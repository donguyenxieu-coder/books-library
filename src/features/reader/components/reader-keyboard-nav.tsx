"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ReaderKeyboardNavProps = {
  prevHref: string | null;
  nextHref: string | null;
};

// Phím ← / → để chuyển chương. Component không render gì, chỉ gắn sự kiện bàn phím.
export function ReaderKeyboardNav({ prevHref, nextHref }: ReaderKeyboardNavProps) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      // Đang gõ trong ô nhập hoặc giữ phím Ctrl/Alt (phím tắt của trình duyệt) thì bỏ qua.
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === "ArrowLeft" && prevHref) router.push(prevHref);
      if (event.key === "ArrowRight" && nextHref) router.push(nextHref);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevHref, nextHref, router]);

  return null;
}
