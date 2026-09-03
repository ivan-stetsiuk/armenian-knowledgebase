#!/usr/bin/env python3
"""One-time migration: merge data/parts/*.tsv into data/vocab.tsv and data/grammar.tsv.

Assigns stable ids (v0001…, g0001…) in lesson order, drops exact duplicates
(same Armenian headword; first occurrence wins) and reports what it did.
After the merge the parts directory is no longer needed: edit data/*.tsv directly.
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTS = ROOT / "data" / "parts"
VOCAB_COLS = ["hy", "en", "phrase_hy", "phrase_en", "lesson", "tags", "note"]
GRAMMAR_COLS = ["prompt", "answer", "rule", "lesson", "tags"]


def read_tsv(path: Path, cols: list[str]) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE)
        header = next(reader, None)
        if header is None:
            return rows
        header = [h.strip() for h in header]
        if header != cols:
            sys.exit(f"{path}: header {header} != {cols}")
        for n, raw in enumerate(reader, start=2):
            if not any(c.strip() for c in raw):
                continue
            if len(raw) != len(cols):
                sys.exit(f"{path}:{n}: expected {len(cols)} fields, got {len(raw)}: {raw}")
            row = {c: v.strip() for c, v in zip(cols, raw)}
            row["_src"] = f"{path.name}:{n}"
            rows.append(row)
    return rows


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def lesson_key(path: Path) -> int:
    m = re.search(r"L(\d+)", path.name)
    return int(m.group(1)) if m else 0


def merge_vocab() -> None:
    files = sorted(PARTS.glob("vocab_L*.tsv"), key=lesson_key)
    seen: dict[str, dict] = {}
    out, dups = [], []
    for path in files:
        for row in read_tsv(path, VOCAB_COLS):
            if not row["hy"]:
                continue
            key = norm(row["hy"])
            if key in seen:
                first = seen[key]
                # enrich the kept row: fill empty phrase/note, union the topic tags
                for col in ("phrase_hy", "phrase_en", "note"):
                    if not first[col] and row[col]:
                        first[col] = row[col]
                tags = [t.strip() for t in first["tags"].split(",") if t.strip()]
                for t in (t.strip() for t in row["tags"].split(",")):
                    if t and t not in tags:
                        tags.append(t)
                first["tags"] = ",".join(tags)
                dups.append((row["_src"], row["hy"], first["_src"]))
                continue
            seen[key] = row
            out.append(row)
    out.sort(key=lambda r: (int(r["lesson"]), 0))
    dest = ROOT / "data" / "vocab.tsv"
    with dest.open("w", encoding="utf-8", newline="") as f:
        f.write("\t".join(["id", *VOCAB_COLS]) + "\n")
        for i, row in enumerate(out, start=1):
            f.write("\t".join([f"v{i:04d}", *(row[c] for c in VOCAB_COLS)]) + "\n")
    print(f"vocab: {len(out)} rows from {len(files)} files → {dest.relative_to(ROOT)}")
    if dups:
        print(f"  dropped {len(dups)} duplicate headwords (first occurrence kept):")
        for src, hy, first in dups:
            print(f"    {src}: {hy}  (already in {first})")


def merge_grammar() -> None:
    files = sorted(PARTS.glob("grammar_*.tsv"))
    seen: set[tuple[str, str]] = set()
    out = []
    for path in files:
        for row in read_tsv(path, GRAMMAR_COLS):
            key = (norm(row["prompt"]), row["rule"])
            if key in seen or not row["prompt"]:
                continue
            seen.add(key)
            out.append(row)
    out.sort(key=lambda r: (int(r["lesson"] or 0), r["rule"]))
    dest = ROOT / "data" / "grammar.tsv"
    with dest.open("w", encoding="utf-8", newline="") as f:
        f.write("\t".join(["id", *GRAMMAR_COLS]) + "\n")
        for i, row in enumerate(out, start=1):
            f.write("\t".join([f"g{i:04d}", *(row[c] for c in GRAMMAR_COLS)]) + "\n")
    print(f"grammar: {len(out)} rows from {len(files)} files → {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    merge_vocab()
    merge_grammar()
