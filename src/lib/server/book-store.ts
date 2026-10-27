// ============================================================
// MOCK BACKEND — bạn KHÔNG cần sửa file này.
// Đóng vai "database": đọc/ghi data/books.json để dữ liệu
// không mất khi dev server reload.
// ============================================================
import { promises as fs } from "fs";
import path from "path";
import type { Book, CreateBookInput, UpdateBookInput } from "@/types/book";

const DATA_FILE = path.join(process.cwd(), "data", "books.json");

const SEED: Book[] = [
  {
    id: 1,
    title: "Dế Mèn phiêu lưu ký",
    author: "Tô Hoài",
    description: "Hành trình phiêu lưu của chú Dế Mèn qua thế giới loài vật.",
    status: "read",
    rating: 5,
    image: "https://picsum.photos/seed/demen/400/600",
  },
  {
    id: 2,
    title: "Cho tôi xin một vé đi tuổi thơ",
    author: "Nguyễn Nhật Ánh",
    description: "Những ký ức tuổi thơ hồn nhiên qua góc nhìn của cu Mùi.",
    status: "read",
    rating: 4,
    image: "https://picsum.photos/seed/vetuoitho/400/600",
  },
  {
    id: 3,
    title: "Mắt biếc",
    author: "Nguyễn Nhật Ánh",
    status: "reading",
    image: "https://picsum.photos/seed/matbiec/400/600",
  },
  {
    id: 4,
    title: "Clean Code",
    author: "Robert C. Martin",
    description: "Nguyên tắc viết code dễ đọc, dễ bảo trì.",
    status: "reading",
  },
  {
    id: 5,
    title: "Nhà giả kim",
    author: "Paulo Coelho",
    description: "Hành trình đi tìm kho báu và ý nghĩa cuộc đời của Santiago.",
    status: "want-to-read",
    image: "https://picsum.photos/seed/nhagiakim/400/600",
  },
  {
    id: 6,
    title: "Đắc nhân tâm",
    author: "Dale Carnegie",
    status: "want-to-read",
  },
  {
    id: 7,
    title: "Atomic Habits",
    author: "James Clear",
    description: "Thay đổi nhỏ mỗi ngày tạo ra kết quả lớn.",
    status: "read",
    rating: 4,
    image: "https://picsum.photos/seed/atomic/400/600",
  },
  {
    id: 8,
    title: "Số đỏ",
    author: "Vũ Trọng Phụng",
    status: "want-to-read",
    image: "https://picsum.photos/seed/sodo/400/600",
  },
];

async function readAll(): Promise<Book[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Book[];
  } catch {
    // Chưa có file → tạo từ dữ liệu mẫu.
    await writeAll(SEED);
    return [...SEED];
  }
}

async function writeAll(books: Book[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), "utf-8");
}

// Field tùy chọn nhận "" hoặc null → coi như "không có" và bỏ khỏi object.
function clean(book: Record<string, unknown>): Book {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(book)) {
    if (value === "" || value === null || value === undefined) continue;
    result[key] = value;
  }
  return result as Book;
}

export async function listBooks(filters: { q?: string; status?: string }) {
  const books = await readAll();
  const q = filters.q?.trim().toLowerCase();

  return books.filter((book) => {
    const matchQ =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q);
    const matchStatus = !filters.status || book.status === filters.status;
    return matchQ && matchStatus;
  });
}

export async function getBook(id: number) {
  const books = await readAll();
  return books.find((book) => book.id === id) ?? null;
}

export async function createBook(input: CreateBookInput) {
  const books = await readAll();
  const nextId = books.reduce((max, b) => Math.max(max, b.id), 0) + 1;
  const created = clean({ id: nextId, ...input });
  await writeAll([...books, created]);
  return created;
}

export async function updateBook(id: number, input: UpdateBookInput) {
  const books = await readAll();
  const existing = books.find((book) => book.id === id);
  if (!existing) return null;

  // PATCH: field không gửi (undefined) giữ nguyên giá trị cũ;
  // field gửi "" hoặc null thì bị xóa.
  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const updated = clean({ ...existing, ...changes, id });
  await writeAll(books.map((book) => (book.id === id ? updated : book)));
  return updated;
}

export async function deleteBook(id: number) {
  const books = await readAll();
  const exists = books.some((book) => book.id === id);
  if (!exists) return false;

  await writeAll(books.filter((book) => book.id !== id));
  return true;
}
