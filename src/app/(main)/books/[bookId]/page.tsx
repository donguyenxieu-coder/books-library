import { GlobeIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/features/books/components/book-cover";
import { getCoverUrl } from "@/features/books/cover";
import { chapterLabel, formatNumber, formatReadingTime } from "@/features/books/format";
import { getBookWithChapters } from "@/features/books/queries";

export async function generateMetadata({ params }: PageProps<"/books/[bookId]">): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBookWithChapters(bookId);
  return { title: book?.title ?? "Không tìm thấy sách" };
}

// Bản tối giản để xem sách vừa tải lên. Ngày 3: sửa thông tin, xoá, sắp xếp chương.
export default async function BookPage({ params }: PageProps<"/books/[bookId]">) {
  const { bookId } = await params;
  const book = await getBookWithChapters(bookId);
  // RLS đã lọc: sách private của người khác trả về null giống như không tồn tại.
  if (!book) notFound();

  return (
    <div className="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)] animate-in fade-in duration-500">
      <aside className="mx-auto w-44 md:w-full">
        <BookCover title={book.title} author={book.author} src={getCoverUrl(book.cover_path)} />
      </aside>

      <div className="flex flex-col gap-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase">
              {book.format}
            </Badge>
            <Badge variant="outline">
              {book.visibility === "public" ? <GlobeIcon /> : <LockIcon />}
              {book.visibility === "public" ? "Công khai" : "Riêng tư"}
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{book.title}</h1>
          <p className="text-muted-foreground">
            {book.author ?? "Không rõ tác giả"}
            {book.owner && ` · đăng bởi ${book.owner.full_name}`}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatNumber(book.chapter_count)} chương · {formatNumber(book.word_count)} từ · khoảng{" "}
            {formatReadingTime(book.word_count)} đọc
          </p>
          {book.description && <p className="max-w-prose leading-relaxed whitespace-pre-line">{book.description}</p>}
        </header>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Danh sách chương</h2>
          <ol className="divide-y rounded-xl border">
            {book.chapters.map((chapter) => (
              <li key={chapter.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="min-w-0 truncate">{chapterLabel(chapter.position, chapter.title)}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatNumber(chapter.word_count)} từ
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
