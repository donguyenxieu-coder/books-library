import { z } from "zod";

// Thông tin cơ bản của sách: dùng cho form lúc tải lên (Ngày 2) và form sửa (Ngày 3).
// Field tuỳ chọn để là string ("" = không có) cho dễ gắn vào <input>;
// server đổi "" thành null trước khi lưu.
export const bookMetaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Nhập tên sách" })
    .max(200, { error: "Tên sách tối đa 200 ký tự" }),
  author: z.string().trim().max(120, { error: "Tên tác giả tối đa 120 ký tự" }),
  description: z.string().trim().max(2000, { error: "Mô tả tối đa 2000 ký tự" }),
  visibility: z.enum(["private", "public"]),
});

export const createBookSchema = bookMetaSchema.extend({
  format: z.enum(["epub", "txt", "md"]),
  coverPath: z.string().max(300).nullable(),
});

export const chapterInputSchema = z.object({
  title: z.string().trim().max(200, { error: "Tên chương tối đa 200 ký tự" }),
  html: z.string().min(1).max(3_000_000, { error: "Chương quá dài" }),
});

// Chương được gửi lên theo từng lô; startPosition cho biết lô này bắt đầu
// từ chương số mấy.
export const appendChaptersSchema = z.object({
  bookId: z.uuid(),
  startPosition: z.int().min(1),
  chapters: z.array(chapterInputSchema).min(1).max(500),
});

export type BookMetaFormValues = z.input<typeof bookMetaSchema>;
export type BookMetaInput = z.output<typeof bookMetaSchema>;
export type CreateBookInput = z.input<typeof createBookSchema>;
export type ChapterInput = z.input<typeof chapterInputSchema>;
