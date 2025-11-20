const fs = require("fs");
const path = require("path");
const { extractFromHTML } = require("../../data_extraction/extractor");

describe("extractor", () => {
  const sampleFile = path.join(__dirname, "sample.html");

  beforeAll(() => {
    fs.writeFileSync(
      sampleFile,
      `
      <h1>Q: What is service?</h1>
      <p>A: Service is love made visible.</p>
    `
    );
  });

  afterAll(() => {
    fs.unlinkSync(sampleFile);
  });

  test("extracts paragraphs and roles", () => {
    const turns = extractFromHTML(sampleFile);

    expect(turns.length).toBe(2);

    expect(turns[0].role).toBe("user");
    expect(turns[0].content).toContain("What is service");

    expect(turns[1].role).toBe("assistant");
    expect(turns[1].content).toContain("love made visible");
  });
});
