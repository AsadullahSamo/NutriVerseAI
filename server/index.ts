import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the root directory
config({ path: resolve(__dirname, '..', '.env') });

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { sql } from 'drizzle-orm';
import { culturalCuisines } from '@shared/schema';

const app = express();

// Updated CORS configuration to handle credentials and auth routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // CORS preflight cache time - 24 hours
}));

app.set('trust proxy', 1); // trust first proxy

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Test database connection
    const { db } = await import('./db');
    const testQuery = await db.select({ count: sql`count(*)` }).from(culturalCuisines);
    console.log('Database connection test successful:', testQuery);

    const server = await registerRoutes(app);

    // Global error handler with detailed logging
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server Error Details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause,
        code: err.code
      });

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const details = app.get("env") === "development" ? err.stack : undefined;
      
      res.status(status).json({ 
        message,
        details,
        error: err.name,
        ...(err.code ? { code: err.code } : {})
      });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = parseInt(process.env.BACKEND_PORT || "8000", 10);
    server.listen(PORT, "localhost", () => {
      console.log(`Backend server started on port ${PORT}`);
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
})().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
