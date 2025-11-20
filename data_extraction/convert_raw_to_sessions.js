
// data_extraction/convert_raw_to_sessions.js
const fs = require("fs");
const path = require("path");
const { extractFromHTML } = require("./extractor");

function convertFile(inputFile, outputFile) {
  const turns = extractFromHTML(inputFile);

  const session = {
    title: path.basename(inputFile),
    turns,
  };

  fs.writeFileSync(outputFile, JSON.stringify(session, null, 2));
}

// Convert all .html files in a directory
function convertDir(inputDir, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir);

  files.forEach((file) => {
    if (!file.endsWith(".html")) return;

    const fullIn = path.join(inputDir, file);
    const outName = file.replace(/\.html$/, ".json");
    const fullOut = path.join(outputDir, outName);

    convertFile(fullIn, fullOut);
  });
}

module.exports = {
  convertFile,
  convertDir,
};
