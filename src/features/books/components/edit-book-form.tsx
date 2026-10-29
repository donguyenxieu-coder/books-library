"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { type CoverImage, CoverPicker } from "@/features/import/components/cover-picker";
import { applyServerErrors } from "@/lib/form";

import { updateBook } from "../actions";
import { uploadCover } from "../lib/upload-cover";
import { type BookMetaFormValues, type BookMetaInput, bookMetaSchema } from "../schemas";
import { BookMetaFields } from "./book-meta-fields";

type EditBookFormProps = {
  userId: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    visibility: "private" | "public";
    coverUrl: string | null;
  };
};

// Cùng BookMetaFields + CoverPicker với trang tải sách lên, chỉ khác giá trị ban đầu
// lấy từ DB và lúc submit gọi updateBook thay vì createBook.
export function EditBookForm({ userId, book }: EditBookFormProps) {
  const router = useRouter();
  const form = useForm<BookMetaFormValues, unknown, BookMetaInput>({
    resolver: zodResolver(bookMetaSchema),
    defaultValues: {
      title: book.title,
      author: book.author ?? "",
      description: book.description ?? "",
      visibility: book.visibility,
    },
    mode: "onTouched",
  });
  const [title, author] = useWatch({ control: form.control, name: ["title", "author"] });
  // Ảnh có sẵn: chỉ có URL, blob = null.
  const [cover, setCover] = useState<CoverImage | null>(book.coverUrl ? { blob: null, url: book.coverUrl } : null);
  const coverChanged = (cover?.url ?? null) !== book.coverUrl;

  async function onSubmit(meta: BookMetaInput) {
    try {
      // Ba trường hợp ảnh bìa: chọn ảnh mới → upload; bấm xoá → null; không đụng → undefined (giữ nguyên).
      let coverPath: string | null | undefined;
      if (cover?.blob) coverPath = await uploadCover(userId, cover.blob);
      else if (!cover && book.coverUrl) coverPath = null;

      const result = await updateBook(book.id, { ...meta, coverPath });
      if (!result.ok) {
        applyServerErrors(result, form.setError);
        return;
      }
      toast.success("Đã lưu thay đổi");
      router.push(`/books/${book.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được thay đổi");
    }
  }

  const { isSubmitting, isDirty, errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      {errors.root?.server && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.server.message}
        </p>
      )}
      <div className="grid gap-8 sm:grid-cols-[180px_minmax(0,1fr)]">
        <CoverPicker cover={cover} onChange={setCover} title={title} author={author} />
        <BookMetaFields form={form} />
      </div>
      <div className="flex justify-end gap-3 border-t pt-6">
        <Button asChild variant="ghost">
          <Link href={`/books/${book.id}`}>Huỷ</Link>
        </Button>
        {/* Chưa sửa gì thì không cho lưu */}
        <Button type="submit" disabled={isSubmitting || (!isDirty && !coverChanged)}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
