// searchQuoRelevant.js
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

const ELASTICSEARCH_NODE =
  process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const ELASTICSEARCH_INDEX =
  process.env.ELASTICSEARCH_INDEX || 'quo_index';

const client = new Client({ node: ELASTICSEARCH_NODE });

/**
 * Fetch top-N relevant Q'uo chunks for a natural-language query.
 * For now this uses BM25 full-text on `content`.
 */
const searchRelevantQuo = async (queryText, size = 5) => {
  if (!queryText || !queryText.trim()) {
    throw new Error('Query text is required');
  }

  const body = {
    query: {
      multi_match: {
        query: queryText,
        fields: ['content'],
        type: 'best_fields',
      },
    },
  };

  const resp = await client.search({
    index: ELASTICSEARCH_INDEX,
    size,
    body,
  });

  const hits = resp.hits?.hits || [];

  return hits.map((hit) => ({
    score: hit._score,
    content: hit._source.content,
    session_date: hit._source.session_date,
    title: hit._source.title,
    source: hit._source.source,
    chunk_index: hit._source.chunk_index,
  }));
};

/**
 * CLI entrypoint
 * Usage:
 *   node searchQuoRelevant.js "What is the significance of the challenge procedure?"
 */
const main = async () => {
  const queryText = process.argv.slice(2).join(' ');

  if (!queryText) {
    console.error(
      'Usage: node searchQuoRelevant.js "your question about Confederation teachings"'
    );
    process.exit(1);
  }

  console.log(`[search] Query: ${queryText}`);
  console.log(
    `[search] ES node=${ELASTICSEARCH_NODE}, index=${ELASTICSEARCH_INDEX}`
  );

  try {
    const results = await searchRelevantQuo(queryText, 5);

    if (!results.length) {
      console.log('[search] No hits.');
      return;
    }

    results.forEach((r, i) => {
      const preview =
        r.content.length > 260 ? r.content.slice(0, 260) + '…' : r.content;

      console.log('\n────────────────────────────────────────────');
      console.log(`#${i + 1}  score=${r.score.toFixed(2)}`);
      console.log(`date:   ${r.session_date}  |  source: ${r.source}`);
      console.log(`title:  ${r.title}`);
      console.log('----- excerpt -----');
      console.log(preview);
    });

    console.log('\n[search] Done.');
  } catch (err) {
    console.error('[search] ERROR:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

// If you want to import it from another script later:
// module.exports = { searchRelevantQuo };
