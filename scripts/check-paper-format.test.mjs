import assert from "node:assert/strict";
import test from "node:test";
import { formatPaper, formatPaperPages } from "../src/utils/paper.ts";
import { fromHtml } from "hast-util-from-html";

test("section numbers are readable text and preserve heading anchors", () => {
  const result = formatPaper(
    '<h2 id="method"><a href="#method">Method</a></h2><h3>Detail</h3><h2 id="results">Results</h2><h2 id="footnote-label">Footnotes</h2>',
    true,
  );
  assert.match(
    result,
    /class="section-number">1\. <\/span><a href="#method">Method/,
  );
  assert.match(result, /class="section-number">2\. <\/span>Results/);
  assert.doesNotMatch(result, /3\. /);
  assert.doesNotMatch(formatPaper("<h2>Method</h2>"), /section-number/);
});

test("table scrolling has an accessible caption and native column headers", () => {
  const result = formatPaper(
    '<figure><figcaption id="table-1-caption">Table 1. Errors</figcaption><table><thead><tr><th>Error</th></tr></thead><tbody><tr><td>0.2</td></tr></tbody></table></figure>',
  );
  assert.match(
    result,
    /role="region" tabindex="0" aria-labelledby="table-1-caption"/,
  );
  assert.match(result, /<th scope="col">Error<\/th>/);
  assert.equal((result.match(/paper-table-scroll/g) ?? []).length, 1);
  assert.equal(formatPaper(result), result);
});

