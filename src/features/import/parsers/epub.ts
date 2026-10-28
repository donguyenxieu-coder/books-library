import JSZip from "jszip";

import type { ParsedBook, ParsedChapter } from "../types";
import { countWords, titleFromFileName } from "./utils";

// EPUB thực chất là một file zip chứa các trang XHTML:
//   META-INF/container.xml → chỉ tới file .opf
//   .opf: metadata (tên, tác giả), manifest (danh sách file), spine (thứ tự đọc)
//   nav.xhtml (EPUB 3) hoặc toc.ncx (EPUB 2): mục lục → tên chương
// Mỗi file trong spine thường là một chương.

type ManifestItem = { href: string; mediaType: string; properties: string };

// Thẻ chỉ để trình bày hoặc nguy hiểm: bỏ hẳn cả nội dung bên trong.
const REMOVED_TAGS = "script, style, link, meta, img, svg, image, video, audio, iframe, object, embed, form";

function parseXml(text: string, type: DOMParserSupportedType = "application/xml") {
  const doc = new DOMParser().parseFromString(text, type);
  // XHTML lỗi cú pháp (khá phổ biến) → đọc lại bằng parser HTML dễ tính hơn.
  if (type !== "text/html" && doc.getElementsByTagName("parsererror").length > 0) {
    return new DOMParser().parseFromString(text, "text/html");
  }
  return doc;
}

// Lấy phần tử theo tên bỏ qua namespace: "dc:title" và "title" đều khớp.
function byLocalName(root: Document | Element, name: string) {
  return Array.from(root.getElementsByTagName("*")).filter((el) => el.localName === name);
}

// "OEBPS/Text/" + "../Images/a.jpg#x" → "OEBPS/Images/a.jpg"
export function resolvePath(baseDir: string, href: string) {
  const clean = decodeURIComponent(href.split("#")[0]);
  const parts = (baseDir ? `${baseDir}/${clean}` : clean).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part && part !== ".") out.push(part);
  }
  return out.join("/");
}

