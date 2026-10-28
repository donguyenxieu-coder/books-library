import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/features/auth/components/user-menu";
import { getCurrentProfile } from "@/features/auth/queries";

// Server Component: đọc profile ngay trên server, nên header render đúng
// trạng thái đăng nhập từ HTML đầu tiên (không nháy "Đăng nhập" rồi mới đổi).
export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <BrandLogo />
          {profile && <MainNav />}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
