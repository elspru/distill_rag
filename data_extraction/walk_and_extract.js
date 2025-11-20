// data_extraction/walk_and_extract.js

const fs = require("fs");
const path = require("path");
const { convertFile } = require("./convert_raw_to_sessions");

// Recursively walk directory and return list of full file paths
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      results.push(filePath);
    }
  });

  return results;
}

// Convert all HTML files from inputDir → outputDir
function mainCLI() {
  const args = process.argv.slice(2);

  // ---------------------------
  //  Usage print (fix for Jest)
  // ---------------------------
  if (args.length < 2) {
    console.log("Usage: node walk_and_extract.js <input_dir> <output_dir>");
    return; // no exit needed — Jest now sees output correctly
  }

  const inputDir = args[0];
  const outputDir = args[1];

  if (!fs.existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = walkDir(inputDir).filter((f) => f.endsWith(".html"));

  files.forEach((filePath) => {
    const outName = path.basename(filePath).replace(/\.html$/, ".json");
    const outPath = path.join(outputDir, outName);
    convertFile(filePath, outPath);
  });

  console.log(`[walk_and_extract] Processed ${files.length} HTML files.`);
}

// Only run if executed directly
if (require.main === module) {
  mainCLI();
}

module.exports = {
  walkDir,
  mainCLI,
};
