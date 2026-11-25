# Design

Started 2026-11-24 (owner: redesign the frontend design language and system from scratch).
**Status: built (2026-11-25).** Every screen in `docs/design/screen-map.md` is rebuilt in this
language and merged on `claude/exciting-albattani-v1zoug`; what is left for the owner's own check
is listed in `VERIFICATION.md` (2026-11-25 entry). Product, personas and the insight map are in
`PRODUCT.md`.

This file is the design authority. It replaced `docs/design/design-system.md` (v0.8) and
`docs/design/brand-tokens.md` (removed). `design-system.md` stays as the token register only:
twelve test files and `web/scripts/kit-chrome.mjs` parse its tables, which carry the values below.
Where its remaining prose disagrees with this file, this file wins.

## What carries over

Only the logo symbol (`web/public/symbol.svg`, `src/deploy_vii/assets/brand/`). Colours, type
families, radii, shadows, layouts, chart palette and component styling are all open.

## Why the current design fails (evidence)

- **One layout for every module.** `web/src/pages/connected/report/Modules.tsx` draws each of
  25 modules in one fixed order: findings, confidence, metric grid, figures, charts,
  limitations, records. Only CP-2A, CP-2E and CP-3 have a figure of their own.
- **One chart for every shape.** `pages/connected/visuals/charts.tsx` picks the chart from
  `descriptor.kind` alone; with no kind it is a trend or column chart. On CP-1, five of seven
  charts were the same blue three-period column chart (`.impeccable/critique/2026-11-16T05-13-06Z…`).
- **One container for every block.** Nearly every section uses the same `card` class
  (`pages/connected/layout.tsx`), so the page has no hierarchy.
- **Records swamp findings.** Thirteen tables follow Limitations on CP-1, about 32 screens.
- **No continuity.** Three font systems and three token sets across the connected app, the
  older static library and the HTML Model.

## Evidence base

Real module output reviewed for the information architecture (TransDigm, FY2024, as of
2024-09-30; outdated evidence, used for shape and scope only):

- `tests/fixtures/live_2026_11_15/earnings_update-CP-1-draft3-accepted.md` — a complete
  accepted CP-1 handoff.
- `tests/fixtures/tdg_sol_high_2026_11_13/` — CP-1 tables, CP-2G forecast JSON, CP-2A scenarios.
- `reviews/2026-11-12-module-output-adversarial/latest-run-tdg-proof-snapshot-opus-002.md` —
  section headings and quoted values for all 13 delivered modules of a Full run.
- No real handoff is retained for CP-1D, CP-2D, CP-2H, CP-3C, CP-3D, CP-4C or CP-L10; their
  screens are specified from the contract only and need proof on a real run.

The mockups mix figures from these runs to exercise the layout. They are illustrations of
form, not a delivered report.

## Information architecture

Unchanged at the top: Library → issuer report (Overview, Changes, Modules, Forecast, Evidence,
Calendar) and Run start → Run activity. Changed inside:

1. **Overview is the decision page.** The call (CP-6 stance, else CP-3, else CP-2), confidence
   and evidence clearance sit in the header; the bottom line is the largest text; each finding
   sits beside its own evidence visual; "what this run could not do" is a first-class block.
2. **Modules are grouped by the reader's question, not listed by code.** Five stages, also the
   run pipeline: Sources (CP-0) · Financials (CP-1, 1B, 1C, 1D, MODEL) · Credit (CP-1A, DR, 2,
   2A, 2D, 2E, 2G, 2H) · Structure and market (CP-3, 3C, 3D, 4, 4C) · Validation and decision
   (CP-5, 6, 8). The same pipeline component shows the live run on Run activity and the finished
   run on the report.
3. **Each module page leads with its own visual** (PRODUCT.md § Modules), then findings.
   Statements, registers and calculations sit behind one disclosure per module.
4. **Evidence keeps all machinery**; every other page has one trace control per paragraph, row
   or figure.

## Choosing the form

The form is chosen from the data's shape and the question, never from a default.

