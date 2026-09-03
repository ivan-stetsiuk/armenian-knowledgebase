# Project guidelines

Structure, visual design and flashcard workflow for this knowledge base.
Version 1.1 (English). Changes from 1.0 are listed at the end.

---

## 0. Context and scope

**What this is.** A personal Armenian knowledge base on GitHub Pages. The material comes from lessons with a tutor and from homework.

**What this is not.** It is not a self-study course. Pages do not explain everything from scratch and need not be understandable to an outsider without the tutor. Two consequences:

- motivations and lead-ins that a commercial textbook must include can be skipped;
- "explanation" (why the language works the way it does) is a low-priority section, filled in last.

**Primary quality criterion.** Speed of adding material. If adding a lesson takes more than 15 minutes of routine work, the structure is wrong and must be simplified, not endured.

**Second criterion.** A rule or a word learned three months ago is found in ten seconds.

**Language.** English throughout: navigation, headings, explanations, glosses. Russian appears only inside a translation when it is the sharper literal equivalent (где / куда for որտեղ / ուր) or when the tutor used it. No transliteration anywhere; pronunciation notes use Armenian letters.

---

## 1. Architecture

Diátaxis layout: four different needs, four kinds of material that do not mix.

```
docs/
├── lessons/            # Chronology. What happened in class.
│   ├── index.md        #   Table lesson → date → topics
│   └── L01.md … L41.md
├── grammar/            # Grammar reference.
│   ├── index.md
│   └── <topic>.md      #   Future with կ-, negation, plural…
├── vocabulary/         # Word reference. GENERATED from data/vocab.tsv.
│   ├── index.md        #   Full list, Armenian alphabetical order
│   └── <topic>.md      #   Food, transport, time…
├── how-to/             # Task → ready script.
│   ├── index.md
│   └── <task>.md       #   Tell the time, at the table, give directions
data/                   # Single source of truth for flashcards
├── vocab.tsv
└── grammar.tsv
scripts/
├── build_vocab_pages.py   # TSV → docs/vocabulary/*.md
└── build_decks.py         # TSV → dist/armenian.apkg + dist/quizlet/*.tsv
```

### Single-source rule

Every entity lives in full in exactly one place:

| Entity | Lives in | Everyone else |
|---|---|---|
| Word | `data/vocab.tsv` | The lesson shows its subset; the glossary is generated |
| Grammar topic | `grammar/<topic>.md` | The lesson gives a one-line statement and a link |
| What happened in class | `lessons/LNN.md` | Nobody |
| Speech script | `how-to/<task>.md` | The lesson links |

Duplicating a rule's text in a lesson and in the reference is forbidden: in six months they diverge. The lesson gets one line of substance and a link.

### Link direction

```
lessons  ──►  grammar
   │     ──►  vocabulary
   └─────►  how-to

grammar  ──►  grammar (related topics)
grammar  ──X──►  lessons     (the reference does not know the chronology)
```

Grammar and vocabulary do not link back to lessons. A reference must stand alone; back-links turn it into a diary. A grammar page may say "Introduced in Lesson 7" as plain text.

---

## 2. Principles everything rests on

| Principle | Source | What we do |
|---|---|---|
| Signaling | Mayer | Closed list of 3 block types, identical on every page |
| Coherence | Mayer | Zero decorative elements. Three colours, one per block type |
| Spatial contiguity | Mayer | The translation sits on the same line as the Armenian. Never in a glossary at the bottom |
| Segmenting | Mayer | Full paradigms and nuances under `???` collapsibles; the base rule is always visible |
| Pre-training | Mayer | Vocabulary comes before grammar, in the lesson and inside a rule block |
| Small steps | Rosenshine | A rule is split into 2–4 steps, an example after each |
| Worked examples | Rosenshine | Every rule has at least one worked example, not only a paradigm |
| Practice testing | Dunlosky | Retrieval happens in Anki, daily, not by re-reading pages |
| Avoid interference | Nation | Do not place look-alike letters or semantically homogeneous lists side by side |
| Line length ≤ 75 | Bringhurst / WCAG 1.4.8 | `max-width: 66ch` for body text |

---

## 3. Block types (signaling)

Three types. The list is closed. A fourth type "just to highlight something" breaks the system: a signal works only while it is predictable.

### 3.1 Rule

The main block. Internal structure:

```
[Statement]     one sentence, no conditions or caveats
[Formula]       formation scheme: stem + affix
[Example]       1–2 worked examples, translation on the same line
[Link]          → full reference in grammar/
```

