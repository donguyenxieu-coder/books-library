// "Khởi Đầu" → "khoi dau": bỏ dấu tiếng Việt để so khớp khi lọc ở client.
// NFD tách chữ có dấu thành chữ gốc + dấu, rồi xoá các dấu (\p{Diacritic}).
// "đ" là chữ riêng, không tách được → đổi tay.
export function normalizeForSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
