"use client";

import { GlobeIcon, LockIcon } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { BookMetaFormValues, BookMetaInput } from "../schemas";

const VISIBILITY_OPTIONS = [
  { value: "private", icon: LockIcon, label: "Riêng tư", description: "Chỉ mình bạn xem được" },
  { value: "public", icon: GlobeIcon, label: "Công khai", description: "Ai đăng nhập cũng đọc được" },
] as const;

// Chỉ là các ô nhập, không tự tạo form: component cha giữ useForm và quyết định
// submit làm gì. Nhờ vậy dùng chung được cho trang tải sách lên và trang sửa sách.
export function BookMetaFields({ form }: { form: UseFormReturn<BookMetaFormValues, unknown, BookMetaInput> }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="title">Tên sách</FieldLabel>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field data-invalid={!!errors.author}>
        <FieldLabel htmlFor="author">Tác giả</FieldLabel>
        <Input id="author" placeholder="Không bắt buộc" aria-invalid={!!errors.author} {...register("author")} />
        <FieldError errors={[errors.author]} />
      </Field>

      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor="description">Mô tả</FieldLabel>
        <Textarea
          id="description"
          rows={4}
          placeholder="Không bắt buộc"
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError errors={[errors.description]} />
      </Field>

      <FieldSet>
        <FieldLegend variant="label">Ai được xem</FieldLegend>
        {/* RadioGroup của Radix không phải <input> thường → không dùng register được,
            phải dùng Controller để nối value/onChange với React Hook Form. */}
        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
              {VISIBILITY_OPTIONS.map(({ value, icon: Icon, label, description }) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                    field.value === value && "border-primary bg-muted/50",
                  )}
                >
                  <RadioGroupItem value={value} aria-label={label} className="mt-0.5" />
                  <span className="space-y-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Icon className="size-3.5" />
                      {label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{description}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </FieldSet>
    </FieldGroup>
  );
}
