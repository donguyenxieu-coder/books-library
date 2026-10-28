import { abortImport, appendChapters, createBook, finishImport } from "@/features/books/actions";
import type { BookMetaInput } from "@/features/books/schemas";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/client";

import type { BookFormat, ParsedChapter } from "../types";
import { resizeImage } from "./resize-image";

const encoder = new TextEncoder();
const MAX_BATCH_BYTES = 800_000; // dưới giới hạn body của Server Action

// Chia chương thành các lô theo kích thước thật (UTF-8: chữ có dấu tốn 2–3 byte).
export function batchChapters(chapters: ParsedChapter[]) {
  const batches: ParsedChapter[][] = [];
  let current: ParsedChapter[] = [];
  let bytes = 0;
  for (const chapter of chapters) {
    const size = encoder.encode(chapter.html).length + encoder.encode(chapter.title).length;
    if (current.length > 0 && (bytes + size > MAX_BATCH_BYTES || current.length >= 500)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(chapter);
    bytes += size;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

type SaveBookParams = {
  userId: string;
  meta: BookMetaInput;
  format: BookFormat;
  cover: Blob | null;
  chapters: ParsedChapter[];
  onProgress: (saved: number, total: number) => void;
};

// Chạy ở client, điều phối các bước lưu (xem chú thích trong features/books/actions.ts).
// Trả về ActionResult của createBook nếu lỗi validate (để form hiện lỗi từng ô);
// lỗi khác thì ném Error.
export async function saveBook({
  userId,
  meta,
  format,
  cover,
  chapters,
  onProgress,
}: SaveBookParams): Promise<ActionResult<{ bookId: string }>> {
  let coverPath: string | null = null;
  if (cover) {
    const resized = await resizeImage(cover);
    // Upload thẳng từ trình duyệt lên Storage, không đi qua server Next.js.
    const path = `${userId}/${crypto.randomUUID()}.webp`;
    const { error } = await createClient().storage.from("covers").upload(path, resized, {
      contentType: resized.type,
    });
    if (error) throw new Error("Không tải được ảnh bìa lên");
    coverPath = path;
  }

  const created = await createBook({ ...meta, format, coverPath });
  if (!created.ok) return created;
  const { bookId } = created.data;

  try {
    let saved = 0;
    onProgress(0, chapters.length);
    for (const batch of batchChapters(chapters)) {
      const result = await appendChapters({
        bookId,
        startPosition: saved + 1,
        chapters: batch.map(({ title, html }) => ({ title, html })),
      });
      if (!result.ok) throw new Error(result.message);
      saved += batch.length;
      onProgress(saved, chapters.length);
    }
  } catch (error) {
    // Đừng để lại cuốn sách thiếu chương trong thư viện.
    await abortImport(bookId);
    throw error;
  }

  await finishImport();
  return { ok: true, data: { bookId } };
}
