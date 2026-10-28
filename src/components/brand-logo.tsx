import { LibraryBigIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-heading text-lg font-semibold", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LibraryBigIcon className="size-4.5" />
      </span>
      Tủ Sách
    </Link>
  );
}
