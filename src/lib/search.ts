import { getCollection } from "astro:content";
import { base } from "./site";
import { oneLine, groupOf } from "./grammar";
import { words, TOPICS } from "./vocab";

/* The index the search dialog ranks against.
 *
 * Pagefind reads the built HTML and answers "which page says this?", which it
 * does well, and which is not the question most searches here are asking. A
 * reader typing "L2", "ablative" or "գալ" is naming a thing on the site, not
 * quoting it, and full text cannot tell the title of lesson 2 from the three
 * hundred other pages with a 2 in a table. So the things themselves (every
 * lesson, grammar page, how-to, topic and word) are listed here, and
 * src/components/Search.astro ranks that list by how well a query names an
 * entry. Pagefind still answers the other question, underneath.
 *
 * The whole file is one JSON payload (src/pages/search-index.json.ts), fetched
 * the first time the dialog opens and never again. Keys are one letter because
 * a thousand words repeat them a thousand times:
 *
 *   t  kind        u  url          n  name
 *   s  subtitle    k  keywords (searched, never shown)
 *   l  lesson number, where a thing belongs to one
 */
export interface Entry {
  t: "lesson" | "grammar" | "howto" | "topic" | "word" | "page";
  u: string;
  n: string;
  s?: string;
  k?: string;
  l?: number;
}

/* Summaries are one line in the dialog and are cut to one line here too: the
 * whole index is fetched before the first keystroke is answered, and a few
 * grammar one-liners run to three hundred characters. */
const short = (s: string, n = 120) =>
  s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n) > 0 ? s.lastIndexOf(" ", n) : n) + "…";

export async function searchEntries(): Promise<Entry[]> {
  const out: Entry[] = [];

  const grammar = await getCollection("grammar");
  const titleOf = (slug: string) => grammar.find((g) => g.id === slug)?.data.title ?? slug;

  const lessons = (await getCollection("lessons")).sort((a, b) => a.data.lesson - b.data.lesson);
  for (const l of lessons) {
    out.push({
      t: "lesson",
      u: `${base}/lessons/${l.id}/`,
      n: l.data.title,
      s: short(l.data.topics ?? ""),
      /* What the lesson taught, by name. It is what a reader remembers a lesson
       * by when they cannot remember its number. */
      k: l.data.grammar.map(titleOf).join(" "),
      l: l.data.lesson,
    });
  }

  for (const g of grammar) {
    out.push({
      t: "grammar",
      u: `${base}/grammar/${g.id}/`,
      n: g.data.title,
      s: short(oneLine(g.body ?? "")),
      /* The slug and the section it sits in: "future-k" is how the page is
       * linked, "Verbs" is where a reader looks for it. */
      k: `${g.id.replace(/-/g, " ")} ${groupOf(g.id)}`,
    });
  }

  for (const h of await getCollection("howto")) {
    out.push({
      t: "howto",
      u: `${base}/how-to/${h.id}/`,
      n: h.data.title,
      k: h.id.replace(/-/g, " "),
    });
  }

  const all = words();
  const counts = new Map<string, number>();
  for (const w of all) for (const t of w.tags) counts.set(t, (counts.get(t) ?? 0) + 1);

  for (const [tag, title, blurb] of TOPICS) {
    if (!counts.get(tag)) continue;
    out.push({ t: "topic", u: `${base}/vocabulary/${tag}/`, n: title, s: blurb, k: tag });
  }

  /* Words are results in their own right. Searching for գալ used to return the
   * eight pages that happen to use it, in no useful order, and never the word
   * itself with its gloss and the lesson it came from. The link opens the word
   * list already filtered to it, which scrolls to the row and marks it. */
  for (const w of all) {
    out.push({
      t: "word",
      u: `${base}/vocabulary/?q=${encodeURIComponent(w.hy)}`,
      n: w.hy,
      s: w.en,
      k: w.tags.join(" "),
      l: w.lesson,
    });
  }

  for (const [n, u, k] of [
    ["Lessons", `${base}/lessons/`, "index all lessons"],
    ["Grammar", `${base}/grammar/`, "index reference rules"],
    ["Words", `${base}/vocabulary/`, "index vocabulary glossary dictionary"],
    ["How-to", `${base}/how-to/`, "index phrasebook situations"],
  ] as const) {
    out.push({ t: "page", u, n, k });
  }

  return out;
}
