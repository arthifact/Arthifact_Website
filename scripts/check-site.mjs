import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";
import { verifyPonyoGallery } from "./check-ponyo-gallery.mjs";

const root = path.resolve("dist");
assert(fs.existsSync(root), "Build the site before running verification.");
function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(full) : [full];
  });
}
const pages = filesIn(root).filter((file) => file.endsWith(".html"));
const errors = [];
function check(condition, message) {
  if (!condition) errors.push(message);
}
function resolveTarget(url, pageFile) {
  const relativePage =
    "/" + path.relative(root, pageFile).split(path.sep).join("/");
  const target = new URL(
    url.replaceAll("&amp;", "&"),
    "https://arthifact.com" + relativePage,
  );
  if (target.origin !== "https://arthifact.com") return undefined;
  const file = path.join(root, decodeURIComponent(target.pathname));
  const candidates = [file, path.join(file, "index.html")];
  return {
    file: candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile()),
    hash: target.hash,
  };
}
for (const file of pages) {
  const page = path.relative(root, file);
  const html = fs.readFileSync(file, "utf8");
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  check(
    (markup.match(/<h1\b/g) || []).length === 1,
    `${page}: expected exactly one main heading`,
  );
  check(/<html[^>]+lang=/.test(markup), `${page}: missing document language`);
  check(
    /<meta[^>]+name="description"/.test(markup),
    `${page}: missing description`,
  );
  const hasMath = /class="[^"]*\bkatex\b/.test(markup);
  check(
    hasMath === markup.includes("data-math-styles"),
    `${page}: math styles must load only when the page contains equations`,
  );
  check(
    !markup.includes('class="katex-error"'),
    `${page}: invalid LaTeX equation`,
  );
  if (hasMath) {
    check(
      /<math\b[^>]+xmlns="http:\/\/www.w3.org\/1998\/Math\/MathML"/.test(
        markup,
      ) && markup.includes('class="katex-html" aria-hidden="true"'),
      `${page}: equations must include MathML and hide duplicate visual markup from assistive tools`,
    );
  }
  if (/class="[^"]*\bpaper\b/.test(markup)) {
    check(
      !markup.includes("article-toc") && !markup.includes("On this page"),
      `${page}: paper layout must not include a table-of-contents sidebar`,
    );
    check(
      markup.includes("data-paper-styles"),
      `${page}: missing article typography`,
    );
  }
  for (const match of markup.matchAll(/<(a|img|link|script)\b[^>]*>/g)) {
    const tag = match[0];
    const url = tag.match(/\b(?:href|src)="([^"]+)"/)?.[1];
    if (match[1] === "img") {
      check(
        /\balt(?:=|\s|>)/.test(tag),
        `${page}: image needs alternative text`,
      );
      check(
        /\bwidth=/.test(tag) && /\bheight=/.test(tag),
        `${page}: image dimensions must reserve space`,
      );
    }
    if (!url || /^(mailto:|tel:|data:|javascript:)/.test(url)) continue;
    const target = resolveTarget(url, file);
    if (!target) continue;
    check(!!target.file, `${page}: broken local link ${url}`);
    if (target.file && target.hash && target.file.endsWith(".html")) {
      const body = fs.readFileSync(target.file, "utf8");
      const id = decodeURIComponent(target.hash.slice(1));
      check(body.includes(`id="${id}"`), `${page}: missing anchor ${url}`);
    }
  }
}
const mainPages = [
  "index.html",
  "research/index.html",
  "projects/index.html",
  "art/index.html",
  "blog/index.html",
  "about/index.html",
];
for (const page of mainPages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || [];
  check(
    page === "index.html"
      ? scripts.length === 1 &&
          /data-ponyo-randomizer/.test(scripts[0]) &&
          !/\bsrc=/.test(scripts[0].split(">")[0])
      : scripts.length === 0,
    `${page}: only the homepage's inline still chooser may use a client script`,
  );
  check(
    !/<iframe\b/.test(html),
    `${page}: core pages must not embed third-party players`,
  );
  check(
    !/<(?:img|script)[^>]+src="https?:/.test(html),
    `${page}: core page assets must be local`,
  );
  check(
    !html.includes("data-paper-styles"),
    `${page}: article fonts must not load on index pages`,
  );
  const kb = gzipSync(html).length / 1024;
  check(
    kb < 24,
    `${page}: HTML exceeds the 24 KiB gzip budget (${kb.toFixed(1)} KiB)`,
  );
}
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
check(
  (home.match(/class="work-card"/g) || []).length === 6,
  "Homepage must show six selected works.",
);
check(
  home.includes("/projects/article-exploring-dmesh/"),
  "Homepage must include the DMesh++ research essay.",
);
const feed = fs.readFileSync(path.join(root, "rss.xml"), "utf8");
check(
  feed.includes("DMesh++") && feed.includes("earth_layers"),
  "RSS must include the writing shown in the blog.",
);
check(
  !feed.includes("markdown-elements") && !feed.includes("paper-example"),
  "The layout samples must stay out of RSS.",
);
const example = fs.readFileSync(
  path.join(root, "posts/paper-example/index.html"),
  "utf8",
);
check(
  example.includes('content="noindex, follow"') &&
    example.includes("data-pagefind-ignore"),
  "Paper example must remain unlisted and excluded from search.",
);
check(
  (example.match(/class="section-number"/g) || []).length === 5,
  "Paper example must have five numbered sections, without numbering footnotes.",
);
check(
  (example.match(/<figcaption id="(?:fig|table)-[^\"]+"/g) || []).length === 4,
  "Paper example needs three figure captions and one table caption.",
);
check(
  example.includes('aria-labelledby="table-errors-caption"') &&
    example.includes('scope="col"'),
  "Paper table must retain native headers and a labelled scroll region.",
);
check(
  example.includes("data-math-styles") && example.includes("expressive-code"),
  "Paper example must demonstrate math and highlighted code.",
);
check(
  example.includes("srcset=") && example.includes("paper-wide"),
  "Paper example must demonstrate responsive images and wide figures.",
);
check(
  example.includes("paper-columned") &&
    (example.match(/class="paper-columns"/g) || []).length === 2,
  "Paper example must have one continuous column pair per sheet.",
);
check(
  !example.includes("paper-figure-side") &&
    example.includes("figure-grid-lead"),
  "Paper example must keep captions below figures and retain the paired image composition.",
);
check(
  (example.match(/class="paper-page"/g) || []).length === 2 &&
    example.includes('aria-label="Page 2 of 2"') &&
    !example.includes("data-paper-break"),
  "Paper example must have two labelled sheets with consumed page breaks.",
);
const exampleHeadings = [];
visit(fromHtml(example), "element", (node) => {
  if (node.tagName === "h2") exampleHeadings.push(node.properties.id);
  if (node.properties.className?.includes("paper-page")) {
    let flows = 0;
    visit(node, "element", (child) => {
      if (child.properties.className?.includes("paper-columns")) flows++;
    });
    check(
      flows === 1,
      "Each example sheet must have one continuous left-to-right column flow.",
    );
  }
  if (node.properties.className?.includes("paper-columns")) {
    let headings = 0;
    visit(node, "element", (child) => {
      if (child.tagName === "h2") headings++;
      check(
        !child.properties.className?.includes("paper-wide"),
        "Wide figures must sit outside the text column flow.",
      );
    });
    check(
      headings >= 2,
      "Successive sections must share the same column flow.",
    );
  }
  if (!node.properties.className?.includes("figure-grid")) return;
  visit(node, "element", (child) => {
    check(
      !/^h[1-6]$/.test(child.tagName),
      "The example must pair images without introducing competing text sections.",
    );
  });
});
check(
  exampleHeadings.join(",") ===
    "introduction,method,results,code,writing-a-paper,footnote-label" &&
    example.indexOf('id="table-errors"') < example.indexOf('id="code"'),
  "The example must preserve the authored section order and place the results table before code.",
);
check(
  gzipSync(example).length < 12 * 1024,
  "Paper example must stay below 12 KiB of compressed HTML.",
);
const exampleScripts = [
  ...example.matchAll(/<script\b[^>]+src="([^"]+)"[^>]*>/g),
];
check(
  exampleScripts.length <= 1,
  "Paper example may use only the small code accessibility helper.",
);
for (const script of exampleScripts) {
  const file = resolveTarget(
    script[1],
    path.join(root, "posts/paper-example/index.html"),
  )?.file;
  check(
    !!file && gzipSync(fs.readFileSync(file)).length < 1024,
    "Paper example's accessibility helper must stay below 1 KiB compressed.",
  );
}
const paperCssHref = example.match(
  /<link[^>]+href="([^"]+)"[^>]+data-paper-styles/,
)?.[1];
const paperCssPath =
  paperCssHref &&
  resolveTarget(paperCssHref, path.join(root, "posts/paper-example/index.html"))
    ?.file;
