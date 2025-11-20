// tests/chunker.test.js
const { chunkContent } = require("../indexing/index_distill_chunks.js");

describe("Chunker", () => {
  test("Returns a non-empty chunk and preserves content", () => {
    const input = `
A

B

C

D
`;

    const chunks = chunkContent(input);

    // With current CONFIG (CHUNK_MAX=9000, CHUNK_MIN=5000),
    // short inputs will always be a single chunk.
    expect(chunks.length).toBe(1);
    expect(typeof chunks[0]).toBe("string");
    expect(chunks[0]).toContain("A");
    expect(chunks[0]).toContain("D");
  });
});
