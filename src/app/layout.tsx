import type { Metadata } from "next";
import { Be_Vietnam_Pro, Literata } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// Cả 2 font đều có subset tiếng Việt. next/font tự tải về lúc build và
// gắn vào CSS variable → globals.css map sang `font-sans` / `font-heading`.
const sans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const heading = Literata({
  variable: "--font-literata",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: { default: "Tủ Sách", template: "%s · Tủ Sách" },
  description: "Thư viện sách cá nhân: tải EPUB, TXT, Markdown và đọc theo cách của bạn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes thêm class "dark" vào <html> trước khi React hydrate.
    <html lang="vi" suppressHydrationWarning className={`${sans.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
