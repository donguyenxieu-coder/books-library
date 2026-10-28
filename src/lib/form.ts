import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ActionResult } from "@/lib/action-result";

// Đổ lỗi server vào React Hook Form:
// - có lỗi từng field → hiện ngay dưới ô đó
// - không gắn được vào ô nào → "root.server", form hiện thành banner
export function applyServerErrors<TValues extends FieldValues>(
  result: Extract<ActionResult<unknown>, { ok: false }>,
  setError: UseFormSetError<TValues>,
) {
  const fieldErrors = Object.entries(result.fieldErrors ?? {}).filter(([, message]) => message);
  if (fieldErrors.length === 0) {
    setError("root.server", { type: "server", message: result.message });
    return;
  }
  fieldErrors.forEach(([field, message], index) =>
    // Đưa con trỏ về ô lỗi đầu tiên để sửa ngay.
    setError(field as Path<TValues>, { type: "server", message: message as string }, { shouldFocus: index === 0 }),
  );
}
