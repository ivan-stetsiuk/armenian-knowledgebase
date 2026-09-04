import { stem } from "./hy";
import type { Entry } from "./search";

/* The ranking. Kept apart from the dialog that draws it so it can be read, and
 * tested, as what it is: a function from a query and a list of things to the
 * things that query names.
 *
 * Full text (Pagefind, underneath) answers "which page says this?". This
 * answers "which thing is this?", which is the question nearly every search on
 * this site is actually asking, and the one BM25 over the built HTML cannot get
 * right: "L2" is a name, and the corpus is full of 2s that are not.
 */

export const norm = (s: string | undefined) => (s || "").toLowerCase().normalize("NFC").trim();
export const cut = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/* How well one field answers one token. This ladder is the ranking: a field
 * that *is* the query outranks one that begins with it, which outranks a word
 * inside it, which outranks a mention buried in the middle. */
function inField(value: string | undefined, token: string): number {
  if (!value) return 0;
  const v = norm(value);
  if (v === token) return 12;
  if (v.startsWith(token)) return 8;
  let best = 0;
  for (const w of cut(v)) {
    if (w === token) best = Math.max(best, 7);
    else if (w.startsWith(token)) best = Math.max(best, 5);
  }
  return best || (v.includes(token) ? 1.5 : 0);
}

/* Name, then the summary under it, then the keywords that are searched but
 * never shown. */
const FIELDS: [keyof Entry, number][] = [["n", 10], ["s", 3.2], ["k", 2]];

/* A grammar page is a reference and gets a nudge for being one; the four
 * section indexes are a way in rather than an answer, and get out of the way. */
const PRIOR: Record<Entry["t"], number> = {
  grammar: 1.06, lesson: 1, howto: 1, word: 1, topic: 0.96, page: 0.88,
};

function score(entry: Entry, tokens: string[]): number {
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [f, weight] of FIELDS) best = Math.max(best, weight * inField(entry[f] as string, token));

    /* Armenian piles suffixes on a root, so the word typed and the word wanted
     * are often not the same string: հիշել and հիշեցնել share հիշ. A shared root
     * is a real answer, but a weaker one than a spelling. */
    if (!best && entry.t === "word" && token.length >= 4) {
      const root = stem(token);
      if (root.length >= 3 && stem(entry.n).startsWith(root)) best = 22;
    }

    /* Every token has to land somewhere, or "lesson 2" would match all
     * forty-one of them through the word "lesson" alone. */
    if (!best) return 0;
    total += best;
  }
  return total;
}

/* "2", "L2", "l02", "lesson 2", "урок 2" all mean the second lesson. Spelled out
 * here rather than left to the text index, which cannot tell a lesson number
 * from the several hundred other 2s in the tables. A bare number scores lower
 * than a named one: it is a guess about intent, not a statement of it. */
const LESSON_Q = /^(?:(l|lesson|lessons|л|урок|урока|уроке)\s*)?0*(\d{1,2})$/i;

export function lessonIntent(q: string): { n: number; named: boolean } | null {
  const m = LESSON_Q.exec(norm(q));
  return m ? { n: Number(m[2]), named: Boolean(m[1]) } : null;
}

export function rank(entries: Entry[], q: string, base: string, limit = 10): Entry[] {
  const tokens = cut(q);
  if (!tokens.length) return [];

  const want = lessonIntent(q);
  const hits: [number, Entry][] = [];

  for (const e of entries) {
    let s = score(e, tokens);
    if (want && e.t === "lesson") {
      /* "lesson 2" is not a query about lesson 20, however well 2 prefixes it.
       * A bare "2" keeps them: there the number is a guess to begin with, and
       * the twenties are a reasonable thing to have meant. */
      if (e.l === want.n) s = Math.max(s, want.named ? 1000 : 420);
      else if (want.named) s = 0;
    }
    if (s > 0) hits.push([s * (PRIOR[e.t] ?? 1), e]);
  }

  /* Asking for a lesson by number is usually asking for its words too. */
  if (want && entries.some((e) => e.t === "lesson" && e.l === want.n)) {
    hits.push([
      want.named ? 900 : 380,
      { t: "page", n: `Words from lesson ${want.n}`, u: `${base}/vocabulary/?q=L${want.n}` },
    ]);
  }

  /* Ties go to the shorter name: it is the more exact answer to the same query
   * "come" over "come back", ձեռք over ձեռքերով. */
  hits.sort((a, b) => b[0] - a[0] || a[1].n.length - b[1].n.length);
  return hits.slice(0, limit).map((h) => h[1]);
}
