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

      // Handle missing recharts files
      if (importer?.includes('recharts') && id.startsWith('./')) {
        const fileName = id.replace('./', '').replace('.jsx', '').replace(/[\/\\]/g, '-');

        // List of known missing files in recharts
        const missingFiles = [
          'container/Surface',
          'container/Layer',
          'component/DefaultLegendContent',
          'component/DefaultTooltipContent',
          'util/ReactUtils',
          'util/DOMUtils',
          'util/DataUtils'
        ];

        if (missingFiles.some(file => fileName.includes(file.replace('/', '-')))) {
          return `virtual:recharts-${fileName}`;
        }
      }

      return null;
    },
    load(id) {
      if (id === 'virtual:react-remove-scroll-combination') {
        return 'export default function Combination() { return null; }';
      }

      // Handle recharts virtual modules with proper exports
      if (id.startsWith('virtual:recharts-')) {
        const fileName = id.replace('virtual:recharts-', '');

        if (fileName.includes('Surface')) {
          return `
            import React from 'react';
            export default function Surface(props) {
              return React.createElement('div', { ...props, className: 'recharts-surface' });
            }
            export { Surface };
          `;
        }

        if (fileName.includes('Layer')) {
          return `
            import React from 'react';
            export default function Layer(props) {
              return React.createElement('div', { ...props, className: 'recharts-layer' });
            }
            export { Layer };
          `;
        }

        // Generic fallback for other missing components
        const componentName = fileName.split('-').pop();
        const finalName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
        return `
          import React from 'react';
          export default function ${finalName}(props) {
            return React.createElement('div', props);
          }
          export { ${finalName} };
        `;
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
      outDir: 'dist',
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
          // Force cache busting with timestamp
          entryFileNames: `assets/[name].[hash].${Date.now()}.js`,
          chunkFileNames: `assets/[name].[hash].${Date.now()}.js`,
          assetFileNames: `assets/[name].[hash].${Date.now()}.[ext]`,
          manualChunks: {
            vendor: ['react', 'react-dom', 'wouter'],
            ui: ['framer-motion', 'react-icons'],
            charts: ['chart.js', 'react-chartjs-2'],
          },
        },
        external: [],
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