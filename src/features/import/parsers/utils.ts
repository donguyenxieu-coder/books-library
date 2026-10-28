// Tiện ích dùng chung cho các parser. Không phụ thuộc DOM để test được dễ.

export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Tiếng Việt cũng tách từ bằng khoảng trắng, nên đếm theo khoảng trắng là đủ.
export function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// Bỏ thẻ HTML để lấy chữ (dùng cho đếm từ và trích đoạn xem trước).
export function htmlToText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// "tat-den_ngo-tat-to.txt" → "tat den ngo tat to"
export function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Đọc bytes thành chữ. File txt tiếng Việt cũ hay lưu bằng Windows-1258
// hoặc UTF-16 (Notepad), nên không thể mặc định là UTF-8.
export function decodeText(bytes: Uint8Array): { text: string; encoding: string } {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { text: new TextDecoder("utf-8").decode(bytes.subarray(3)), encoding: "utf-8" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder("utf-16le").decode(bytes.subarray(2)), encoding: "utf-16le" };
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: new TextDecoder("utf-16be").decode(bytes.subarray(2)), encoding: "utf-16be" };
  }
  try {
    // fatal: true → gặp byte không hợp lệ UTF-8 thì ném lỗi thay vì thay bằng "�"
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1258").decode(bytes), encoding: "windows-1258" };
  }
}

// Gom đoạn văn thành các phần ~maxWords từ, cắt đúng ranh giới đoạn.
// Dùng khi file không có tiêu đề chương: một "chương" 500.000 từ vừa quá nặng
// để gửi lên server, vừa khó đọc.
export function splitParagraphsIntoParts(paragraphs: string[], maxWords = 4000) {
  const parts: string[][] = [];
  let current: string[] = [];
  let words = 0;
  for (const paragraph of paragraphs) {
    const count = countWords(paragraph);
    if (words + count > maxWords && current.length > 0) {
      parts.push(current);
      current = [];
      words = 0;
    }
    current.push(paragraph);
    words += count;
  }
  if (current.length > 0) parts.push(current);
  return parts;
}
