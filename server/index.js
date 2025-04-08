import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the root directory only in development
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(__dirname, '..', '.env') });
}

import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();

// Configure middleware first
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Updated CORS configuration to handle credentials and auth routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://nutri-cart-frontend.onrender.com', 'http://localhost:5173']
    : 'http://localhost:5173',  // Cannot use * with credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'Accept',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // CORS preflight cache time - 24 hours
}));

app.set('trust proxy', 1); // trust first proxy

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

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
    // Add a health check endpoint that doesn't depend on the database
    app.get('/api/health/check', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Continue with server initialization even if DB is unavailable
    let dbConnected = false;
    
    try {
      // Set a timeout for the database connection attempt
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 8000)
      );
      
      const dbPromise = Promise.all([
        import('./db.js'),
        import('./shared/schema.js')
      ]);
      
      // Race the DB connection against a timeout
      const [dbModule, schemaModule] = await Promise.race([
        timeoutPromise.then(() => Promise.reject(new Error('Database connection timeout'))),
        dbPromise
      ]);
      
      const { db, sql } = dbModule;
      const { culturalCuisines } = schemaModule;
      
      // Test database connection with a simple COUNT query
      const result = await sql`SELECT COUNT(*) FROM cultural_cuisines`;
      const count = result?.[0]?.count || 0;
      console.log('Database connection test successful, found', count, 'cuisines');
      dbConnected = true;
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, continuing with limited functionality:', 
        dbError.name, '-', dbError.message);
      
      if (dbError instanceof AggregateError && dbError.errors) {
        dbError.errors.forEach(err => console.warn(' - ', err.message));
      }
    }

    const server = await registerRoutes(app);

    // Global error handler with detailed logging
    app.use((err, _req, res, _next) => {
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
      console.log(`Database connection status: ${dbConnected ? '✅ Connected' : '⚠️ Not connected'}`);
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