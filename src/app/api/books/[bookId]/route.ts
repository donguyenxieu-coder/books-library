// ============================================================
// MOCK BACKEND — /api/books/:bookId
//   GET    → 200 Book | 400 | 404
//   PATCH  → 200 Book | 400 | 404
//   DELETE → 204 (không có body) | 400 | 404
// ============================================================
import { deleteBook, getBook, updateBook } from "@/lib/server/book-store";
import {
  delay,
  errorResponse,
  parseId,
  shouldSimulateError,
  toFieldErrors,
  updateBookSchema,
} from "@/lib/server/api-utils";
import type { UpdateBookInput } from "@/types/book";

// Giống page.tsx: params là Promise, phải await.
type Context = { params: Promise<{ bookId: string }> };

export async function GET(request: Request, { params }: Context) {
  await delay();
  if (shouldSimulateError(request)) {
    return errorResponse(500, "Lỗi server giả lập");
  }

  const { bookId } = await params;
  const id = parseId(bookId);
  if (id === null) return errorResponse(400, "bookId không hợp lệ");

  const book = await getBook(id);
  if (!book) return errorResponse(404, "Không tìm thấy sách");

  return Response.json(book, { status: 200 });
}

export async function PATCH(request: Request, { params }: Context) {
  await delay();
  if (shouldSimulateError(request)) {
    return errorResponse(500, "Lỗi server giả lập");
  }

  const { bookId } = await params;
  const id = parseId(bookId);
  if (id === null) return errorResponse(400, "bookId không hợp lệ");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Body phải là JSON hợp lệ");
  }

  const result = updateBookSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(400, "Dữ liệu không hợp lệ", toFieldErrors(result.error));
  }

  const updated = await updateBook(id, result.data as UpdateBookInput);
  if (!updated) return errorResponse(404, "Không tìm thấy sách");

  return Response.json(updated, { status: 200 });
}

export async function DELETE(request: Request, { params }: Context) {
  await delay();
  if (shouldSimulateError(request)) {
    return errorResponse(500, "Lỗi server giả lập");
  }

  const { bookId } = await params;
  const id = parseId(bookId);
  if (id === null) return errorResponse(400, "bookId không hợp lệ");

  const deleted = await deleteBook(id);
  if (!deleted) return errorResponse(404, "Không tìm thấy sách");

  // 204 No Content: thành công nhưng KHÔNG có body
  // → frontend không được gọi response.json() ở đây.
  return new Response(null, { status: 204 });
}
