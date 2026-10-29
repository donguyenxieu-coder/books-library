"use client";

import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteChapter } from "../../actions";
import { chapterLabel } from "../../format";
import type { ChapterSummary } from "./types";

type DeleteChapterDialogProps = {
  bookId: string;
  chapter: ChapterSummary;
  onClose: () => void;
};

// Khác với xoá sách (xoá mềm + Hoàn tác), xoá chương là xoá thật → phải hỏi lại.
export function DeleteChapterDialog({ bookId, chapter, onClose }: DeleteChapterDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteChapter(bookId, chapter.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Đã xoá ${chapterLabel(chapter.position, chapter.title)}`);
      onClose();
    });
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá {chapterLabel(chapter.position, chapter.title)}?</AlertDialogTitle>
          <AlertDialogDescription>
            Nội dung chương, bookmark và ghi chú trong chương sẽ bị xoá vĩnh viễn. Các chương phía sau tự lùi lên
            một số.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Huỷ</AlertDialogCancel>
          {/* Dùng Button thường thay cho AlertDialogAction: Action tự đóng dialog ngay khi bấm,
              trong khi mình muốn giữ dialog mở (hiện spinner) cho tới khi xoá xong. */}
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Xoá chương
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
