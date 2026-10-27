// ============================================================
// MOCK BACKEND — /api/books
//   GET  /api/books?q=&status=   → 200 Book[]
//   POST /api/books              → 201 Book | 400 | 500
// ============================================================
import { createBook, listBooks } from "@/lib/server/book-store";
import {
  createBookSchema,
  delay,
  errorResponse,
  shouldSimulateError,
  toFieldErrors,
} from "@/lib/server/api-utils";
import type { CreateBookInput } from "@/types/book";

export async function GET(request: Request) {
  await delay();
  if (shouldSimulateError(request)) {
    return errorResponse(500, "Lỗi server giả lập");
  }

  const { searchParams } = new URL(request.url);
  const books = await listBooks({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  return Response.json(books, { status: 200 });
}

export async function POST(request: Request) {
  await delay();
  if (shouldSimulateError(request)) {
    return errorResponse(500, "Lỗi server giả lập");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Body phải là JSON hợp lệ");
  }

  // Server validation: KHÔNG tin dữ liệu client gửi lên.
  const result = createBookSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(400, "Dữ liệu không hợp lệ", toFieldErrors(result.error));
  }

  // store sẽ bỏ các field "" / null trước khi lưu
  const created = await createBook(result.data as CreateBookInput);
  return Response.json(created, { status: 201 });
}
