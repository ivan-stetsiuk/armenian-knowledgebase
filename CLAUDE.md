# Working in this repository

Read these before changing anything, in this order:

1. **[GUIDELINES.md](GUIDELINES.md)** for anything visual. The type scale, the
   space scale, the measure, targets, contrast, glass, Armenian, prose. Values
   come from tokens in `:root`; a number typed by hand is a bug.
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** for anything structural. It has the
   pipelines, the registries in `src/lib`, where each invariant is enforced, and
   an extension-points table for adding a lesson, a rule, a topic or a check.
   Keep it current in the same commit as the change it describes.

## Before you push

```bash
python3 scripts/check.py          # repository invariants
python3 scripts/check_design.py   # the type and space scales
npm run check                     # types across .astro and src/lib
npm run build                     # astro build, then pagefind
```

`data/*.tsv` changed? Run `python3 scripts/build_decks.py` and commit `decks/`
with it, or CI fails on stale flashcards.

## House rules

* A page added is a registry entry added, in the same commit. `scripts/check.py`
  fails the build otherwise, because a page missing from its index renders fine
  and is simply never linked.
* No transliteration, no answer keys, and no links from a grammar page back to a
  lesson.
* Comments say why, not what. The reason a value is what it is outlives the
  value.
* No em dashes in interface text, documentation or comments. Use a comma, a
  colon, a semicolon or parentheses. The dash between an Armenian phrase and its
  translation is a gloss convention and stays.
