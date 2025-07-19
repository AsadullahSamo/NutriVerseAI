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



      if (modified !== code) {
        return { code: modified, map: null };
      }

      return null;
    }
  };
}

// Plugin to fix missing file issues in dependencies
function fixMissingFiles() {
  return {
    name: 'fix-missing-files',
    resolveId(id, importer) {
      if (id === './Combination.jsx' && importer?.includes('react-remove-scroll')) {
        return 'virtual:react-remove-scroll-combination';
      }
      // Handle any missing .jsx files in recharts
      if (importer?.includes('recharts') && id.startsWith('./') && id.endsWith('.jsx')) {
        const fileName = id.replace('./', '').replace('.jsx', '').replace(/[\/\\]/g, '-');
        return `virtual:recharts-${fileName}`;
      }
      return null;
    },
    load(id) {
      if (id === 'virtual:react-remove-scroll-combination') {
        return 'export default function Combination() { return null; }';
      }
      // Handle recharts virtual modules
      if (id.startsWith('virtual:recharts-')) {
        // Extract the original component name from the virtual ID
        const fileName = id.replace('virtual:recharts-', '');
        // Get the last part after the last dash (the actual component name)
        const parts = fileName.split('-');
        const componentName = parts[parts.length - 1];
        // Capitalize first letter
        const finalName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
        return `export default function ${finalName}() { return null; }
export { ${finalName} };`;
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
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@ai-services': fileURLToPath(new URL('./src/ai-services', import.meta.url)),
      },
      extensions: ['.js', '.jsx', '.json', '.ts'],
    },
    build: {
      outDir: '../dist/public',
      sourcemap: true,
      // Ensure component imports are handled correctly
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress warnings about missing files in react-remove-scroll
          if (warning.code === 'UNRESOLVED_IMPORT' && warning.source?.includes('Combination.jsx')) {
            return;
          }
          warn(warning);
        },
        output: {
          // Ensure file extensions are preserved in chunk names
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: {
            vendor: ['react', 'react-dom', 'wouter'],
            ui: ['framer-motion', 'react-icons'],
          },
        },
      },
    },
    esbuild: {
      // React 18 with automatic JSX runtime
      jsx: 'automatic',
    },
    plugins: [
      react(),
      fixComponentImports(), // Add custom plugin to ensure proper file extensions
      fixMissingFiles(), // Fix missing file issues in dependencies
    ],
  };
}); 