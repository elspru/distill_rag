const { cleanHTML } = require("../../data_extraction/clean_html");

describe("cleanHTML", () => {
  test("removes scripts, styles, headers, footers, ads", () => {
    const html = `
      <html>
        <head><style>.x{}</style></head>
        <body>
          <header>HEADER</header>
          <script>alert("x")</script>
          <div class="ads">Buy NOW</div>
          <p>Hello world</p>
          <footer>FOOTER</footer>
        </body>
      </html>
    `;

    const out = cleanHTML(html);

    expect(out).toContain("Hello world");
    expect(out).not.toMatch(/HEADER|FOOTER|Buy NOW|alert/);
  });

  test("collapses whitespace", () => {
    const html = `<p>Text</p>\n\n<p>More</p>`;
    const out = cleanHTML(html);
    expect(out).toBe("Text More");
  });
});
