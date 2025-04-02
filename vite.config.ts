import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure paths are normalized
const clientRoot = path.resolve(__dirname, "client");
const clientEntry = path.resolve(clientRoot, "index.html");

export default defineConfig({
  plugins: [
    react(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  define: {
    'process.env': process.env
  },
  envPrefix: ['VITE_'],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@ai-services": path.resolve(__dirname, "ai-services"),
    }
  },
  root: clientRoot,
  publicDir: path.resolve(clientRoot, "public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: clientEntry
    }
  },
  server: {
    hmr: {
      overlay: false,
    },
    fs: {
      strict: true,
      allow: [clientRoot]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
        }
      }
    }
  }
});
