// ============================================================
// MOCK BACKEND — bạn KHÔNG cần sửa file này.
// Server validation (Zod) + vài tiện ích giả lập mạng chậm / lỗi.
// ============================================================
import { z } from "zod";

// ---------- Server validation ----------
// Đây là validation phía SERVER (bắt buộc, vì client không đáng tin).
// Schema phía client (trong BookForm) là phần bạn tự viết ở P8.4.
// Field tùy chọn chấp nhận "" hoặc null = "không có giá trị".
export const createBookSchema = z.object({
  title: z
    .string({ message: "Title là bắt buộc" })
    .trim()
    .min(1, { message: "Title không được để trống" })
    .max(150, { message: "Title tối đa 150 ký tự" }),
  author: z
    .string({ message: "Author là bắt buộc" })
    .trim()
    .min(1, { message: "Author không được để trống" })
    .max(100, { message: "Author tối đa 100 ký tự" }),
  description: z
    .string()
    .trim()
    .max(1000, { message: "Description tối đa 1000 ký tự" })
    .nullable()
    .optional(),
  status: z.enum(["want-to-read", "reading", "read"], {
    message: "Status phải là want-to-read, reading hoặc read",
  }),
  rating: z
    .number({ message: "Rating phải là số" })
    .int({ message: "Rating phải là số nguyên" })
    .min(1, { message: "Rating từ 1 đến 5" })
    .max(5, { message: "Rating từ 1 đến 5" })
    .nullable()
    .optional(),
  image: z
    .union([
      z.literal(""),
      z.string().trim().url({ message: "Image phải là URL hợp lệ" }),
    ])
    .nullable()
    .optional(),
});

export const updateBookSchema = createBookSchema.partial();

// Gom lỗi Zod thành { field: message } để frontend dễ hiển thị.
export function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "body");
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

// ---------- Response helpers ----------
export function errorResponse(
  status: number,
  message: string,
  errors?: Record<string, string>,
) {
  return Response.json(errors ? { message, errors } : { message }, { status });
}

// "10" → 10 ; "abc" / "1.5" / "-3" → null
export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---------- Giả lập mạng ----------
// Mỗi request chậm một chút để bạn THẤY loading state.
// Đổi số ms ở đây nếu muốn (0 = tắt).
const DELAY_MS = 800;

export function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Thêm ?simulateError=true vào URL API để ép server trả 500
// → dùng để test error.tsx / error UI.
export function shouldSimulateError(request: Request) {
  return new URL(request.url).searchParams.get("simulateError") === "true";
}
