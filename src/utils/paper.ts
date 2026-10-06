import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import { SKIP, visit } from "unist-util-visit";
import type { Element, Root, RootContent } from "hast";

function classes(node: RootContent): string[] {
  return node.type === "element" && Array.isArray(node.properties.className)
    ? node.properties.className.map(String)
    : [];
}

function textLength(node: RootContent): number {
  if (node.type === "text")
    return node.value.trim().split(/\s+/).filter(Boolean).length;
  if (node.type !== "element") return 0;
  // Count an equation as a block, without counting its duplicate visual/MathML text.
  if (classes(node).includes("katex-display")) return 60;
  if (classes(node).includes("katex")) return 3;
  return node.children.reduce((sum, child) => sum + textLength(child), 0);
}

function fullWidth(node: RootContent): boolean {
  if (node.type !== "element") return false;
  return (
    ["pre", "iframe", "video", "style", "script"].includes(node.tagName) ||
    classes(node).some((name) =>
      [
        "paper-wide",
        "expressive-code",
        "paper-table",
        "paper-table-scroll",
        "footnotes",
        "interactive-model",
      ].includes(name),
    )
  );
}

/** Keep each column pair short and preserve the source's reading and keyboard order. */
function arrangeColumns(tree: Root): void {
  const output: RootContent[] = [];
  let flow: RootContent[] = [];
  let words = 0;
  const flush = () => {
    if (
      !flow.some(
        (node) =>
          node.type === "element" ||
          (node.type === "text" && node.value.trim()),
      )
    ) {
      flow = [];
      words = 0;
      return;
    }
    output.push({
      type: "element",
      tagName: "div",
      properties: { className: ["paper-columns"] },
      children: flow as Element["children"],
    });
    flow = [];
    words = 0;
  };
  for (const node of tree.children) {
    const heading = node.type === "element" && node.tagName === "h2";
    if (heading || fullWidth(node)) {
      flush();
      output.push(node);
      continue;
    }
    // A long unsectioned essay should still read in successive column pairs.
    if (
      words > 480 &&
      node.type === "element" &&
      node.tagName === "p" &&
      textLength(node) > 40
    )
      flush();
    flow.push(node);
    words += textLength(node);
  }
  flush();
  tree.children = output;
}

/** Add readable section numbers and keyboard access to native HTML tables at build time. */
export function formatPaper(
  html: string,
  numberedSections = false,
  columns: 1 | 2 = 1,
): string {
  const tree = fromHtml(html, { fragment: true });
  let section = 0;
  let table = 0;
  visit(tree, "element", (node, index, parent) => {
    if (
      numberedSections &&
      node.tagName === "h2" &&
      !String(node.properties.id ?? "").includes("footnote-label")
    ) {
      node.children.unshift({
        type: "element",
        tagName: "span",
        properties: { className: ["section-number"] },
        children: [{ type: "text", value: `${++section}. ` }],
      });
    }
    if (node.tagName !== "table" || index === undefined || !parent) return;
    if (
      parent.type === "element" &&
      parent.properties.className?.includes("paper-table-scroll")
    )
      return SKIP;
    table++;
    const caption =
      parent.type === "element" && parent.tagName === "figure"
        ? parent.children.find(
            (child) =>
              child.type === "element" && child.tagName === "figcaption",
          )
        : undefined;
    const captionId =
      caption?.type === "element" ? caption.properties.id : undefined;
    visit(node, "element", (child) => {
      if (child.tagName === "thead") {
        visit(child, "element", (cell) => {
          if (cell.tagName === "th" && !cell.properties.scope)
            cell.properties.scope = "col";
        });
      }
    });
    parent.children[index] = {
      type: "element",
      tagName: "div",
      properties: {
        className: ["paper-table-scroll"],
        role: "region",
        tabIndex: 0,
        ...(captionId
          ? { ariaLabelledBy: [String(captionId)] }
          : { ariaLabel: `Table ${table}` }),
      },
      children: [node],
    };
    return SKIP;
  });
  if (columns === 2) arrangeColumns(tree);
  return toHtml(tree);
}
