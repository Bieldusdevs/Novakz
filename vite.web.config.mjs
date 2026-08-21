import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * Browser-only config used to preview / develop the renderer UI outside of
 * Electron (`pnpm dev:web`). The IPC bridge falls back to demo data.
 */
export default defineConfig({
  root: path.join(root, "src/renderer"),
  base: "./",
  plugins: [
    react(),
    {
      // The Electron build ships a strict CSP; Vite's dev server needs inline
      // scripts for HMR, so the tag is dropped for the browser preview only.
      name: "strip-csp-in-dev",
      apply: "serve",
      transformIndexHtml: (html) => html.replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, ""),
    },
  ],
  resolve: {
    alias: {
      "@renderer": path.join(root, "src/renderer/src"),
      "@": path.join(root, "src/renderer/src"),
    },
  },
  css: { postcss: root },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: { host: "0.0.0.0", port: 5173, allowedHosts: true },
})