check(!!paperCssPath, "Article typography stylesheet must be local.");
if (paperCssPath) {
  const css = fs.readFileSync(paperCssPath, "utf8");
  check(
    css.includes("STIX Two Text") && css.includes("font-display:swap"),
    "Article serif fonts must load with font swapping.",
  );
  for (const match of css.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/g)) {
    check(
      !!resolveTarget(match[1], paperCssPath)?.file,
      `Missing article font: ${match[1]}`,
    );
  }
}
const sitemap = fs.readFileSync(path.join(root, "sitemap-0.xml"), "utf8");
check(
  !sitemap.includes("paper-example"),
  "Paper example must stay out of the sitemap.",
);
check(
  fs
    .readFileSync(path.join(root, "blog/index.html"), "utf8")
    .includes("/posts/paper-example/"),
  "Blog must link directly to the paper example.",
);
check(
  fs.existsSync(path.join(root, "files/Gabriel_Isaac_Alonso_Serrato_CV.pdf")),
  "CV must remain available.",
);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const chooserKiB = verifyPonyoGallery(home, root);
console.log(
  `Verified ${pages.length} pages: local links and anchors, image dimensions, main headings, RSS, CV, script-free navigation, and HTML budgets.`,
);
console.log(
  `Homepage HTML: ${(gzipSync(home).length / 1024).toFixed(1)} KiB gzipped; inline still chooser: ${chooserKiB.toFixed(1)} KiB gzipped.`,
);
console.log(
  "Verified all 50 local stills, random selection, repeat avoidance, disabled-storage handling, and image-error/no-JavaScript fallbacks.",
);
