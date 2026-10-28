"use client";

import { XIcon } from "lucide-react";

import { formatNumber } from "@/features/books/format";

export type PreviewChapter = {
  key: number; // id tạm ổn định để React không nhầm dòng khi xoá
  title: string;
  wordCount: number;
  excerpt: string;
};

type ChapterPreviewListProps = {
  chapters: PreviewChapter[];
  onRemove: (key: number) => void;
};

// Danh sách chương nhận diện được, để người dùng kiểm tra trước khi lưu
// và bỏ những phần không phải chương (mục lục, lời cảm ơn...).
export function ChapterPreviewList({ chapters, onRemove }: ChapterPreviewListProps) {
  return (
    // div cuộn thường thay vì ScrollArea của Radix: ScrollArea bọc nội dung trong
    // display: table nên "truncate" không cắt được chữ dài, đẩy cột số từ ra ngoài.
    <div className="max-h-[28rem] overflow-y-auto overscroll-contain rounded-xl border">
      <ol className="divide-y">
        {chapters.map((chapter, index) => (
          <li key={chapter.key} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
            <span className="mt-0.5 w-20 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
              Chương {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={chapter.title ? "truncate text-sm font-medium" : "text-sm text-muted-foreground italic"}>
                {chapter.title || "Không có tên"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{chapter.excerpt}</p>
            </div>
            <span className="mt-0.5 shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatNumber(chapter.wordCount)} từ
            </span>
            <button
              type="button"
              onClick={() => onRemove(chapter.key)}
              aria-label={`Bỏ chương ${index + 1}`}
              className="-my-1 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
            >
              <XIcon className="size-4" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
