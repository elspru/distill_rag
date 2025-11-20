const fs = require("fs");
const path = require("path");
const { convertDir } = require("../../data_extraction/convert_raw_to_sessions");

describe("convert_raw_to_sessions", () => {
  const rawDir = path.join(__dirname, "raw_data");
  const outDir = path.join(__dirname, "out_data");

  beforeAll(() => {
    fs.mkdirSync(rawDir, { recursive: true });

    fs.writeFileSync(
      path.join(rawDir, "example.html"),
      `
        <h1>Q: How do I serve?</h1>
        <p>A: Begin with kindness.</p>
      `
    );
  });

  afterAll(() => {
    fs.rmSync(rawDir, { recursive: true });
    fs.rmSync(outDir, { recursive: true });
  });

  test("converts raw HTML to JSON session", () => {
    convertDir(rawDir, outDir);

    const outFile = path.join(outDir, "example.json");
    expect(fs.existsSync(outFile)).toBe(true);

    const session = JSON.parse(fs.readFileSync(outFile, "utf8"));

    expect(session.title).toBe("example.html");
    expect(session.turns.length).toBe(2);
    expect(session.turns[0].role).toBe("user");
  });
});
