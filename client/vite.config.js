import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';

// Custom plugin to fix component imports, especially Navbar
function fixComponentImports() {
  return {
    name: 'fix-component-imports',
    transform(code, id) {
      // Only transform JS/JSX files
      if (!id.endsWith('.js') && !id.endsWith('.jsx')) {
        return null;
      }
      
      // Fix imports of PascalCase components without extensions
      let modified = code.replace(
        /from\s+["']([^"']+\/[A-Z][^"'\/.]*)["']/g,
        (match, importPath) => {
          // Only add .jsx if there's no file extension already
          if (!importPath.match(/\.[a-z]+$/)) {
            return match.replace(importPath, `${importPath}.jsx`);
          }
          return match;
        }
      );
      
      // Specifically handle Navbar imports
      modified = modified.replace(
        /from\s+["']@\/components\/Navbar["']/g,
        'from "@/components/Navbar.jsx"'
      );
      
      if (modified !== code) {
        return { code: modified, map: null };
      }
      
      return null;
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      extensions: ['.js', '.jsx', '.json'],
    },
    build: {
      outDir: '../dist/public',
      sourcemap: true,
      // Ensure component imports are handled correctly
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          // Ensure file extensions are preserved in chunk names
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: {
            vendor: ['react', 'react-dom', 'wouter'],
            ui: ['framer-motion', 'react-icons', 'react-hot-toast'],
          },
        },
      },
    },
    esbuild: {
      jsxInject: `import React from 'react'`,
    },
    plugins: [
      react(),
      fixComponentImports(), // Add custom plugin to ensure proper file extensions
    ],
  };
}); 