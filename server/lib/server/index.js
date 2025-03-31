import { config } from 'dotenv';
import express from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import { sql } from 'drizzle-orm';
import { culturalCuisines } from '../shared/schema';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config();
const app = express();
// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://nutri-cart-frontend.onrender.com',
            'http://localhost:5173',
            'https://healthcheck.railway.app',
            'https://nutriverse-ai-production.up.railway.app'
        ]
        : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400
}));
// Health check endpoint - must be first, before any middleware
app.get(['/health', '/api/health'], (_req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[Health Check] Request received at ${timestamp} from ${_req.get('host')}`);
    res.status(200).send('OK');
});
// Rest of your middleware and configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set('trust proxy', 1);
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            console.log(logLine);
        }
    });
    next();
});
// Function to serve static files in production
function serveStaticFiles(app) {
    const rootDir = process.env.RAILWAY_ENVIRONMENT ? '/app' : path.resolve(__dirname, '..');
    const distPath = path.join(rootDir, 'dist/public');
    console.log('Serving static files from:', distPath);
    if (!fs.existsSync(distPath)) {
        console.error(`Could not find the build directory: ${distPath}`);
        return;
    }
    app.use(express.static(distPath));
    // Handle client-side routing
    app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}
(async () => {
    try {
        // Test database connection
        const { db } = await import('./db');
        const testQuery = await db.select({ count: sql `count(*)` }).from(culturalCuisines);
        console.log('Database connection test successful:', testQuery);
        const server = await registerRoutes(app);
        if (process.env.NODE_ENV === "development") {
            // Development mode - use Vite
            const { setupVite } = await import("./vite");
            await setupVite(app, server);
        }
        else {
            // Production mode - serve static files
            serveStaticFiles(app);
        }
        const PORT = parseInt(process.env.PORT || process.env.BACKEND_PORT || "8000", 10);
        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Backend server started on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Server initialization error:', error);
        process.exit(1);
    }
})().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map