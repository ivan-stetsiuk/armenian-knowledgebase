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
  build: {
    format: "directory",
    /* Styles ship inside the page rather than as a hashed file beside it.
     * GitHub Pages caches HTML for a few minutes, so right after a deploy a
     * browser can hold a page that points at a stylesheet the new build has
     * already replaced — the file 404s and the page renders unstyled until a
     * reload. Inlined, a cached page always carries the styles it was built
     * with. It costs about 4KB gzipped per page and removes the failure. */
    inlineStylesheets: "always",
  },
  devToolbar: { enabled: false },
});
