import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentUserId } from "@/features/auth/queries";
import { EditBookForm } from "@/features/books/components/edit-book-form";
import { getCoverUrl } from "@/features/books/cover";
import { getBookWithChapters } from "@/features/books/queries";

export const metadata: Metadata = { title: "Sửa thông tin sách" };

export default async function EditBookPage({ params }: PageProps<"/books/[bookId]/edit">) {
  const { bookId } = await params;
  const [book, userId] = await Promise.all([getBookWithChapters(bookId), getCurrentUserId()]);
  // Sách public người khác xem được nhưng không được sửa → coi như không có trang này.
  // (Server Action updateBook + RLS vẫn chặn lần nữa nếu ai đó cố gọi thẳng.)
  if (!book || !userId || book.owner_id !== userId) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Sửa thông tin sách</h1>
        <p className="truncate text-muted-foreground">{book.title}</p>
      </header>
      <EditBookForm
        userId={userId}
        book={{
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          visibility: book.visibility,
          coverUrl: getCoverUrl(book.cover_path),
        }}
      />
    </div>
  );
}
