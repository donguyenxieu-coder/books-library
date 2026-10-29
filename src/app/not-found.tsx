import { BookXIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// Hiện khi gọi notFound() (sách không tồn tại / không có quyền xem) hoặc URL sai.
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <BookXIcon className="size-7 text-muted-foreground" />
      </span>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Không tìm thấy trang này</h1>
        <p className="max-w-sm text-muted-foreground">
          Sách có thể đã bị xoá, là sách riêng tư của người khác, hoặc đường dẫn không đúng.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/library">Về thư viện</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Trang chủ</Link>
        </Button>
      </div>
    </main>
  );
}
