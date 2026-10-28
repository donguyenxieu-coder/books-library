import { lexer, parser, type Token, type Tokens } from "marked";

import type { ParsedBook, ParsedChapter } from "../types";
import { countWords, decodeText, htmlToText, titleFromFileName } from "./utils";

const MIN_PROLOGUE_WORDS = 30;

// Front matter đơn giản ở đầu file:
// ---
// title: Tên sách
// author: Tác giả
// ---
function readFrontMatter(text: string) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) return { meta: {} as Record<string, string>, body: text };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const pair = /^(\w+)\s*:\s*(.+)$/.exec(line.trim());
    if (pair) meta[pair[1].toLowerCase()] = pair[2].replace(/^["']|["']$/g, "").trim();
  }
  return { meta, body: text.slice(match[0].length) };
}

function toChapter(title: string, tokens: Token[]): ParsedChapter {
  const html = parser(tokens);
  return { title, html, wordCount: countWords(htmlToText(html)) };
}

export function parseMarkdown(bytes: Uint8Array, fileName: string): ParsedBook {
  const { meta, body } = readFrontMatter(decodeText(bytes).text.replace(/\r\n?/g, "\n"));
  const tokens = lexer(body);
  const headings = tokens.filter((t): t is Tokens.Heading => t.type === "heading");
  const h1Count = headings.filter((h) => h.depth === 1).length;

  // Chọn cấp heading dùng để chia chương:
  // - nhiều "#"  → mỗi "#" là một chương
  // - một "#"    → đó là tên sách, chia theo "##"
  // - không "#"  → chia theo "##" nếu có
  let bookTitle = meta.title ?? null;
  let splitDepth: number | null = null;
  if (h1Count > 1) {
    splitDepth = 1;
  } else if (h1Count === 1) {
    bookTitle ??= headings.find((h) => h.depth === 1)!.text;
    splitDepth = headings.some((h) => h.depth === 2) ? 2 : null;
  } else if (headings.some((h) => h.depth === 2)) {
    splitDepth = 2;
  }

  const sections: { title: string | null; tokens: Token[] }[] = [{ title: null, tokens: [] }];
  for (const token of tokens) {
    if (token.type === "heading" && (token as Tokens.Heading).depth === splitDepth) {
      sections.push({ title: (token as Tokens.Heading).text, tokens: [] });
    } else if (token.type === "heading" && h1Count === 1 && (token as Tokens.Heading).depth === 1) {
      continue; // tên sách đã lấy ở trên, không đưa vào nội dung
    } else {
      sections[sections.length - 1].tokens.push(token);
    }
  }

  const [prologue, ...headed] = sections;
  const chapters: ParsedChapter[] = [];
  const prologueChapter = toChapter(headed.length ? "Mở đầu" : "", prologue.tokens);
  if (headed.length === 0 || prologueChapter.wordCount >= MIN_PROLOGUE_WORDS) chapters.push(prologueChapter);
  for (const section of headed) chapters.push(toChapter(section.title ?? "", section.tokens));

  return {
    format: "md",
    title: bookTitle ?? titleFromFileName(fileName),
    author: meta.author ?? null,
    description: meta.description ?? null,
    cover: null,
    chapters: chapters.filter((chapter) => chapter.wordCount > 0),
    warnings: headed.length === 0 ? ["Không tìm thấy heading để chia chương, cả file là một chương."] : [],
  };
}
