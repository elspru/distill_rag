// search/search_distill_chunks.js
require("dotenv").config();
const { Client } = require("@elastic/elasticsearch");
const fetch = require("node-fetch");

// Config
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

if (!ES_NODE) {
  throw new Error("ELASTICSEARCH_NODE / ES_NODE not configured");
}

const client = new Client({ node: ES_NODE });

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

// Simple relevance search (BM25) for tests
async function searchMostRelevant(query) {
  const res = await client.search({
    index: ES_INDEX,
    query: {
      match: {
        content: query,
      },
    },
    size: 1,
  });

  const hitsContainer = res.hits || (res.body && res.body.hits);
  if (!hitsContainer || !hitsContainer.hits || hitsContainer.hits.length === 0) {
    return null;
  }

  return hitsContainer.hits[0]._source;
}

module.exports = {
  embedText,
  searchMostRelevant,
};
