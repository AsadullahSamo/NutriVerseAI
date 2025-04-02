import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import type { ViteDevServer } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteLogger = createLogger();

// Normalize paths
const clientRoot = path.resolve(__dirname, "..", "client");
const clientDist = path.resolve(__dirname, "..", "dist", "client");

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app?: Express, server?: Server): Promise<ViteDevServer | null> {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    // In production, ensure the client is built
    if (!fs.existsSync(clientDist)) {
      console.error("Client build not found. Please run 'npm run build' first.");
      process.exit(1);
    }
    return null;
  }

  try {
    const vite = await createViteServer({
      root: clientRoot,
      server: {
        middlewareMode: true,
        hmr: {
          overlay: false,
          port: 24678,
          server: server
        },
        fs: {
          strict: false,
          allow: [
            clientRoot,
            path.resolve(__dirname, "..", "shared"),
            path.resolve(__dirname, "..", "ai-services"),
          ],
        },
      },
      appType: "custom",
      base: "/",
    });

    if (app) {
      app.use(vite.middlewares);
    }

    return vite;
  } catch (e) {
    console.error("Error creating Vite server:", e);
    throw e;
  }
}

// Helper function to get the client entry path
export function getClientEntry() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const manifestPath = path.resolve(clientDist, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error("Client manifest not found. Please rebuild the client.");
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const entry = manifest["index.html"]?.file;
    if (!entry) {
      throw new Error("Client entry not found in manifest.");
    }
    return path.resolve(clientDist, entry);
  }
  return path.resolve(clientRoot, "index.html");
}

// Helper function to get the client directory
export function getClientDir() {
  return process.env.NODE_ENV === "production" ? clientDist : clientRoot;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, {
    index: false // Don't serve index.html automatically
  }));

  // Serve index.html for all routes
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
