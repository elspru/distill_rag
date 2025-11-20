// addQuoJsonDirToElasticsearch.js
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // same style as ask_quo_rag.js

// Env config
const ELASTICSEARCH_NODE =
  process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const ELASTICSEARCH_INDEX =
  process.env.ELASTICSEARCH_INDEX || 'quo_index';
const QUO_JSON_DIR =
  process.env.QUO_JSON_DIR || process.argv[2];

if (!QUO_JSON_DIR) {
  console.error(
    'Usage: QUO_JSON_DIR=/path/to/datasets_quo node addQuoJsonDirToElasticsearch.js'
  );
  process.exit(1);
}

// ES client
const client = new Client({ node: ELASTICSEARCH_NODE });

/**
 * Call Ollama embeddings API (mxbai-embed-large) for a single text.
 * Returns a Float32Array-ish plain JS array.
 */
const embed = (text) =>
  fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mxbai-embed-large',
      prompt: text,
    }),
  })
    .then((resp) => {
      if (!resp.ok) {
        throw new Error(`Embedding request failed: ${resp.status}`);
      }
      return resp.json();
    })
    .then((data) => data.embedding);

/**
 * Paragraph-aware chunker.
 * - Splits on blank lines first
 * - Then greedily groups paragraphs into ~maxChars blocks
 * - Tries not to leave tiny orphan chunks (uses minChars)
 * No for-loops, just reduce.
 */
const chunkContent = (text, maxChars = 3200, minChars = 1600) => {
  if (!text || typeof text !== 'string') return [];

  const paras = text
    .split(/\n\s*\n/g)
    .map(p => p.trim())
    .filter(Boolean);

  if (!paras.length) return [];

  return paras.reduce((chunks, para) => {
    if (!chunks.length) {
      return [para];
    }

    const last = chunks[chunks.length - 1];
    const combined = `${last}\n\n${para}`;

    // If the combined chunk is still under maxChars,
    // OR the existing last chunk is still smaller than minChars,
    // we merge them. Otherwise we start a new chunk.
    const canGrow =
      combined.length <= maxChars || last.length < minChars;

    return canGrow
      ? [
          ...chunks.slice(0, -1),
          combined,
        ]
      : [...chunks, para];
  }, []);
};


/**
 * Combine all assistant turns into one big teaching blob.
 */
const extractAssistantText = (session) =>
  (Array.isArray(session?.turns) ? session.turns : [])
    .filter(
      (t) =>
        t?.role === 'assistant' &&
        typeof t.content === 'string' &&
        t.content.trim().length > 0
    )
    .map((t) => t.content.trim())
    .join('\n\n');

/**
 * Index a single Q'uo JSON session file into Elasticsearch.
 * Pure-ish style, uses map/flatMap + Promise.all.
 */
const indexSessionFile = (filePath) => {
  console.log(`[index] Processing ${filePath}`);

  const session = (() => {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error(
        `[index]   ERROR reading/parsing ${filePath}:`,
        err.message
      );
      return null;
    }
  })();

  if (!session) return Promise.resolve(0);

  const sessionDate = session.session_date || 'unknown';
  const title = session.title || path.basename(filePath);

  const content = extractAssistantText(session);
  if (!content.trim()) {
    console.log('[index]   No assistant content, skipping.');
    return Promise.resolve(0);
  }

  const chunks = chunkContent(content, 1000, 150);
  console.log(`[index]   Produced ${chunks.length} chunks`);

  if (!chunks.length) {
    console.log('[index]   No chunks, skipping.');
    return Promise.resolve(0);
  }

  // Build bulk body with embeddings, all in functional style
  return Promise.all(
    chunks.map((chunk, i) =>
      embed(chunk).then((vec) => ({
        header: { index: { _index: ELASTICSEARCH_INDEX } },
        doc: {
          content: chunk,
          session_date: sessionDate,
          title,
          source: path.basename(filePath),
          chunk_index: i,
          embedding: vec,
        },
      }))
    )
  )
    .then((docs) => docs.flatMap((d) => [d.header, d.doc]))
    .then((body) =>
      client
        .bulk({ body })
        .then((resp) => {
          if (resp.errors) {
            console.error('[index]   Bulk index reported errors.');
          } else {
            console.log(
              `[index]   Indexed ${chunks.length} chunks for ${path.basename(
                filePath
              )}.`
            );
          }
          return chunks.length;
        })
        .catch((err) => {
          console.error(
            `[index]   ERROR bulk indexing ${filePath}:`,
            err.message
          );
          return 0;
        })
    );
};

/**
 * Main: read all *.json in QUO_JSON_DIR and index them,
 * using Promise.reduce style (no explicit for-loops).
 */
const main = async () => {
  const baseDir = QUO_JSON_DIR;
  console.log(`[index] QUO_JSON_DIR=${baseDir}`);
  console.log(
    `[index] ES node=${ELASTICSEARCH_NODE}, index=${ELASTICSEARCH_INDEX}`
  );

  const files = (() => {
    try {
      return fs
        .readdirSync(baseDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => path.join(baseDir, f))
        .sort();
    } catch (err) {
      console.error('[index] ERROR reading directory:', err.message);
      process.exit(1);
    }
  })();

  console.log(`[index] Found ${files.length} session files.`);

  const totalChunks = await files.reduce(
    (promiseAcc, filePath) =>
      promiseAcc.then((acc) =>
        indexSessionFile(filePath).then((added) => {
          const newTotal = acc + added;
          console.log(`[index] Total chunks so far: ${newTotal}`);
          return newTotal;
        })
      ),
    Promise.resolve(0)
  );

  console.log(`[index] DONE. Total chunks indexed: ${totalChunks}`);
};

main().catch((err) => {
  console.error('[index] FATAL:', err);
  process.exit(1);
});
