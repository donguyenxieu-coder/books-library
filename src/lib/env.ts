import { z } from "zod";

// Kiểm tra biến môi trường một lần lúc khởi động: thiếu hoặc sai là báo lỗi
// rõ ràng ngay, thay vì lỗi khó hiểu lúc gọi Supabase.
// Phải viết đủ `process.env.NEXT_PUBLIC_...` để Next thay giá trị vào bundle client.
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: "NEXT_PUBLIC_SUPABASE_URL phải là URL" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "Thiếu NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" })
    .min(1, { error: "Thiếu NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" }),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
