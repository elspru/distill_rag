// indexing/index_distill_chunks.js
//
// Long-chunk Elasticsearch indexer for bootstrapped distillation.
// DRY + centralized config + async/await clean style.
//
// Usage:
//   QUO_JSON_DIR=./datasets_quo node indexing/index_distill_chunks.js
//

require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// ------------------------------------------------------------
// CONFIG (all constants live here — DRY, centralized)
// ------------------------------------------------------------
const CONFIG = {
  ES_NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  ES_INDEX: process.env.ES_DISTILL_INDEX || 'quo_distill_index',

  // Embedding API
  EMBED_URL: process.env.EMBED_URL || 'http://localhost:11434/api/embeddings',
  EMBED_MODEL: process.env.EMBED_MODEL || 'mxbai-embed-large',

  // Chunking sizes for distillation-long docs
  CHUNK_MAX: Number(process.env.CHUNK_MAX || 9000),
  CHUNK_MIN: Number(process.env.CHUNK_MIN || 5000),

  // Input directory
  QUO_DIR: process.env.QUO_JSON_DIR || process.argv[2],
};

// NOTE: no QUO_DIR validation here – tests may require this file
// without setting QUO_JSON_DIR.

// ES client
const client = new Client({ node: CONFIG.ES_NODE });

// ------------------------------------------------------------
// Embedding
// ------------------------------------------------------------
async function embed(text) {
  const res = await fetch(CONFIG.EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.EMBED_MODEL,
      prompt: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.embedding; // 1024-dim vector
}

// ------------------------------------------------------------
// Long-form paragraph-aware chunker
// ------------------------------------------------------------
function chunkContent(text) {
  if (!text || typeof text !== 'string') return [];

  const paras = text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paras.length) return [];

  return paras.reduce((chunks, para) => {
    if (chunks.length === 0) return [para];

    const last = chunks[chunks.length - 1];
    const combined = `${last}\n\n${para}`;

    const canGrow =
      combined.length <= CONFIG.CHUNK_MAX || last.length < CONFIG.CHUNK_MIN;

    return canGrow
      ? [...chunks.slice(0, -1), combined]
      : [...chunks, para];
  }, []);
}

// ------------------------------------------------------------
// Extract assistant text
// ------------------------------------------------------------
function extractAssistantText(session) {
  return (Array.isArray(session?.turns) ? session.turns : [])
    .filter((t) => t?.role === 'assistant' && typeof t.content === 'string')
    .map((t) => t.content.trim())
    .filter(Boolean)
    .join('\n\n');
}

// ------------------------------------------------------------
// Progress tracker (non-spammy)
// ------------------------------------------------------------
function makeProgress(totalFiles) {
  const start = Date.now();
  let processed = 0;
  let totalChunks = 0;

  return {
    tick(addedChunks) {
      processed += 1;
      totalChunks += addedChunks;

      const elapsedSec = (Date.now() - start) / 1000;
      const chunksPerSec = elapsedSec > 0 ? totalChunks / elapsedSec : 0;

      const remainingFiles = totalFiles - processed;
      const secPerFile = processed > 0 ? elapsedSec / processed : 0;
      const etaSec = remainingFiles * secPerFile;

      const pct = totalFiles > 0
        ? ((processed / totalFiles) * 100).toFixed(1)
        : '100.0';

      // Only print occasionally to avoid flooding
      if (processed % 10 === 0 || processed === totalFiles) {
        process.stdout.write(
          `\r[progress] ${processed}/${totalFiles} files | ` +
          `${totalChunks} chunks | ` +
          `${chunksPerSec.toFixed(1)} chunks/s | ` +
          `ETA: ${etaSec.toFixed(1)}s | ${pct}%   `
        );
      }

      return { processed, totalChunks };
    },
  };
}

// ------------------------------------------------------------
// Index one file
// ------------------------------------------------------------
async function indexSessionFile(filePath) {
  let session;
  try {
    session = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`[index]   ERROR parse ${filePath}:`, err.message);
    return 0;
  }

  const title = session.title || path.basename(filePath);
  const sessionDate = session.session_date || 'unknown';

  const content = extractAssistantText(session);
  if (!content.trim()) {
    // No assistant content; nothing to index
    return 0;
  }

  const chunks = chunkContent(content);
  if (!chunks.length) return 0;

  const docs = [];

  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i];
    const vec = await embed(text);

    docs.push(
      { index: { _index: CONFIG.ES_INDEX } },
      {
        content: text,
        title,
        session_date: sessionDate,
        source: path.basename(filePath),
        chunk_index: i,
        embedding: vec,
      }
    );
  }

  const resp = await client.bulk({ body: docs });

  if (resp.errors) {
    console.error('[index]   Bulk indexing reported errors.');
  }

  return chunks.length;
}

// ------------------------------------------------------------
// Main (CLI entrypoint)
// ------------------------------------------------------------
async function main() {
  console.log('[index] Starting distillation indexer with config:');
  console.log(CONFIG);

  if (!CONFIG.QUO_DIR) {
    console.error(
      'Usage: QUO_JSON_DIR=./datasets_quo node indexing/index_distill_chunks.js'
    );
    process.exit(1);
  }

  let files;
  try {
    files = fs
      .readdirSync(CONFIG.QUO_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(CONFIG.QUO_DIR, f))
      .sort();
  } catch (err) {
    console.error('[index] ERROR reading directory:', err.message);
    process.exit(1);
  }

  console.log(`[index] Found ${files.length} sessions`);

  let total = 0;
  const progress = makeProgress(files.length);

  for (const filePath of files) {
    try {
      const added = await indexSessionFile(filePath);
      const { totalChunks } = progress.tick(added);
      total = totalChunks;
    } catch (err) {
      console.error(`[index] Error indexing ${filePath}:`, err);
    }
  }

  // Ensure the progress line is ended
  process.stdout.write('\n');
  console.log(`[index] DONE. Total chunks indexed: ${total}`);
}

// Only run main() when executed as a script, not when required by Jest
if (require.main === module) {
  main().catch((err) => {
    console.error('[index] FATAL:', err);
    process.exit(1);
  });
}

// Exports for tests
module.exports = {
  CONFIG,
  client,
  embed,
  chunkContent,
  extractAssistantText,
  indexSessionFile,
  main,
};
