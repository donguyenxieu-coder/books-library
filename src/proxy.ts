import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Next 16: middleware.ts đổi tên thành proxy.ts.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Bỏ qua file tĩnh và ảnh để không tốn một lượt gọi Supabase cho mỗi asset.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
