# Armenian Knowledge Base

A personal Eastern Armenian reference built from lessons with a tutor. Astro, deployed to GitHub Pages:
**https://ivan-stetsiuk.github.io/armenian-knowledgebase/**

```
src/content/lessons/   one page per lesson: new words, rules in one line, exercise prompts
src/content/grammar/   reference pages, each opening with the rule in one line
src/content/howto/     ready dialogue scripts
src/lib/               the ordering registries: which grammar group, which running order
src/plugins/           remark/rehype: directives → HTML, base paths, image sizing
src/layouts/           Base (head, header, client scripts) and Doc (rails, pager)
src/pages/             one route per section, index + [slug]
data/vocab.tsv         single source of truth for words — the site and Anki both read it
data/grammar.tsv       transformation cards
decks/                 generated flashcards, committed on purpose
public/admin/          Decap CMS, the browser editor at /admin/
scripts/               invariant checks and the flashcard build
```

[ARCHITECTURE.md](ARCHITECTURE.md) has the diagrams: what feeds what, and where each
invariant is enforced.

## Local

```bash
npm install
npm run dev                                  # http://localhost:4321/armenian-knowledgebase/
npm run build                                # astro build + pagefind search index
npm run check                                # astro check — types across .astro and src/lib
python3 scripts/check.py                     # repository invariants
python3 scripts/build_decks.py               # data/*.tsv → decks/
```

The flashcard build needs `pip install -r requirements.txt`; nothing else does.

CI runs all four on every push to `main`, plus two checks that only exist there:
that every directive in the content reached the page as the markup it means, and
that `decks/` still matches `data/*.tsv` — it is generated output under version
control, so an edit through the CMS can leave it behind.

**Editing a remark or rehype plugin?** Delete `node_modules/.astro` first. Astro's content layer caches rendered markdown between builds and does not invalidate it when a plugin changes, so a local build will keep serving the old HTML and a fix will look like it did nothing.

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

`python3 scripts/build_decks.py` writes `decks/armenian.apkg` (decks `hy::vocab::LNN` and `hy::grammar::<topic>`) and Quizlet import files. Re-importing updates existing cards rather than duplicating them, because note GUIDs come from the TSV ids.
