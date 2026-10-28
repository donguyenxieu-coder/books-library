import type { ParsedBook } from "../types";
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from "./constants";
import { parseEpub } from "./epub";
import { parseMarkdown } from "./md";
import { parseTxt } from "./txt";

// Điểm vào duy nhất: nhận File từ <input type="file"> hoặc kéo thả,
// chọn parser theo đuôi file.
export async function parseBookFile(file: File): Promise<ParsedBook> {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error("Chỉ hỗ trợ file .epub, .txt hoặc .md");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File quá lớn (tối đa 50MB)");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === ".epub") return parseEpub(bytes, file.name);
  if (extension === ".txt") return parseTxt(bytes, file.name);
  return parseMarkdown(bytes, file.name);
}
