"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/library", label: "Thư viện" },
  { href: "/books/new", label: "Tải sách lên" },
];

// Client Component vì cần usePathname() để biết trang nào đang mở.
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
