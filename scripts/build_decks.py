#!/usr/bin/env python3
"""Build Anki decks and Quizlet import files from data/*.tsv.

  decks/armenian.apkg         one package, decks hy::vocab::LNN and hy::grammar::<rule>
  decks/quizlet/LNN.tsv       term<TAB>definition per lesson, paste into Quizlet import
  decks/quizlet/grammar-<rule>.tsv

The output is committed on purpose: the point is to open Anki and import, not to
install Python first.

Vocab: two cards per word (recognition հայ→en, production en→հայ); the phrase is on the back only.
Grammar: one card, prompt → answer, back links to the grammar page.
Note GUIDs come from the TSV id, so re-importing updates cards instead of duplicating them.
"""
from __future__ import annotations

import csv
import hashlib
import sys
from collections import defaultdict
from pathlib import Path

import genanki

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "decks"
SITE = "https://ivan-stetsiuk.github.io/armenian-knowledgebase"

CSS = """
.card { font-family: "Noto Sans Armenian", "Noto Sans", sans-serif; font-size: 22px; text-align: center;
        color: #1c1c1c; background: #fbfaf7; line-height: 1.6; }
.hy { font-size: 1.25em; }
.phrase { margin-top: 1em; font-size: 0.85em; color: #6e6a63; }
.note { font-size: 0.75em; color: #6e6a63; }
.rule a { color: #2f5d8a; font-size: 0.8em; }
hr { border: 0; border-top: 1px solid #ddd; margin: 1em 2em; }
"""


def stable_id(name: str) -> int:
    return int(hashlib.sha1(name.encode()).hexdigest()[:10], 16)


VOCAB_MODEL = genanki.Model(
    stable_id("hy-vocab-model-v1"),
    "HY Vocab",
    fields=[{"name": f} for f in ("Armenian", "English", "PhraseHy", "PhraseEn", "Note", "Lesson", "Id")],
    templates=[
        {
            "name": "Recognition",
            "qfmt": '<div class="hy">{{Armenian}}</div>',
            "afmt": '{{FrontSide}}<hr>{{English}}<div class="note">{{Note}}</div>'
                    '<div class="phrase"><span class="hy">{{PhraseHy}}</span><br>{{PhraseEn}}</div>',
        },
        {
            "name": "Production",
            "qfmt": "{{English}}",
            "afmt": '{{FrontSide}}<hr><div class="hy">{{Armenian}}</div><div class="note">{{Note}}</div>'
                    '<div class="phrase"><span class="hy">{{PhraseHy}}</span><br>{{PhraseEn}}</div>',
        },
    ],
    css=CSS,
)

GRAMMAR_MODEL = genanki.Model(
    stable_id("hy-grammar-model-v1"),
    "HY Grammar",
    fields=[{"name": f} for f in ("Prompt", "Answer", "Rule", "Lesson", "Id")],
    templates=[
        {
            "name": "Transform",
            "qfmt": '<div class="hy">{{Prompt}}</div>',
            "afmt": '{{FrontSide}}<hr><div class="hy">{{Answer}}</div>'
                    f'<div class="rule"><a href="{SITE}/grammar/{{{{Rule}}}}/">{{{{Rule}}}}</a></div>',
        }
    ],
    css=CSS,
)


class Note(genanki.Note):
    @property
    def guid(self):  # stable across rebuilds
        return genanki.guid_for(self.fields[-1])


def read(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
    return [{k: (v or "").strip() for k, v in r.items()} for r in rows]


def main() -> None:
    vocab = read(ROOT / "data" / "vocab.tsv")
    grammar = read(ROOT / "data" / "grammar.tsv")
    DIST.mkdir(exist_ok=True)
    (DIST / "quizlet").mkdir(exist_ok=True)

    decks: dict[str, genanki.Deck] = {}

    def deck(name: str) -> genanki.Deck:
        if name not in decks:
            decks[name] = genanki.Deck(stable_id(name), name)
        return decks[name]

    quizlet: dict[str, list[tuple[str, str]]] = defaultdict(list)

    for r in vocab:
        lesson = int(r["lesson"])
        name = f"hy::vocab::L{lesson:02d}"
        tags = [t.strip() for t in r["tags"].split(",") if t.strip()] + [f"L{lesson:02d}"]
        deck(name).add_note(Note(
            model=VOCAB_MODEL,
            fields=[r["hy"], r["en"], r["phrase_hy"], r["phrase_en"], r["note"], str(lesson), r["id"]],
            tags=tags,
        ))
        definition = r["en"]
        if r["note"]:
            definition += f" ({r['note']})"
        if r["phrase_hy"]:
            definition += f" · {r['phrase_hy']}" + (f" — {r['phrase_en']}" if r["phrase_en"] else "")
        quizlet[f"L{lesson:02d}"].append((r["hy"], definition))

    for r in grammar:
        name = f"hy::grammar::{r['rule']}"
        tags = [t.strip() for t in r["tags"].split(",") if t.strip()] + [f"L{int(r['lesson'] or 0):02d}"]
        deck(name).add_note(Note(
            model=GRAMMAR_MODEL,
            fields=[r["prompt"], r["answer"], r["rule"], r["lesson"], r["id"]],
            tags=tags,
        ))
        quizlet[f"grammar-{r['rule']}"].append((r["prompt"], r["answer"]))

    pkg = genanki.Package(list(decks.values()))
    out = DIST / "armenian.apkg"
    pkg.write_to_file(str(out))

    for name, pairs in quizlet.items():
        with (DIST / "quizlet" / f"{name}.tsv").open("w", encoding="utf-8", newline="") as f:
            for term, definition in pairs:
                f.write(f"{term}\t{definition}\n")

    print(f"{out.relative_to(ROOT)}: {len(decks)} decks, {len(vocab)} vocab notes ({2*len(vocab)} cards), "
          f"{len(grammar)} grammar notes; {len(quizlet)} Quizlet files in decks/quizlet/")


if __name__ == "__main__":
    main()
