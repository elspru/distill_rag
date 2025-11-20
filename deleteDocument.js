const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' }); // Adjust your Elasticsearch node URL

// Get _index and _id from command-line arguments
const [,, index, id] = process.argv;

if (!index || !id) {
  console.error("Please provide both _index and _id as command-line arguments.");
  process.exit(1);
}

async function deleteDocument() {
  try {
    // Step 1: Delete the document
    const response = await client.delete({
      index: index,
      id: id
    });

    // Step 2: Log success message
    console.log(`Document with ID ${id} from index ${index} deleted successfully.`);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error deleting document:', error);
  }
}

deleteDocument().catch(console.error);
