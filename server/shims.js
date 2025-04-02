import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Polyfill global require
globalThis.require = createRequire(import.meta.url);

// Polyfill __filename and __dirname
globalThis.__filename = fileURLToPath(import.meta.url);
globalThis.__dirname = dirname(__filename); 