#!/usr/bin/env python3
"""Validate the repository's own invariants, beyond what `mkdocs build --strict` catches.

  1. Lesson front matter: lesson number matches the file name, date is a real date,
     source_lesson present, grammar slugs point at existing grammar pages.
  2. Lesson numbering is continuous and dates increase with the lesson number.
  3. Every lesson referenced in data/vocab.tsv has a page, and vice versa.
  4. Only the three allowed admonition types are used (rule / vocab / pitfall) and at
     most one pitfall per lesson.
  5. Grammar pages never link back to lessons and always open with a "One line" summary.
  6. data/grammar.tsv rule slugs point at existing grammar pages.

Exit code 1 and a list of problems if anything fails.
"""
from __future__ import annotations

import csv
import datetime as dt
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "docs" / "lessons"
GRAMMAR = ROOT / "docs" / "grammar"

ALLOWED_BLOCKS = {"rule", "vocab", "pitfall"}
problems: list[str] = []


def fail(msg: str) -> None:
    problems.append(msg)


def front_matter(text: str) -> dict[str, str]:
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def check_lessons(grammar_slugs: set[str]) -> set[int]:
    numbers: dict[int, dt.date] = {}
    for path in sorted(LESSONS.glob("L*.md")):
        rel = path.relative_to(ROOT)
        text = path.read_text(encoding="utf-8")
        fm = front_matter(text)
        if not fm:
            fail(f"{rel}: no front matter")
            continue

        try:
            number = int(fm.get("lesson", ""))
        except ValueError:
            fail(f"{rel}: lesson must be an integer, got {fm.get('lesson')!r}")
            continue
        if number != int(path.stem[1:]):
            fail(f"{rel}: front matter lesson {number} does not match the file name")

        try:
            date = dt.date.fromisoformat(fm.get("date", ""))
        except ValueError:
            fail(f"{rel}: date must be YYYY-MM-DD, got {fm.get('date')!r}")
            continue
        numbers[number] = date

        if not fm.get("source_lesson", "").isdigit():
            fail(f"{rel}: source_lesson missing or not a number")

        for slug in re.findall(r"[a-z0-9-]+", fm.get("grammar", "")):
            if slug not in grammar_slugs:
                fail(f"{rel}: front matter names unknown grammar page {slug!r}")

        blocks = re.findall(r"^\s*(?:!!!|\?\?\?\+?)\s+([a-z]+)", text, re.M)
        for block in blocks:
            if block not in ALLOWED_BLOCKS and block != "note":
                fail(f"{rel}: block type {block!r} is not one of {sorted(ALLOWED_BLOCKS)} (or a `??? note` collapsible)")
        if blocks.count("pitfall") > 1:
            fail(f"{rel}: {blocks.count('pitfall')} pitfall blocks, at most one per lesson")

    if numbers:
        expected = set(range(1, max(numbers) + 1))
        missing = sorted(expected - set(numbers))
        if missing:
            fail(f"lesson numbering has holes: {missing}")
        ordered = [numbers[n] for n in sorted(numbers)]
        for (a_n, a), (b_n, b) in zip(sorted(numbers.items()), sorted(numbers.items())[1:]):
            if b < a:
                fail(f"lesson {b_n} ({b}) is dated before lesson {a_n} ({a})")
        del ordered
    return set(numbers)


def check_grammar() -> set[str]:
    slugs = set()
    for path in sorted(GRAMMAR.glob("*.md")):
        if path.name == "index.md":
            continue
        rel = path.relative_to(ROOT)
        slugs.add(path.stem)
        text = path.read_text(encoding="utf-8")
        if "../lessons/" in text or "](lessons/" in text:
            fail(f"{rel}: grammar pages must not link to lessons")
        if not re.search(r"^>\s*\*\*One line", text, re.M):
            fail(f"{rel}: missing the mandatory '> **One line.**' summary")
    return slugs


def check_data(lesson_numbers: set[int], grammar_slugs: set[str]) -> None:
    vocab = ROOT / "data" / "vocab.tsv"
    if vocab.exists():
        with vocab.open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
        used = {int(r["lesson"]) for r in rows if r["lesson"].isdigit()}
        for n in sorted(used - lesson_numbers):
            fail(f"data/vocab.tsv: lesson {n} has words but no page")
        for n in sorted(lesson_numbers - used):
            fail(f"data/vocab.tsv: lesson {n} has a page but no words")

    grammar = ROOT / "data" / "grammar.tsv"
    if grammar.exists():
        with grammar.open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
        for slug in sorted({r["rule"] for r in rows} - grammar_slugs):
            fail(f"data/grammar.tsv: cards point at unknown grammar page {slug!r}")


def main() -> None:
    grammar_slugs = check_grammar()
    lesson_numbers = check_lessons(grammar_slugs)
    check_data(lesson_numbers, grammar_slugs)

    if problems:
        print("\n".join(f"error: {p}" for p in problems), file=sys.stderr)
        sys.exit(1)
    print(f"ok: {len(lesson_numbers)} lessons, {len(grammar_slugs)} grammar pages, invariants hold")


if __name__ == "__main__":
    main()
