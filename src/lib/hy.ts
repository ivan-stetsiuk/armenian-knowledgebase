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

/* Latin for search, and for nothing else.
 *
 * The site never shows transliteration: it teaches the script, and a crutch
 * printed beside every word is how a reader never stops needing one. Typing is
 * a different matter. Someone three weeks in still switches keyboard layouts
 * slowly, and a dictionary that can only be searched in Armenian is a
 * dictionary that gets opened less. So every word carries a hidden Latin key
 * and `erku` finds երկու.
 *
 * The mapping is the common romanisation of Eastern Armenian, not a standard
 * one: the point is what a learner would type. Two letters are pronounced
 * differently at the start of a word than inside it, so those words carry both
 * keys (երկու is filed under `erku` and `yerku`, ոչ under `och` and `voch`).
 */
const ROMAN: Record<string, string> = {
  ա: "a", բ: "b", գ: "g", դ: "d", ե: "e", զ: "z", է: "e", ը: "e", թ: "t",
  ժ: "zh", ի: "i", լ: "l", խ: "kh", ծ: "ts", կ: "k", հ: "h", ձ: "dz",
  ղ: "gh", ճ: "ch", մ: "m", յ: "y", ն: "n", շ: "sh", ո: "o", չ: "ch",
  պ: "p", ջ: "j", ռ: "r", ս: "s", վ: "v", տ: "t", ր: "r", ց: "ts",
  ւ: "v", փ: "p", ք: "k", և: "ev", օ: "o", ֆ: "f",
};

/* Spellings a learner reaches for that are not the ones above. Applied to the
 * key and to the query alike, so the two meet in the middle: x and kh are the
 * same letter, and so are q and k, ou and u, and any letter typed twice.
 *
 * Injected into the word filter on /vocabulary/ as data, so the page and the
 * search dialog fold a query the same way without sharing code. */
export const LATIN_FOLD: Record<string, string> = {
  /* Digraphs first and mapped to themselves, so that a pass cannot reach inside
   * one: without this the c of ch would be rewritten and չ would file as tsh. */
  ch: "ch", sh: "sh", zh: "zh", kh: "kh", gh: "gh", ts: "ts", dz: "dz",
  ou: "u", ph: "p", th: "t",
  x: "kh", q: "k", w: "v", c: "ts",
};

export function foldLatin(s: string): string {
  const keys = Object.keys(LATIN_FOLD).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.join("|"), "g");
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f'\u2019`]/g, "")
    .replace(re, (m) => LATIN_FOLD[m])
    .replace(/(.)\1+/g, "$1");
}

export function roman(word: string): string {
  const w = word.toLowerCase().trim();
  let out = "";
  for (let i = 0; i < w.length; i++) {
    /* ու is one letter and one sound. */
    if (w[i] === "ո" && w[i + 1] === "ւ") { out += "u"; i++; continue; }
    out += ROMAN[w[i]] ?? (/[a-z0-9]/.test(w[i]) ? w[i] : " ");
  }
  const keys = new Set([foldLatin(out)]);

  /* Word-initial ե is "ye" and ո is "vo", which is how they are heard and so
   * how they are typed. */
  for (const [letter, sound] of [["ե", "y"], ["ո", "v"]] as const) {
    if (w.startsWith(letter)) keys.add(foldLatin(sound + out));
  }
  return [...keys].join(" ");
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