| Data shape | Question | Form | Not |
|---|---|---|---|
| One measure, two periods | Did it move, which way | Paired figure with delta, slope or dumbbell | Column or line chart |
| One measure, three or more periods | What is the trend | Line; columns only for flows | Three-bar column chart per measure |
| Value against a limit | How much room | Bullet with the limit marked | Bare number |
| Reported and adjusted, or as-reported and pro forma | What is the real level | One axis, both marks, the gap labelled | Two separate tiles |
| Steps from A to B | What explains the difference | Waterfall | Table of add-backs alone |
| Amounts by date | When is the cliff | Wall on a true time axis | Category columns with equal spacing |
| Parts of a ranked whole | Who is ahead of whom | Proportional stack in rank order | Pie or donut |
| Few cases, several measures | Which case breaks | Small multiples on one scale | One grouped chart per measure |
| Issuer against peers | Where does it sit | Range strip with the issuer marked | Peer table alone |
| Dated events | What is coming | Timeline on one axis | Table sorted by date |
| Relationships | What depends on what | Node map with a table fallback | Prose |
| Module × status | Can it run, did it run | Matrix or pipeline | Paragraph |
| Missing, blocked, not supplied | What is not known | The designed gap state, in place | Zero, blank, or a hidden block |

Rules: label the basis once (reported, as defined, pro forma); direct-label series; a figure's
title is its plain subject ("Liquidity bridge", "Net leverage by case"), never a reading the page
assembles; the reading is the figure's text alternative and table view; every figure has a table
view and a trace control; a chart with fewer than three marks is a figure, not a chart; periods
the page cannot put in time order are drawn as stated, with no connecting line, and the page says
so.

## Component sources

The owner's references (2026-11-24) and what is taken from each. Everything is self-hosted to
satisfy the content security policy.

| Need | Source to adapt |
|---|---|
| Base controls, badges, inputs, tables, menus | Untitled UI React (already vendored under `web/src/components`), ui-sdk menu patterns |
| Application shell | shadcnblocks application shell (inset sidebar with secondary navigation; top navigation) |
| Stat rows, chart cards, chart groups | shadcnblocks dashboard, chart card, chart group |
| Overview composition | React Bits Pro bento grid; shadcnblocks bento |
| Module and run pipeline | React Bits Pro pipeline |
| Dates and run history | shadcnblocks timeline |

## Direction (owner, 2026-11-24)

"B for overview and overall look and card shape and layout, but not in dark. C for modules and
forecast + colours." Of the three candidates (A · Brief, B · Signal, C · Desk):

- **Look, shell, card shape, layout: B, in a light theme.** Top-bar shell with a centred command
  field; a 12-column bento where tile area encodes importance and each tile states one fact
  with one visual; the module pipeline drawn as a node graph.
- **Colour: C.** Neutral zinc ground, teal primary, navy secondary, orange signal.
- **Modules and Forecast: C's working patterns** inside B's shell and tile shape: a stats strip
  divided by hairlines, tabbed chart groups, tables with inline proportional bars, small-multiple
  strips, stepper tables, mono numerals.
- A is not used.

## Tokens

Light theme only. Implemented in `web/src/styles/theme.css` under the existing token names, so
every screen takes the new values. The per-token register that tests parse is
`docs/design/design-system.md` (tables only; its prose describes the previous design and is
superseded by this file).

| Role | Token | Value |
|---|---|---|
| Page ground | `surface-canvas` | `#FAFAFA` |
| Tile surface | `surface-card` | `#FFFFFF` |
| Well, inset surface | `surface-subtle` | `#F4F4F5` |
| Selected, accent tint | `surface-selected`, `action-subtle` | `#F0FDFA` |
| Inverse | `surface-inverse` | `#0A0A0A` |
| Hairline | `border-subtle`, `border-hairline` | `#E4E4E7` |
| Strong divider | `border-container` | `#D4D4D8` |
| Control edge | `border-control` | `#71717A` |
| Ink | `text-primary` | `#0A0A0A` |
| Secondary text | `text-secondary` | `#52525B` |
| Label text | `text-tertiary` | `#6B6B74` |
| Disabled, connector | `text-disabled`, `connector` | `#A1A1AA` |
| Accent, link, focus | `action`, `text-link`, `focus` | teal `#0F766E` |
| Accent hover, pressed | `action-hover`, `action-pressed` | `#115E59`, `#134E4A` |
| Accent tint edge | `action-subtle-hover` | `#CCFBF1` |
| Focus on dark | `focus-inverse` | `#5EEAD4` |
| Gap edge, gap text | `border-gap`, `gap-text` | `#8E8E96`, `#52525B` |

