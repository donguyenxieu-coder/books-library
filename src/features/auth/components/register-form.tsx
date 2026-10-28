"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/form";

import { register as registerAccount } from "../actions";
import { type RegisterInput, registerSchema } from "../schemas";
import { FormErrorBanner } from "./form-error-banner";

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", fullName: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  async function onSubmit(values: RegisterInput) {
    const result = await registerAccount(values);
    if (result?.ok === false) applyServerErrors(result, setError);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FormErrorBanner message={errors.root?.server?.message} />

      <FieldGroup>
        <Field data-invalid={!!errors.fullName}>
          <FieldLabel htmlFor="fullName">Họ tên</FieldLabel>
          <Input
            id="fullName"
            autoComplete="name"
            autoFocus
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!errors.username}
            {...register("username")}
          />
          {errors.username ? (
            <FieldError errors={[errors.username]} />
          ) : (
            <FieldDescription>3–20 ký tự: chữ không dấu, số, dấu gạch dưới.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password", {
              // Đổi mật khẩu thì kiểm tra lại ô "nhập lại" (nếu đã chạm vào)
              // để lỗi "không khớp" tự biến mất / hiện ra đúng lúc.
              deps: ["confirmPassword"],
            })}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Nhập lại mật khẩu</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2Icon className="animate-spin" />}
        {isSubmitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
