import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import { SKIP, visit } from "unist-util-visit";

/** Add readable section numbers and keyboard access to native HTML tables at build time. */
export function formatPaper(html: string, numberedSections = false): string {
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
  return toHtml(tree);
}
