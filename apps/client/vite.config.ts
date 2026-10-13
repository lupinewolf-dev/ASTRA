import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: false },
      "/health": { target: "http://127.0.0.1:3001", changeOrigin: false },
      "/room": {
        target: "http://127.0.0.1:3001",
        ws: true,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/room/, ""),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL("index.html", import.meta.url)),
        visual: fileURLToPath(new URL("visual.html", import.meta.url)),
      },
    },
  },
});
