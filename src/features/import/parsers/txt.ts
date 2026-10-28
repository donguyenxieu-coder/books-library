import type { ParsedBook, ParsedChapter } from "../types";
import { countWords, decodeText, escapeHtml, splitParagraphsIntoParts, titleFromFileName } from "./utils";

// Một dòng là tiêu đề chương nếu: bắt đầu bằng từ khoá + số (Ả Rập hoặc La Mã),
// phần sau (nếu có) là tên chương. Giới hạn độ dài để không bắt nhầm câu văn
// kiểu "Chương 3 kể về việc...".
//   "Chương 12: Khởi đầu"  → tên "Khởi đầu"
//   "CHAPTER IV - The End" → tên "The End"
//   "Chương 5"             → tên ""
// Sau số bắt buộc là hết dòng, khoảng trắng hoặc dấu ngăn cách: nhờ vậy
// "Phần lớn thời gian..." không bị hiểu nhầm ("l" cũng là số La Mã).
const HEADING =
  /^\s*(?:chương|chuong|chapter|hồi|quyển|phần|part)\s+(?:\d+|[ivxlcdm]+)(?=$|[\s:.\-–—])\s*[:.\-–—]?\s*(.*)$/iu;
const MAX_HEADING_LENGTH = 100;

// Phần chữ trước chương đầu tiên (lời tựa, thông tin tác giả...) chỉ giữ lại
// nếu đủ dài, còn vài dòng tên sách thì bỏ.
const MIN_PROLOGUE_WORDS = 30;

function toParagraphs(text: string): string[] {
  const lines = text.split("\n");
  const nonEmpty = lines.filter((line) => line.trim());
  // File "xuống dòng cứng" (mỗi dòng ~70 ký tự, đoạn cách nhau bởi dòng trống)
  // thì một đoạn = nhiều dòng liền nhau. Còn lại (phổ biến ở truyện tiếng Việt)
  // mỗi dòng là một đoạn.
  const shortLines = nonEmpty.filter((line) => line.length <= 80).length;
  const isHardWrapped = text.includes("\n\n") && shortLines / Math.max(nonEmpty.length, 1) > 0.9;

  if (isHardWrapped) {
    return text
      .split(/\n\s*\n/)
      .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
  }
  return nonEmpty.map((line) => line.trim());
}

function toChapter(title: string, paragraphs: string[]): ParsedChapter {
  return {
    title,
    html: paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n"),
    wordCount: paragraphs.reduce((sum, p) => sum + countWords(p), 0),
  };
}

export function parseTxt(bytes: Uint8Array, fileName: string): ParsedBook {
  const warnings: string[] = [];
  const { text: raw, encoding } = decodeText(bytes);
  if (encoding === "windows-1258") {
    warnings.push("File không phải UTF-8, đã đọc theo bảng mã Windows-1258. Kiểm tra lại dấu tiếng Việt.");
  }
  const text = raw.replace(/\r\n?/g, "\n");

  // Duyệt từng dòng: gặp tiêu đề thì mở chương mới, còn lại gom vào chương hiện tại.
  const sections: { title: string | null; lines: string[] }[] = [{ title: null, lines: [] }];
  for (const line of text.split("\n")) {
    const match = line.length <= MAX_HEADING_LENGTH ? HEADING.exec(line) : null;
    if (match) {
      sections.push({ title: match[1].trim(), lines: [] });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }

  const [prologue, ...headed] = sections;
  const chapters: ParsedChapter[] = [];

  if (headed.length === 0) {
    // Không có tiêu đề nào → tự chia thành các phần ~4000 từ.
    const parts = splitParagraphsIntoParts(toParagraphs(prologue.lines.join("\n")));
    chapters.push(...parts.map((paragraphs) => toChapter("", paragraphs)));
    if (parts.length > 1) {
      warnings.push(`Không nhận diện được tiêu đề chương, đã tự chia thành ${parts.length} phần.`);
    }
  } else {
    const prologueParagraphs = toParagraphs(prologue.lines.join("\n"));
    const prologueChapter = toChapter("Mở đầu", prologueParagraphs);
    if (prologueChapter.wordCount >= MIN_PROLOGUE_WORDS) chapters.push(prologueChapter);

    for (const section of headed) {
      chapters.push(toChapter(section.title ?? "", toParagraphs(section.lines.join("\n"))));
    }
  }

  return {
    format: "txt",
    title: titleFromFileName(fileName),
    author: null,
    description: null,
    cover: null,
    chapters: chapters.filter((chapter) => chapter.wordCount > 0),
    warnings,
  };
}
