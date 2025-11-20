const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

describe("walk_and_extract CLI", () => {
  const cli = path.resolve(__dirname, "../../data_extraction/walk_and_extract.js");
  const rawDir = path.join(__dirname, "raw_cli");
  const outDir = path.join(__dirname, "out_cli");

  beforeAll(() => {
    fs.mkdirSync(rawDir, { recursive: true });
    fs.writeFileSync(
      path.join(rawDir, "file1.html"),
      `
        <h1>Q: What is love?</h1>
        <p>A: Love is unity.</p>
      `
    );
  });

  afterAll(() => {
    fs.rmSync(rawDir, { recursive: true });
    fs.rmSync(outDir, { recursive: true });
  });

  test("prints usage with no args", () => {
    const output = execSync(`node ${cli}`, { encoding: "utf8" });
    expect(output).toMatch(/Usage:/);
  });

  test("extracts files when given args", () => {
    execSync(`node ${cli} ${rawDir} ${outDir}`);

    const outFile = path.join(outDir, "file1.json");
    expect(fs.existsSync(outFile)).toBe(true);

    const json = JSON.parse(fs.readFileSync(outFile, "utf8"));
    expect(json.turns.length).toBeGreaterThan(0);
  });
});
