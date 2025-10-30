import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: __dirname, // points to rockbot-ui folder
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"), // adjust if shared is outside
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    allowedHosts: ["localhost", "127.0.0.1"],
  },
});