In a lesson only these four items appear. Paradigms, negation, questions, nuances live in the grammar page, where they are collapsible or tabbed.

**Paradigms are tabs, not three tables in a row.** Affirmative / negative / question are content tabs. Three tables one under another do not fit on the screen and force scrolling between the forms being compared, which violates spatial contiguity.

```markdown
!!! rule "Future with կ-"

    **կ + verb stem + personal ending.**

    :   գրել (to write) → կգրեմ — I will write

    Full reference → [Future with կ-](../grammar/future-k.md)
```

In the grammar page:

```markdown
=== "Affirmative"

    | Person | Singular | Plural |
    |---|---|---|
    | 1 | կգրեմ — I will write | կգրենք — we will write |

=== "Negative"

    | Person | Singular | Plural |
    |---|---|---|
    | 1 | չեմ գրի — I will not write | չենք գրի — we will not write |
```

**The translation sits in the same cell as the form.** Not as a separate column to the right of the whole table, not as a footnote. The eye should not travel further from the Armenian form than the length of one line.

### 3.2 Vocabulary

Appears up to twice in a lesson: at the top (words introduced in class) and after the exercises (words given in parentheses inside exercise prompts). Two blocks with different captions, not one.

```markdown
!!! vocab "New words — class"

    | Armenian | English | Phrase |
    |---|---|---|
    | հաց | bread | Հաց եմ գնում — I am buying bread |
```

The Phrase column stays even when empty. Nation recommends learning words inside ready phrases; the Anki card carries the phrase on its back (§6.3). Phrases come from the lessons; they are not invented.

### 3.3 Pitfall

**Decision: the block exists, but only as a personal log, never as a preventive warning.**

Rationale. Showing a wrong form before the right one has settled is exactly the interference Nation warns about. Oxford textbooks put "common mistakes" after practice, not before. At the same time your own corpus of mistakes is the most valuable part of the base: no textbook has it and it lands precisely on your weak spots.

Rules:

1. Created **only after the fact**, after a real mistake in class. Not "people usually err here".
2. The correct form dominates visually: it comes first, larger, green. The wrong one is secondary and muted.
3. One mistake = one block. Lists of five mistakes in a row are not read.
4. At most one block per lesson. Further ones go to `grammar/<topic>.md`, section "My mistakes".

```markdown
!!! pitfall "From this lesson"

    <span class="ok">✓ Ես գնում եմ</span>
    <span class="bad">✗ Ես եմ գնում</span>

    The auxiliary follows the verb, not the subject.
```

### Summary

| Block | Colour | When |
|---|---|---|
| Rule | blue | New grammar |
| Vocabulary | green | Top of the lesson; after the exercises |
| Pitfall | amber | Only after the fact, ≤ 1 per lesson |

---

## 4. Anatomy of a lesson page

Fixed order. Vocabulary before grammar is Mayer's pre-training principle: names and properties of key concepts first, mechanism second.

```markdown
---
lesson: 7
date: 2025-12-24
source_lesson: 7
grammar: [dates, question-words]
---

# Lesson 7

*24 December 2025 · tutor's lesson 7*

**Topics:** days of the week · how are you

## New words
!!! vocab "New words — class"

## Grammar
!!! rule "Days of the week"
Full reference → [Dates](../grammar/dates.md)

## Dialogue / Text / Examples        (optional, tutor's material)

## Exercises
Prompts only. Exercises are done on paper.

## Homework                          (only if the tutor set one)

## Words from exercises              (only if any)
!!! vocab "Words from exercises"

## Pitfall                           (only after a real mistake)
!!! pitfall

## Flashcards
Anki `hy::vocab::L07` · Quizlet: link
```

`source_lesson` is the tutor's numbering; it differs from the site numbering from lesson 20 onwards because sessions without notes were dropped (see [Lessons](lessons/index.md)).

---

## 5. Tooling

### 5.1 Stack

**MkDocs Material + GitHub Actions → GitHub Pages.**

Why not Jekyll (the GitHub Pages default): Material ships exactly the primitives described above, none of them has to be hand-built.

| Need | In Material | In Jekyll |
|---|---|---|
| Blocks with icon and colour | Admonitions | Custom markup |
| Collapsed paradigms | `???` | Custom JS |
| Affirmative / negative tabs | Content tabs | Custom JS |
| Instant search over glossaries | Built in | Plugin + setup |
| Footnotes for glosses | Footnotes | Plugin |
| Custom admonition types | CSS variables | — |

