import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distServerDir = path.join(__dirname, '..', 'dist', 'server');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix relative imports that don't have .js extension
    const importRegex = /from\s+["'](\.\/?[^"']*?)["']/g;
    content = content.replace(importRegex, (match, importPath) => {
      // Skip if already has extension
      if (importPath.includes('.js') || importPath.includes('.mjs') || importPath.includes('.json')) {
        return match;
      }

      // Add .js extension
      modified = true;
      console.log(`  Fixing import: ${importPath} -> ${importPath}.js`);
      return match.replace(importPath, `${importPath}.js`);
    });

    // Fix dynamic imports
    const dynamicImportRegex = /import\s*\(\s*["'](\.\/?[^"']*?)["']\s*\)/g;
    content = content.replace(dynamicImportRegex, (match, importPath) => {
      if (importPath.includes('.js') || importPath.includes('.mjs') || importPath.includes('.json')) {
        return match;
      }

      modified = true;
      console.log(`  Fixing dynamic import: ${importPath} -> ${importPath}.js`);
      return match.replace(importPath, `${importPath}.js`);
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.isFile() && item.name.endsWith('.js')) {
      fixImportsInFile(fullPath);
    }
  }
}

console.log('Fixing import statements in compiled JavaScript files...');
processDirectory(distServerDir);
console.log('Import statements fixed successfully!');
