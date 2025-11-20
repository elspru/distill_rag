// addChunkedFileToElasticsearch.js
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load environment variables
const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE;
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX;

// Elasticsearch client configuration
const client = new Client({ node: ELASTICSEARCH_NODE });

// Function to chunk the file content with overlap
function chunkContent(content, chunkSize, overlap) {
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize - overlap) {
    const chunk = content.substring(i, Math.min(i + chunkSize, content.length));
    chunks.push(chunk);
  }
  return chunks;
}

// Function to add a chunked file to Elasticsearch
async function addChunkedFileToElasticsearch(filePath) {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Get metadata
    const filePathMetadata = path.resolve(filePath);
    const hostname = os.hostname();
    const date = new Date().toISOString();

    // Chunk the file content with overlap
    const chunkSize = 500; // Adjust chunk size as needed
    const overlap = 100; // 100-character overlap
    const chunks = chunkContent(fileContent, chunkSize, overlap);

    // Index each chunk in Elasticsearch
    for (let i = 0; i < chunks.length; i++) {
      const response = await client.index({
        index: ELASTICSEARCH_INDEX,
        body: {
          content: chunks[i],
          filePath: filePathMetadata,
          hostname: hostname,
          date: date,
          chunkIndex: i,
        },
      });

      console.log(`Chunk ${i + 1} added to Elasticsearch:`, JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.error('Error adding chunked file to Elasticsearch:', error);
  }
}

// Check if a file path is provided as a command-line argument
if (process.argv.length < 3) {
  console.error('Usage: node addChunkedFileToElasticsearch.js <file_path>');
  process.exit(1);
}

// Get the file path from the command-line argument
const filePath = process.argv[2];

// Add the chunked file to Elasticsearch
addChunkedFileToElasticsearch(filePath);
