import { visit } from "unist-util-visit";

/* Prefixes root-relative links and images written in markdown with the site's
 * base path.
 *
 * The content says `/grammar/genitive/` because that is what it means and what
 * a CMS preview can resolve. On GitHub Pages the site actually lives under
 * /armenian-knowledgebase/, and Astro only rewrites paths it generates itself,
 * not ones inside markdown, so without this every cross-reference in the
 * corpus 404s in production while working perfectly in dev.
 */
export default function rehypeBase(base = "") {
  const BASE = String(base).replace(/\/$/, "");
  return (tree) => {
    if (!BASE) return;
    visit(tree, "element", (node) => {
      for (const attr of ["href", "src"]) {
        const v = node.properties?.[attr];
        if (typeof v !== "string") continue;
        // Root-relative only: leave //cdn, https://, #anchor and ./relative alone.
        if (!v.startsWith("/") || v.startsWith("//")) continue;
        if (v.startsWith(BASE + "/") || v === BASE) continue;
        node.properties[attr] = BASE + v;
      }
    });
  };
}
