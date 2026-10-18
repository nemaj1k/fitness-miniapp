import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" — чтобы сборка работала и на GitHub Pages, и на Vercel
export default defineConfig({
  base: "./",
  plugins: [react()],
});
