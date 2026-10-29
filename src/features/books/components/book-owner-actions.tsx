"use client";

import { EllipsisIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { deleteBook, restoreBook } from "../actions";

// Nút dành riêng cho chủ sách. Xoá không hỏi "Bạn có chắc?" mà xoá luôn
// rồi cho "Hoàn tác" trong vài giây: nhanh hơn cho người dùng, và an toàn
// vì là xoá mềm (chỉ đánh dấu deleted_at).
export function BookOwnerActions({ bookId, title }: { bookId: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBook(bookId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push("/library");
      // Toaster nằm ở root layout nên toast vẫn hiện sau khi chuyển trang.
      toast.success(`Đã xoá “${title}”`, {
        duration: 8000,
        action: {
          label: "Hoàn tác",
          onClick: async () => {
            const restored = await restoreBook(bookId);
            if (!restored.ok) return toast.error(restored.message);
            toast.success("Đã khôi phục sách");
            router.push(`/books/${bookId}`);
          },
        },
      });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline">
        <Link href={`/books/${bookId}/edit`}>
          <PencilIcon />
          Sửa thông tin
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Thêm thao tác" disabled={isPending}>
            {isPending ? <Loader2Icon className="animate-spin" /> : <EllipsisIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/books/${bookId}/edit`}>
              <PencilIcon />
              Sửa thông tin
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
            <Trash2Icon />
            Xoá sách
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
