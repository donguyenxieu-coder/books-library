"use client";

import { FileUpIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { ACCEPTED_EXTENSIONS } from "../parsers/constants";

type FileDropzoneProps = {
  onFile: (file: File) => void;
  isParsing: boolean;
  error: string | null;
};

// Vùng kéo thả file. Bên trong là một <input type="file"> thật (ẩn đi) bọc trong <label>:
// bấm vào vùng = bấm vào input, dùng bàn phím (Tab + Enter) cũng chọn file được.
export function FileDropzone({ onFile, isParsing, error }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault(); // bắt buộc, nếu không trình duyệt sẽ mở file trong tab mới
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={cn(
        "group relative flex min-h-80 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
        "hover:border-primary/50 hover:bg-muted/40 has-[:focus-visible]:border-primary has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring/30",
        isDragging && "scale-[1.01] border-primary bg-muted/60",
        isParsing && "pointer-events-none opacity-70",
      )}
    >
      <input
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="sr-only"
        disabled={isParsing}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = ""; // cho phép chọn lại cùng một file
        }}
      />

      <span
        className={cn(
          "flex size-16 items-center justify-center rounded-2xl bg-muted transition-transform duration-300 group-hover:-translate-y-1",
          isDragging && "-translate-y-2 bg-primary text-primary-foreground",
        )}
      >
        {isParsing ? <Loader2Icon className="size-7 animate-spin" /> : <FileUpIcon className="size-7" />}
      </span>

      <div className="space-y-1">
        <p className="text-lg font-medium">
          {isParsing ? "Đang đọc file…" : isDragging ? "Thả file vào đây" : "Kéo thả file sách vào đây"}
        </p>
        <p className="text-sm text-muted-foreground">
          hoặc <span className="font-medium text-foreground underline underline-offset-4">chọn từ máy</span> · EPUB,
          TXT, Markdown · tối đa 50MB
        </p>
      </div>

      {error && (
        <p role="alert" className="max-w-md text-sm text-destructive animate-in fade-in">
          {error}
        </p>
      )}
    </label>
  );
}