function dirOf(path: string) {
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

async function readText(zip: JSZip, path: string) {
  const file = zip.file(path);
  if (!file) throw new Error(`EPUB thiếu file ${path}`);
  return file.async("text");
}

// Mục lục: đường dẫn file → tên chương (lấy mục đầu tiên trỏ vào file đó).
async function readToc(zip: JSZip, opfDir: string, manifest: Map<string, ManifestItem>, ncxId: string | null) {
  const titles = new Map<string, string>();
  const add = (href: string | null, label: string | null | undefined, baseDir: string) => {
    const text = label?.replace(/\s+/g, " ").trim();
    if (!href || !text) return;
    const path = resolvePath(baseDir, href);
    if (!titles.has(path)) titles.set(path, text);
  };

  const nav = [...manifest.values()].find((item) => item.properties.split(/\s+/).includes("nav"));
  if (nav) {
    const navPath = resolvePath(opfDir, nav.href);
    const doc = parseXml(await readText(zip, navPath), "application/xhtml+xml");
    const tocNav =
      byLocalName(doc, "nav").find((el) => /toc/.test(el.getAttribute("epub:type") ?? el.getAttribute("type") ?? "")) ??
      byLocalName(doc, "nav")[0];
    for (const a of tocNav ? byLocalName(tocNav, "a") : []) add(a.getAttribute("href"), a.textContent, dirOf(navPath));
    if (titles.size > 0) return titles;
  }

  const ncx = ncxId ? manifest.get(ncxId) : [...manifest.values()].find((i) => i.mediaType === "application/x-dtbncx+xml");
  if (ncx) {
    const ncxPath = resolvePath(opfDir, ncx.href);
    const doc = parseXml(await readText(zip, ncxPath));
    for (const point of byLocalName(doc, "navPoint")) {
      const label = byLocalName(point, "text")[0]?.textContent;
      const src = byLocalName(point, "content")[0]?.getAttribute("src") ?? null;
      add(src, label, dirOf(ncxPath));
    }
  }
  return titles;
}

function findCover(opf: Document, manifest: Map<string, ManifestItem>) {
  // EPUB 3: properties="cover-image"
  const byProperty = [...manifest.values()].find((item) => item.properties.split(/\s+/).includes("cover-image"));
  if (byProperty) return byProperty;
  // EPUB 2: <meta name="cover" content="id-của-ảnh"/>
  const coverId = byLocalName(opf, "meta").find((m) => m.getAttribute("name") === "cover")?.getAttribute("content");
  if (coverId && manifest.get(coverId)?.mediaType.startsWith("image/")) return manifest.get(coverId)!;
  // Đoán theo tên
  return [...manifest.entries()].find(
    ([id, item]) => item.mediaType.startsWith("image/") && /cover/i.test(id + item.href),
  )?.[1];
}

function chapterFromXhtml(xhtml: string, tocTitle: string | undefined): ParsedChapter | null {
  const doc = parseXml(xhtml, "application/xhtml+xml");
  const body = byLocalName(doc, "body")[0];
  if (!body) return null;

  for (const el of Array.from(body.querySelectorAll(REMOVED_TAGS))) el.remove();

  // Nhiều EPUB dùng <div> thay cho <p>. Server chỉ giữ thẻ ngữ nghĩa và bỏ <div>,
  // nên đổi các div "lá" (không chứa khối nào bên trong) thành <p> để không bị dính đoạn.
  for (const div of Array.from(body.getElementsByTagName("div")).reverse()) {
    if (div.querySelector("p, div, h1, h2, h3, h4, h5, h6, ul, ol, table, blockquote, pre")) continue;
    const p = doc.createElementNS(div.namespaceURI, "p");
    p.append(...Array.from(div.childNodes));
    div.replaceWith(p);
  }

  const text = body.textContent ?? "";
  const wordCount = countWords(text);
  if (wordCount === 0) return null; // trang bìa, trang chỉ có ảnh...

  // Không có trong mục lục thì lấy heading đầu tiên của trang làm tên.
  const heading = body.querySelector("h1, h2, h3");
  const title = tocTitle ?? heading?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  // Tên chương đã hiện riêng, nên bỏ heading trùng tên khỏi nội dung.
  if (heading && heading.textContent?.replace(/\s+/g, " ").trim() === title) heading.remove();

  return { title, html: body.innerHTML.trim(), wordCount };
}

export async function parseEpub(data: ArrayBuffer | Uint8Array, fileName: string): Promise<ParsedBook> {
  const zip = await JSZip.loadAsync(data);
  const warnings: string[] = [];

  const container = parseXml(await readText(zip, "META-INF/container.xml"));
  const opfPath = byLocalName(container, "rootfile")[0]?.getAttribute("full-path");
  if (!opfPath) throw new Error("EPUB không hợp lệ: không tìm thấy file .opf");
  const opfDir = dirOf(opfPath);
  const opf = parseXml(await readText(zip, opfPath));

  const manifest = new Map<string, ManifestItem>();
  for (const item of byLocalName(opf, "item")) {
    manifest.set(item.getAttribute("id") ?? "", {
      href: item.getAttribute("href") ?? "",
      mediaType: item.getAttribute("media-type") ?? "",
      properties: item.getAttribute("properties") ?? "",
    });
  }

  const meta = (name: string) => byLocalName(opf, name)[0]?.textContent?.replace(/\s+/g, " ").trim() || null;
  // Mô tả thường chứa HTML → chỉ giữ chữ.
  const rawDescription = meta("description");
  const description = rawDescription
    ? (parseXml(`<div>${rawDescription}</div>`, "text/html").body.textContent?.trim() ?? null)
    : null;

  const spine = byLocalName(opf, "spine")[0];
  const tocTitles = await readToc(zip, opfDir, manifest, spine?.getAttribute("toc") ?? null);

  const chapters: ParsedChapter[] = [];
  for (const ref of spine ? byLocalName(spine, "itemref") : []) {
    const item = manifest.get(ref.getAttribute("idref") ?? "");
    if (!item || !/x?html/.test(item.mediaType)) continue;
    const path = resolvePath(opfDir, item.href);
    const file = zip.file(path);
    if (!file) {
      warnings.push(`Thiếu file ${path}, đã bỏ qua.`);
      continue;
    }
    const chapter = chapterFromXhtml(await file.async("text"), tocTitles.get(path));
    if (chapter) chapters.push(chapter);
  }

  let cover: Blob | null = null;
  const coverItem = findCover(opf, manifest);
  const coverFile = coverItem ? zip.file(resolvePath(opfDir, coverItem.href)) : null;
  if (coverItem && coverFile) {
    cover = new Blob([await coverFile.async("arraybuffer")], { type: coverItem.mediaType });
  }

  if (chapters.length === 0) warnings.push("Không đọc được nội dung chương nào từ file EPUB này.");

  return {
    format: "epub",
    title: meta("title") ?? titleFromFileName(fileName),
    author: meta("creator"),
    description,
    cover,
    chapters,
    warnings,
  };
}
