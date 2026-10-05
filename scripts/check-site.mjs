import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
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
  if (markup.includes('class="paper"')) {
    check(
      !markup.includes("article-toc") && !markup.includes("On this page"),
      `${page}: paper layout must not include a table-of-contents sidebar`,
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
  !feed.includes("markdown-elements"),
  "The template sample must stay out of RSS.",
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
