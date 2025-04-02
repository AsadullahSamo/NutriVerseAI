import * as esbuild from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

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
    // Node.js built-in modules - must be external
    'node:*',  // All node: protocol imports
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
    'querystring',
    'string_decoder',
    'worker_threads',
    'child_process',
    'cluster',
    'dgram',
    'dns',
    'module',
    'process',
    'readline',
    'repl',
    'timers',
    'tty',
    'v8',
    'vm',
    // External dependencies that should not be bundled
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
    // Any package that contains native modules
    'lightningcss',
    'lightningcss/*',
    'node-gyp/*'
  ],
  loader: { 
    '.ts': 'ts',
    '.js': 'js'
  },
  tsconfig: './tsconfig.json',
  resolveExtensions: ['.ts', '.js', '.json'],
  mainFields: ['module', 'main'],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  inject: ['./server/shims.js'],
  minify: false,
  sourcemap: true,
  outExtension: { '.js': '.js' },
  allowOverwrite: true,
  logLevel: 'info',
  metafile: true,
  plugins: [{
    name: 'copy-shared',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length === 0) {
          // Copy shared directory
          await esbuild.build({
            entryPoints: ['shared/**/*.ts'],
            outdir: 'dist/shared',
            platform: 'node',
            format: 'esm',
            target: 'node18',
            loader: { '.ts': 'ts' },
            tsconfig: './tsconfig.json',
            bundle: false,
            minify: false,
            sourcemap: true
          });
        }
      });
    }
  }]
}).catch(() => process.exit(1)); 