test("plain tables get labels and MathML, Unicode, and code remain intact", () => {
  const result = formatPaper(
    '<p>λ &amp; shape</p><table><tbody><tr><td>x</td></tr></tbody></table><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math><pre><code>a &lt; b</code></pre>',
  );
  assert.match(result, /aria-label="Table 1"/);
  assert.match(result, /λ/);
  assert.match(
    result,
    /<math xmlns="http:\/\/www.w3.org\/1998\/Math\/MathML"><mi>x<\/mi><\/math>/,
  );
  assert.match(result, /<code>a &#x3C; b<\/code>/);
});

test("headings, equations, code, and tables continue within the same page columns", () => {
  const source =
    '<figure class="paper-wide" id="wide">Wide figure</figure><h2 id="intro">Introduction</h2><p id="a">First paragraph.</p><p id="b">Second paragraph.</p><h2 id="method">Method</h2><p id="c">Method text.</p><span class="katex-display" id="equation"><math><mi>x</mi></math></span><figure class="paper-table" id="table"><table><thead><tr><th>Error</th></tr></thead></table></figure><figure class="paper-figure" id="inline">Inline figure</figure><div class="expressive-code" id="code">Code</div><section class="footnotes" id="footnotes">Footnotes</section>';
  const tree = fromHtml(formatPaper(source, true, 2), { fragment: true });
  const elements = tree.children.filter((node) => node.type === "element");
  assert.deepEqual(
    elements.map((node) => node.tagName),
    ["figure", "div"],
  );
  assert.deepEqual(
    elements[1].children.map((node) => node.properties.id),
    [
      "intro",
      "a",
      "b",
      "method",
      "c",
      "equation",
      "table",
      "inline",
      "code",
      "footnotes",
    ],
  );
  assert.equal(elements[0].properties.id, "wide");
  assert.match(formatPaper(source, true, 2), /scope="col"/);
  assert.doesNotMatch(formatPaper(source, false, 1), /paper-columns/);
});

test("the single-column option keeps prose and equations in their authored sequence", () => {
  const result = formatPaper(
    '<h2 id="method">Method</h2><p id="before">Define the model.</p><span class="katex-display" id="equation"><math><mi>x</mi></math></span><p id="after">Explain the equation.</p><figure id="figure">Result</figure><h2 id="results">Results</h2><p id="conclusion">Discuss the result.</p>',
    true,
  );
  const tree = fromHtml(result, { fragment: true });
  assert.deepEqual(
    tree.children.map((node) => node.properties.id),
    [
      "method",
      "before",
      "equation",
      "after",
      "figure",
      "results",
      "conclusion",
    ],
  );
  assert.doesNotMatch(result, /paper-columns/);
  assert.match(result, /<math><mi>x<\/mi><\/math>/);
});

test("authored sheets keep numbering and references continuous without empty pages", () => {
  const pages = formatPaperPages(
    '<div data-paper-break></div><h2 id="method">Method</h2><p><a href="#result">See the result.</a></p><div data-paper-break></div>\n<!-- author note --><div data-paper-break></div><h2 id="result">Results</h2><div data-paper-break></div>',
    true,
    2,
  );
  assert.equal(pages.length, 2);
  assert.match(pages[0], /1\. <\/span>Method/);
  assert.match(pages[0], /href="#result"/);
  assert.match(pages[1], /id="result"/);
  assert.match(pages[1], /2\. <\/span>Results/);
  assert(pages.every((page) => !page.includes("data-paper-break")));
  assert(pages.every((page) => !page.includes("author note")));
  assert.equal(formatPaperPages("<p>A short article.</p>").length, 1);
  assert.deepEqual(formatPaperPages(""), [""]);
});

test("Markdown images stay in one column without restarting the text flow", () => {
  const tree = fromHtml(
    formatPaper(
      '<p>Before.</p><p><a href="/image.png"><img src="/image.png" alt="Plot" width="800" height="400"></a></p><p>After.</p>',
      false,
      2,
    ),
    { fragment: true },
  );
  assert.deepEqual(
    tree.children.map((node) => node.tagName),
    ["div"],
  );
  assert.match(tree.children[0].children[0].children[0].value, /Before/);
  assert.equal(
    tree.children[0].children[1].children[0].children[0].tagName,
    "img",
  );
  assert.match(tree.children[0].children[2].children[0].value, /After/);
  assert.throws(
    () => formatPaperPages("<figure><div data-paper-break></div></figure>"),
    /outside figures/,
  );
});

test("wide figures, tables, and code float above or below one continuous column flow", () => {
  const source =
    '<h2 id="intro">Intro</h2><p id="a">Text before.</p><figure class="paper-figure paper-wide" id="plot">Plot</figure><p id="b">Text after.</p><figure class="paper-table paper-wide" data-paper-placement="bottom" id="table">Table</figure><div class="paper-block paper-wide" id="listing">Code</div><p id="c">Last paragraph.</p>';
  const tree = fromHtml(formatPaper(source, true, 2), { fragment: true });
  const elements = tree.children.filter((n) => n.type === "element");
  assert.deepEqual(
    elements.map((n) => n.properties.id ?? n.properties.className[0]),
    ["plot", "listing", "paper-columns", "table"],
  );
  assert.deepEqual(
    elements[2].children.map((n) => n.properties.id),
    ["intro", "a", "b", "c"],
  );
  assert.equal(
    (formatPaper(source, true, 2).match(/class="paper-columns"/g) ?? []).length,
    1,
  );
  assert(
    formatPaper(source, true, 1).indexOf('id="intro"') <
      formatPaper(source, true, 1).indexOf('id="plot"'),
  );
});

test("a kept block preserves its heading, listing, links, and accessible math together", () => {
  const result = formatPaper(
    '<p>Before</p><div class="paper-block"><h2 id="code">Code</h2><p>Explanation</p><pre><code>x = 1</code></pre><span class="katex-display"><math><mi>x</mi></math></span><p><a href="#code">Code link</a></p></div><p>After</p>',
    true,
    2,
  );
  const tree = fromHtml(result, { fragment: true });
  const block = tree.children[0].children[1];
  assert.deepEqual(block.properties.className, ["paper-block"]);
  assert.equal(block.children[0].properties.id, "code");
  assert.match(result, /1\. <\/span>Code/);
  assert.match(result, /<code>x = 1<\/code>/);
  assert.match(result, /<math><mi>x<\/mi><\/math>/);
  assert.match(result, /href="#code"/);
});

test("long writing does not restart the page's columns after a word threshold", () => {
  const paragraph = Array.from({ length: 60 }, () => "word").join(" ");
  const source = Array.from(
    { length: 12 },
    (_, index) => `<p id="p${index}">${paragraph}</p>`,
  ).join("");
  const tree = fromHtml(formatPaper(source, false, 2), { fragment: true });
  assert.equal(tree.children.length, 1);
  assert.deepEqual(
    tree.children.flatMap((group) =>
      group.children.map((node) => node.properties.id),
    ),
    Array.from({ length: 12 }, (_, index) => `p${index}`),
  );
});

test("composed panels retain native headings, table labels, and their reading order", () => {
  const result = formatPaper(
    '<h2 id="results">Results</h2><div class="figure-grid paper-wide"><section><h2 id="code">Code</h2><pre><code>x = 1</code></pre></section><section><figure><figcaption id="errors-caption">Errors</figcaption><table><thead><tr><th>Error</th></tr></thead></table></figure><h2 id="writing">Writing</h2></section></div>',
    true,
    2,
  );
  assert.match(result, /1\. <\/span>Results/);
  assert.match(result, /2\. <\/span>Code/);
  assert.match(result, /3\. <\/span>Writing/);
  assert.match(result, /aria-labelledby="errors-caption"/);
  assert.match(result, /scope="col"/);
  assert(result.indexOf('id="code"') < result.indexOf('id="errors-caption"'));
  assert(
    result.indexOf('id="errors-caption"') < result.indexOf('id="writing"'),
  );
  assert.equal((result.match(/class="paper-columns"/g) ?? []).length, 1);
});

test("equation links target the equation itself across column breaks", () => {
  const result = formatPaper(
    '<p><a href="#eq-energy">Energy</a></p><div id="eq-energy"></div>\n<!-- equation --><span class="katex-display"><math><mi>E</mi></math></span>',
    false,
    2,
  );
  assert.match(result, /class="katex-display" id="eq-energy"/);
  assert.match(result, /role="region" tabindex="0" aria-label="Display equation"/);
  assert.match(result, /href="#eq-energy"/);
  assert.equal((result.match(/id="eq-energy"/g) ?? []).length, 1);
  assert.match(result, /<math><mi>E<\/mi><\/math>/);
});

test("nonvisual assets do not create empty column pairs", () => {
  const tree = fromHtml(
    formatPaper(
      '<style>p{color:black}</style><script>void 0</script><figure class="paper-wide">Figure</figure><p>Text</p>',
      false,
      2,
    ),
    { fragment: true },
  );
  assert.deepEqual(
    tree.children.map((node) => node.tagName),
    ["style", "script", "figure", "div"],
  );
  assert.deepEqual(tree.children[3].properties.className, ["paper-columns"]);
});
