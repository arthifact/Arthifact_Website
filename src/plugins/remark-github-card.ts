import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { h, isNodeDirective } from "../utils/remark";

// Render repository references as static links: no API requests, placeholder stats,
// client-side scripts, or dependency on GitHub availability to read the page.
export const remarkGithubCard: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node, index, parent) => {
    if (
      !parent ||
      index === undefined ||
      !isNodeDirective(node) ||
      node.type !== "leafDirective" ||
      node.name !== "github"
    )
      return;
    const raw = node.attributes?.repo ?? node.attributes?.user;
    if (!raw) return;
    const name = raw.replace(/^https:\/\/github\.com\//, "").replace(/\/$/, "");
    if (!/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)?$/.test(name)) return;
    parent.children.splice(
      index,
      1,
      h("div", { class: "static-repo-link" }, [
        h("a", { href: `https://github.com/${name}` }, [
          { type: "text", value: `${name} ↗` },
        ]),
      ]),
    );
  });
};
