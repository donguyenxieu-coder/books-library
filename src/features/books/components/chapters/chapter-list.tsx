"use client";

import { ArrowUpDownIcon, EllipsisVerticalIcon, PencilIcon, SearchIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { normalizeForSearch } from "@/lib/search";

import { chapterLabel, formatNumber } from "../../format";
import { ChapterReorderList } from "./chapter-reorder-list";
import { DeleteChapterDialog } from "./delete-chapter-dialog";
import { RenameChapterDialog } from "./rename-chapter-dialog";
import type { ChapterSummary } from "./types";

type ChapterListProps = {
  bookId: string;
  chapters: ChapterSummary[];
  canEdit: boolean;
};

const FILTER_THRESHOLD = 10; // ít chương thì không cần ô lọc

export function ChapterList({ bookId, chapters, canEdit }: ChapterListProps) {
  const [mode, setMode] = useState<"view" | "reorder">("view");
  const [renaming, setRenaming] = useState<ChapterSummary | null>(null);
  const [deleting, setDeleting] = useState<ChapterSummary | null>(null);

  // Lọc chương: gõ "39" → chương 39; gõ "khoi dau" → chương có tên "Khởi đầu".
  // useDeferredValue: ô nhập luôn mượt, danh sách dài lọc lại "sau một nhịp".
  const [filter, setFilter] = useState("");
  const deferredFilter = useDeferredValue(filter);
  const visible = useMemo(() => {
    const query = normalizeForSearch(deferredFilter);
    if (!query) return chapters;
    if (/^\d+$/.test(query)) return chapters.filter((c) => String(c.position).startsWith(query));
    return chapters.filter((c) => normalizeForSearch(c.title).includes(query));
  }, [chapters, deferredFilter]);

  if (mode === "reorder") {
    return <ChapterReorderList bookId={bookId} chapters={chapters} onDone={() => setMode("view")} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {chapters.length > FILTER_THRESHOLD && (
          <div className="relative min-w-48 flex-1 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Tìm chương theo số hoặc tên…"
              aria-label="Lọc chương"
              className="pl-9"
            />
          </div>
        )}
        {canEdit && chapters.length > 1 && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => setMode("reorder")}>
            <ArrowUpDownIcon />
            Sắp xếp chương
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Không có chương nào khớp “{filter}”
        </p>
      ) : (
        <ol className="divide-y rounded-xl border">
          {visible.map((chapter) => (
            <li key={chapter.id} className="group flex items-center transition-colors hover:bg-muted/50">
              <Link
                href={`/books/${bookId}/read/${chapter.position}`}
                className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 text-sm outline-none focus-visible:bg-muted"
              >
                <span className="min-w-0 truncate">{chapterLabel(chapter.position, chapter.title)}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatNumber(chapter.word_count)} từ
                </span>
              </Link>
              {canEdit && (
                // Menu này mở Dialog. onCloseAutoFocus preventDefault: menu đóng KHÔNG trả focus
                // về nút ⋯, nếu không nó cướp focus khỏi ô nhập trong Dialog vừa mở
                // (gõ phím sẽ không vào ô nào).
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Thao tác với chương ${chapter.position}`}
                      className="mr-1 size-8 opacity-60 group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onCloseAutoFocus={(event) => event.preventDefault()}>
                    <DropdownMenuItem onSelect={() => setRenaming(chapter)}>
                      <PencilIcon />
                      Đổi tên
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(chapter)}>
                      <Trash2Icon />
                      Xoá chương
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ol>
      )}

      {renaming && <RenameChapterDialog bookId={bookId} chapter={renaming} onClose={() => setRenaming(null)} />}
      {deleting && <DeleteChapterDialog bookId={bookId} chapter={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
