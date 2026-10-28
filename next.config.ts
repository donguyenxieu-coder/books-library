import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Mặc định 1MB. Lô chương gửi lên được chia ~800KB, nhưng một chương
      // rất dài có thể vượt 1MB. Vercel giới hạn cứng ~4.5MB cho mỗi request.
      bodySizeLimit: "4mb",
    },
  },
  logging: {
    // Mặc định dev server in tham số của mỗi Server Action ra terminal,
    // tức là in luôn mật khẩu lúc đăng nhập / đăng ký.
    serverFunctions: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
