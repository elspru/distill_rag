// searchElasticsearch.js
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

// Load environment variables
const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE;
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX;

// Elasticsearch client configuration
const client = new Client({ node: ELASTICSEARCH_NODE });

// Function to search for documents in Elasticsearch
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
      },
    });

    console.log('Search results:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error searching in Elasticsearch:', error);
  }
}

// Check if a search query is provided as a command-line argument
if (process.argv.length < 3) {
  console.error('Usage: node searchElasticsearch.js <search_query>');
  process.exit(1);
}

// Get the search query from the command-line argument
const query = process.argv[2];

// Search for documents in Elasticsearch
searchElasticsearch(query);
