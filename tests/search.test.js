// tests/search.test.js
const { searchMostRelevant, embedText } = require("../search/search_distill_chunks.js");

describe("Search", () => {
  test("Embeds text", async () => {
    const vec = await embedText("test embedding");
    expect(Array.isArray(vec)).toBe(true);
    expect(vec.length).toBeGreaterThan(0);
  });

  test("Search returns at least one hit", async () => {
    const res = await searchMostRelevant("maturity of the spirit");
    expect(res).not.toBeNull();
    expect(typeof res.content).toBe("string");
  });
});
