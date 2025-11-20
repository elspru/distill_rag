// src/search/searchHybrid.js
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const fetch = require('node-fetch');

const ELASTICSEARCH_NODE =
  process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

const DEFAULT_INDEX =
  process.env.ELASTICSEARCH_INDEX || 'quo_index';

const OLLAMA_URL =
  process.env.OLLAMA_URL || 'http://localhost:11434';

const EMBED_MODEL =
  process.env.EMBED_MODEL || 'mxbai-embed-large';

const client = new Client({ node: ELASTICSEARCH_NODE });

/**
 * Get an embedding for a query string via Ollama.
 */
const embedQuery = async (text) => {
  if (!text || !text.trim()) {
    throw new Error('embedQuery: text is required');
  }

  const resp = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text
    })
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(
      `embedQuery: Ollama error ${resp.status} ${resp.statusText} ${body}`
    );
  }

  const data = await resp.json();
  if (!data || !Array.isArray(data.embedding)) {
    throw new Error('embedQuery: invalid embedding response');
  }

  return data.embedding;
};

/**
 * BM25 search over `content`.
 */
const bm25Search = async (queryText, size, index) => {
  const resp = await client.search({
    index,
    size,
    body: {
      query: {
        multi_match: {
          query: queryText,
          fields: ['content'],
          type: 'best_fields'
        }
      }
    }
  });

  const hits = resp.hits?.hits || [];

  return hits.map((hit) => ({
    id: hit._id,
    score_bm25: hit._score || 0,
    score_vector: 0,
    content: hit._source.content,
    session_date: hit._source.session_date,
    date: hit._source.session_date, // alias for existing code
    title: hit._source.title,
    source: hit._source.source,
    chunk_index: hit._source.chunk_index
  }));
};

/**
 * Pure vector search using cosine similarity on `embedding`.
 */
const vectorSearch = async (queryText, size, index) => {
  const queryVector = await embedQuery(queryText);

  const resp = await client.search({
    index,
    size,
    body: {
      query: {
        script_score: {
          query: { match_all: {} },
          script: {
            source: "cosineSimilarity(params.qv, 'embedding') + 1.0",
            params: { qv: queryVector }
          }
        }
      },
      _source: ['content', 'session_date', 'title', 'source', 'chunk_index']
    }
  });

  const hits = resp.hits?.hits || [];

  return hits.map((hit) => ({
    id: hit._id,
    score_bm25: 0,
    score_vector: hit._score || 0,
    content: hit._source.content,
    session_date: hit._source.session_date,
    date: hit._source.session_date, // alias
    title: hit._source.title,
    source: hit._source.source,
    chunk_index: hit._source.chunk_index
  }));
};

/**
 * Min–max normalize a field across an array.
 */
const normalizeField = (items, field) => {
  const values = items.map((x) => x[field] || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const denom = max - min || 1; // avoid div by zero

  return items.map((x, i) => ({
    ...x,
    [field + '_norm']: (values[i] - min) / denom
  }));
};

/**
 * Merge BM25 + vector hits by ID & compute hybrid score.
 */
const mergeAndScore = (
  bm25Hits,
  vectorHits,
  weightBM25 = 0.3,
  weightVector = 0.7
) => {
  // Start with BM25 hits in a map
  const mergedMap = bm25Hits.reduce(
    (acc, h) => ({
      ...acc,
      [h.id]: h
    }),
    {}
  );

  // Merge vector hits
  const withVector = vectorHits.reduce((acc, h) => {
    const existing = acc[h.id] || {
      ...h,
      score_bm25: 0
    };

    return {
      ...acc,
      [h.id]: {
        ...existing,
        score_vector: h.score_vector
      }
    };
  }, mergedMap);

  // Normalize both scores
  const withBm25Norm = normalizeField(
    Object.values(withVector),
    'score_bm25'
  );
  const withBothNorm = normalizeField(withBm25Norm, 'score_vector');

  // Hybrid score
  return withBothNorm
    .map((h) => ({
      ...h,
      score_hybrid:
        (h.score_bm25_norm || 0) * weightBM25 +
        (h.score_vector_norm || 0) * weightVector
    }))
    .sort((a, b) => b.score_hybrid - a.score_hybrid);
};

/**
 * Hybrid search:
 * - BM25 on content
 * - Vector on embedding
 * - Merge + normalize + weighted hybrid score
 *
 * @param {string} queryText
 * @param {number} size   final number of chunks to return
 * @param {object} options
 *   - index: ES index name (default: ELASTICSEARCH_INDEX)
 *   - bm25Size: how many BM25 candidates
 *   - vectorSize: how many vector candidates
 *   - weightBM25: weight for lexical score
 *   - weightVector: weight for vector score
 */
const searchHybrid = async (
  queryText,
  size = 6,
  {
    index = DEFAULT_INDEX,
    bm25Size = 24,
    vectorSize = 24,
    weightBM25 = 0.3,
    weightVector = 0.7
  } = {}
) => {
  if (!queryText || !queryText.trim()) {
    throw new Error('searchHybrid: query text is required');
  }

  const [bm25Hits, vectorHits] = await Promise.all([
    bm25Search(queryText, bm25Size, index),
    vectorSearch(queryText, vectorSize, index)
  ]);

  const merged = mergeAndScore(bm25Hits, vectorHits, weightBM25, weightVector);

  // Trim to requested size
  return merged.slice(0, size);
};

module.exports = {
  searchHybrid
};
