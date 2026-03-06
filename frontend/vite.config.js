import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        contentScript: resolve(__dirname, "src/content/contentScript.ts"),
        serviceWorker: resolve(__dirname, "src/background/serviceWorker.ts"),
      },
      output: {
        entryFileNames(chunkInfo) {
          if (chunkInfo.name === "contentScript") return "contentScript.js";
          if (chunkInfo.name === "serviceWorker") return "serviceWorker.js";
          return "[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
