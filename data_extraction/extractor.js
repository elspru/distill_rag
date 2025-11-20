// data_extraction/extractor.js
const fs = require("fs");
const cheerio = require("cheerio");

function extractFromHTML(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(raw);

  // Select paragraphs AND headings
  const blocks = $("p, h1, h2, h3, h4, h5, h6")
    .map((i, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 0);

  // If no structured blocks exist, fallback to body text split
  let lines = blocks;
  if (lines.length === 0) {
    lines = $("body")
      .text()
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  // Convert each block into a turn
  const turns = lines.map((text, idx) => ({
    role: idx === 0 ? "user" : "assistant",
    content: text,
  }));

  return turns;
}

module.exports = { extractFromHTML };
