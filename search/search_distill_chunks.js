// search/search_distill_chunks.js
require("dotenv").config();
const { Client } = require("@elastic/elasticsearch");
const fetch = require("node-fetch");

// ------------------------------
// Config
// ------------------------------
const ES_NODE =
  process.env.ES_NODE ||
  process.env.ELASTICSEARCH_NODE ||
  "http://localhost:9200";

const ES_INDEX =
  process.env.ES_INDEX ||
  process.env.ELASTICSEARCH_INDEX ||
  "quo_distill_index";

const EMBED_URL =
  process.env.EMBED_URL || "http://localhost:11434/api/embeddings";

const EMBED_MODEL =
  process.env.EMBED_MODEL || "mxbai-embed-large";

// ES client
const client = new Client({ node: ES_NODE });

// ------------------------------
// Embedding helper
// ------------------------------
async function embedText(text) {
  const resp = await fetch(EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Embedding request failed: ${resp.status}`);
  }

  const data = await resp.json();
  return data.embedding;
}

// ------------------------------
// Sparse Search (BM25)
// ------------------------------
async function searchBM25(query, size = 10) {
  const res = await client.search({
    index: ES_INDEX,
    size,
    query: {
      match: {
        content: query,
      },
    },
  });

  const hitsContainer = res.hits || (res.body && res.body.hits);
  if (!hitsContainer || !hitsContainer.hits) return [];

  return hitsContainer.hits.map((h) => ({
    id: h._id,
    score: h._score,
    ...h._source,
  }));
}

// ------------------------------
// Dense Vector Search (KNN)
// ------------------------------
async function searchVector(query, size = 10) {
  const vector = await embedText(query);

  const res = await client.search({
    index: ES_INDEX,
    knn: {
      field: "embedding",
      query_vector: vector,
      k: size,
      num_candidates: 50,
    },
  });

  return res.hits.hits.map((h) => ({
    id: h._id,
    score: h._score,
    ...h._source,
  }));
}

// ------------------------------
// Hybrid RRF Fusion (SOTA)
// ------------------------------
function fuseRRF(dense, sparse, k = 60) {
  const scores = new Map();

  const add = (arr) => {
    arr.forEach((item, i) => {
      const id = item.id;
      const rank = i + 1;
      const score = 1 / (k + rank);
      scores.set(id, (scores.get(id) || 0) + score);
    });
  };

  add(dense);
  add(sparse);

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => dense.find(d => d.id === id) || sparse.find(s => s.id === id));
}

// ------------------------------
// Hybrid Search Wrapper
// ------------------------------
async function searchHybrid(query, size = 10) {
  const [dense, sparse] = await Promise.all([
    searchVector(query, size),
    searchBM25(query, size),
  ]);

  return fuseRRF(dense, sparse).slice(0, size);
}

// Backwards compatibility for tests
async function searchMostRelevant(query) {
  const result = await searchBM25(query, 1);
  return result[0] || null;
}

module.exports = {
  embedText,
  searchBM25,
  searchVector,
  searchHybrid,
  searchMostRelevant, // used by tests
};
