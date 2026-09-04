import { visit } from "unist-util-visit";

/* Marks every run of Armenian in the rendered HTML with lang="hy".
 *
 * The stylesheet has a rule for Armenian: the Noto face, a size a touch larger
 * than the Latin around it, and no negative tracking (the page's slight
 * negative tracking is a correction for Helvetica, and it closes Armenian up).
 * The word tables carry a class for it, but a lesson is markdown, and markdown
 * produces a plain <td>. So on every lesson page that rule was matching
 * nothing: the Armenian was falling through the font stack to whatever the
 * reader's OS happens to use for the block, which is a different face on macOS,
 * on Windows and on Android.
 *
 * It is also what WCAG 3.1.2 asks for. The document is lang="en"; without this
 * a screen reader pronounces Երեկ երկուշաբթի էր as English.
 *
 * A run stops at the first character that is not Armenian and is not followed
 * by more Armenian, so the gloss in `Երեկ երկուշաբթի էր — Yesterday it was
 * Monday` splits at the dash and the English half is left alone.
 */

const A = "\\u0531-\\u0556\\u0559-\\u058A\\u058D-\\u058F\\u0561-\\u0587\\uFB13-\\uFB17";
const RUN = new RegExp(`[${A}]+(?:[\\s\\p{P}]*[${A}]+)*`, "gu");

/* Code is quoted verbatim, and a heading id or a class name is not prose. */
const SKIP = new Set(["code", "pre", "script", "style"]);

export default function rehypeLang() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (SKIP.has(node.tagName) || node.properties?.lang) return;

      let changed = false;
      const out = [];

      for (const child of node.children) {
        if (child.type !== "text" || !RUN.test(child.value)) {
          out.push(child);
          continue;
        }
        RUN.lastIndex = 0;

        let at = 0;
        for (const m of child.value.matchAll(RUN)) {
          if (m.index > at) out.push({ type: "text", value: child.value.slice(at, m.index) });
          out.push({
            type: "element",
            tagName: "span",
            properties: { lang: "hy" },
            children: [{ type: "text", value: m[0] }],
          });
          at = m.index + m[0].length;
          changed = true;
        }
        if (at < child.value.length) out.push({ type: "text", value: child.value.slice(at) });
      }

      if (changed) node.children = out;
    });
  };
}
