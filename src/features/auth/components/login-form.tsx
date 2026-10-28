"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/form";

import { login } from "../actions";
import { type LoginInput, loginSchema } from "../schemas";
import { FormErrorBanner } from "./form-error-banner";

export function LoginForm({ next }: { next?: string }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    // Chỉ báo lỗi sau khi rời ô lần đầu, sau đó kiểm tra lại mỗi lần gõ.
    mode: "onTouched",
  });

  // handleSubmit chỉ gọi hàm này khi Zod phía client đã pass,
  // và `values` là dữ liệu SAU khi parse (username đã trim + lowercase).
  async function onSubmit(values: LoginInput) {
    const result = await login(values, next);
    // Thành công thì action redirect luôn, nên chỉ cần xử lý nhánh lỗi.
    if (result?.ok === false) applyServerErrors(result, setError);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FormErrorBanner message={errors.root?.server?.message} />

      <FieldGroup>
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            aria-invalid={!!errors.username}
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2Icon className="animate-spin" />}
        {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
