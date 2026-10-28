import { z } from "zod";

// File này dùng ở CẢ hai phía:
// - Client: zodResolver(schema) cho React Hook Form → báo lỗi ngay khi gõ.
// - Server: schema.safeParse(input) trong Server Action → không tin dữ liệu client.

// trim/toLowerCase chạy trước regex, nên "  An_99 " được chuẩn hoá thành "an_99".
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, { error: "Tên đăng nhập tối thiểu 3 ký tự" })
  .max(20, { error: "Tên đăng nhập tối đa 20 ký tự" })
  .regex(/^[a-z0-9_]+$/, { error: "Chỉ dùng chữ không dấu, số và dấu gạch dưới" });

// 72 là giới hạn của bcrypt (Supabase dùng để băm mật khẩu).
const passwordSchema = z
  .string()
  .min(8, { error: "Mật khẩu tối thiểu 8 ký tự" })
  .max(72, { error: "Mật khẩu tối đa 72 ký tự" });

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, { error: "Nhập mật khẩu" }),
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    fullName: z
      .string()
      .trim()
      .min(1, { error: "Nhập họ tên" })
      .max(60, { error: "Họ tên tối đa 60 ký tự" }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { error: "Nhập lại mật khẩu" }),
  })
  // So sánh 2 field → phải refine ở cấp object. `path` gắn lỗi vào ô "nhập lại".
  // confirmPassword chỉ tồn tại ở đây, không gửi xuống DB.
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Mật khẩu nhập lại không khớp",
  });

// z.input = kiểu giá trị trong form (trước trim/lowercase),
// z.output = kiểu sau khi parse (cái server thực sự dùng).
export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginInput = z.output<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;
