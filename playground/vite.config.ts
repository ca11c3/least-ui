import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Relative asset paths so the built site works from any sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    // Point the package name at the source, so edits hot-reload without a build.
    alias: { leastui: fileURLToPath(new URL("../src/components/index.ts", import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL("../site", import.meta.url)),
    emptyOutDir: true,
  },
});
