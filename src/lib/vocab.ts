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

/* Tags carried into the Anki notes that deliberately get no page of their own.
 * A part of speech is worth filtering a deck by, but "all 426 nouns" is not a
 * topic anybody browses. The ones that are (verbs, adjectives, phrases,
 * question words, postpositions) appear in TOPICS below.
 *
 * scripts/check.py fails the build on any tag in data/vocab.tsv that is in
 * neither list, so a typo cannot silently drop a word out of every topic. */
export const NON_TOPIC_TAGS = [
  "noun", "adverb", "pronoun", "numeral", "conjunction", "other", "vulgar",
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

/* The language rules themselves live in hy.ts, which has no build-time
 * dependencies and can therefore be bundled into the page. Re-exported here so
 * that "the words and how they behave" stays one import for the pages. */
export { SUFFIXES, stem, ALPHABET, initialLetter, byArmenian, roman, foldLatin, LATIN_FOLD } from "./hy";
