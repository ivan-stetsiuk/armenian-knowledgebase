/* Reference order for the grammar section.
 *
 * Alphabetical would put "ablative" first and "word-order" last, which tells a
 * reader nothing. This order is pedagogical: script, then the words that point
 * at things, then nouns, then verbs, then the sentence. It also fixes prev/next,
 * so paging through the section walks the language rather than the dictionary.
 */
export const GROUPS: { name: string; slugs: string[] }[] = [
  { name: "Script and sounds", slugs: ["alphabet"] },
  {
    name: "Pronouns and articles",
    slugs: ["to-be", "definite-article", "possessive-pronouns", "demonstratives", "question-words"],
  },
  {
    name: "Nouns and cases",
    slugs: ["plural", "genitive", "dative", "ablative", "instrumental", "locative", "postpositions", "nationality-suffixes"],
  },
  {
    name: "Adjectives and numbers",
    slugs: ["adjectives-comparison", "numerals", "dates", "telling-time"],
  },
  {
    name: "Verbs",
    slugs: [
      "present-tense", "to-have-and-to-know", "can", "past-of-to-be", "past-simple", "perfect",
      "future-k", "future-u", "future-piti", "imperative", "verbs-anal", "causative",
    ],
  },
  { name: "The sentence", slugs: ["negation", "there-is", "word-order", "conjunctions"] },
];

export const ORDERED = GROUPS.flatMap((g) => g.slugs);

export function groupOf(slug: string): string {
  return GROUPS.find((g) => g.slugs.includes(slug))?.name ?? "Other";
}

/* The `> **One line.** …` summary that opens every grammar page. Shown in the
 * index so the section can be skimmed without opening anything. */
export function oneLine(body: string): string {
  const m = body.match(/^>\s*\*\*One line\.?\*\*\s*(.+)$/m);
  if (!m) return "";
  return m[1].replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
}
