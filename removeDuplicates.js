const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' }); // Adjust your Elasticsearch node URL

async function findAndDeleteDuplicates() {
  const searchTerm = "love for all creation"; // The search query

  try {
    // Step 1: Search for documents
    const { body } = await client.search({
      index: 'file_index', // Replace with your index name
      body: {
        query: {
          match: {
            content: searchTerm
          }
        },
        size: 10000 // Adjust based on the expected number of documents
      }
    });

    // Log the entire response body to check its structure
    console.log('Elasticsearch response:', body);

    if (!body || !body.hits) {
      console.error("No hits found in the response.");
      return;
    }

    // Step 2: Group documents by content
    const contentMap = new Map();

    body.hits.hits.forEach(doc => {
      const content = doc._source.content;

      // If content already exists in the map, add the document id to the list of duplicates
      if (!contentMap.has(content)) {
        contentMap.set(content, [doc._id]);
      } else {
        contentMap.get(content).push(doc._id);
      }
    });

    // Step 3: Identify duplicates and delete all but one
    let deletedCount = 0;

    for (const [content, docIds] of contentMap.entries()) {
      if (docIds.length > 1) {
        // Keep the first document, delete the others
        const [firstDocId, ...duplicateDocIds] = docIds;

        for (const docId of duplicateDocIds) {
          await client.delete({
            index: 'file_index',
            id: docId
          });
          console.log(`Deleted document with ID: ${docId}`);
          deletedCount++;
        }
      }
    }

    console.log(`Deleted ${deletedCount} duplicate(s).`);
  } catch (error) {
    console.error('Error occurred while querying Elasticsearch:', error);
  }
}

findAndDeleteDuplicates().catch(console.error);
