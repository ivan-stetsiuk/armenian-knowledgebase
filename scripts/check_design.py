#!/usr/bin/env python3
"""The design system, enforced.

GUIDELINES.md states the scales; this is what makes them true. Every font size,
line height, margin, padding and gap in the stylesheets has to come from a
token, because a value written by hand is exactly how a design system stops
being one: nobody notices 0.42rem, and six months later there are nine spacing
values that are almost 8px.

Run: python3 scripts/check_design.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "src/styles/global.css",
    "src/components/WordTable.astro",
    "src/pages/vocabulary/index.astro",
]

PROPS = re.compile(
    r"(?P<prop>font-size|line-height|margin|margin-top|margin-bottom|margin-left|margin-right"
    r"|margin-inline|margin-block|margin-block-start|padding|padding-top|padding-bottom"
    r"|padding-left|padding-right|padding-inline|padding-block|gap|row-gap|column-gap)\s*:\s*(?P<val>[^;{}]+);"
)

# A length that is not a token and not zero.
LITERAL = re.compile(r"(?<![\w-])(-?\d*\.?\d+)(rem|em|px)\b")

FREE = {"0", "auto", "inherit", "initial", "none", "normal", "1", "50%", "100%"}

# Values that are deliberately not on the scale, each with its reason. Anything
# else that wants an exception has to be argued for here, in writing.
ALLOWED = {
    # The Armenian face runs small beside Helvetica and has to follow whatever
    # Latin context it is quoted inside, so this one size is relative.
    "font-size: 1.06em",
    # Inherited so a heading hidden from sight is not also a different size.
    "font-size: inherit",
    "font-size: 1em",
    # The standard visually-hidden clip, which needs its own pixel.
    "margin: -1px",
    "padding: 0",
}


def literals(value: str) -> list[str]:
    v = value.strip()
    if v in FREE:
        return []
    return [m.group(0) for m in LITERAL.finditer(v)]


def main() -> int:
    problems: list[str] = []

    for name in FILES:
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        # Comments carry prose, and prose carries numbers.
        text = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)

        for i, line in enumerate(text.splitlines(), 1):
            for m in PROPS.finditer(line):
                prop, val = m.group("prop"), m.group("val").strip()
                decl = f"{prop}: {val}"
                if decl in ALLOWED:
                    continue
                bad = literals(val)
                if not bad:
                    continue
                token = "--t-" if prop == "font-size" else "--lh-" if prop == "line-height" else "--s-"
                problems.append(f"{name}:{i}  {decl}\n      off the scale: {', '.join(bad)} (use a var({token}…) token)")

    if problems:
        print("design: values outside the scale\n")
        for p in problems:
            print("  " + p)
        print(f"\n{len(problems)} to fix. The scales are in GUIDELINES.md.")
        return 1

    print("design: type and space are on the scale")
    return 0


if __name__ == "__main__":
    sys.exit(main())
