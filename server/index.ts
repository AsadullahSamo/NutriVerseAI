import { config } from 'dotenv';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the root directory
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(__dirname, '..', '.env') });
} else {
  config({ path: resolve(__dirname, '..', '.env') });
}

import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

// Custom log function 
function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// Configure middleware first
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Working CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://nutriverse-ai.vercel.app',
      'https://nutriverse-q2mvhwmes-asadullahsamos-projects.vercel.app',
      'https://nutriverse-boqizwo3u-asadullahsamos-projects.vercel.app',
      'http://localhost:5173',
      'http://localhost:8000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Explicit OPTIONS handler for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://nutriverse-ai.vercel.app',
    'https://nutriverse-q2mvhwmes-asadullahsamos-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:8000'
  ];

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, Pragma, Expires, X-Requested-With, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

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
    // Add a health check endpoint that doesn't depend on the database - CORS FIXED
    app.get('/api/health/check', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cors: 'fixed',
        version: '2.0'
      });
    });

    // Continue with server initialization even if DB is unavailable
    let dbConnected = false;
    
    try {
      // Set a timeout for the database connection attempt
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 8000)
      );
      
      const dbPromise = Promise.all([
        import('./db'),
        import('./shared/schema')
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

    // Static file serving for all environments
    const publicPath = join(__dirname, '..', 'public');
    console.log('Serving static files from:', publicPath);
    
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
      
      // Fall through to index.html for SPA routing
      app.use('*', (req, res) => {
        res.sendFile(join(publicPath, 'index.html'));
      });
      console.log('Static file serving configured successfully');
    } else {
      console.error(`Public directory not found at ${publicPath}`);
    }

    const PORT = parseInt(process.env.BACKEND_PORT || "8000", 10);
    server.listen(PORT, "0.0.0.0", () => {
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