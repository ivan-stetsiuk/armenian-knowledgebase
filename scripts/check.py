#!/usr/bin/env python3
"""Validate the repository's own invariants: the ones the site build cannot see.

  1. Lesson front matter: the lesson number matches the file name, the date parses,
     and every grammar slug names a page that exists.
  2. Lesson numbering is continuous, and dates rise with the number.
  3. Every lesson with words has a page, and every lesson page has words.
  4. Directive fences nest correctly: an outer block must carry more colons than
     anything inside it, or remark closes it at the first inner `:::`.
  5. Grammar pages never link back to a lesson, and each opens with "One line".
  6. data/grammar.tsv points only at grammar pages that exist.
  7. The three ordering registries in src/lib cover every page and tag they are
     responsible for. Nothing renders a page that is missing from one. It just
     quietly stops appearing in its index, which is the kind of thing you find
     out about months later.

Exits 1 with a list of problems if anything fails.
"""
from __future__ import annotations

import csv
import datetime as dt
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "src" / "content" / "lessons"
GRAMMAR = ROOT / "src" / "content" / "grammar"
HOWTO = ROOT / "src" / "content" / "howto"

BLOCKS = {"rule", "vocab", "pitfall"}
problems: list[str] = []


def fail(msg: str) -> None:
    problems.append(msg)


def front_matter(text: str) -> tuple[dict[str, str], str]:
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        return {}, text
    out = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip().strip('"')
    return out, m.group(2)


def check_fences(rel: str, body: str) -> None:
    """A directive is closed by the first fence of the same length or longer, so
    a `:::rule` containing a `:::example` loses everything after the example."""
    stack: list[tuple[str, int, int]] = []
    for n, line in enumerate(body.split("\n"), start=1):
        m = re.match(r"^(:{3,})\s*([a-z]*)", line)
        if not m:
            continue
        colons, name = len(m.group(1)), m.group(2)
        if name:
            if stack and colons >= stack[-1][1]:
                fail(f"{rel}:{n}: `{name}` opens with {colons} colons inside "
                     f"`{stack[-1][0]}` which has {stack[-1][1]}; the outer block "
                     f"closes here instead of wrapping this one")
            stack.append((name, colons, n))
        else:
            while stack and stack[-1][1] > colons:
                stack.pop()
            if stack:
                stack.pop()
    for name, _, n in stack:
        fail(f"{rel}:{n}: `{name}` is never closed")


def check_lessons(grammar_slugs: set[str]) -> set[int]:
    numbers: dict[int, dt.date] = {}
    for path in sorted(LESSONS.glob("*.md")):
        rel = str(path.relative_to(ROOT))
        fm, body = front_matter(path.read_text(encoding="utf-8"))
        if not fm:
            fail(f"{rel}: no front matter")
            continue

        try:
            number = int(fm.get("lesson", ""))
        except ValueError:
            fail(f"{rel}: lesson must be an integer, got {fm.get('lesson')!r}")
            continue
        if f"l{number:02d}" != path.stem:
            fail(f"{rel}: front matter lesson {number} does not match the file name")

        try:
            numbers[number] = dt.date.fromisoformat(fm.get("date", ""))
        except ValueError:
            fail(f"{rel}: date must be YYYY-MM-DD, got {fm.get('date')!r}")

        for slug in re.findall(r"[a-z0-9-]+", fm.get("grammar", "")):
            if slug not in grammar_slugs:
                fail(f"{rel}: front matter names unknown grammar page {slug!r}")

        for name in re.findall(r"^:{3,}([a-z]+)", body, re.M):
            if name not in BLOCKS | {"details", "tabs", "tab", "example"}:
                fail(f"{rel}: unknown block type {name!r}")
        if len(re.findall(r"^:{3,}pitfall", body, re.M)) > 1:
            fail(f"{rel}: more than one pitfall block; at most one per lesson")

        check_fences(rel, body)

    if numbers:
        missing = sorted(set(range(1, max(numbers) + 1)) - set(numbers))
        if missing:
            fail(f"lesson numbering has holes: {missing}")
        ordered = sorted(numbers.items())
        for (an, a), (bn, b) in zip(ordered, ordered[1:]):
            if b < a:
                fail(f"lesson {bn} is dated before lesson {an}")
    return set(numbers)


def check_grammar() -> set[str]:
    slugs = set()
    for path in sorted(GRAMMAR.glob("*.md")):
        rel = str(path.relative_to(ROOT))
        slugs.add(path.stem)
        fm, body = front_matter(path.read_text(encoding="utf-8"))
        if not fm.get("title"):
            fail(f"{rel}: missing title in front matter")
        if "/lessons/" in body:
            fail(f"{rel}: grammar pages must not link to lessons")
        if not re.search(r"^>\s*\*\*One line", body, re.M):
            fail(f"{rel}: missing the mandatory '> **One line.**' summary")
        check_fences(rel, body)
    return slugs


