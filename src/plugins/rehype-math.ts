import type { RehypePlugin } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";

export const rehypeMath: RehypePlugin = () => {
  const render = rehypeKatex({
    output: "htmlAndMathml",
    trust: false,
    strict: "error",
  });
  return (tree, file) => {
    render(tree, file);
    const error = file.messages.find(
      (message) => message.source === "rehype-katex",
    );
    if (error) file.fail(error);
    visit(tree, "element", (node) => {
      if (node.properties.className?.includes("katex-display")) {
        node.properties.tabIndex = 0;
      }
    });
  };
};