Navigation is generated from the file system by `mkdocs-awesome-pages-plugin`; a new lesson file appears in the menu without touching `mkdocs.yml`.

### 5.2 Fonts

At the same point size Armenian looks smaller than Latin, so Armenian text gets a little more size and leading.

- Body: **Noto Sans**; Armenian glyphs fall through to **Noto Sans Armenian** (Google Fonts), loaded in `mkdocs.yml`.
- Wrap a phrase in `<span class="hy">…</span>` when it needs the larger Armenian setting explicitly; generated vocabulary pages do this automatically.
- Paradigm tables: `font-variant-numeric: tabular-nums`.

### 5.3 Tokens

The palette is minimal on purpose: coherence demands removing everything without a learning function, and Mayer separately warns about "seductive details" — interesting but irrelevant material that is remembered better than the essential.

```css
:root {
  --hy-rule:    #2f5d8a;   /* rule */
  --hy-vocab:   #3f7a52;   /* vocabulary */
  --hy-pitfall: #b0761f;   /* pitfall */
  --hy-ink:     #1c1c1c;
  --hy-paper:   #fbfaf7;
  --hy-muted:   #6e6a63;
}
```

Three colours are three block types and nothing else. Colour carries information; it does not decorate.

---

## 6. Flashcards: data, Anki, Quizlet

### 6.1 Roles

| Layer | Role |
|---|---|
| `data/*.tsv` in the repository | Single source of truth. Edited by hand |
| Anki | Repetition engine. Schedule, statistics, desktop + phone |
| Quizlet | Trainer for short sessions and Match / Write modes. Linked from the lesson |

Anki and Quizlet are not synchronised with each other. Both are generated from the TSV. A discrepancy is fixed by regenerating, never by editing in the app.

### 6.2 Data format

`data/vocab.tsv`:

```
id	hy	en	phrase_hy	phrase_en	lesson	tags	note
v0142	հաց	bread	Հաց եմ գնում	I am buying bread	7	noun,food	
v0143	հոգնած	tired			7	adjective,feelings	pron. հոքնած
```

- `tags`: a part-of-speech tag first (`noun`, `verb`, `adjective`, `adverb`, `pronoun`, `numeral`, `postposition`, `conjunction`, `question`, `phrase`, `other`), then topic tags. Topic tags drive the generated vocabulary pages; the list of topics is in `scripts/build_vocab_pages.py`.
- `note`: pronunciation (`pron. …`), register (`spoken`, `formal`), literal meaning (`lit. …`).
- `lesson`: site lesson number.
- Duplicated headwords are allowed only when the meaning differs.

`data/grammar.tsv` — transformation cards:

```
id	prompt	answer	rule	lesson	tags
g0031	գիրք → plural	գրքեր	plural	14	plural,irregular
```

`rule` is the slug of a page in `grammar/`, so the card links to the reference.

### 6.3 Anki note types

**Vocab — two cards per word:**

- Recognition: `հաց` → `bread`
- Production: `bread` → `հաց`

Both show `phrase_hy` + `phrase_en` on the back. Context on the back, not the front: otherwise the phrase gives the answer away.

**Grammar — one card, one direction:**

`գիրք → plural` → `գրքեր`

No reverse direction. From a plural back to the singular the answer is often ambiguous and the card becomes unfair.

### 6.4 Anki settings

| Setting | Value |
|---|---|
| Scheduler | FSRS |
| Desired retention | **0.90** |
| Days to simulate (when optimising) | 1825 (5 years) |
| New cards/day | 10 at the start; raise only when the review queue is consistently cleared |
| Maximum interval | 365 |
| Bury related | on (recognition and production of one word not on the same day) |

FSRS is the scheduling algorithm that became standard in Anki 23.10; it was trained on 700 million reviews from 20 000 users and gives 20–30% fewer reviews than SM-2 at the same retention. 0.90 is the authors' recommendation: a review is scheduled when the predicted recall probability drops to that value, so recall oscillates between 100% and 90%. The 5-year horizon is what the developers call reasonable for language learners.

Optimise parameters after 1000+ reviews, not earlier.

### 6.5 Naming

```
Anki:    hy::vocab::L07
         hy::grammar::plural

Quizlet: HY · L07
         HY · Grammar: plural
```

Hierarchical in Anki, flat in Quizlet — Quizlet has no nesting.

### 6.6 Building a set

