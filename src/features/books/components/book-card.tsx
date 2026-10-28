import { GlobeIcon } from "lucide-react";
import Link from "next/link";

import { getCoverUrl } from "../cover";
import { formatNumber } from "../format";
import type { LibraryBook } from "../queries";
import { BookCover } from "./book-cover";

export function BookCard({ book, showOwner }: { book: LibraryBook; showOwner?: boolean }) {
  return (
    <Link href={`/books/${book.id}`} className="group flex flex-col gap-3 rounded-lg outline-none">
      {/* Nhấc bìa lên + đổ bóng khi hover / focus bằng bàn phím */}
      <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5">
        <BookCover
          title={book.title}
          author={book.author}
          src={getCoverUrl(book.cover_path)}
          className="transition-shadow duration-300 group-hover:shadow-xl group-focus-visible:ring-2 group-focus-visible:ring-ring"
        />
        {book.visibility === "public" && !showOwner && (
          <span
            title="Công khai"
            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
          >
            <GlobeIcon className="size-3.5" />
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">{book.title}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {showOwner && book.owner ? `Đăng bởi ${book.owner.full_name}` : (book.author ?? "Không rõ tác giả")}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">{formatNumber(book.chapter_count)} chương</p>
      </div>
    </Link>
  );
}
