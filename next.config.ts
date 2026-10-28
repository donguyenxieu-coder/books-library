import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
