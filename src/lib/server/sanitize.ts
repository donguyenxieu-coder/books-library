import "server-only";

import sanitizeHtml from "sanitize-html";

// Nội dung chương đến từ file người dùng tải lên → coi như không đáng tin.
// Lọc ở server TRƯỚC khi lưu, nên lúc hiển thị có thể render HTML trong DB
// mà không lo XSS (kể cả với sách public người khác đọc).
const ALLOWED_TAGS = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote",
  "em", "strong", "i", "b", "u", "s", "sub", "sup", "small",
  "ul", "ol", "li", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption",
];

export function sanitizeChapterHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {}, // bỏ mọi thuộc tính: style, class, onclick, href...
    // Thẻ không được phép (div, span, a...) bị bỏ nhưng giữ chữ bên trong,
    // riêng các thẻ này thì bỏ luôn cả nội dung.
    nonTextTags: ["script", "style", "textarea", "option", "noscript", "title", "head"],
  }).trim();
}
