#!/usr/bin/env node
/**
 * Auto-convert ES Module imports/exports to CommonJS require/module.exports
 * Makes .bak backups for safety.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const shouldProcess = (file) =>
  file.endsWith(".js") &&
  !file.includes("node_modules") &&
  !file.includes("data") &&
  !file.endsWith(".bak");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function convertFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let out = src;

  // Backup
  fs.writeFileSync(file + ".bak", src);

  // 1. Convert default import:  import x from 'y';
  out = out.replace(
    /^import\s+([a-zA-Z0-9_$]+)\s+from\s+["']([^"']+)["'];?/gm,
    (_, name, mod) => `const ${name} = require("${mod}");`
  );

  // 2. Convert named import: import { a, b } from 'y';
  out = out.replace(
    /^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/gm,
    (_, names, mod) => `const {${names}} = require("${mod}");`
  );

  // 3. Convert namespace import: import * as x from 'y';
  out = out.replace(
    /^import\s+\*\s+as\s+([a-zA-Z0-9_$]+)\s+from\s+["']([^"']+)["'];?/gm,
    (_, name, mod) => `const ${name} = require("${mod}");`
  );

  // 4. Remove bare imports (rare in your repo)
  out = out.replace(
    /^import\s+["']([^"']+)["'];?/gm,
    (_, mod) => `require("${mod}");`
  );

  // 5. export function → module.exports.func = function
  out = out.replace(
    /^export\s+function\s+([a-zA-Z0-9_$]+)\s*\(/gm,
    (_, name) => `function ${name}(` // define function
  );

  out = out.replace(
    /^function\s+([a-zA-Z0-9_$]+)\s*\(/gm,
    (match, name, offset) => {
      // Only append module.exports if original had export
      if (src.includes(`export function ${name}`)) {
        return `function ${name}(`;
      }
      return match;
    }
  );

  // Add module.exports line for exported functions
  const exportedFns = [...src.matchAll(/export function ([a-zA-Z0-9_$]+)/g)].map(
    (m) => m[1]
  );

  if (exportedFns.length) {
    out += `\n\nmodule.exports = { ${exportedFns.join(", ")} };\n`;
  }

  // 6. export default X → module.exports = X
  out = out.replace(
    /^export\s+default\s+([a-zA-Z0-9_$]+);?/gm,
    (_, name) => `module.exports = ${name};`
  );

  // 7. export { a, b };
  out = out.replace(
    /^export\s+\{([^}]+)\};?/gm,
    (_, names) => `module.exports = {${names}};`
  );

  // Save file
  fs.writeFileSync(file, out, "utf8");

  console.log("Converted:", file);
}

console.log("Scanning project for .js files…");

const all = walk(ROOT).filter(shouldProcess);

console.log("Found", all.length, "files to convert.");
all.forEach(convertFile);

console.log("\n✔ Conversion complete!");
console.log("✔ Backups saved as *.bak");
