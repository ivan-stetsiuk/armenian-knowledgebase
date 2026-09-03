import { visit } from "unist-util-visit";

/* Classes for the two kinds of image in the corpus, assigned by path rather
 * than by markup. The alternative was an attribute on every image in every
 * lesson, which is one more thing to get wrong when adding a lesson — and the
 * path already says what the picture is.
 *
 * Also lazy-loads and gives every image an intrinsic-size hint so the page does
 * not jump as the letter strips arrive.
 */
export default function rehypeMedia() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      const src = String(node.properties?.src || "");
      const cls = src.includes("/assets/letters/")
        ? "letter"
        : /body-parts\.png|face\.png/.test(src)
          ? "diagram"
          : "figure";
      node.properties.className = [cls];
      node.properties.loading = "lazy";
      node.properties.decoding = "async";
    });
  };
}