Teal scale (`brand-50` to `brand-950`): `#F0FDFA`, `#CCFBF1`, `#99F6E4`, `#5EEAD4`, `#2DD4BF`,
`#14B8A6`, `#0F766E`, `#115E59`, `#134E4A`, `#0F3F3C`, `#042F2E`.

| Status | Text | Fill | Edge | Mark | Used for |
|---|---|---|---|---|---|
| Success | `#115E59` | `#F0FDFA` | `#99F6E4` | `#0F766E` | Delivered, better |
| Warning (signal) | `#9A3412` | `#FFF7ED` | `#FED7AA` | `#EA580C` | Worse, pro forma, blocked, not tested |
| Error | `#991B1B` | `#FEF2F2` | `#FECACA` | `#DC2626` | A failed run, an invalid field, or a limit the service will refuse at run start; hover `#7F1D1D` |
| Info | `#1E3A5F` | `#EFF4FA` | `#C7D6E8` | `#3B6591` | Notes, the counter-argument surface |

| Chart series | Value | Use |
|---|---|---|
| 1 | `#115E59` | Primary (current period, secured) |
| 2 | `#0F2440` | Secondary |
| 3 | `#8E8E96` | Prior period |
| 4 | `#EA580C` | Signal: worse, pro forma, shortfall |
| 5 | `#3B6591` | Fifth series |
| 6 | `#5EA8A1` | Sixth series |
| Other | `#71717A` | Remainder |

Series 1 and 2 are a shade deeper than the mockups' `#0F766E` and `#1E3A5F`: with those two the
first three series cannot each reach 3:1 on white and stay 2:1 apart in greyscale
(`chart-lightness.test.ts`). Label text is `#6B6B74`, not the mockups' `#71717A`, to hold 4.5:1
on the well surface. Tooltip supporting text is `#D4D4D8`.

- "Better" is teal with the word; "worse" is orange with the word, and only where the direction
  is established (no better or worse for a negative leverage multiple). Signal colour never
  appears without a word or icon. Red is kept for failures, invalid input and a refusal at run
  start, never for a finding.
- **Gaps:** one pattern (a plain tile or cell with the gap note). A gap says only what the page
  checked ("This page could not read the rating history.") or the module's own reason as written.
  Reader words only: no "handoff", register, id or file name outside Evidence. A lead does not
  say "the module" (it is drawn on that module's own page); elsewhere "module" is the reader's
  word for a part of the report, as on the Modules page. A module-written word ("n.m.", "—") is
  drawn as written; a written dash is not a missing value.
- **Type:** Geist 400/500/600 for text and headings; Geist Mono 400/500 with tabular numerals for
  figures, codes and axis labels. Ramp (size / line): display 44/48, h1 32/38, h2 24/30,
  h3 20/28, h4 18/26, lead 18/28, body 15/24, small 14/22, caption 12/16, metric 36/40,
  mono 13/20.
- **Shape:** 12-column grid, 16 px gap. Radius: tile 20 (`radius-lg`), 12 (`radius-md`), wells and
  controls 8 (`radius-sm`), chips 6 (`radius-xs`). One-pixel hairlines. Cards carry no shadow
  (`shadow-1` is empty); floating menus and tooltips use `shadow-2`.
- **Shell:** one top bar — symbol, product name, areas — over the page. The current area has the
  accent tint and an underline.
- **Motion:** one animation, a slow dash along delivered pipeline edges; off under reduced motion.
- **Trace control:** one icon button, the same everywhere, per paragraph, row or figure: 32 px,
  with a 44 px touch area on a phone. Every other control is at least 32 px wide and tall, 44 px
  on a phone (narrower than 480 px, the pages' `max-[480px]` styles).

## Migration

The current system is pinned by tests and gates that the implementation change must update
together: `web/src/styles/theme.css` and `theme.test.ts`; `chart-lightness.test.ts`;
`web/scripts/classes.mjs` and `kit-chrome.mjs`; the `*.designReference.test.tsx`,
`*.design.test.tsx` and `*finalAudit*.test.tsx` files; `tests/test_brand_tokens.py` for the
HTML Model. A presentation change needs a fidelity check recorded in VERIFICATION.md.

A screen is checked in a real browser before it is reported done:
`docs/design/preview/check-render.cjs` renders it at 1440, 1280, 1024, 768 and 390 and fails on
sideways scroll, unnamed scroll boxes, cut text, small targets, text under 12 px and overlapping
chart labels (`docs/design/preview/README.md`). It does not replace looking at the screenshots.
