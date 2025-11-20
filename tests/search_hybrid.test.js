// tests/search_hybrid.test.js
require("dotenv").config();
const {
  searchBM25,
  searchVector,
  searchHybrid,
} = require("../search/search_distill_chunks");
const fs = require("fs");

describe("Hybrid + Vector Search", () => {
  test("BM25 returns at least one result", async () => {
    const results = await searchBM25("love", 3);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  test("Vector search returns at least one result", async () => {
    const results = await searchVector("service to others", 3);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  test("Hybrid search returns fused sorted results", async () => {
    const results = await searchHybrid("spiritual seeking", 5);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    // Make sure there's no undefined objects
    results.forEach((r) => {
      expect(r).toBeTruthy();
      expect(typeof r.content).toBe("string");
    });
  });
});
