import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* Front matter is a contract with two consumers: these pages and the CMS at
 * /admin. Keeping the schema strict means a malformed lesson fails the build
 * rather than rendering a page with a blank date. */

const lessons = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    lesson: z.number().int().positive(),
    date: z.coerce.date(),
    // The tutor's own numbering. It diverges from ours from lesson 20 on,
    // because sessions that left no notes were dropped.
    source_lesson: z.number().int().positive().optional(),
    grammar: z.array(z.string()).default([]),
    topics: z.string().optional(),
  }),
});

const grammar = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/grammar" }),
  schema: z.object({
    title: z.string(),
    group: z.string().optional(),
    order: z.number().optional(),
  }),
});

const howto = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/howto" }),
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
  }),
});

export const collections = { lessons, grammar, howto };
