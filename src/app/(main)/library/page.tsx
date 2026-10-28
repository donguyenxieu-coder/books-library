import { LibraryBigIcon, PlusIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BookCard } from "@/features/books/components/book-card";
import { LibrarySearch } from "@/features/books/components/library-search";
import { type LibraryScope, searchBooks } from "@/features/books/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Thư viện" };

const SCOPES: { value: LibraryScope; label: string }[] = [
  { value: "mine", label: "Sách của tôi" },
  { value: "public", label: "Cộng đồng" },
];

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const scope: LibraryScope = params.scope === "public" ? "public" : "mine";
  const books = await searchBooks({ query, scope });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Thư viện</h1>
          <p className="text-muted-foreground">
            {scope === "mine" ? "Sách bạn đã tải lên." : "Sách người khác chia sẻ công khai."}
          </p>
        </div>
        <Button asChild>
          <Link href="/books/new">
            <PlusIcon />
            Tải sách lên
          </Link>
        </Button>
      </header>

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tab bằng <Link>: trạng thái nằm trên URL (?scope=public), Server Component tự đọc */}
        <nav aria-label="Phạm vi" className="inline-flex w-fit rounded-lg bg-muted p-1">
          {SCOPES.map(({ value, label }) => {
            const href = { pathname: "/library", query: { ...(query && { q: query }), ...(value === "public" && { scope: value }) } };
            const active = scope === value;
            return (
              <Link
                key={value}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <LibrarySearch />
      </div>

      {books.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((book, index) => (
            <div
              key={book.id}
              // Hiện dần từng cuốn; giới hạn độ trễ để danh sách dài không phải chờ lâu.
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              className="fill-mode-both animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <BookCard book={book} showOwner={scope === "public"} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState query={query} scope={scope} />
      )}
    </div>
  );
}

function EmptyState({ query, scope }: { query: string; scope: LibraryScope }) {
  const Icon = query ? SearchXIcon : LibraryBigIcon;
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <div className="space-y-1">
        <h2 className="font-medium">
          {query
            ? `Không tìm thấy sách nào khớp “${query}”`
            : scope === "mine"
              ? "Tủ sách của bạn đang trống"
              : "Chưa có ai chia sẻ sách công khai"}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {query ? "Thử từ khoá khác, gõ không dấu cũng được." : "Tải lên một file EPUB, TXT hoặc Markdown để bắt đầu."}
        </p>
      </div>
      {!query && scope === "mine" && (
        <Button asChild variant="outline">
          <Link href="/books/new">
            <PlusIcon />
            Tải sách đầu tiên
          </Link>
        </Button>
      )}
    </div>
  );
}
