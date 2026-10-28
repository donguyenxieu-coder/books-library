const WORDS_PER_MINUTE = 200;

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

// 45 phút / 3 giờ 20 phút
export function formatReadingTime(wordCount: number) {
  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

// "Chương 3: Khởi đầu" hoặc "Chương 3" nếu không có tên.
// Số chương lấy từ vị trí, không lưu trong tên.
export function chapterLabel(position: number, title: string) {
  return title ? `Chương ${position}: ${title}` : `Chương ${position}`;
}
