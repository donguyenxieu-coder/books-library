import { BookOpenTextIcon, HighlighterIcon, type LucideIcon, UploadIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/features/auth/queries";

// Cùng một URL "/": khách thấy landing, người đã đăng nhập thấy trang của mình.
// Ngày 4 phần dành cho người dùng sẽ thành dashboard (đọc tiếp, đọc gần đây).
export default async function HomePage() {
  const profile = await getCurrentProfile();
  return profile ? <Welcome fullName={profile.full_name} /> : <Landing />;
}

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: UploadIcon,
    title: "Tải sách từ máy",
    description: "EPUB, TXT hoặc Markdown. Tự nhận diện chương, tên sách và ảnh bìa.",
  },
  {
    icon: BookOpenTextIcon,
    title: "Đọc theo cách của bạn",
    description: "Đổi font, cỡ chữ, lề, nền sáng/tối. Nhảy tới chương bất kỳ trong một cú gõ.",
  },
  {
    icon: HighlighterIcon,
    title: "Đánh dấu và ghi chú",
    description: "Bôi đen một đoạn để ghi chú, bookmark chỗ hay để quay lại sau.",
  },
];

function Landing() {
  return (
    <div className="flex flex-col gap-20 py-6 sm:py-12">
      <section className="flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-700">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Thư viện sách cá nhân</span>
        <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Cả tủ sách của bạn, gọn trong một trình duyệt
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          Tải sách lên, sắp xếp chương, đọc với font chữ bạn thích và tiếp tục đúng trang đang dở trên mọi thiết bị.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Bắt đầu miễn phí</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Tôi đã có tài khoản</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }, index) => (
          <article
            key={title}
            style={{ animationDelay: `${200 + index * 100}ms` }}
            className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md fill-mode-both animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5" />
            </span>
            <h2 className="mb-1 font-medium">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function Welcome({ fullName }: { fullName: string }) {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Xin chào,</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{fullName}</h1>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <BookOpenTextIcon className="size-6 text-muted-foreground" />
        </span>
        <div className="space-y-1">
          <h2 className="font-medium">Bắt đầu với một cuốn sách</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tải lên file EPUB, TXT hoặc Markdown. Lịch sử đọc gần đây sẽ hiện ở đây.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/books/new">Tải sách lên</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/library">Mở thư viện</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
