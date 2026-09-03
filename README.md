# Armenian Knowledge Base

A personal Eastern Armenian reference built from lessons with a tutor. Astro, deployed to GitHub Pages:
**https://ivan-stetsiuk.github.io/armenian-knowledgebase/**

```
src/content/lessons/   one page per lesson: new words, rules in one line, exercise prompts
src/content/grammar/   34 reference pages, each opening with the rule in one line
src/content/howto/     ready dialogue scripts
src/content/pages/     the project guidelines
data/vocab.tsv         single source of truth for words — the site and Anki both read it
data/grammar.tsv       transformation cards
public/admin/          Decap CMS, the browser editor at /admin/
scripts/               invariant checks and the flashcard build
```

## Local

```bash
npm install
npm run dev                                  # http://localhost:4321/armenian-knowledgebase/
npm run build                                # astro build + pagefind search index
python3 scripts/check.py                     # repository invariants
python3 scripts/build_decks.py               # data/*.tsv → dist Anki package
```

`scripts/check.py` and `npm run build` both run in CI on every push to `main`.

## Content format

Pages are plain Markdown so the CMS can round-trip them. Four constructs are special:

```markdown
::::rule{title="Postpositions take the genitive"}
**The postposition follows its noun, and the noun stands in the genitive.**

:::example
Պայուսակը սեղանի վրա է։ — The bag is on the table.
:::

Full list → [Postpositions](/grammar/postpositions/)
::::

:::vocab{title="New words — class"}
| Armenian | English | Phrase |
|---|---|---|
:::

:::details{title="All irregular forms"} … :::

::::tabs
:::tab{name="Affirmative"} … :::
:::tab{name="Negative"} … :::
::::
```

**An outer block needs more colons than anything inside it.** `scripts/check.py` fails the build if it does not, because remark would otherwise close the outer block at the first inner fence.

Links are written root-relative (`/grammar/genitive/`); the base path for GitHub Pages is added at build time.

## Editing from the site

`/admin/` is Decap CMS. It commits to this repository and opens a pull request per change.

One-time setup, because GitHub Pages cannot hold an OAuth secret:

1. Create a GitHub OAuth app (Settings → Developer settings → OAuth Apps). Homepage: the site URL. Callback: `https://<your-worker>.workers.dev/callback`.
2. Deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) as a Cloudflare Worker (free) and set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `ALLOWED_DOMAINS=ivan-stetsiuk.github.io`.
3. Put the worker address in `base_url` in `public/admin/config.yml`.

Until step 3 is done, `/admin/` loads but cannot sign in. Everything else works.

## Deployment

One-time: repository Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## Anki

`python3 scripts/build_decks.py` writes `dist/armenian.apkg` (decks `hy::vocab::LNN` and `hy::grammar::<topic>`) and Quizlet import files. Re-importing updates existing cards rather than duplicating them, because note GUIDs come from the TSV ids. Recommended settings are in the [guidelines](https://ivan-stetsiuk.github.io/armenian-knowledgebase/guidelines/).
