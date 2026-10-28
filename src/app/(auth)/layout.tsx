import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookSpines } from "@/features/auth/components/book-spines";
import { getCurrentProfile } from "@/features/auth/queries";

// Route group "(auth)": dấu ngoặc làm thư mục không xuất hiện trên URL
// (/login, /register), chỉ để 2 trang này dùng chung layout chia đôi màn hình.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Đã đăng nhập thì không cần thấy trang login/register nữa.
  if (await getCurrentProfile()) redirect("/");

  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 size-[28rem] rounded-full bg-rose-500/10 blur-3xl" />

        <BrandLogo className="relative text-white [&>span]:bg-white [&>span]:text-zinc-950" />

        <div className="relative space-y-10">
          <blockquote className="max-w-md space-y-3">
            <p className="font-heading text-3xl leading-snug">
              Mỗi cuốn sách là một chuyến đi. Tủ Sách giữ chỗ cho bạn ở trang đang đọc dở.
            </p>
            <footer className="text-sm text-white/60">Tải EPUB, TXT, Markdown · đọc mọi lúc, mọi nơi</footer>
          </blockquote>
          <BookSpines />
        </div>
      </aside>

      <main className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <BrandLogo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
