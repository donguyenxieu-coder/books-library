"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, FileTextIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookMetaFields } from "@/features/books/components/book-meta-fields";
import { formatNumber, formatReadingTime } from "@/features/books/format";
import { type BookMetaFormValues, type BookMetaInput, bookMetaSchema } from "@/features/books/schemas";
import { applyServerErrors } from "@/lib/form";

import { saveBook } from "../lib/save-book";
import { htmlToText } from "../parsers/utils";
import type { ParsedBook, ParsedChapter } from "../types";
import { ChapterPreviewList } from "./chapter-preview-list";
import { type CoverImage, CoverPicker, toCoverImage } from "./cover-picker";

type ReviewChapter = ParsedChapter & { key: number; excerpt: string };

type ReviewStepProps = {
  userId: string;
  book: ParsedBook;
  fileName: string;
  onBack: () => void;
};

export function ReviewStep({ userId, book, fileName, onBack }: ReviewStepProps) {
  const router = useRouter();
  // Khai báo rõ kiểu: không thì TypeScript suy "private" thành string thường.
  const form = useForm<BookMetaFormValues, unknown, BookMetaInput>({
    resolver: zodResolver(bookMetaSchema),
    // Điền sẵn từ metadata của file, người dùng sửa lại nếu cần.
    defaultValues: {
      title: book.title,
      author: book.author ?? "",
      description: book.description ?? "",
      visibility: "private",
    },
    mode: "onTouched",
  });
  // useWatch: bìa xem trước cập nhật theo tên sách / tác giả đang gõ.
  const [title, author] = useWatch({ control: form.control, name: ["title", "author"] });

  const [cover, setCover] = useState<CoverImage | null>(() => (book.cover ? toCoverImage(book.cover) : null));
  // Lazy initializer: chỉ tính excerpt một lần lúc mount, không phải mỗi lần render.
  const [chapters, setChapters] = useState<ReviewChapter[]>(() =>
    book.chapters.map((chapter, index) => ({
      ...chapter,
      key: index,
      excerpt: htmlToText(chapter.html).slice(0, 160),
    })),
  );
  const totalWords = useMemo(() => chapters.reduce((sum, c) => sum + c.wordCount, 0), [chapters]);

  const [progress, setProgress] = useState<{ saved: number; total: number } | null>(null);
  const isSaving = form.formState.isSubmitting;

  // Đang lưu mà đóng tab thì trình duyệt hỏi lại, tránh mất sách giữa chừng.
  useEffect(() => {
    if (!isSaving) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isSaving]);

  async function onSubmit(meta: BookMetaInput) {
    if (chapters.length === 0) {
      toast.error("Sách cần ít nhất một chương");
      return;
    }
    try {
      const result = await saveBook({
        userId,
        meta,
        format: book.format,
        cover: cover?.blob ?? null,
        chapters,
        onProgress: (saved, total) => setProgress({ saved, total }),
      });
      if (!result.ok) {
        setProgress(null);
        applyServerErrors(result, form.setError);
        if (!result.fieldErrors) toast.error(result.message);
        return;
      }
      toast.success(`Đã thêm “${meta.title}” vào tủ sách`);
      router.push(`/books/${result.data.bookId}`);
    } catch (error) {
      setProgress(null);
      toast.error(error instanceof Error ? error.message : "Không lưu được sách, vui lòng thử lại");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} disabled={isSaving}>
          <ArrowLeftIcon />
          Chọn file khác
        </Button>
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <FileTextIcon className="size-4 shrink-0" />
          <span className="truncate">{fileName}</span>
        </span>
        <Badge variant="secondary" className="uppercase">
          {book.format}
        </Badge>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section className="grid content-start gap-6 sm:grid-cols-[160px_minmax(0,1fr)]">
          <CoverPicker cover={cover} onChange={setCover} title={title} author={author} />
          <BookMetaFields form={form} />
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">{formatNumber(chapters.length)} chương</h2>
            <p className="text-sm text-muted-foreground">
              {formatNumber(totalWords)} từ · khoảng {formatReadingTime(totalWords)} đọc · di chuột vào chương để bỏ
            </p>
          </div>
          {book.warnings.map((warning) => (
            <Alert key={warning}>
              <TriangleAlertIcon />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
          <ChapterPreviewList
            chapters={chapters}
            onRemove={(key) => setChapters((current) => current.filter((c) => c.key !== key))}
          />
        </section>
      </div>

      {/* Thanh lưu dính đáy màn hình: luôn thấy nút lưu dù danh sách chương dài */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t bg-background/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="min-w-0 flex-1">
          {progress && (
            <div className="space-y-1.5 animate-in fade-in">
              <p className="text-sm text-muted-foreground tabular-nums">
                Đang lưu {formatNumber(progress.saved)}/{formatNumber(progress.total)} chương…
              </p>
              <Progress value={(progress.saved / progress.total) * 100} className="h-1.5" />
            </div>
          )}
        </div>
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving && <Loader2Icon className="animate-spin" />}
          {isSaving ? "Đang lưu…" : "Lưu vào tủ sách"}
        </Button>
      </div>
    </form>
  );
}
