require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

// Configuration for the Elasticsearch client using environment variables
const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  }
});

async function run() {
  try {
    // Check if the client is connected
    const { body } = await client.ping();
    console.log('Elasticsearch is running:', body);

    // Define an index and a document to be indexed
    const indexName = 'test-index';
    const doc = {
      name: 'John Doe',
      age: 30,
      email: 'john.doe@example.com'
    };

    // Index the document
    const indexResponse = await client.index({
      index: indexName,
      body: doc,
      refresh: true // Refresh to make the indexed document immediately searchable
    });
    console.log('Document indexed with id:', indexResponse.body._id);

    // Search for documents in the index
    const searchResponse = await client.search({
      index: indexName,
      q: 'name:John Doe'
    });
    console.log('Search results:', searchResponse.body.hits.hits);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
