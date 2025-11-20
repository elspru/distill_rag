// es/rebuild_distill_index.js
//
// Deletes and recreates the distillation index
// using es/mapping.json.
//
// Usage:
//   node es/rebuild_distill_index.js

require("dotenv").config();
const { Client } = require("@elastic/elasticsearch");
const fs = require("fs");
const path = require("path");

const ES_NODE = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";
const INDEX = process.env.ES_DISTILL_INDEX || "quo_distill_index";

const client = new Client({ node: ES_NODE });

async function run() {
  console.log(`🔨 Rebuilding index: ${INDEX}`);

  // delete if exists
  try {
    await client.indices.delete({ index: INDEX });
    console.log("🗑 Deleted old index");
  } catch (err) {
    console.log("ℹ No previous index to delete");
  }

  // load mapping
  const mappingPath = path.join(__dirname, "mapping.json");
  const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

  // create index
  await client.indices.create({
    index: INDEX,
    body: mapping
  });

  console.log(`🎉 Created new index: ${INDEX}`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
