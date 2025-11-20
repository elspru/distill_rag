// tests/smoke.test.js
const { Client } = require("@elastic/elasticsearch");
const fetch = require("node-fetch");

const ES_NODE =
  process.env.ES_NODE ||
  process.env.ELASTICSEARCH_NODE ||
  "http://localhost:9200";

const ES_INDEX =
  process.env.ES_INDEX ||
  process.env.ELASTICSEARCH_INDEX ||
  "quo_distill_index";

const client = new Client({ node: ES_NODE });

describe("Smoke Test", () => {
  test("ES cluster reachable", async () => {
    const health = await client.cluster.health();
    const status = health.status || (health.body && health.body.status);
    expect(["green", "yellow"]).toContain(status);
  });

  test("Index exists", async () => {
    const exists = await client.indices.exists({ index: ES_INDEX });
    const existsBool =
      typeof exists === "boolean" ? exists : (exists.body ?? exists);
    expect(existsBool).toBe(true);
  });

  test("Embedding API live", async () => {
    const resp = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mxbai-embed-large",
        prompt: "ping",
      }),
    });
    expect(resp.ok).toBe(true);
  });
});
