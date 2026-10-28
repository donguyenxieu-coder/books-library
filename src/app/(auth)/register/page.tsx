import type { Metadata } from "next";

import { AuthHeading } from "@/features/auth/components/auth-heading";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading title="Tạo tài khoản" description="Chỉ cần tên đăng nhập và mật khẩu, không cần email." />
      <RegisterForm />
    </>
  );
}
