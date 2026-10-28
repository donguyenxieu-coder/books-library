import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Parser EPUB cần DOMParser → giả lập trình duyệt bằng jsdom.
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" cố ý báo lỗi khi bị import ngoài server React; trong test thì bỏ qua.
      "server-only": path.resolve(import.meta.dirname, "src/test/empty-module.ts"),
    },
  },
});
