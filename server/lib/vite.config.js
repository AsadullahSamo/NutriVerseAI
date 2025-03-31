import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
    plugins: [
        react(),
        themePlugin(),
        ...(process.env.NODE_ENV !== "production" &&
            process.env.REPL_ID !== undefined
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
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
        },
    },
    root: path.resolve(__dirname, "client"),
    build: {
        outDir: path.resolve(__dirname, "dist", "public"),
        emptyOutDir: true,
        sourcemap: true
    },
    server: {
        hmr: {
            overlay: false,
        },
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://localhost:8000',
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
    },
});
//# sourceMappingURL=vite.config.js.map