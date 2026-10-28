// Tách riêng khỏi index.ts: component chỉ cần các hằng số này sẽ không
// kéo theo JSZip + marked vào bundle.
export const ACCEPTED_EXTENSIONS = [".epub", ".txt", ".md", ".markdown"];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
