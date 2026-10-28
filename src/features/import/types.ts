// Kết quả chung của mọi parser: dù file là EPUB, TXT hay MD,
// phần còn lại của app chỉ làm việc với một hình dạng duy nhất này.

export type BookFormat = "epub" | "txt" | "md";

export type ParsedChapter = {
  title: string; // "" nếu không có tên; nhãn "Chương N" do app tự đánh
  html: string; // nội dung đã chuyển thành HTML (server sẽ sanitize lại)
  wordCount: number;
};

export type ParsedBook = {
  format: BookFormat;
  title: string;
  author: string | null;
  description: string | null;
  cover: Blob | null;
  chapters: ParsedChapter[];
  warnings: string[]; // điều người dùng nên biết, ví dụ "không nhận diện được chương"
};
