import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// For development only (not used in production)
export async function setupVite(app, server) {
  log("Development mode not supported in production build");
}

// For production (no-op now, handled directly in index.js)
export function serveStatic(app) {
  log("Static file serving handled directly in index.js");
}
