import { describe, expect, it } from "vitest";

import { sanitizeChapterHtml } from "./sanitize";

describe("sanitizeChapterHtml", () => {
  it("bỏ script, style và mọi thuộc tính", () => {
    const html = `<p class="x" onclick="steal()" style="color:red">Chào</p><script>alert(1)</script><style>p{}</style>`;
    expect(sanitizeChapterHtml(html)).toBe("<p>Chào</p>");
  });

  it("giữ thẻ định dạng, bỏ thẻ lạ nhưng giữ chữ", () => {
    const html = `<h2>Tên</h2><p><em>nghiêng</em> <a href="javascript:x">link</a> <span>chữ</span></p><img src=x onerror=alert(1)>`;
    expect(sanitizeChapterHtml(html)).toBe("<h2>Tên</h2><p><em>nghiêng</em> link chữ</p>");
  });
});
