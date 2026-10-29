"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/form";

import { renameChapter } from "../../actions";
import { type ChapterTitleFormValues, type ChapterTitleInput, chapterTitleSchema } from "../../schemas";
import type { ChapterSummary } from "./types";

type RenameChapterDialogProps = {
  bookId: string;
  chapter: ChapterSummary;
  onClose: () => void;
};

// Component cha chỉ render dialog này khi đang đổi tên một chương cụ thể
// (chapter luôn có giá trị), nên defaultValues của form luôn đúng chương đó.
export function RenameChapterDialog({ bookId, chapter, onClose }: RenameChapterDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChapterTitleFormValues, unknown, ChapterTitleInput>({
    resolver: zodResolver(chapterTitleSchema),
    defaultValues: { title: chapter.title },
  });

  async function onSubmit(values: ChapterTitleInput) {
    const result = await renameChapter(bookId, chapter.id, values);
    if (!result.ok) {
      applyServerErrors(result, setError);
      return;
    }
    toast.success("Đã đổi tên chương");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Đổi tên chương {chapter.position}</DialogTitle>
            <DialogDescription>Để trống nếu chỉ muốn hiện “Chương {chapter.position}”.</DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="chapter-title">Tên chương</FieldLabel>
            <Input id="chapter-title" autoFocus aria-invalid={!!errors.title} {...register("title")} />
            <FieldError errors={[errors.title, errors.root?.server]} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
