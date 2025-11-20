// addFileToElasticsearch.js
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

// Function to add a file to Elasticsearch
async function addFileToElasticsearch(filePath) {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Get metadata
    const filePathMetadata = path.resolve(filePath);
    const hostname = os.hostname();
    const date = new Date().toISOString();

    // Prepare the document to be indexed
    const document = {
      content: fileContent,
      filePath: filePathMetadata,
      hostname: hostname,
      date: date,
    };

    // Index the document in Elasticsearch
    const response = await client.index({
      index: ELASTICSEARCH_INDEX,
      body: document,
    });

    console.log('File added to Elasticsearch:', JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.error('Error adding file to Elasticsearch:', error);
  }
}

// Check if a file path is provided as a command-line argument
if (process.argv.length < 3) {
  console.error('Usage: node addFileToElasticsearch.js <file_path>');
  process.exit(1);
}

// Get the file path from the command-line argument
const filePath = process.argv[2];

// Add the file to Elasticsearch
addFileToElasticsearch(filePath);
