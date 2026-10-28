import type { Metadata } from "next";

import { AuthHeading } from "@/features/auth/components/auth-heading";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // ?next=/library: proxy.ts gắn vào khi chặn trang cần đăng nhập,
  // đăng nhập xong sẽ quay lại đúng trang đó.
  const { next } = await searchParams;

  return (
    <>
      <AuthHeading title="Chào mừng trở lại" description="Đăng nhập để đọc tiếp cuốn sách đang dở." />
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
