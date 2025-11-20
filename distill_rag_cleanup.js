// distill_rag_cleanup.js
//
// Usage:
//   node distill_rag_cleanup.js
//
// Cleans and reorganizes the distill_rag directory into a clean
// structure optimized for bootstrap distillation workflows.

const fs = require("fs");
const path = require("path");

// Helper to safely mkdir
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Helper to safely move
function move(from, to) {
  if (fs.existsSync(from)) {
    console.log(`Moving ${from} -> ${to}`);
    fs.renameSync(from, to);
  }
}

// Helper to safely delete
function del(target) {
  if (fs.existsSync(target)) {
    console.log(`Deleting ${target}`);
    fs.rmSync(target, { recursive: true, force: true });
  }
}

const ROOT = process.cwd();

// --- 1. Create final folder structure ---
const STRUCTURE = [
  "pipeline",           // generators/verifiers/reward loops
  "indexing",           // ES indexers, chunkers, rebuild scripts
  "search",             // distill-specific search scripts
  "prompts",            // generator/verifier/reward prompts
  "es",                 // ES mappings + index builders
  "shared",             // minimal shared utils
];

STRUCTURE.forEach(dir => ensureDir(path.join(ROOT, dir)));


// --- 2. Move relevant files into the correct folders ---

// INDEXING
move(
  path.join(ROOT, "addQuoJsonDirToElasticsearch.js"),
  path.join(ROOT, "indexing", "index_distill_chunks.js")
);

move(
  path.join(ROOT, "addChunkedFileToElasticsearch.js"),
  path.join(ROOT, "indexing", "addChunkedFileToElasticsearch.js")
);

move(
  path.join(ROOT, "elasticsearch.js"),
  path.join(ROOT, "shared", "elastic.js")
);


// SEARCH (distill-specific, but interactive scripts removed)
move(
  path.join(ROOT, "searchRelevantElasticsearch.js"),
  path.join(ROOT, "search", "search_distill_chunks.js")
);


// PROMPTS (empty placeholders created)
[
  "generator_prompt.txt",
  "verifier_prompt.txt",
  "reward_prompt.txt"
].forEach(f => {
  const out = path.join(ROOT, "prompts", f);
  if (!fs.existsSync(out)) {
    console.log(`Creating placeholder: prompts/${f}`);
    fs.writeFileSync(out, "TODO: fill in prompt\n");
  }
});


// PIPELINE (create placeholders)
[
  "generator.js",
  "verifier.js",
  "reward.js",
  "build_gold.js",
  "distill_pipeline.js"
].forEach(f => {
  const out = path.join(ROOT, "pipeline", f);
  if (!fs.existsSync(out)) {
    console.log(`Creating placeholder: pipeline/${f}`);
    fs.writeFileSync(out, "// TODO: implement\n");
  }
});


// ES mapping placeholder
const esMap = path.join(ROOT, "es", "mapping.json");
if (!fs.existsSync(esMap)) {
  console.log("Creating es/mapping.json placeholder");
  fs.writeFileSync(esMap, "{\n  \"mappings\": {}\n}\n");
}


// --- 3. Delete interactive RAG files (safe to remove) ---
[
  "ask_quo_rag.js",
  "searchQuoRelevant.js",
  "searchElasticsearch.js",
  "deleteDocument.js",
  "removeDuplicates.js"
].forEach(file => del(path.join(ROOT, file)));


// --- 4. Move src utils if present ---
if (fs.existsSync(path.join(ROOT, "src"))) {
  console.log("Moving src/ → shared/src/");
  ensureDir(path.join(ROOT, "shared", "src"));
  move(path.join(ROOT, "src"), path.join(ROOT, "shared", "src"));
}

console.log("\n✨ distill_rag reorganization complete!");
console.log("New structure:");
console.log(`
distill_rag/
  indexing/
    index_distill_chunks.js
    addChunkedFileToElasticsearch.js

  search/
    search_distill_chunks.js

  pipeline/
    generator.js
    verifier.js
    reward.js
    build_gold.js
    distill_pipeline.js

  prompts/
    generator_prompt.txt
    verifier_prompt.txt
    reward_prompt.txt

  es/
    mapping.json

  shared/
    elastic.js
    src/   (former shared utils)
`);
