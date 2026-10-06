import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import { SKIP, visit } from "unist-util-visit";
import type { Element, Root, RootContent } from "hast";

function classes(node: RootContent): string[] {
  return node.type === "element" && Array.isArray(node.properties.className)
    ? node.properties.className.map(String)
    : [];
}

function spacing(node: RootContent | undefined): boolean {
  return (
    node?.type === "comment" || (node?.type === "text" && !node.value.trim())
  );
}

function fullWidth(node: RootContent): boolean {
  if (node.type !== "element") return false;
  return classes(node).some((name) =>
    ["paper-wide", "interactive-model"].includes(name),
  );
}

/** Wide floats sit above or below one uninterrupted column flow on each sheet. */
function arrangeColumns(tree: Root): void {
  const assets: RootContent[] = [];
  const top: RootContent[] = [];
  const bottom: RootContent[] = [];
  const flow: RootContent[] = [];
  for (const node of tree.children) {
    if (fullWidth(node)) {
      const placement =
        node.type === "element" && node.properties.dataPaperPlacement;
      (placement === "bottom" ? bottom : top).push(node);
    } else if (
      node.type === "element" &&
      ["style", "script", "link", "meta"].includes(node.tagName)
    ) {
      assets.push(node);
    } else {
      flow.push(node);
    }
  }
  tree.children = [
    ...assets,
    ...top,
    ...(hasContent(flow)
      ? [
          {
            type: "element" as const,
            tagName: "div",
            properties: { className: ["paper-columns"] },
            children: flow as Element["children"],
          },
        ]
      : []),
    ...bottom,
  ];
}

/** Attach an authored equation anchor to its equation so a column break cannot separate them. */
function attachEquationAnchors(tree: Root): void {
  visit(tree, (parent) => {
    if (parent.type !== "root" && parent.type !== "element") return;
    for (let index = 0; index < parent.children.length; index++) {
      const anchor = parent.children[index];
      if (
        anchor?.type !== "element" ||
        anchor.tagName !== "div" ||
        typeof anchor.properties.id !== "string" ||
        Object.keys(anchor.properties).length !== 1 ||
        !anchor.children.every(spacing)
      )
        continue;
      let next = index + 1;
      while (next < parent.children.length && spacing(parent.children[next]))
        next++;
      const equation = parent.children[next];
      if (
        equation?.type === "element" &&
        classes(equation).includes("katex-display") &&
        !equation.properties.id
      ) {
        equation.properties.id = anchor.properties.id;
        parent.children.splice(index, 1);
        index--;
      }
    }
  });
}

/** Prepare the complete document before splitting, keeping numbering and references continuous. */
function preparePaper(tree: Root, numberedSections: boolean): void {
  attachEquationAnchors(tree);
  let section = 0;
  let table = 0;
  visit(tree, "element", (node, index, parent) => {
    if (classes(node).includes("katex-display")) {
      node.properties.role = "region";
      node.properties.tabIndex = 0;
      node.properties.ariaLabel = "Display equation";
    }
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
}

function pageBreak(node: RootContent): boolean {
  return (
    node.type === "element" && Object.hasOwn(node.properties, "dataPaperBreak")
  );
}

function hasContent(nodes: RootContent[]): boolean {
  return nodes.some(
    (node) =>
      node.type === "element" || (node.type === "text" && node.value.trim()),
  );
}

/** Author-controlled sheets, rendered once at build time with no browser pagination. */
export function formatPaperPages(
  html: string,
  numberedSections = false,
  columns: 1 | 2 = 1,
): string[] {
  const tree = fromHtml(html, { fragment: true });
  visit(tree, "element", (node, _index, parent) => {
    if (pageBreak(node) && parent?.type !== "root") {
      throw new Error(
        "Place a paper page break between sections, outside figures, tables, or other components.",
      );
    }
  });
  preparePaper(tree, numberedSections);
  const pages: Root[] = [];
  let children: RootContent[] = [];
  const flush = () => {
    if (hasContent(children)) pages.push({ type: "root", children });
    children = [];
  };
  for (const node of tree.children) {
    if (pageBreak(node)) flush();
    else children.push(node);
  }
  flush();
  if (pages.length === 0) pages.push({ type: "root", children: [] });
  return pages.map((page) => {
    if (columns === 2) arrangeColumns(page);
    return toHtml(page);
  });
}

/** Add readable section numbers and keyboard access to native HTML tables at build time. */
export function formatPaper(
  html: string,
  numberedSections = false,
  columns: 1 | 2 = 1,
): string {
  return formatPaperPages(html, numberedSections, columns).join("\n");
}
