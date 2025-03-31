import * as esbuild from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFile } from 'fs/promises';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist/server',
  external: [
    // Node.js built-in modules
    'path',
    'url',
    'fs',
    'crypto',
    'stream',
    'util',
    'events',
    'http',
    'https',
    'net',
    'tls',
    'zlib',
    'os',
    'buffer',
    // External dependencies
    'express',
    'cors',
    'dotenv',
    'passport',
    'passport-local',
    'express-session',
    'connect-pg-simple',
    'memorystore',
    'ws',
    '@neondatabase/serverless',
    'drizzle-orm',
    'pg',
    'zod',
    'openai',
    '@google/generative-ai',
    'groq-sdk',
    'lightningcss',
    // Any package that contains native modules
    'lightningcss/*',
    'node-gyp/*'
  ],
  loader: { '.ts': 'ts' },
  tsconfig: './tsconfig.json',
  resolveExtensions: ['.ts', '.js', '.json'],
  mainFields: ['module', 'main'],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  banner: {
    js: `
      // Only create require if it doesn't exist
      import { createRequire as _createRequire } from 'module';
      const require = globalThis.require || _createRequire(import.meta.url);
    `
  },
  minify: false,
  sourcemap: true,
  logLevel: 'info',
  legalComments: 'none'
}).catch(() => process.exit(1));