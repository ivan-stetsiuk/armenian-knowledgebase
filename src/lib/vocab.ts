import fs from "node:fs";
import path from "node:path";

/* data/vocab.tsv stays the single source of truth for words: the Anki build
 * reads the same file. Pages are rendered from it at build time, so a glossary
 * page cannot drift from the flashcard it came from. */

export interface Word {
  id: string;
  hy: string;
  en: string;
  phrase_hy: string;
  phrase_en: string;
  lesson: number;
  tags: string[];
  note: string;
}

const DATA = path.join(process.cwd(), "data");

function readTsv(file: string): Record<string, string>[] {
  const text = fs.readFileSync(path.join(DATA, file), "utf8").replace(/\r\n/g, "\n");
  const [head, ...lines] = text.split("\n").filter((l) => l.trim() !== "");
  const cols = head.split("\t");
  return lines.map((line) => {
    const cells = line.split("\t");
    return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? "").trim()]));
  });
}

let cache: Word[] | null = null;

export function words(): Word[] {
  if (cache) return cache;
  cache = readTsv("vocab.tsv").map((r) => ({
    id: r.id,
    hy: r.hy,
    en: r.en,
    phrase_hy: r.phrase_hy,
    phrase_en: r.phrase_en,
    lesson: Number(r.lesson),
    tags: r.tags.split(",").map((t) => t.trim()).filter(Boolean),
    note: r.note,
  }));
  return cache;
}

export function grammarCards() {
  return readTsv("grammar.tsv");
}

/* A flag is decoration, not linguistic data, so it lives here and never in the
 * TSV — on an Anki card it would give the answer away. */
export const FLAGS: Record<string, string> = {
  "Հայաստան": "🇦🇲", "Թուրքիա": "🇹🇷", "Հունաստան": "🇬🇷", "Հնդկաստան": "🇮🇳",
  "Պարսկաստան / Իրան": "🇮🇷", "Իրան": "🇮🇷", "Չինաստան": "🇨🇳", "Վրաստան": "🇬🇪",
  "Ռուսաստան": "🇷🇺", "Ամերիկա / ԱՄՆ": "🇺🇸", "ԱՄՆ": "🇺🇸", "Անգլիա": "🇬🇧",
  "Ֆրանսիա": "🇫🇷", "Սիրիա": "🇸🇾", "Կանադա": "🇨🇦", "Ճապոնիա": "🇯🇵",
  "Իտալիա": "🇮🇹", "Իսպանիա": "🇪🇸", "Շվեդիա": "🇸🇪", "Պորտուգալիա": "🇵🇹",
  "Բրազիլիա": "🇧🇷", "Կորեա": "🇰🇷", "Ադրբեջան": "🇦🇿", "Գերմանիա": "🇩🇪",
};

export const PARTS_OF_SPEECH = [
  "noun", "verb", "adjective", "adverb", "pronoun", "numeral",
  "postposition", "conjunction", "question", "phrase", "other",
] as const;

/* tag → [slug, title, one-line description]. Order is the order on the index. */
export const TOPICS: [string, string, string][] = [
  ["greetings", "Greetings", "Hello, goodbye, how are you, getting acquainted."],
  ["family", "Family", "Relatives and family members."],
  ["people", "People", "Words for people, roles and professions."],
  ["home", "Home", "Rooms, parts of the house, the building."],
  ["furniture", "Furniture", "Things inside the house."],
  ["city", "City", "Places you go to and come from."],
  ["food", "Food", "Meals, dishes and things to eat."],
  ["drinks", "Drinks", "Coffee, tea and everything else."],
  ["weather", "Weather", "Talking about the weather."],
  ["seasons", "Seasons", "The four seasons and their forms."],
  ["body", "Body", "Parts of the body, fingers."],
  ["face", "Face", "Parts of the face and head."],
  ["colours", "Colours", "Basic colours and the -գույն compounds."],
  ["time", "Time", "Time of day, telling the time, soon and later."],
  ["calendar", "Calendar", "Days, months, dates, yesterday and tomorrow."],
  ["numbers", "Numbers", "Cardinal and ordinal numerals."],
  ["feelings", "Feelings", "Tired, glad, busy, sick."],
  ["countries", "Countries", "Countries, nationalities and their adjectives."],
  ["languages", "Languages", "Names of languages."],
  ["transport", "Transport", "By metro, by taxi, on foot."],
  ["work", "Work", "Work, colleagues, meetings."],
  ["travel", "Travel", "Trips, flights, staying somewhere."],
  ["school", "Study", "Lessons, homework, studying."],
  ["nature", "Nature", "Trees, mountains, animals, the outdoors."],
  ["clothes", "Clothes", "Things you wear."],
  ["abstract", "Abstract", "Love, life, truth, success."],
  ["colloquial", "Colloquial", "Everyday spoken Armenian and fillers."],
  ["letters", "Letter practice", "Words used to practise single letters in lessons 1–6."],
  ["from-exercise", "From exercises", "Words given in parentheses inside homework prompts."],
  ["verb", "All verbs", "Every verb in the base, in the infinitive."],
  ["adjective", "All adjectives", "Every adjective in the base."],
  ["phrase", "Phrases", "Multi-word expressions and set phrases."],
  ["question", "Question words", "Who, what, where, when, why, how."],
  ["postposition", "Postpositions", "for, about, with, on, under, near."],
];

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
