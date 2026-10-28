// Thu nhỏ ảnh bìa ngay trên trình duyệt trước khi upload:
// ảnh 4000px / 5MB → WebP tối đa 600×900, thường chỉ ~50KB.
// Đỡ tốn dung lượng Storage và trang thư viện tải nhanh hơn nhiều.
export async function resizeImage(source: Blob, maxWidth = 600, maxHeight = 900): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Không xử lý được ảnh"))),
      "image/webp",
      0.85,
    ),
  );
}
