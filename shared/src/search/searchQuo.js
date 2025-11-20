// src/search/searchQuo.js
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

const ELASTICSEARCH_NODE =
  process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const ELASTICSEARCH_INDEX =
  process.env.ELASTICSEARCH_INDEX || 'quo_index';

const client = new Client({ node: ELASTICSEARCH_NODE });

/**
 * Search top-N relevant Q'uo chunks for a question.
 */
async function searchQuoRelevant(question, size = 6) {
  const resp = await client.search({
    index: ELASTICSEARCH_INDEX,
    size,
    body: {
      query: {
        multi_match: {
          query: question,
          fields: ['content'],
          type: 'best_fields'
        }
      }
    }
  });

  return resp.hits.hits.map(h => ({
    score: h._score,
    content: h._source.content,
    date: h._source.session_date,
    title: h._source.title,
    source: h._source.source,
    chunk_index: h._source.chunk_index,
  }));
}

module.exports = { searchQuoRelevant };
