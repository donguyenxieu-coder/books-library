"use client";

import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

import { logout } from "../actions";
import type { CurrentProfile } from "../queries";

// Server Component (SiteHeader) lấy profile rồi truyền xuống qua props:
// component này không tự fetch gì cả, chỉ lo phần tương tác (mở menu, đăng xuất).
export function UserMenu({ profile }: { profile: CurrentProfile }) {
  // useTransition: isPending = true trong lúc Server Action chạy → hiện spinner.
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Mở menu tài khoản" className="h-10 gap-2 rounded-full pr-3 pl-1">
          <Avatar className="size-8">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">{profile.full_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-medium text-foreground">{profile.full_name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">@{profile.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            // Giữ menu mở để người dùng thấy spinner cho tới khi redirect.
            event.preventDefault();
            startTransition(() => logout());
          }}
        >
          {isPending ? <Loader2Icon className="animate-spin" /> : <LogOutIcon />}
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
