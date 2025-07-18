/**
 * Postbuild script to prepare the application for production.
 * This automatically handles:
 * 1. Copying index.html to the dist/public directory
 * 2. Updating references in index.html to point to the correct asset files
 * 3. Fixing .js extensions in import statements for ESM modules
 * 4. Setting environment variables for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get root path
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const serverDir = path.join(distDir, 'server');

console.log('Starting post-build process...');

// Make sure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created dist/public directory');
}

// Step 1: Copy index.html from client to dist/public
function copyIndexHtml() {
  const sourceIndexHtml = path.join(rootDir, 'client', 'index.html');
  const destIndexHtml = path.join(publicDir, 'index.html');

  if (fs.existsSync(sourceIndexHtml)) {
    let indexContent = fs.readFileSync(sourceIndexHtml, 'utf8');
    
    // Find the CSS and JS files in the assets directory
    const assetsDir = path.join(publicDir, 'assets');
    let cssFile = '';
    let jsFile = '';

    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      cssFile = files.find(file => file.endsWith('.css'));
      jsFile = files.find(file => file.endsWith('.js') && !file.endsWith('.map.js'));
      
      console.log('Found asset files:', { cssFile, jsFile });
    }

    // Update references in index.html
    if (cssFile) {
      indexContent = indexContent.replace('</head>', 
        `  <link rel="stylesheet" href="/assets/${cssFile}">\n  </head>`);
    }
    
    if (jsFile) {
      indexContent = indexContent.replace(
        /<script type="module" src="\/src\/main.jsx"><\/script>/,
        `<script type="module" src="/assets/${jsFile}"></script>`
      );
    }

    // Write the updated index.html
    fs.writeFileSync(destIndexHtml, indexContent);
    console.log('Copied and updated index.html with correct asset references');
  } else {
    console.error('Source index.html not found!');
  }
}

// Helper function to recursively process directories
function processDirectory(dir, depth = 0) {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return;
  }
  
  if (depth > 10) {
    console.warn(`Maximum directory depth reached for ${dir}, skipping`);
    return;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  // Process all JS files in this directory
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Process subdirectories recursively
      processDirectory(fullPath, depth + 1);
    } else if (item.isFile() && item.name.endsWith('.js') && 
              !item.name.endsWith('.min.js') && 
              !item.name.endsWith('.map.js') && 
              !item.name.includes('node_modules')) {
      fixImportsInFile(fullPath);
    }
  }
}

// Fix import statements in a single file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Match different import patterns:
    // 1. Standard imports: import X from './path'
    // 2. Named imports: import { X } from './path'
    // 3. Namespace imports: import * as X from './path'
    // 4. Side effect imports: import './path'
    // 5. Dynamic imports: import('./path')
    
    // Fix static imports
    const staticImportRegex = /import(?:["'\s]*([\w*${}\n\r\t, ]+)from\s*)?["'\s]["'\s](\.\/[^"']+|\.\.\/[^"']+)["'\s](?:["'\s].*)?[;\n]/g;
    const modifiedContent = content.replace(staticImportRegex, (match, imports, path) => {
      if (!path.endsWith('.js') && !path.includes('.')) {
        modified = true;
        return match.replace(path, `${path}.js`);
      }
      return match;
    });
    
    // Fix dynamic imports
    const dynamicImportRegex = /import\s*\(\s*["'](\.\/[^"']+|\.\.\/[^"']+)["']\s*\)/g;
    const finalContent = modifiedContent.replace(dynamicImportRegex, (match, path) => {
      if (!path.endsWith('.js') && !path.includes('.')) {
        modified = true;
        return match.replace(path, `${path}.js`);
      }
      return match;
    });
    
    // Also fix module imports from './storage' to './storage.js' specifically
    const specificFixRegex = /from\s+["'](\.\/[a-zA-Z0-9_-]+|\.\.\/[a-zA-Z0-9_-]+)["']/g;
    const finalContentWithSpecificFixes = finalContent.replace(specificFixRegex, (match, path) => {
      if (!path.endsWith('.js') && !path.includes('.')) {
        modified = true;
        return match.replace(path, `${path}.js`);
      }
      return match;
    });
    
    // Also fix dynamic imports like await import('./db')
    const dynamicImportAwaitRegex = /(?:await\s+)?import\s*\(\s*["'](\.\/[^"']+|\.\.\/[^"']+)["']\s*\)/g;
    const finalContentWithDynamicFixes = finalContentWithSpecificFixes.replace(dynamicImportAwaitRegex, (match, path) => {
      if (!path.endsWith('.js') && !path.includes('.')) {
        modified = true;
        return match.replace(path, `${path}.js`);
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, finalContentWithDynamicFixes);
      console.log(`Fixed imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Step 2: Fix .js extensions in import statements
function fixJsExtensions() {
  console.log('Fixing import extensions in server files...');
  
  // Process the server directory recursively
  processDirectory(serverDir);
  
  console.log('Import extensions fixed');
}

// Step 3: Copy environment file to dist
function copyEnvFile() {
  const sourceEnvFile = path.join(rootDir, '.env.production');
  const destEnvFile = path.join(distDir, '.env');

  if (fs.existsSync(sourceEnvFile)) {
    fs.copyFileSync(sourceEnvFile, destEnvFile);
    console.log('Copied .env.production to dist/.env');
  } else {
    console.warn('.env.production file not found');
  }
}

// Step 4: Fix specific issues that might cause problems in production
async function fixServerConfig() {
  console.log("Starting server configuration fixes...");
  
  try {
    // Handle index.js
    const serverIndexPath = path.join(serverDir, 'index.js');
    if (fs.existsSync(serverIndexPath)) {
      let indexContent = fs.readFileSync(serverIndexPath, 'utf8');
      let modified = false;
      
      // Remove any imports from vite.js that might cause issues in production
      const viteImportRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^,]+)(?:\s*,\s*)?)?(?:[^,{}\s*]+)?(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+[^,]+))?\s+from\s+['"]\.\/vite\.js['"];/;
      
      if (viteImportRegex.test(indexContent)) {
        console.log('Detected vite.js import in server/index.js. Adding production-ready code...');
        
        // Replace import with our own log function
        indexContent = indexContent.replace(viteImportRegex, `
// Custom log function for production
function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(\`\${formattedTime} [\${source}] \${message}\`);
}
`);
        modified = true;
        
        // Replace any calls to serveStatic or setupVite with direct static file serving
        // This regex looks for the conditional serving section
        const serveStaticRegex = /if\s*\(app\.get\("env"\)\s*===\s*"development"\)\s*{[^}]*}\s*else\s*{[^}]*}/;
        
        if (serveStaticRegex.test(indexContent)) {
          indexContent = indexContent.replace(serveStaticRegex, `
// Static file serving for production
const publicPath = path.join(__dirname, '..', 'public');
console.log('Serving static files from:', publicPath);

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  
  // Fall through to index.html for SPA routing
  app.use('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  console.log('Static file serving configured successfully');
} else {
  console.error(\`Public directory not found at \${publicPath}\`);
}
`);
          modified = true;
        }
        
        // Ensure listen is on 0.0.0.0 not localhost
        if (indexContent.includes('server.listen(PORT, "localhost"')) {
          indexContent = indexContent.replace(/server\.listen\(PORT,\s*["']localhost["']/g, 'server.listen(PORT, "0.0.0.0"');
          modified = true;
        }
        
        if (modified) {
          fs.writeFileSync(serverIndexPath, indexContent);
          console.log('Updated server/index.js for production');
        }
      }
    } else {
      console.warn('server/index.js not found');
    }
    
    // Fix any specific auth.js issues
    const authJsPath = path.join(serverDir, 'auth.js');
    if (fs.existsSync(authJsPath)) {
      let content = fs.readFileSync(authJsPath, 'utf8');
      let modified = false;
      
      // Check for specific import that needs fixing
      if (content.includes('import { storage } from "./storage"')) {
        content = content.replace(
          'import { storage } from "./storage"',
          'import { storage } from "./storage.js"'
        );
        modified = true;
      }
      
      // Fix session configuration
      const sessionConfigRegex = /const sessionMiddleware = session\(\{[\s\S]*?\}\)/;
      if (sessionConfigRegex.test(content)) {
        content = content.replace(sessionConfigRegex, `const sessionMiddleware = session({
      secret: process.env.SESSION_SECRET || "your_secure_session_secret",
      resave: true,
      saveUninitialized: true,
      store: storage.sessionStore,
      cookie: {
        secure: false, // Set to false for http testing
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
        path: "/"
      },
      name: "sessionId"
    })`);
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(authJsPath, content);
        console.log('Fixed auth.js session configuration');
      }
    }
    
    // Handle any specific AI service imports
    const aiServicesDir = path.join(serverDir, 'ai-services');
    if (fs.existsSync(aiServicesDir)) {
      const aiFiles = fs.readdirSync(aiServicesDir).filter(file => 
        file.endsWith('.js') && !file.endsWith('.map.js'));
        
      for (const file of aiFiles) {
        const filePath = path.join(aiServicesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Fix specific imports in AI service files
        if (content.includes('from "./gemini-client"')) {
          content = content.replace(
            'from "./gemini-client"',
            'from "./gemini-client.js"'
          );
          modified = true;
        }
        
        if (modified) {
          fs.writeFileSync(filePath, content);
          console.log(`Fixed imports in ${filePath}`);
        }
      }
    }

    // Fix component imports to ensure they have proper file extensions
    await fixComponentImports(path.join(rootDir, 'public'));
    
    // Fix import paths to ensure proper resolution in production
    await fixImportPaths(path.join(rootDir, 'public'));
    
    console.log("Server configuration fixed successfully!");
  } catch (error) {
    console.error("Error fixing server configuration:", error);
  }
}

// Add these utility functions at the top of the file, before the main functions
// Utility function to find all JS files in a directory recursively
async function findJsFiles(dir) {
  let results = [];
  
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return results;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      const subDirResults = await findJsFiles(fullPath);
      results = [...results, ...subDirResults];
    } else if (item.isFile() && 
              (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.mjs')) && 
              !fullPath.endsWith('.min.js') && 
              !fullPath.endsWith('.map.js') && 
              !fullPath.includes('node_modules')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Utility function to read a file - Promise-based wrapper
function readFile(filePath, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, encoding, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

// Utility function to write a file - Promise-based wrapper
function writeFile(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// Function to calculate a relative path between two directories
function calculateRelativePath(from, to) {
  return path.relative(from, to).replace(/\\/g, '/');
}

// Fix relative path imports that use @ aliases
async function fixImportPaths(dir) {
  console.log(`Fixing import paths in ${dir}`);
  const files = await findJsFiles(dir);
  
  for (const file of files) {
    console.log(`Processing imports in ${file}`);
    let content = await readFile(file, 'utf8');
    let modified = false;

    // Replace @ aliases with proper relative paths
    const aliasImportRegex = /from\s+["']@\/([^"']+)["']/g;
    content = content.replace(aliasImportRegex, (match, importPath) => {
      modified = true;
      // For components that should have .jsx extension
      if (importPath.startsWith('components/') && 
          importPath.split('/').pop().charAt(0).toUpperCase() === importPath.split('/').pop().charAt(0) &&
          !importPath.endsWith('.jsx') && !importPath.endsWith('.js')) {
        return match.replace(`@/${importPath}`, `@/${importPath}.jsx`);
      }
      return match;
    });
    


    // Fix all PascalCase component imports to ensure they have .jsx extension
    content = content.replace(
      /from\s+["']([^"']+\/[A-Z][^"'\/.]*)["']/g,
      (match, importPath) => {
        // Only add .jsx if there's no file extension already
        if (!importPath.match(/\.[a-z]+$/)) {
          modified = true;
          return match.replace(importPath, `${importPath}.jsx`);
        }
        return match;
      }
    );

    if (modified) {
      await writeFile(file, content);
      console.log(`Fixed imports in ${file}`);
    }
  }
}

// Fix component imports to ensure they have proper file extensions
async function fixComponentImports(dir) {
  console.log(`Ensuring component imports have file extensions in ${dir}`);
  const files = await findJsFiles(dir);
  
  for (const file of files) {
    console.log(`Processing component imports in ${file}`);
    let content = await readFile(file, 'utf8');
    let modified = false;



    // Add .jsx extension to PascalCase component imports if they don't have an extension
    content = content.replace(
      /from\s+["']([^"']+\/[A-Z][^"'\/.]*)["']/g,
      (match, importPath) => {
        // Only add .jsx if there's no file extension already
        if (!importPath.match(/\.[a-z]+$/)) {
          modified = true;
          return match.replace(importPath, `${importPath}.jsx`);
        }
        return match;
      }
    );

    // Also fix dynamic imports of components
    content = content.replace(
      /import\(['"]([^'"]+\/[A-Z][^'"\/.]*)['"][\),]/g,
      (match, importPath) => {
        // Only add .jsx if there's no file extension already
        if (!importPath.match(/\.[a-z]+$/)) {
          modified = true;
          return match.replace(importPath, `${importPath}.jsx`);
        }
        return match;
      }
    );

    if (modified) {
      await writeFile(file, content);
      console.log(`Updated component imports in ${file}`);
    }
  }
}

// Add this function to specifically address the Railway deployment issue
async function fixRailwayPaths() {
  console.log('Applying Railway-specific fixes...');
  
  // Check if we're running in Railway
  const isRailway = process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY;
  if (isRailway) {
    console.log('Railway environment detected, applying additional fixes');
  }

  // In Railway, the app is deployed to /app, not the original project path
  // We need to handle component import issues
  // This will run for all environments to ensure consistency
  
  try {
    // Find all JS and JSX files in the public directory (where the client build outputs)
    const publicDir = path.join(distDir, 'public');
    const files = await findJsFiles(publicDir);
    
    console.log(`Found ${files.length} files to check for Railway path fixes`);
    
    for (const file of files) {
      let content = await readFile(file, 'utf8');
      let modified = false;
      

    }
    
    console.log('Railway-specific fixes completed.');
  } catch (error) {
    console.error('Error applying Railway fixes:', error);
  }
}

// Run all the steps
try {
  copyIndexHtml();
  fixJsExtensions();
  copyEnvFile();
  await fixServerConfig();
  await fixRailwayPaths();
  console.log('Post-build process completed successfully! The application is ready for production.');
} catch (error) {
  console.error('Error during post-build process:', error);
  process.exit(1);
} 