# Colour as signal: the app build (Coverage excepted)

by: user (R1-R3); coordinator (C1-C9)
date: 2026-11-27

The owner approved the 13 static mockups of `docs/design/mockups/colour/` on 2026-11-26
("Approved") and asked on 2026-11-27 to "build the pages". The coordinator put three conflicts with
earlier rulings to the owner as question cards; the owner's answers are R1-R3, quoted by the option
chosen. C1-C9 are the coordinator's rulings for the build; the owner may overturn any.

## Owner (2026-11-27)

- R1, "Two marks, no share": on the issuer report covenant room is drawn as the actual and the
  limit, two marks on one scale, with the module-written headroom in words. No percentage of the
  limit is computed or printed and no green-to-red fill is drawn. Spend against the run cap (Run
  start, Run activity, Evidence) keeps a coloured share bar: it is run cost, not issuer analysis.
- R2, "Category and amount only": Downside and Forecast get category and amount colours only, and
  no better or worse marks. Assumption cells that differ from the base case are tinted lower or
  higher than base; no difference is computed or printed. This amends part (c) of the 2026-11-16
  amendment to `2026-11-11-reader-and-issuer-report.md` only as far as category and amount colour.
- R3, "Keep cash neutral": cash carries no direction, as the 2026-11-16 amendment says; the
  direction table in `DESIGN.md` lists it under no direction.

## Coordinator

- C1 Status never uses green. In data visuals green means better, except the first band of
  spend against the cap (C3), which shares the hex and is told apart by form (a bar in a track).
- C2 Better and worse are one level each (mark `#15803D` / `#C2410C`, tint `#BBF7D0` / `#FED7AA`),
  always with an up or down glyph and the word. Direction comes only from the fixed table in
  `web/src/pages/connected/signal.ts`.
- C3 Spend against the cap is banded: under 50%, 50 to under 70, 70 to under 85, 85 to under 100,
  100 or more (with ✕ and "at the cap"). The band is a bar fill; the percentage sits beside it in ink.
- C4 An amount tint or a bar's length draws a figure's size against the largest figure in the same
  visual; no figure is printed from it.
- C5 No series is assembled that the data does not carry. A sparkline is drawn only from a series
  of three or more periods that the visual already receives.
- C6 The eight-slot category palette (DESIGN.md order) colours named categories in every visual
  this build touches. A visual that also carries better/worse marks, status marks or blue chrome
  does not use slot 1 (the success and running blue), slot 2 (orange) or slot 7 (green). Beyond the
  remaining slots, further categories share slot 8 with their own words. The six-slot chart palette
  stays where the build touches nothing.
- C7 Severity and check status are ink glyphs and words, with no colour of their own.
- C8 Signal's market table is unchanged: no colour, no arrows, and no sparkline (the data carries
  no series).
- C9 Event kind is not coloured until the data carries a typed kind: today's "Credit relevance"
  cell is free text, and sorting it into kinds would be delivery classifying.
