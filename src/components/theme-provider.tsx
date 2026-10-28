"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes cần chạy ở client (đọc localStorage, prefers-color-scheme),
// nên bọc lại thành Client Component để root layout (Server Component) dùng được.
// attribute="class" → thêm class "dark" vào <html>, khớp với `@custom-variant dark` trong globals.css.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
