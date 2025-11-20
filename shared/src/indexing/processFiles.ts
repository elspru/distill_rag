import { Client } from 'elasticsearch';
import * as fs from 'fs-extra';
import path from 'path';

const client = new Client({
  node: process.env.ES_HOST || 'http://localhost:9200',
});

async function processFiles(baseDir: string) {
  try {
    const files = await fs.readdirSync(baseDir);

    for (const file of files) {
      const filePath = path.join(baseDir, file);
      if (!fs.existsSync(filePath)) continue;

      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // Process subdirectories recursively
        await processFiles(filePath);
      } else {
        // Process the file here (e.g., generate embeddings and index)
        console.log('Processing file:', filePath);
        // Add your embedding generation logic here
      }
    }

  } catch (error) {
    console.error('Error processing files:', error);
  }
}

processFiles('/path/to/your/text/files');