**Size: 20–30 cards.** Kornell (2009) showed a counter-intuitive result: one large stack beats four small ones because it lengthens the gap between repetitions of the same card within a session — in a stack of 20 the repetitions of one card are separated by 19 others. 90% of participants showed the effect, while 72% believed the opposite after the first session. Nation gives a consistent range: 15–20 at the start, up to 50 when it gets easier.

**Do not build a set from a semantic cluster.** Tinkham contrasts semantic clusters (eye, nose, ear, mouth: one field, one class) with thematic ones (frog, green, jump, pond, slippery) and predicts the second is learned more easily; Tinkham, Waring and Finkbeiner & Nicol agree that words in semantically related sets are harder to learn. Caveat: later studies gave mixed results. The cost is zero, so: a set "in the shop" (bread, expensive, give me, thank you, change) rather than a set "10 colours". Sets are therefore per lesson, not per topic.

**Do not put look-alike words in one set.** Nation: avoid interference between items similar in form. For Armenian this matters: ո / օ, ղ / դ, ձ / ծ / ց.

**Every card carries a phrase when the lesson supplied one.** See §6.3.

### 6.7 Schedule

FSRS computes the schedule; intervals are not set by hand. What is required from you:

- **A daily session**, short. Any form of spacing beats massed repetition; do not worry whether the gaps are equal.
- **Rule of three sessions.** Rawson & Dunlosky, after three experiments, recommend reaching a criterion of 3 correct recalls at first study, then relearning 3 times at widely spaced intervals. The effect is large: 20% recall a week after one session against 80% after relearning three times to mastery. After the third time the gain diminishes — four or five sessions did not retain better after a month. In practice: a new set is run on the day of the lesson, the next day and three days later, then handed to FSRS.
- **Horizon.** The optimal review gap is 10–20% of the retention period: from 20–40% for a one-week delay to 5–10% for a year (Cepeda et al., 2008). For a language the horizon is "forever", so intervals must reach months. Do not set the maximum interval below a year.

---

## 7. Anatomy of a grammar page

```markdown
# Future with կ-

> **One line.** կ + stem + personal ending.

## Formation
Formula, 2 worked examples

## Paradigm
Tabs: affirmative / negative (question only when it was taught)

## Usage
2–4 bullets, each with an example

## Notes and exceptions
Table, if any

## My mistakes
Collected from lessons

## Related
Other grammar pages

## Flashcards
`hy::grammar::future-k`

## Introduced
Lesson 28
```

The "One line" section at the top is mandatory: in 90% of visits to the reference that is all that is needed, and it must be visible without scrolling.

---

## 8. Anatomy of a how-to page

The most applied section. The format is a ready dialogue script, not an explanation.

```markdown
# Tell the time

## Script

**You:** Ժամը քանի՞սն է։
*What time is it?*

**Them:** Ութն անց կես է։
*It is half past eight.*

## Variants
Table: question → answer pattern

## Grammar you need
[Telling the time](../grammar/telling-time.md)
```

No grammar explanations inside a how-to. Only links. Diátaxis warns separately that authors of tutorials tend to overload them with explanation; give the minimum on the spot and link to the full article.

---

## 9. Checklist for adding a lesson

```
□ Create lessons/LNN.md from the template (§4)
□ Fill front matter: date, source_lesson, grammar
□ Topics line
□ New words → vocab block + rows in data/vocab.tsv (same words, same glosses)
□ Grammar → rule block + link into grammar/
   └ new topic: create grammar/<slug>.md and add it to grammar/.pages and grammar/index.md
□ Dialogue / text / examples from the tutor, if any
□ Exercises: prompts only; parenthesised words → second vocab block + TSV rows
□ Homework the tutor set
□ Mistake made in class (if any) → pitfall block
   └ duplicate in grammar/<slug>.md § My mistakes
□ python scripts/build_vocab_pages.py
□ python scripts/build_decks.py
□ Import dist/armenian.apkg into Anki
□ Create the Quizlet set from dist/quizlet/LNN.tsv, paste the link
□ Add the lesson row to lessons/index.md
□ Run the set on the day of the lesson
□ git push
```

If the checklist is regularly not completed, shorten the checklist rather than force yourself.

---

## 10. Deferred decisions

Not to be decided now; return when there are 60+ lessons:

- Audio. How to store it, where to get it, whether to put it into Anki. Needs a separate pipeline.
- Tags and cross-navigation in vocabulary beyond topic pages. While the list is short, Material's search suffices.
- Splitting vocabulary into active and passive.
- The "Explanation" section (why the language is built this way) — low priority, see §0.
- Question forms in paradigms: they were never taught as a separate pattern; add when they are.

