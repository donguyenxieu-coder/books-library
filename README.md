# Tủ Sách

Thư viện sách cá nhân: tải EPUB / TXT / Markdown, quản lý chương, đọc với font và bố cục tuỳ chỉnh.

Stack: Next.js 16 · Supabase (Auth, Postgres, Storage) · Zod 4 · React Hook Form · shadcn/ui · Tailwind 4.
Kế hoạch và tiến độ: [docs/PLAN.md](docs/PLAN.md).

## Cài đặt

1. Tạo project trên [Supabase](https://supabase.com/dashboard).
2. **Authentication → Sign In / Providers → Email**: tắt **Confirm email** (app đăng nhập bằng username, không gửi email).
3. **SQL Editor**: chạy lần lượt các file trong `supabase/migrations/`.
4. Copy `.env.example` thành `.env.local`, điền URL và publishable key (Project Settings → API Keys).
5. Chạy:

```bash
npm install
npm run dev
```

Yêu cầu Node.js 22 trở lên (supabase-js đã ngừng hỗ trợ Node 20).

## Sinh lại type cho database

`src/types/database.ts` đang viết tay theo schema. Muốn sinh tự động:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npm run db:types
```

## Cấu trúc

```
src/
  app/(auth)/          trang đăng nhập, đăng ký (layout chia đôi màn hình)
  app/(main)/          các trang có header
  features/<tên>/      schemas.ts (Zod) · actions.ts (Server Action) · queries.ts · components/
  lib/supabase/        client cho server, browser và proxy
  proxy.ts             refresh session, chặn trang cần đăng nhập
supabase/migrations/   schema, RLS, trigger, storage
```
