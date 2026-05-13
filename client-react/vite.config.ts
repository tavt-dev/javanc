import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react-router",
      "react-router-dom",
    ],
  },
  server: {
    port: 3000,
    proxy: {
      "^/auth/": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/users(?:$|/|\\?)": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/profiles(?:$|/|\\?)": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/project/": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/manager/(user|hr|company|manager|admin)/": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/notification/": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/image/": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
