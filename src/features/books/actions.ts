"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/features/auth/queries";
import { htmlToText, countWords } from "@/features/import/parsers/utils";
import { type ActionResult, toFieldErrors } from "@/lib/action-result";
import { sanitizeChapterHtml } from "@/lib/server/sanitize";
import { createClient } from "@/lib/supabase/server";

import {
  appendChaptersSchema,
  chapterTitleSchema,
  createBookSchema,
  reorderChaptersSchema,
  updateBookSchema,
} from "./schemas";

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

// ============================================================
// Ngày 3 — sửa, xoá mềm, quản lý chương
// Mọi hàm đều dựa vào RLS để chặn sửa sách của người khác: câu update/delete
// của người không phải chủ sách sẽ không khớp dòng nào.
// ============================================================

export async function updateBook(bookId: string, input: unknown): Promise<ActionResult> {
  const parsed = updateBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Thông tin sách không hợp lệ", fieldErrors: toFieldErrors(parsed.error) };
  }

  const userId = await getCurrentUserId();
  if (!userId) return NOT_LOGGED_IN;

  const { title, author, description, visibility, coverPath } = parsed.data;
  if (coverPath && !coverPath.startsWith(`${userId}/`)) {
    return { ok: false, message: "Ảnh bìa không hợp lệ" };
  }

  const supabase = await createClient();
  const { data: before } = await supabase.from("books").select("cover_path").eq("id", bookId).single();

  const { data: updated, error } = await supabase
    .from("books")
    .update({
      title,
      author: author || null,
      description: description || null,
      visibility,
      // undefined → supabase-js bỏ qua field này → giữ ảnh cũ
      ...(coverPath !== undefined && { cover_path: coverPath }),
    })
    .eq("id", bookId)
    .select("id");

  if (error) {
    console.error("[updateBook]", error);
    return { ok: false, message: "Không lưu được thay đổi, vui lòng thử lại" };
  }
  if (!updated?.length) return { ok: false, message: "Không tìm thấy sách hoặc bạn không có quyền sửa" };

  // Đã thay ảnh bìa → xoá file cũ trên Storage cho đỡ rác (lỗi cũng không sao).
  if (coverPath !== undefined && before?.cover_path && before.cover_path !== coverPath) {
    await supabase.storage.from("covers").remove([before.cover_path]);
  }

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/library");
  return { ok: true, data: undefined };
}

// Xoá mềm: chỉ đánh dấu deleted_at, dữ liệu vẫn còn → "Hoàn tác" được.
export async function deleteBook(bookId: string): Promise<ActionResult> {
  return setDeletedAt(bookId, new Date().toISOString());
}

export async function restoreBook(bookId: string): Promise<ActionResult> {
  return setDeletedAt(bookId, null);
}

async function setDeletedAt(bookId: string, deletedAt: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .update({ deleted_at: deletedAt })
    .eq("id", bookId)
    .select("id");

  if (error || !data?.length) {
    if (error) console.error("[setDeletedAt]", error);
    return { ok: false, message: deletedAt ? "Không xoá được sách" : "Không khôi phục được sách" };
  }
  revalidatePath("/library");
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  return { ok: true, data: undefined };
}

export async function renameChapter(bookId: string, chapterId: string, input: unknown): Promise<ActionResult> {
  const parsed = chapterTitleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Tên chương không hợp lệ", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .update({ title: parsed.data.title })
    .eq("id", chapterId)
    .eq("book_id", bookId)
    .select("id");

  if (error || !data?.length) {
    if (error) console.error("[renameChapter]", error);
    return { ok: false, message: "Không đổi được tên chương" };
  }
  revalidatePath(`/books/${bookId}`);
  return { ok: true, data: undefined };
}

export async function deleteChapter(bookId: string, chapterId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_chapter", { p_chapter_id: chapterId });
  if (error) {
    console.error("[deleteChapter]", error);
    return { ok: false, message: "Không xoá được chương" };
  }
  revalidatePath(`/books/${bookId}`);
  return { ok: true, data: undefined };
}

export async function reorderChapters(input: unknown): Promise<ActionResult> {
  const parsed = reorderChaptersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Thứ tự chương không hợp lệ" };

  const { bookId, chapterIds } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_chapters", { p_book_id: bookId, p_chapter_ids: chapterIds });
  if (error) {
    console.error("[reorderChapters]", error);
    // 22023 = lỗi do hàm SQL tự ném khi danh sách chương đã thay đổi
    return {
      ok: false,
      message: error.code === "22023" ? error.message : "Không lưu được thứ tự chương, vui lòng thử lại",
    };
  }
  revalidatePath(`/books/${bookId}`);
  return { ok: true, data: undefined };
}
