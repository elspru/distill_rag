import { Client } from 'elasticsearch';

const client = new Client({
  node: process.env.ES_HOST || 'http://localhost:9200',
});

async function createIndex() {
  try {
    // Check if index exists
    const { body: existsBody } = await client.indices.exists({ index: 'text-index' });
    if (existsBody.indices[0]) {
      console.log('Index already exists.');
      return;
    }

    // Create the index with mapping
    const mapping = {
      properties: {
        title: { type: 'keyword' },
        content: { type: 'text' },
        embedding: { 
          type: 'dense_vector', 
          dims: 100,
          index: true
        }
      }
    };

    await client.indices.create({
      index: 'text-index',
      body: {
        mappings: mapping
      }
    });

    console.log('Index created successfully.');
  } catch (error) {
    console.error('Error creating index:', error);
  }
}

createIndex();
