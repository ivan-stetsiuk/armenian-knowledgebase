import { visit } from "unist-util-visit";
import fs from "node:fs";
import path from "node:path";

/* PNG stores its dimensions in the first 24 bytes. Reading them here means an
 * image can reserve its space before it loads, which is what stops the page
 * jumping as the letter strips arrive. They are lazy-loaded, so they arrive
 * after the text has already been read. */
const size = new Map();
function pngSize(src) {
  if (size.has(src)) return size.get(src);
  let out = null;
  try {
    const file = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    const fd = fs.openSync(file, "r");
    const head = Buffer.alloc(24);
    fs.readSync(fd, head, 0, 24, 0);
    fs.closeSync(fd);
    if (head.toString("ascii", 1, 4) === "PNG") out = { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
  } catch {}
  size.set(src, out);
  return out;
}

/* Classes for the two kinds of image in the corpus, assigned by path rather
 * than by markup. The alternative was an attribute on every image in every
 * lesson, which is one more thing to get wrong when adding a lesson, and the
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

      const dim = pngSize(src);
      if (dim) {
        node.properties.width = dim.w;
        node.properties.height = dim.h;
      }
    });
  };
}
