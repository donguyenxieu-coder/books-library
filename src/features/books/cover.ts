import { env } from "@/lib/env";

// Bucket "covers" là public → URL ảnh cố định, ghép được mà không cần gọi API.
export function getCoverUrl(coverPath: string | null) {
  if (!coverPath) return null;
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${coverPath}`;
}
