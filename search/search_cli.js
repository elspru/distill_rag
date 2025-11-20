#!/usr/bin/env node

/**
 * search/search_cli.js
 * 
 * CLI search tool for distill_rag
 *
 * Usage:
 *   node search_cli.js "<query>" [mode] [k]
 *
 * Examples:
 *   node search_cli.js "service to others"
 *   node search_cli.js "unity and love" hybrid 5
 *   node search_cli.js "healing" vector 10
 */

require("dotenv").config();
const {
  searchBM25,
  searchVector,
  searchHybrid,
} = require("./search_distill_chunks");

// ---- Parse CLI arguments ----
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage:
  node search_cli.js "<query>" [mode] [k]

Modes:
  bm25     BM25 keyword search
  vector   Dense embedding search (KNN)
  hybrid   RRF-fused hybrid (default)

Examples:
  node search_cli.js "service to others"
  node search_cli.js "unity" bm25
  node search_cli.js "spiritual seeking" hybrid 8
`);
  process.exit(0);
}

const query = args[0];
const mode = (args[1] || "hybrid").toLowerCase();
const k = parseInt(args[2] || "5", 10);

// ---- Mode selection ----
async function run() {
  let results;

  switch (mode) {
    case "bm25":
      console.log(`\n🔍 Running BM25 keyword search (k=${k})…\n`);
      results = await searchBM25(query, k);
      break;

    case "vector":
      console.log(`\na🧠 Running dense vector search (k=${k})…\n`);
      results = await searchVector(query, k);
      break;

    case "hybrid":
    default:
      console.log(`\n🚀 Running hybrid RRF search (k=${k})…\n`);
      results = await searchHybrid(query, k);
      break;
  }

  if (!results || results.length === 0) {
    console.log("No results found.");
    return;
  }

  // ---- Pretty-print results ----
  results.forEach((hit, index) => {
    console.log(`\n${index + 1}. ─────────────────────────────`);
    console.log(`📄 Source: ${hit.source || hit.title || "unknown"}`);
    console.log(`📏 Chunk: ${hit.chunk_index ?? "?"}`);
    if (hit.score !== undefined) {
      console.log(`⭐ Score: ${hit.score.toFixed(4)}`);
    }
    console.log("\n" + hit.content.slice(0, 500) + "…");
  });

  console.log("\nDone.\n");
}

run().catch((err) => {
  console.error("❌ Search error:", err.message);
  process.exit(1);
});
