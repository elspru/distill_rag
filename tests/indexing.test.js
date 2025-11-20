// tests/indexing.test.js
const { Client } = require("@elastic/elasticsearch");
const { execSync } = require("child_process");

const ES_NODE =
  process.env.ES_NODE ||
  process.env.ELASTICSEARCH_NODE ||
  "http://localhost:9200";

const ES_INDEX =
  process.env.ES_INDEX ||
  process.env.ELASTICSEARCH_INDEX ||
  "quo_distill_index";

const client = new Client({ node: ES_NODE });

describe("Indexing", () => {
  test("Indexes 1 test session", async () => {
    // Re-index test data into quo_distill_index
    execSync("JSON_DIR=tests/data node indexing/index_distill_chunks.js", {
      stdio: "inherit",
    });

    const res = await client.search({
      index: ES_INDEX,
      query: { match_all: {} },
      size: 1,
    });

    const hitsContainer = res.hits || (res.body && res.body.hits);
    expect(hitsContainer.total.value).toBeGreaterThan(0);
  });
});
