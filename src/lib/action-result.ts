import { z } from "zod";

// Mọi Server Action trả về cùng một hình dạng → form xử lý kết quả theo
// một khuôn duy nhất: ok thì dùng data, không ok thì hiện message / lỗi từng field.
export type ActionResult<TData = undefined, TField extends string = string> =
  | { ok: true; data: TData }
  | { ok: false; message: string; fieldErrors?: Partial<Record<TField, string>> };

// ZodError → { field: "lỗi đầu tiên" } để form gọi setError cho từng ô.
export function toFieldErrors<TField extends string>(error: z.ZodError) {
  const { fieldErrors } = z.flattenError(error);
  const result: Partial<Record<TField, string>> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) result[field as TField] = first;
  }
  return result;
}

// Chỉ cho redirect về đường dẫn nội bộ ("/library"), chặn "//evil.com" hay "https://...".
export function safeRedirectPath(path: unknown, fallback = "/") {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : fallback;
}
