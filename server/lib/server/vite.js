import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viteLogger = createLogger();
export function log(message, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
export async function setupVite(app, server) {
    const serverOptions = {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: true,
    };
    const vite = await createViteServer(Object.assign(Object.assign({}, viteConfig), { configFile: false, customLogger: Object.assign(Object.assign({}, viteLogger), { error: (msg, options) => {
                viteLogger.error(msg, options);
                process.exit(1);
            } }), server: serverOptions, appType: "custom" }));
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
        const url = req.originalUrl;
        try {
            const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
            let template = await fs.promises.readFile(clientTemplate, "utf-8");
            template = template.replace('src="/src/main.js"', `src="/src/main.js?v=${nanoid()}`);
            const page = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(page);
        }
        catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
}
export function serveStatic(app) {
    // In production on Railway, the app runs from /app directory
    const rootDir = process.env.RAILWAY_ENVIRONMENT ? '/app' : path.resolve(__dirname, '..');
    const distPath = path.join(rootDir, 'dist/public');
    const sharedPath = path.join(rootDir, 'dist/server/shared');
    // Log the environment and paths for debugging
    console.log('Environment:', {
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
        rootDir,
        distPath,
        sharedPath,
        currentDir: __dirname
    });
    // List available directories
    try {
        const availableDirs = fs.readdirSync(rootDir);
        console.log('Available directories in root:', availableDirs);
        if (fs.existsSync(path.join(rootDir, 'dist'))) {
            console.log('Contents of dist directory:', fs.readdirSync(path.join(rootDir, 'dist')));
        }
    }
    catch (err) {
        console.error('Error reading directories:', err);
    }
    if (!fs.existsSync(distPath)) {
        console.error(`Could not find the build directory: ${distPath}`);
        console.error('Current directory contents:', fs.readdirSync(rootDir));
        throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }
    // Serve static files
    app.use(express.static(distPath));
    app.use('/shared', express.static(sharedPath));
    // Serve index.html for any unmatched routes (SPA fallback)
    app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}
//# sourceMappingURL=vite.js.map