// Type bạn đã tự viết ở P8.1 (Câu 2), dùng chung cho frontend và mock API.

export type ReadingStatus = "want-to-read" | "reading" | "read";

export type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  status: ReadingStatus;
  rating?: number; // số nguyên 1–5 (Zod chặn, TypeScript không chặn được)
  image?: string; // URL ảnh bìa
};

// Create: server tạo id, nên client không gửi id.
export type CreateBookInput = Omit<Book, "id">;

// Edit (PATCH): chỉ gửi field muốn đổi.
// rating: null nghĩa là "xóa đánh giá".
export type UpdateBookInput = Partial<Omit<CreateBookInput, "rating">> & {
  rating?: number | null;
};
