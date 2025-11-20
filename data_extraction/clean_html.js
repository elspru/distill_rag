// data_extraction/clean_html.js
const cheerio = require("cheerio");

function cleanHTML(html) {
  // Load HTML into cheerio
  const $ = cheerio.load(html);

  const kill = [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    ".ads",
    ".advertisement",
    "#sidebar",
  ];

  // Remove unwanted elements
  kill.forEach(sel => $(sel).remove());

  // Extract body text, normalize whitespace
  let text = $("body").text();

  return text.replace(/\s+/g, " ").trim();
}

module.exports = { cleanHTML };
