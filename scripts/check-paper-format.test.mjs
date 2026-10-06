import assert from "node:assert/strict";
import test from "node:test";
import { formatPaper } from "../src/utils/paper.ts";

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
