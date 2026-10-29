import { resizeImage } from "@/features/import/lib/resize-image";
import { createClient } from "@/lib/supabase/client";

// Chạy ở client: thu nhỏ ảnh rồi upload thẳng lên Storage (không đi qua server Next.js).
// Trả về đường dẫn trong bucket "covers" để lưu vào books.cover_path.
// Dùng chung cho trang tải sách lên và trang sửa sách.
export async function uploadCover(userId: string, image: Blob) {
  const resized = await resizeImage(image);
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await createClient().storage.from("covers").upload(path, resized, {
    contentType: resized.type,
  });
  if (error) throw new Error("Không tải được ảnh bìa lên");
  return path;
}
