import { Client } from 'elasticsearch';
import * as fs from 'fs-extra';
import path from 'path';

const client = new Client({
  node: process.env.ES_HOST || 'http://localhost:9200',
});

async function bulkIndex(baseDir: string) {
  try {
    const documents: Document[] = [];
    const files = await fs.readdirSync(baseDir);

    for (const file of files) {
      const filePath = path.join(baseDir, file);
      if (!fs.existsSync(filePath)) continue;

      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // Process subdirectories recursively
        await bulkIndex(filePath);
      } else {
        // Read the file content
        const content = await fs.readFileSync(filePath, 'utf-8');
        
        // Generate embedding (replace with actual implementation)
        const embedding = Array(100).fill(Math.random());

        // Create document object
        const doc: Document = {
          id: Math.random().toString(),
          content,
          embedding
        };

        documents.push(doc);
      }
    }

    if (documents.length > 0) {
      await client.bulk({
        index: 'text-index',
        body: documents.map(doc => ({
          _index: 'text-index',
          doc
        }))
      });
      
      console.log('Indexed', documents.length, 'documents.');
    }
  } catch (error) {
    console.error('Error indexing files:', error);
  }
}

bulkIndex('/path/to/your/text/files');
