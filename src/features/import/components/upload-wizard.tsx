"use client";

import { useState } from "react";

import type { ParsedBook } from "../types";
import { FileDropzone } from "./file-dropzone";
import { ReviewStep } from "./review-step";

// Hai bước: chọn file → kiểm tra & lưu.
// Toàn bộ việc đọc file diễn ra trên trình duyệt, chưa gửi gì lên server
// cho tới khi người dùng bấm "Lưu".
export function UploadWizard({ userId }: { userId: string }) {
  const [parsed, setParsed] = useState<{ book: ParsedBook; fileName: string } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setIsParsing(true);
    setError(null);
    try {
      // Import động: JSZip + marked (~100KB) chỉ được tải khi người dùng thật sự chọn file.
      const { parseBookFile } = await import("../parsers");
      const book = await parseBookFile(file);
      if (book.chapters.length === 0) throw new Error("Không tìm thấy nội dung nào trong file này");
      setParsed({ book, fileName: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đọc được file này");
    } finally {
      setIsParsing(false);
    }
  }

  if (!parsed) return <FileDropzone onFile={handleFile} isParsing={isParsing} error={error} />;

  // key = tên file: chọn file khác thì ReviewStep được tạo mới hoàn toàn
  // (form, danh sách chương... reset theo file mới).
  return <ReviewStep key={parsed.fileName} userId={userId} {...parsed} onBack={() => setParsed(null)} />;
}
