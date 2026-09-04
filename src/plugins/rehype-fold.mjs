/* Folds a whole section of a lesson away behind its own heading.
 *
 * The exercises are the longest thing on a lesson page and the one part nobody
 * reads on the way past: they are a page of prompts to work through later, and
 * left open they push the flashcards and the grammar links off the screen. So
 * the section becomes a <details> whose <summary> is the heading it already
 * had — the contents still links to it, the page still reads as a page, and the
 * practice unfolds when it is wanted.
 *
 * FOLD is matched against the heading text, lower-cased. Anything listed here
 * folds in every lesson that has it; nothing in the markdown changes.
 */

const FOLD = new Set(["exercises"]);

const text = (node) =>
  node.type === "text" ? node.value : (node.children || []).map(text).join("");

export default function rehypeFold() {
  return (tree) => {
    const out = [];

    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      const isFoldable =
        node.type === "element" && node.tagName === "h2" && FOLD.has(text(node).trim().toLowerCase());

      if (!isFoldable) {
        out.push(node);
        continue;
      }

      /* Everything up to the next h2 belongs to this section. */
      let j = i + 1;
      const body = [];
      for (; j < tree.children.length; j++) {
        const next = tree.children[j];
        if (next.type === "element" && next.tagName === "h2") break;
        body.push(next);
      }

      /* How much is behind the fold, in the site's own (count) notation — the
       * same promise the topics list on the words index makes. */
      const n = body.filter((c) => c.type === "element" && c.tagName === "h3").length;
      if (n > 1) {
        node.children.push({ type: "text", value: " " }, {
          type: "element",
          tagName: "span",
          properties: { className: ["count"] },
          children: [{ type: "text", value: String(n) }],
        });
      }

      out.push({
        type: "element",
        tagName: "details",
        properties: { className: ["disclosure", "fold"] },
        children: [
          { type: "element", tagName: "summary", properties: {}, children: [node] },
          ...body,
        ],
      });
      i = j - 1;
    }

    tree.children = out;
  };
}
