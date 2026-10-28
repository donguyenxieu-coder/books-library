"use client";

import { Loader2Icon, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

// Ô tìm kiếm ghi từ khoá lên URL (?q=...), Server Component đọc URL và query lại.
// Lợi ích: tải lại trang hay gửi link cho người khác vẫn giữ kết quả tìm.
export function LibrarySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  // isPending = true trong lúc Next đang render lại trang với từ khoá mới.
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce 300ms: gõ "mắt biếc" không bắn 8 request cho từng chữ.
  useEffect(() => {
    if (value === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      // replace (không phải push): không tạo một mục lịch sử cho mỗi lần gõ.
      startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(timer);
  }, [value, searchParams, pathname, router]);

  // Phím "/" để nhảy vào ô tìm kiếm (giống GitHub, YouTube).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative w-full sm:max-w-sm">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Tìm theo tên sách hoặc tác giả…"
        aria-label="Tìm sách"
        className="pr-10 pl-9"
      />
      {isPending ? (
        <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        !value && (
          <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border bg-muted px-1.5 text-xs text-muted-foreground">
            /
          </kbd>
        )
      )}
    </div>
  );
}