---

## 11. Sources

**Visual design and cognitive load**

- Mayer, R. E. (2021). *Multimedia Learning*, 3rd ed. Cambridge University Press. 15 principles based on more than 200 experiments. Key for this project: coherence, signaling, spatial contiguity, segmenting, pre-training.
- Mayer, R. E. (ed.). *The Cambridge Handbook of Multimedia Learning*, 2nd ed. Chapters by Mayer & Fiorella (principles for reducing extraneous processing) and Mayer & Pilegard (segmenting, pre-training, modality).
- Sweller, J. (1988). Cognitive load theory.

**Lesson structure**

- Rosenshine, B. (2012). Principles of Instruction. *American Educator*, 36(1), 12–19. Ten principles; 5–8 minutes of opening review; presentation in small steps.

**What works in self-study**

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving Students' Learning With Effective Learning Techniques. *Psychological Science in the Public Interest*, 14(1), 4–58. Practice testing and distributed practice rated highest; highlighting and rereading lowest.

**Vocabulary and flashcards**

- Nation, I. S. P. *Learning Vocabulary in Another Language*. Cambridge University Press. Stack size 15–20 → up to 50; retrieval rather than recognition; avoiding interference; shuffling; learning in phrases.
- Kornell, N. (2009). Optimising learning using flashcards: Spacing is more effective than cramming. *Applied Cognitive Psychology*, 23(9), 1297–1317. https://doi.org/10.1002/acp.1537
- Tinkham, T. (1997). The effects of semantic and thematic clustering on the learning of second language vocabulary. *Second Language Research*, 13, 138–163.
- Waring, R. (1997). The negative effects of learning words in semantic sets: a replication. *System*, 25, 261–274.
- Nakata & Suzuki (2019), *Studies in Second Language Acquisition* — review noting mixed results of later studies on semantic clustering.

**Spaced repetition**

- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science*, 19(11), 1095–1102. https://doi.org/10.1111/j.1467-9280.2008.02209.x
- Karpicke, J. D., & Roediger, H. L. (2007). Expanding retrieval practice promotes short-term retention, but equally spaced retrieval enhances long-term retention. *JEP: LMC*, 33, 704–719.
- Kang, S. H. K., Lindsey, R. V., Mozer, M. C., & Pashler, H. (2014). Retrieval practice over the long term: Should spacing be expanding or equal-interval? *Psychonomic Bulletin & Review*, 21(6), 1544–1550.
- Rawson, K. A., & Dunlosky, J. (2011). Optimizing schedules of retrieval practice for durable and efficient learning: How much is enough? *JEP: General*.
- Rawson, K. A., & Dunlosky, J. (2022). Successive relearning: An underexplored but potent technique. *Current Directions in Psychological Science*, 31(4), 362–368.
- FSRS: https://github.com/open-spaced-repetition/fsrs4anki/wiki — "The Optimal Retention", "The Algorithm".

**Architecture and typography**

- Diátaxis: https://diataxis.fr — tutorials / how-to / reference / explanation.
- Bringhurst, R. *The Elements of Typographic Style*. 45–75 characters per line, 66 as the target.
- WCAG 2.1, Success Criterion 1.4.8 Visual Presentation. Ceiling of 80 characters, line height 1.5em.
- MkDocs Material: https://squidfunk.github.io/mkdocs-material/

---

## Changes from version 1.0

Decisions taken when the base was first built (September 2026):

- **English everywhere.** Version 1.0 prescribed a Russian interface. Russian is now confined to translations where it is the sharper equivalent.
- **No transliteration.** The `translit` column and the plan to phase it out by lesson 25–30 are gone; pronunciation notes use Armenian letters (`pron. հոքնած`).
- **Three block types instead of five.** The "Goal" (can-do), "Warm-up" and "Self-check" blocks were removed from the lesson anatomy; retrieval practice lives in Anki. The closed list is now rule / vocab / pitfall.
- **Exercises are prompts only.** Homework is solved on paper and not published; answers never appear on the site.
- **Words in parentheses inside exercise prompts** count as new vocabulary and get their own block and TSV rows.
- **Vocabulary pages are generated** from `data/vocab.tsv` by a script, so the glossary cannot drift from the card data.
- **Lessons are renumbered** continuously; sessions without notes were dropped. The tutor's number is kept in `source_lesson`.
- **Flashcard sets are per lesson** (`hy::vocab::L07`), following §6.6.
