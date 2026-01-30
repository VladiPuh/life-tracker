import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function makeBuildId() {
  // 1) Если задано снаружи (CI/ручной деплой) — используем его
  if (process.env.VITE_BUILD_ID && process.env.VITE_BUILD_ID.trim()) {
    return process.env.VITE_BUILD_ID.trim();
  }

  // 2) Иначе — timestamp на момент старта Vite/build
  // Формат: YYYY-MM-DD_HH:MM
  return new Date().toISOString().replace("T", "_").slice(0, 16);
}

export default defineConfig({
  base: "/app/",
  define: {
    __BUILD_ID__: JSON.stringify(makeBuildId()),
  },
  plugins: [react()],
  server: {
    allowedHosts: [".ngrok-free.dev"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});

