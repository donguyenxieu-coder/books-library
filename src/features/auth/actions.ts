"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ActionResult, safeRedirectPath, toFieldErrors } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from "./schemas";
import { usernameToEmail } from "./username-email";

// input là `unknown`: Server Action là một endpoint công khai, ai cũng gọi được
// với dữ liệu bất kỳ → luôn safeParse lại dù client đã validate.

export async function login(
  input: unknown,
  next?: string,
): Promise<ActionResult<undefined, keyof LoginInput>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Dữ liệu không hợp lệ", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { username, password } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    if (error.code === "invalid_credentials") {
      return { ok: false, message: "Sai tên đăng nhập hoặc mật khẩu" };
    }
    console.error("[login]", error);
    return { ok: false, message: "Không đăng nhập được, vui lòng thử lại" };
  }

  // Cookie session đã đổi → làm mới toàn bộ layout (header hiện avatar).
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(next));
}

export async function register(
  input: unknown,
): Promise<ActionResult<undefined, keyof RegisterInput>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Dữ liệu không hợp lệ", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { username, fullName, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    // → auth.users.raw_user_meta_data → trigger handle_new_user tạo profiles
    options: { data: { username, full_name: fullName } },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return {
        ok: false,
        message: "Tên đăng nhập đã có người dùng",
        fieldErrors: { username: "Tên đăng nhập đã có người dùng" },
      };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: error.message, fieldErrors: { password: "Mật khẩu quá yếu" } };
    }
    console.error("[register]", error);
    return { ok: false, message: "Không tạo được tài khoản, vui lòng thử lại" };
  }

  // Không có session nghĩa là project Supabase vẫn bật xác nhận email.
  if (!data.session) {
    return {
      ok: false,
      message:
        'Tài khoản đã tạo nhưng Supabase đang bật "Confirm email". Hãy tắt trong Authentication → Sign In / Providers → Email.',
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
