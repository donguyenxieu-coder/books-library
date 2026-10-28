import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

// Các trang bắt buộc đăng nhập. Trang chủ "/" thì không: khách thấy landing.
const PROTECTED_PREFIXES = ["/library", "/books"];

// Chạy trước mọi request (gọi từ src/proxy.ts):
// 1. Refresh access token sắp hết hạn và ghi cookie mới vào response.
// 2. Chặn sớm khách chưa đăng nhập ở trang cần đăng nhập.
// Đây chỉ là kiểm tra "lạc quan" cho UX; quyền thật nằm ở RLS của Postgres.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Ghi vào cả request (để Server Component phía sau đọc được token mới)
          // lẫn response (để trình duyệt lưu lại).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Không chèn code giữa createServerClient và getClaims():
  // getClaims() là bước kích hoạt refresh token.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isLoggedIn && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
