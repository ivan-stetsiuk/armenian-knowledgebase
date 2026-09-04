# Design guidelines

The rules every page here already follows. They exist so that a change made in
six months looks like it was made on the same day as the rest, and so that a
question like "how much space goes above a heading" has one answer instead of a
new one each time.

`scripts/check_design.py` enforces the two scales. Everything below it is a
rule the reader can see but a script cannot, so it is written down.

## Type

Seven steps, in rem against a 16px root. Nothing between them.

| Step | rem | Leading | Used for |
|---|---|---|---|
| 12 | `--t-12` 0.75 | `--lh-12` 16px | counts, notes inside a table |
| 14 | `--t-14` 0.875 | `--lh-14` 20px | labels, tables, rails, metadata |
| 17 | `--t-17` 1.0625 | `--lh-17` 28px | reading text, h3, every input |
| 21 | `--t-21` 1.3125 | `--lh-21` 28px | h2, the one-line summary, search field |
| 26 | `--t-26` 1.625 | `--lh-26` 32px | page title, small screens |
| 33 | `--t-33` 2.0625 | `--lh-33` 40px | wordmark, home contents |
| 41 | `--t-41` 2.5625 | `--lh-41` 44px | page title, the alphabet |

Leading is set in px rather than as a ratio, and every size times its leading is
a multiple of 4. A ratio against a step lands on fractions, and fractional
leading is what puts two columns of the same table a pixel out of step.

Reading text is 17px at 28px leading, which is 1.65. Body text never goes below
1.5, and never below 17px: a field set under 16px makes iOS zoom the page on
focus.

Display type steps at breakpoints instead of scaling fluidly. `clamp()` with a
vw term is only on the scale at the two ends of its range, and in between it is
whatever the window happens to be.

## Space

Nine steps, for every margin, padding and gap.

`--s-4` `--s-8` `--s-12` `--s-16` `--s-24` `--s-32` `--s-48` `--s-64` `--s-96`

Three rules on top of the scale:

1. A heading's top margin is twice its bottom margin. The space belongs to the
   section that starts, not to the one that ended.
2. The gap inside a component is at least half the gap to the next component,
   so a group reads as a group.
3. One mechanism per axis. A stack uses `gap` or it uses `margin-bottom`, never
   both: two mechanisms on the same axis is how a value gets doubled by a rule
   nobody remembers writing.

The page gutter is `--gutter`, one definition, wrapped in `max()` with the
safe-area inset so text stays clear of a notch in landscape. It is at least
24px on a phone and grows to 96px on a wide screen.

## Measure

Reading text sits in `--measure` (34rem), which is 58 characters at 17px. Any
container of running text stays between 45 and 75 characters. Tables, code and
the word list are exempt: they are read by scanning, not by line.

## Colour

Ink on paper, plus three accents and nothing else. The accents are the flag:
red for a rule, blue for new words, orange for a pitfall. Every text colour
clears 4.5:1 against its background in both themes, and is checked in both,
because a colour lightened for the dark page usually fails on the light one.

Orange at flag strength is under 2:1 on white, so the rule keeps the flag colour
and the label takes a darkened one. That is the pattern for any accent that
cannot carry text at full strength.

## Targets

Every interactive element has a hit area of at least 24 by 24, measured on the
box and not on the glyph inside it, with 8px between neighbours. 44 by 44 is the
target where there is room for it. A link inside a paragraph is exempt, since
its target is the line of text it sits in.

The usual fix is `padding-block: var(--s-4)` on a 20px line, which costs
nothing: padding on an inline-block does not move the text.

## Glass

One material, three tints. `--glass-blur` and `--glass-saturate` are shared by
the header, the sheet the alphabet raises and the search panel; only the amount
of paper mixed into them differs. The header is the one graduated surface: three
stacked panes, each masked, so the blur tapers over the last few pixels rather
than stopping at a line. Keep the taper short. Spread over a quarter of the
band, the same header reads as fog on one page and as nothing on the next,
because whether a line comes out blurred then depends on where it falls.

## Armenian

Every run of Armenian carries `lang="hy"`, which `src/plugins/rehype-lang.mjs`
adds to the rendered markdown and the components set by hand. Without it the
rules below match nothing, the script falls through the font stack to whatever
the reader's system has, and a screen reader reads Armenian as English.

Armenian runs smaller than Latin at the same size, so `[lang="hy"]` is 1.06em of
whatever it is quoted inside. It never takes negative letter spacing (the page's
slight negative tracking is a correction for Helvetica, and it closes Armenian
up) and it is never set in `text-transform: uppercase`, which is not how the
script marks emphasis.

Transliteration is for searching, never for reading. `roman()` gives every word
a Latin key so that `erku` finds երկու; nothing on the page ever shows it.

## Prose

No em dashes in interface text, documentation or comments. A comma, a colon, a
semicolon or a pair of parentheses says the same thing and says which
relationship is meant. The one place a dash stays is a gloss in the content,
where it separates an Armenian phrase from its translation and is a convention
rather than punctuation.

## Resilience

No fixed height on a container of text, and nothing clipped by `overflow:
hidden` that the reader still needs. Nothing scrolls sideways at a 320px
viewport: a table that might is wrapped in `.table-wrap`, which scrolls inside
its own box.

## Units

rem or em for type and space, never px, apart from hairline borders and the
px leading above. The exceptions to the scales live in `ALLOWED` in
`scripts/check_design.py`, each with the reason it is there. Adding one means
writing that reason down.
