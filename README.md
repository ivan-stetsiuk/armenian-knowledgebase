# Armenian Knowledge Base

Personal Eastern Armenian reference built from tutor lessons. Published with MkDocs Material to GitHub Pages:
**https://ivan-stetsiuk.github.io/armenian-knowledgebase/**

- `docs/lessons/` — one page per lesson: new words, rules in one line, exercise prompts.
- `docs/grammar/` — reference, one topic per page.
- `docs/vocabulary/` — generated from `data/vocab.tsv`, do not edit by hand.
- `docs/how-to/` — ready dialogue scripts.
- `docs/guidelines.md` — how the site is structured and why.
- `data/vocab.tsv`, `data/grammar.tsv` — single source of truth for flashcards.
- `dist/armenian.apkg`, `dist/quizlet/` — generated Anki package and Quizlet import files.

## Local build

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/check.py               # repository invariants
.venv/bin/python scripts/build_vocab_pages.py   # TSV → docs/vocabulary
.venv/bin/python scripts/build_decks.py         # TSV → dist/
.venv/bin/mkdocs serve                          # http://127.0.0.1:8000
```

`scripts/check.py` and `mkdocs build --strict` must pass before pushing. CI runs both and also fails if `docs/vocabulary` is out of date with `data/vocab.tsv`.

## Adding a lesson

Follow the checklist in `docs/guidelines.md` §9. In short: copy a lesson page, fill it in, add rows to `data/vocab.tsv`, run the two scripts, add the row to `docs/lessons/index.md`, push.

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and deploys with GitHub Pages actions. One-time setup: in the repository settings, **Pages → Build and deployment → Source: GitHub Actions**.

## Import into Anki

Anki → File → Import → `dist/armenian.apkg`. Re-importing after a rebuild updates existing cards (note GUIDs come from the TSV ids). Recommended settings are in `docs/guidelines.md` §6.4.
