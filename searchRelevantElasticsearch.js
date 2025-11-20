// searchRelevantElasticsearch.js
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

// Load environment variables
const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE;
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX;

// Elasticsearch client configuration
const client = new Client({ node: ELASTICSEARCH_NODE });

// Function to search for the most relevant document in Elasticsearch
async function searchElasticsearch(query) {
  try {
    // Search for documents in Elasticsearch
    const response = await client.search({
      index: ELASTICSEARCH_INDEX,
      body: {
        query: {
          match: {
            content: query,
          },
        },
        size: 1, // Return only the most relevant result
        highlight: {
          fields: {
            content: {},
          },
        },
      },
    });

    // Check if the response structure is as expected
    if (!response.body || !response.body.hits || !response.body.hits.hits) {
      console.error('Unexpected response structure from Elasticsearch:', JSON.stringify(response.body, null, 2));
      return;
    }

    // Extract the most relevant result
    const hits = response.body.hits.hits;
    if (hits.length > 0) {
      const mostRelevantResult = hits[0];
      console.log('Most relevant result:');
      console.log('ID:', mostRelevantResult._id);
      console.log('Score:', mostRelevantResult._score);
      console.log('Content:', mostRelevantResult.highlight ? mostRelevantResult.highlight.content.join(' ') : mostRelevantResult._source.content);
      console.log('File Path:', mostRelevantResult._source.filePath);
      console.log('Hostname:', mostRelevantResult._source.hostname);
      console.log('Date:', mostRelevantResult._source.date);
    } else {
      console.log('No results found.');
    }
  } catch (error) {
    console.error('Error searching in Elasticsearch:', error);
  }
}

// Check if a search query is provided as a command-line argument
if (process.argv.length < 3) {
  console.error('Usage: node searchRelevantElasticsearch.js <search_query>');
  process.exit(1);
}

// Get the search query from the command-line argument
const query = process.argv[2];

// Search for the most relevant document in Elasticsearch
searchElasticsearch(query);
