import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/profiles": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/project": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/manager": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/notification": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/image": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
