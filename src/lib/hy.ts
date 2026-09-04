/* The language rules, with nothing else in them.
 *
 * Split out of vocab.ts because that file reads data/*.tsv through node:fs at
 * build time, and these four things (the stemmer, the alphabet, the letter a
 * word files under, the sort order) are also needed in the browser, by the
 * word filter and by the search dialog. A module the client bundles cannot
 * import node:fs, so the rules live here and vocab.ts re-exports them.
 */

/* Armenian builds words by piling suffixes on a root: հիշել "to remember" and
 * հիշեցնել "to remind" share հիշ, but a substring search for one will never find
 * the other. Stripping the longest ending both words carry gives a stem the
 * filter can compare, which is what lets a search find a word's relatives.
 *
 * Longest first, or -ել would fire before -եցնել and leave two different stems.
 * The list is deliberately short: these are the endings the lessons actually
 * teach, and every entry added is another chance to mangle an unrelated word. */
export const SUFFIXES = [
  "եցնել", "ացնել", "ցնել", "անալ", "ենալ", "նալ", "ալ", "ել",
  "ների", "երի", "ներ", "եր",
  "ից", "ով", "ում", "ին", "ի", "ու", "ը", "ն",
];

/* A stem shorter than two letters is not a stem, it is a coincidence. */
export function stem(word: string): string {
  const w = word.toLowerCase().trim();
  for (const suf of SUFFIXES) {
    if (w.length - suf.length >= 2 && w.endsWith(suf)) return w.slice(0, -suf.length);
  }
  return w;
}

/* The 39 letters, in the order and the forms the tutor's own table gives in
 * lesson 1. Two of them are digraphs rather than single code points: ՈՒ, which
 * modern Eastern Armenian teaches in place of the obsolete Ւ, and ԵՎ, the
 * ligature written և in lower case. Uppercase throughout: they are being shown
 * as the alphabet here, not as words.
 *
 * Both the alphabet on the home page and the letter dividers in the word table
 * read from this list, so the two can never disagree about what a letter is. */
export const ALPHABET = [
  "Ա", "Բ", "Գ", "Դ", "Ե", "Զ", "Է", "Ը", "Թ", "Ժ",
  "Ի", "Լ", "Խ", "Ծ", "Կ", "Հ", "Ձ", "Ղ", "Ճ", "Մ",
  "Յ", "Ն", "Շ", "Ո", "Չ", "Պ", "Ջ", "Ռ", "Ս", "Վ",
  "Տ", "Ր", "Ց", "ՈՒ", "Փ", "Ք", "ԵՎ", "Օ", "Ֆ",
] as const;

/* The letter a word files under. Case-folded, because proper nouns are
 * capitalised in the corpus and Հայաստան belongs under Հ like everything else.
 * The digraphs are tested first: ուտել starts with ՈՒ, not with Ո. */
export function initialLetter(word: string): string {
  const w = word.trim().toUpperCase();
  if (w.startsWith("ՈՒ")) return "ՈՒ";
  if (w.startsWith("ԵՎ") || w.startsWith("ԵՒ") || word.trim().startsWith("և")) return "ԵՎ";
  return w[0] ?? "";
}

/* Armenian alphabetical order. JavaScript's default sort would put every word
 * beginning with a capital letter first, which is not how a dictionary reads. */
const ARM = "աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցուփքևօֆ";
const ORDER = new Map([...ARM].map((c, i) => [c, i]));

export function byArmenian(a: string, b: string): number {
  const norm = (s: string) => [...s.toLowerCase().replace(/^[-\s]+/, "")];
  const x = norm(a);
  const y = norm(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const p = ORDER.get(x[i]) ?? (x[i] ? 100 + x[i].charCodeAt(0) : -1);
    const q = ORDER.get(y[i]) ?? (y[i] ? 100 + y[i].charCodeAt(0) : -1);
    if (p !== q) return p - q;
  }
  return 0;
}
