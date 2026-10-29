import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { chapterLabel, formatNumber, formatReadingTime } from "@/features/books/format";
import { getChapterForReading } from "@/features/books/queries";
import { ReaderKeyboardNav } from "@/features/reader/components/reader-keyboard-nav";

type ReadPageProps = PageProps<"/books/[bookId]/read/[position]">;

async function loadChapter({ params }: ReadPageProps) {
  const { bookId, position } = await params;
  return getChapterForReading(bookId, Number(position));
}

export async function generateMetadata(props: ReadPageProps): Promise<Metadata> {
  const chapter = await loadChapter(props);
  if (!chapter?.book) return { title: "Không tìm thấy chương" };
  return { title: `${chapterLabel(chapter.position, chapter.title)} · ${chapter.book.title}` };
}

// Bản đọc cơ bản (Ngày 3). Ngày 4 thêm: font, cỡ chữ, theme, mục lục, lưu tiến độ.
export default async function ReadPage(props: ReadPageProps) {
  const chapter = await loadChapter(props);
  if (!chapter?.book) notFound();

  const { book, position } = chapter;
  const base = `/books/${book.id}/read`;
  const prevHref = position > 1 ? `${base}/${position - 1}` : null;
  const nextHref = position < book.chapter_count ? `${base}/${position + 1}` : null;

  return (
    <article className="mx-auto w-full max-w-[68ch]">
      <ReaderKeyboardNav prevHref={prevHref} nextHref={nextHref} />

      <nav className="mb-10 flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <Link href={`/books/${book.id}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground">
          <ArrowLeftIcon className="size-4 shrink-0" />
          <span className="truncate">{book.title}</span>
        </Link>
        <span className="shrink-0 tabular-nums">
          {position}/{book.chapter_count}
        </span>
      </nav>

      <header className="mb-10 space-y-2 text-center">
        <p className="text-sm tracking-wide text-muted-foreground uppercase">Chương {position}</p>
        {chapter.title && (
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">{chapter.title}</h1>
        )}
        <p className="text-xs text-muted-foreground">
          {formatNumber(chapter.word_count)} từ · {formatReadingTime(chapter.word_count)}
        </p>
      </header>

      {/* HTML đã được sanitize ở server lúc lưu (lib/server/sanitize.ts),
          nên render thẳng bằng dangerouslySetInnerHTML là an toàn. */}
      <div className="reader-prose" dangerouslySetInnerHTML={{ __html: chapter.content_html }} />

      <footer className="mt-16 grid grid-cols-2 gap-3 border-t pt-8">
        {prevHref ? (
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link href={prevHref}>
              <ChevronLeftIcon />
              <span className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Chương trước</span>
                <span>Chương {position - 1}</span>
              </span>
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {nextHref ? (
          <Button asChild className="h-auto justify-end py-3">
            <Link href={nextHref}>
              <span className="flex flex-col items-end">
                <span className="text-xs opacity-70">Chương tiếp</span>
                <span>Chương {position + 1}</span>
              </span>
              <ChevronRightIcon />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="h-auto justify-end py-3">
            <Link href={`/books/${book.id}`}>Hết sách · về trang sách</Link>
          </Button>
        )}
      </footer>
      <p className="mt-4 hidden text-center text-xs text-muted-foreground sm:block">Mẹo: dùng phím ← → để chuyển chương</p>
    </article>
  );
}
