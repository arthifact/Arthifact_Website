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

test("editorial columns preserve reading order around full-width media", () => {
  const source =
    '<h2 id="intro">Introduction</h2><p id="a">First paragraph.</p><p id="b">Second paragraph.</p><figure class="paper-wide" id="wide">Wide figure</figure><h2 id="method">Method</h2><p id="c">Method text.</p><figure class="paper-figure" id="inline">Inline figure</figure><div class="expressive-code" id="code">Code</div><section class="footnotes" id="footnotes">Footnotes</section>';
  const tree = fromHtml(formatPaper(source, true, 2), { fragment: true });
  const elements = tree.children.filter((node) => node.type === "element");
  assert.deepEqual(
    elements.map((node) => node.tagName),
    ["h2", "div", "figure", "h2", "div", "figure", "div", "section"],
  );
  assert.deepEqual(
    elements[1].children.map((node) => node.properties.id),
    ["a", "b"],
  );
  assert.deepEqual(
    elements[4].children.map((node) => node.properties.id),
    ["c"],
  );
  assert.equal(elements[2].properties.id, "wide");
  assert.equal(elements[5].properties.id, "inline");
  assert.equal(elements[6].properties.id, "code");
  assert.equal(elements[7].properties.id, "footnotes");
  assert.doesNotMatch(formatPaper(source, false, 1), /paper-columns/);
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

test("figures and Markdown images span columns while retaining source order", () => {
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
    ["div", "p", "div"],
  );
  assert.match(tree.children[0].children[0].children[0].value, /Before/);
  assert.match(tree.children[2].children[0].children[0].value, /After/);
  assert.throws(
    () => formatPaperPages("<figure><div data-paper-break></div></figure>"),
    /outside figures/,
  );
});

test("long unsectioned writing reads in successive column pairs without duplicating content", () => {
  const paragraph = Array.from({ length: 60 }, () => "word").join(" ");
  const source = Array.from(
    { length: 12 },
    (_, index) => `<p id="p${index}">${paragraph}</p>`,
  ).join("");
  const tree = fromHtml(formatPaper(source, false, 2), { fragment: true });
  assert(
    tree.children.length > 1,
    "A long essay should not form one tall column pair.",
  );
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
  assert.doesNotMatch(result, /paper-columns/);
});
