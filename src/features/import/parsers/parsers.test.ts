import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { parseEpub, resolvePath } from "./epub";
import { parseMarkdown } from "./md";
import { parseTxt } from "./txt";

const utf8 = (text: string) => new TextEncoder().encode(text);

describe("parseTxt", () => {
  it("tách chương theo tiêu đề và lấy tên chương", () => {
    const book = parseTxt(
      utf8("Chương 1: Khởi đầu\nĐoạn một.\nĐoạn hai.\n\nChương 2\nNội dung chương hai.\nCHAPTER III - The End\nHết."),
      "mat-biec.txt",
    );
    expect(book.title).toBe("mat biec");
    expect(book.chapters.map((c) => c.title)).toEqual(["Khởi đầu", "", "The End"]);
    expect(book.chapters[0].html).toBe("<p>Đoạn một.</p>\n<p>Đoạn hai.</p>");
  });

  it("không bắt nhầm câu văn bắt đầu giống tiêu đề", () => {
    const book = parseTxt(utf8("Chương 1\nPhần lớn thời gian anh ở nhà.\nHồi ức ùa về."), "a.txt");
    expect(book.chapters).toHaveLength(1);
    expect(book.chapters[0].wordCount).toBe(11);
  });

  it("bỏ phần mở đầu quá ngắn, giữ phần mở đầu dài", () => {
    const shortIntro = parseTxt(utf8("Tên sách\nTác giả\nChương 1\nNội dung."), "a.txt");
    expect(shortIntro.chapters.map((c) => c.title)).toEqual([""]);

    const longIntro = parseTxt(utf8(`${"chữ ".repeat(40)}\nChương 1\nNội dung.`), "a.txt");
    expect(longIntro.chapters.map((c) => c.title)).toEqual(["Mở đầu", ""]);
  });

  it("escape HTML trong nội dung", () => {
    const book = parseTxt(utf8("<script>alert(1)</script>"), "a.txt");
    expect(book.chapters[0].html).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });

  it("không có tiêu đề thì tự chia thành các phần", () => {
    const paragraph = "từ ".repeat(1000);
    const book = parseTxt(utf8(Array(9).fill(paragraph).join("\n")), "a.txt");
    expect(book.chapters).toHaveLength(3);
    expect(book.warnings[0]).toMatch(/3 phần/);
  });

  it("gộp dòng của file xuống dòng cứng thành đoạn", () => {
    const book = parseTxt(utf8("Chương 1\nDòng một của đoạn\ntiếp tục đoạn.\n\nĐoạn mới."), "a.txt");
    expect(book.chapters[0].html).toBe("<p>Dòng một của đoạn tiếp tục đoạn.</p>\n<p>Đoạn mới.</p>");
  });

  it("đọc được file có BOM UTF-16 và file Windows-1258", () => {
    const utf16 = new Uint8Array([0xff, 0xfe, ...new Uint8Array(new Uint16Array([...("Chào")].map((c) => c.charCodeAt(0))).buffer)]);
    expect(parseTxt(utf16, "a.txt").chapters[0].html).toBe("<p>Chào</p>");

    // 0xE0 trong Windows-1258 là "à", và không phải UTF-8 hợp lệ
    const legacy = parseTxt(new Uint8Array([0x6c, 0xe0]), "a.txt");
    expect(legacy.chapters[0].html).toBe("<p>là</p>");
    expect(legacy.warnings[0]).toMatch(/Windows-1258/);
  });
});

describe("parseMarkdown", () => {
  it("một '#' là tên sách, chia chương theo '##'", () => {
    const book = parseMarkdown(utf8("# Sách hay\n\n## Một\n\nXin **chào**.\n\n## Hai\n\nTạm biệt."), "x.md");
    expect(book.title).toBe("Sách hay");
    expect(book.chapters.map((c) => c.title)).toEqual(["Một", "Hai"]);
    expect(book.chapters[0].html).toContain("<strong>chào</strong>");
  });

  it("nhiều '#' thì mỗi '#' là một chương, đọc front matter", () => {
    const book = parseMarkdown(utf8("---\ntitle: Tuyển tập\nauthor: An\n---\n# A\n\nNội dung A.\n\n# B\n\nNội dung B."), "x.md");
    expect(book.title).toBe("Tuyển tập");
    expect(book.author).toBe("An");
    expect(book.chapters.map((c) => c.title)).toEqual(["A", "B"]);
  });

  it("không có heading thì cả file là một chương", () => {
    const book = parseMarkdown(utf8("Chỉ có một đoạn."), "ghi-chu.md");
    expect(book.title).toBe("ghi chu");
    expect(book.chapters).toHaveLength(1);
    expect(book.warnings).toHaveLength(1);
  });
});

async function buildEpub() {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip");
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
      <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
  );
  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>Dế Mèn phiêu lưu ký</dc:title><dc:creator>Tô Hoài</dc:creator>
        <dc:description>&lt;p&gt;Truyện &lt;b&gt;thiếu nhi&lt;/b&gt;&lt;/p&gt;</dc:description>
      </metadata>
      <manifest>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
        <item id="cover" href="Images/cover.png" media-type="image/png" properties="cover-image"/>
        <item id="p0" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>
        <item id="c1" href="Text/c1.xhtml" media-type="application/xhtml+xml"/>
        <item id="c2" href="Text/c2.xhtml" media-type="application/xhtml+xml"/>
      </manifest>
      <spine><itemref idref="p0"/><itemref idref="c1"/><itemref idref="c2"/></spine>
    </package>`,
  );
  zip.file(
    "OEBPS/nav.xhtml",
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body>
      <nav epub:type="toc"><ol><li><a href="Text/c1.xhtml">Tôi sống độc lập</a></li></ol></nav></body></html>`,
  );
  const page = (body: string) => `<html xmlns="http://www.w3.org/1999/xhtml"><head><style>p{}</style></head><body>${body}</body></html>`;
  zip.file("OEBPS/Text/cover.xhtml", page(`<img src="../Images/cover.png"/>`));
  zip.file("OEBPS/Text/c1.xhtml", page(`<h1>Tôi sống độc lập</h1><p>Tôi là em út.</p><script>x()</script>`));
  zip.file("OEBPS/Text/c2.xhtml", page(`<h2>Chương hai</h2><p>Hết rồi.</p>`));
  zip.file("OEBPS/Images/cover.png", new Uint8Array([137, 80, 78, 71]));
  return zip.generateAsync({ type: "uint8array" });
}

describe("parseEpub", () => {
  it("đọc metadata, bìa và chương theo spine + mục lục", async () => {
    const book = await parseEpub(await buildEpub(), "de-men.epub");
    expect(book.title).toBe("Dế Mèn phiêu lưu ký");
    expect(book.author).toBe("Tô Hoài");
    expect(book.description).toBe("Truyện thiếu nhi");
    expect(book.cover?.type).toBe("image/png");
    // trang bìa (chỉ có ảnh) bị bỏ; c1 lấy tên từ mục lục, c2 từ heading
    expect(book.chapters.map((c) => c.title)).toEqual(["Tôi sống độc lập", "Chương hai"]);
    expect(book.chapters[0].html).not.toContain("<script");
    expect(book.chapters[0].html).not.toContain("<h1");
    expect(book.chapters[0].html).toContain("Tôi là em út.");
  });

  it("giải đường dẫn tương đối", () => {
    expect(resolvePath("OEBPS/Text", "../Images/a%20b.jpg#top")).toBe("OEBPS/Images/a b.jpg");
    expect(resolvePath("", "c1.xhtml")).toBe("c1.xhtml");
  });
});