def check_howto() -> None:
    for path in sorted(HOWTO.glob("*.md")):
        rel = str(path.relative_to(ROOT))
        fm, body = front_matter(path.read_text(encoding="utf-8"))
        if not fm.get("title"):
            fail(f"{rel}: missing title in front matter")
        check_fences(rel, body)


def ts_array(path: Path, name: str, pattern: str) -> set[str]:
    """Pull a list of slugs out of one of the TypeScript registries in src/lib.

    The registries live in TypeScript because that is where they are used, and
    they carry the comments explaining each ordering. Reading them from here
    means a mis-parse must fail loudly rather than silently find nothing:
    a check that quietly matches zero entries is worse than no check.
    """
    text = path.read_text(encoding="utf-8")
    start = text.find(f"export const {name}")
    if start == -1:
        fail(f"{path.relative_to(ROOT)}: cannot find `export const {name}`. "
             f"scripts/check.py needs updating alongside it")
        return set()
    end = text.find("];", start)
    found = set(re.findall(pattern, text[start:end], re.S))
    if not found:
        fail(f"{path.relative_to(ROOT)}: parsed no entries out of {name}. "
             f"the shape changed and scripts/check.py needs updating")
    return found


def check_registries(grammar_slugs: set[str]) -> None:
    lib = ROOT / "src" / "lib"

    # Grammar pages missing from GROUPS vanish from /grammar/ and break the pager.
    grouped = set()
    for block in re.findall(r"slugs:\s*\[(.*?)\]",
                            (lib / "grammar.ts").read_text(encoding="utf-8"), re.S):
        grouped |= set(re.findall(r'"([a-z0-9-]+)"', block))
    if not grouped:
        fail("src/lib/grammar.ts: parsed no slugs out of GROUPS. "
             "the shape changed and scripts/check.py needs updating")
    for slug in sorted(grammar_slugs - grouped):
        fail(f"src/lib/grammar.ts: grammar page {slug!r} is in no GROUPS entry, "
             f"so it appears in no index and has no place in the pager")
    for slug in sorted(grouped - grammar_slugs):
        fail(f"src/lib/grammar.ts: GROUPS names {slug!r}, which has no page")

    # Same for the how-to running order.
    howto_pages = {p.stem for p in HOWTO.glob("*.md")}
    ordered = ts_array(lib / "howto.ts", "HOWTO_ORDER", r'"([a-z0-9-]+)"')
    for slug in sorted(howto_pages - ordered):
        fail(f"src/lib/howto.ts: how-to page {slug!r} is missing from HOWTO_ORDER, "
             f"so it never appears in the index")
    for slug in sorted(ordered - howto_pages):
        fail(f"src/lib/howto.ts: HOWTO_ORDER names {slug!r}, which has no page")

    # A tag in neither list reaches no topic page: the word is still in the
    # table and still in Anki, but nothing links to it by subject.
    vocab = ROOT / "data" / "vocab.tsv"
    if not vocab.exists():
        return
    with vocab.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
    used: dict[str, int] = {}
    for r in rows:
        for tag in (t.strip() for t in (r.get("tags") or "").split(",")):
            if tag:
                used[tag] = used.get(tag, 0) + 1

    vocab_ts = lib / "vocab.ts"
    topics = ts_array(vocab_ts, "TOPICS", r'\[\s*"([a-z0-9-]+)"')
    non_topic = ts_array(vocab_ts, "NON_TOPIC_TAGS", r'"([a-z0-9-]+)"')
    declared = topics | non_topic
    for tag in sorted(set(used) - declared):
        fail(f"data/vocab.tsv: tag {tag!r} ({used[tag]} words) is in neither TOPICS "
             f"nor NON_TOPIC_TAGS in src/lib/vocab.ts: a typo, or a topic page "
             f"waiting to be declared")
    for tag in sorted(topics - set(used)):
        fail(f"src/lib/vocab.ts: TOPICS declares {tag!r}, which no word carries")


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
    check_howto()
    check_data(lesson_numbers, grammar_slugs)
    check_registries(grammar_slugs)

    if problems:
        print("\n".join(f"error: {p}" for p in problems), file=sys.stderr)
        sys.exit(1)
    print(f"ok: {len(lesson_numbers)} lessons, {len(grammar_slugs)} grammar pages, "
          f"registries complete, invariants hold")


if __name__ == "__main__":
    main()
