// @ts-check
import { defineConfig } from "astro/config";
import remarkDirective from "remark-directive";
import sitemap from "@astrojs/sitemap";
import remarkBlocks from "./src/plugins/remark-blocks.mjs";
import rehypeMedia from "./src/plugins/rehype-media.mjs";
import rehypeBase from "./src/plugins/rehype-base.mjs";

const BASE = "/armenian-knowledgebase";

export default defineConfig({
  site: "https://ivan-stetsiuk.github.io",
  base: BASE,
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: {
    // remarkDirective parses `:::rule{…}`; remarkBlocks turns it into HTML.
    // Order matters: the parser has to run first.
    remarkPlugins: [remarkDirective, remarkBlocks],
    rehypePlugins: [rehypeMedia, [rehypeBase, BASE]],
    // The corpus uses ։ and ՞ inside Armenian sentences; smartypants would
    // rewrite the surrounding quotes and dashes into forms the tutor did not use.
    smartypants: false,
    gfm: true,
  },
  build: { format: "directory" },
  devToolbar: { enabled: false },
});
