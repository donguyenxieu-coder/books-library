import { BookOpenIcon, GlobeIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/features/auth/queries";
import { BookCover } from "@/features/books/components/book-cover";
import { BookOwnerActions } from "@/features/books/components/book-owner-actions";
import { ChapterList } from "@/features/books/components/chapters/chapter-list";
import { getCoverUrl } from "@/features/books/cover";
import { formatNumber, formatReadingTime } from "@/features/books/format";
import { getBookWithChapters } from "@/features/books/queries";

export async function generateMetadata({ params }: PageProps<"/books/[bookId]">): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBookWithChapters(bookId);
  return { title: book?.title ?? "Không tìm thấy sách" };
}

export default async function BookPage({ params }: PageProps<"/books/[bookId]">) {
  const { bookId } = await params;
  // Promise.all: hai việc độc lập → chạy song song thay vì chờ lần lượt.
  const [book, userId] = await Promise.all([getBookWithChapters(bookId), getCurrentUserId()]);
  // RLS đã lọc: sách private của người khác trả về null giống như không tồn tại.
  if (!book) notFound();

  const isOwner = book.owner_id === userId;

  return (
    <div className="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)] animate-in fade-in duration-500">
      <aside className="mx-auto w-44 md:sticky md:top-24 md:w-full md:self-start">
        <BookCover title={book.title} author={book.author} src={getCoverUrl(book.cover_path)} />
      </aside>

      <div className="flex min-w-0 flex-col gap-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase">
              {book.format}
            </Badge>
            <Badge variant="outline">
              {book.visibility === "public" ? <GlobeIcon /> : <LockIcon />}
              {book.visibility === "public" ? "Công khai" : "Riêng tư"}
            </Badge>
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {book.title}
            </h1>
            <p className="text-muted-foreground">
              {book.author ?? "Không rõ tác giả"}
              {!isOwner && book.owner && ` · đăng bởi ${book.owner.full_name}`}
            </p>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Stat label="Chương" value={formatNumber(book.chapter_count)} />
            <Stat label="Số từ" value={formatNumber(book.word_count)} />
            <Stat label="Thời gian đọc" value={`~${formatReadingTime(book.word_count)}`} />
          </dl>

          {book.description && (
            <p className="max-w-prose leading-relaxed whitespace-pre-line text-foreground/90">{book.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {book.chapter_count > 0 && (
              <Button asChild size="lg">
                <Link href={`/books/${book.id}/read/1`}>
                  <BookOpenIcon />
                  Đọc từ đầu
                </Link>
              </Button>
            )}
            {isOwner && <BookOwnerActions bookId={book.id} title={book.title} />}
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Danh sách chương</h2>
          <ChapterList bookId={book.id} chapters={book.chapters} canEdit={isOwner} />
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
