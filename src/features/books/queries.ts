import "server-only";

import { cache } from "react";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type LibraryScope = "mine" | "public";

// Danh sách cho trang thư viện. Tìm kiếm không dấu nằm trong hàm SQL search_books;
// `.select(...)` sau `.rpc(...)` vẫn nối được bảng profiles để lấy tên người đăng.
// "!books_owner_id_fkey": books và profiles nối với nhau qua nhiều đường (owner_id,
// và gián tiếp qua bookmarks, highlights...) → phải chỉ rõ dùng khoá ngoại owner_id.
export async function searchBooks({ query, scope }: { query: string; scope: LibraryScope }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("search_books", { p_query: query, p_scope: scope })
    .select("id, title, author, cover_path, visibility, chapter_count, word_count, created_at, owner:profiles!books_owner_id_fkey(full_name)");

  if (error) throw new Error(`Không tải được thư viện: ${error.message}`);
  return data;
}

export type LibraryBook = Awaited<ReturnType<typeof searchBooks>>[number];

// cache(): generateMetadata và page cùng gọi → chỉ query một lần mỗi request.
export const getBookWithChapters = cache(async (bookId: string) => {
  // id trên URL không phải uuid thì Postgres báo lỗi kiểu dữ liệu → coi như không tồn tại.
  if (!z.uuid().safeParse(bookId).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select(
      "id, owner_id, title, author, description, cover_path, format, visibility, chapter_count, word_count, created_at, owner:profiles!books_owner_id_fkey(full_name, username), chapters(id, title, position, word_count)",
    )
    .eq("id", bookId)
    .is("deleted_at", null)
    .order("position", { referencedTable: "chapters" })
    .maybeSingle();

  if (error) throw new Error(`Không tải được sách: ${error.message}`);
  return data;
});
