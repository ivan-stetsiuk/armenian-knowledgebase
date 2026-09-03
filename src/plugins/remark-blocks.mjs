import { visit } from "unist-util-visit";

/* Turns the directive syntax the content uses into plain HTML.
 *
 * Content stays editable as markdown — a CMS or a text editor sees
 * `:::rule{title="…"}`, not a component import — while the site gets real
 * elements it can style. Nothing here hydrates: tabs are the only interactive
 * piece and they are progressively enhanced by a few lines in the layout.
 */

const BLOCKS = {
  rule: "Rule",
  vocab: "Vocabulary",
  pitfall: "Pitfall",
};

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default function remarkBlocks() {
  return (tree) => {
    let tabsId = 0;

    visit(tree, (node) => {
      if (node.type !== "containerDirective" && node.type !== "leafDirective") return;

      const name = node.name;
      const attrs = node.attributes || {};
      const data = (node.data ||= {});

      /* ---- rule / vocab / pitfall ---- */
      if (BLOCKS[name]) {
        data.hName = "aside";
        data.hProperties = { className: ["block", `block--${name}`] };
        node.children.unshift({
          type: "html",
          value:
            `<p class="block__kind">${BLOCKS[name]}</p>` +
            (attrs.title ? `<p class="block__title">${esc(attrs.title)}</p>` : ""),
        });
        return;
      }

      /* ---- worked example inside a rule ---- */
      if (name === "example") {
        data.hName = "div";
        data.hProperties = { className: ["example"] };
        return;
      }

      /* ---- collapsible ---- */
      if (name === "details") {
        data.hName = "details";
        data.hProperties = { className: ["disclosure"], ...(attrs.open !== undefined ? { open: true } : {}) };
        node.children.unshift({
          type: "html",
          value: `<summary>${esc(attrs.title || "More")}</summary>`,
        });
        return;
      }

      /* ---- tab set ---- */
      if (name === "tabs") {
        const id = `t${tabsId++}`;
        const tabs = node.children.filter((c) => c.type === "containerDirective" && c.name === "tab");
        const bar = tabs
          .map((t, i) => {
            const label = esc((t.attributes || {}).name || `Tab ${i + 1}`);
            return (
              `<button type="button" class="tabs__btn" role="tab" id="${id}-b${i}" ` +
              `aria-controls="${id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${label}</button>`
            );
          })
          .join("");

        tabs.forEach((t, i) => {
          const d = (t.data ||= {});
          d.hName = "section";
          d.hProperties = {
            className: ["tabs__panel"],
            role: "tabpanel",
            id: `${id}-p${i}`,
            "aria-labelledby": `${id}-b${i}`,
            ...(i === 0 ? {} : { hidden: true }),
          };
        });

        data.hName = "div";
        data.hProperties = { className: ["tabs"], "data-tabs": "" };
        node.children.unshift({
          type: "html",
          value: `<div class="tabs__bar" role="tablist">${bar}</div>`,
        });
        return;
      }

      /* An unknown directive would otherwise render as literal text. */
      if (node.type === "containerDirective") {
        data.hName = "div";
        data.hProperties = { className: [`d-${name}`] };
      }
    });
  };
}
