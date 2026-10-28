"use client";

import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BookCover } from "@/features/books/components/book-cover";

// Ảnh chọn từ máy là Blob, <img> không hiển thị trực tiếp được → tạo URL tạm
// "blob:..." ngay lúc chọn ảnh và giữ cùng Blob trong một object.
export type CoverImage = { blob: Blob; url: string };

export function toCoverImage(blob: Blob): CoverImage {
  return { blob, url: URL.createObjectURL(blob) };
}

type CoverPickerProps = {
  cover: CoverImage | null;
  onChange: (cover: CoverImage | null) => void;
  title: string;
  author: string;
};

export function CoverPicker({ cover, onChange, title, author }: CoverPickerProps) {
  // Đổi / xoá ảnh thì giải phóng URL cũ, nếu không trình duyệt giữ ảnh trong bộ nhớ
  // tới khi đóng tab.
  function replace(next: CoverImage | null) {
    if (cover) URL.revokeObjectURL(cover.url);
    onChange(next);
  }

  // Ảnh gốc được giữ nguyên ở đây, lúc lưu mới thu nhỏ (xem save-book.ts).
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Chọn một file ảnh (JPG, PNG, WebP)");
      return;
    }
    replace(toCoverImage(file));
  }

  return (
    <div className="space-y-3">
      {/* Không có ảnh thì xem trước luôn bìa tự tạo theo tên sách đang gõ */}
      <BookCover title={title || "Chưa có tên"} author={author} src={cover?.url} className="w-full" />
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <label className="cursor-pointer">
            <ImagePlusIcon />
            {cover ? "Đổi ảnh" : "Thêm ảnh bìa"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = "";
              }}
            />
          </label>
        </Button>
        {cover && (
          <Button type="button" variant="ghost" size="sm" aria-label="Xoá ảnh bìa" onClick={() => replace(null)}>
            <Trash2Icon />
          </Button>
        )}
      </div>
    </div>
  );
}
