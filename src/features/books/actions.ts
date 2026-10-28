"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/features/auth/queries";
import { htmlToText, countWords } from "@/features/import/parsers/utils";
import { type ActionResult, toFieldErrors } from "@/lib/action-result";
import { sanitizeChapterHtml } from "@/lib/server/sanitize";
import { createClient } from "@/lib/supabase/server";

import { appendChaptersSchema, createBookSchema } from "./schemas";

const NOT_LOGGED_IN = { ok: false, message: "Phiên đăng nhập đã hết, hãy đăng nhập lại" } as const;

// Luồng lưu một cuốn sách (client gọi lần lượt):
//   1. createBook      → tạo dòng books, trả về id
//   2. appendChapters  → gửi chương theo lô (mỗi lô < 1MB), lặp đến hết
//   3. finishImport    → làm mới trang thư viện
//   (lỗi giữa chừng)   → abortImport: xoá mềm cuốn sách dở dang
// Chia lô vì Server Action giới hạn kích thước body, và để UI hiện được tiến độ.

export async function createBook(input: unknown): Promise<ActionResult<{ bookId: string }>> {
  const parsed = createBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Thông tin sách không hợp lệ", fieldErrors: toFieldErrors(parsed.error) };
  }

  const userId = await getCurrentUserId();
  if (!userId) return NOT_LOGGED_IN;

  const { title, author, description, visibility, format, coverPath } = parsed.data;
  // Ảnh bìa phải nằm trong thư mục của chính user (Storage RLS cũng chặn ghi,
  // còn đây chặn việc "mượn" đường dẫn ảnh của người khác).
  if (coverPath && !coverPath.startsWith(`${userId}/`)) {
    return { ok: false, message: "Ảnh bìa không hợp lệ" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .insert({
      title,
      author: author || null,
      description: description || null,
      visibility,
      format,
      cover_path: coverPath,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createBook]", error);
    return { ok: false, message: "Không tạo được sách, vui lòng thử lại" };
  }
  return { ok: true, data: { bookId: data.id } };
}

export async function appendChapters(input: unknown): Promise<ActionResult<{ inserted: number }>> {
  const parsed = appendChaptersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Dữ liệu chương không hợp lệ", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { bookId, startPosition, chapters } = parsed.data;
  const rows = chapters.map((chapter, index) => {
    const html = sanitizeChapterHtml(chapter.html);
    return {
      book_id: bookId,
      position: startPosition + index,
      title: chapter.title,
      content_html: html,
      // Tự đếm lại từ HTML đã lọc, không dùng số client gửi.
      word_count: countWords(htmlToText(html)),
    };
  });

  const supabase = await createClient();
  // RLS "chapters: write if book owner" chặn việc thêm chương vào sách người khác.
  const { error } = await supabase.from("chapters").insert(rows);
  if (error) {
    console.error("[appendChapters]", error);
    return { ok: false, message: "Không lưu được chương, vui lòng thử lại" };
  }
  return { ok: true, data: { inserted: rows.length } };
}

export async function finishImport(): Promise<ActionResult> {
  revalidatePath("/library");
  revalidatePath("/");
  return { ok: true, data: undefined };
}

export async function abortImport(bookId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", bookId);
  if (error) console.error("[abortImport]", error);
  return { ok: true, data: undefined };
}
