# Stage 2 report: S5 Model (static)

Audited commit `2b881075` (branch `audit/out-sections-static`). Section S5 = `web/src/pages/model/` and the routes `#/model/runs`, `#/model/:issuer/:run/front`, `analysis`, `statements`, `portfolio-fit`, `limitations`, `forecast`. Static surface only. Run in headless Chromium build 1243 from `web/dist` (shipped, empty `data.js`) and from a copy of `web/dist` whose `data.js` is written from `web/fixtures` (fixture). Every host but loopback and `file:` was blocked in every context (ruling R8). No synthetic service was started, because S5 has no connected surface of its own. No paid call, no application file or fixture changed; variants were made as copies under `/tmp`.

(Written by the worker; placed in this file by the `sections-static` controller because the Write tool refuses report files from subagents.)

## Result

26 findings: 7 Medium, 12 Low, 7 Info, no High. No request to another host was attempted on any screen or state. There was no console error or page error on any screen; the only logged failure was the expected missing `data.js` of a copy where I deleted it. Fonts (Schibsted Grotesk, Geist) load from the local folder. Marks for the 74 content rows, 3 control rows, 6 retired items and 8 unaccounted items are in `harmony.csv` (91 rows).

| Severity | Ids |
| :--- | :--- |
| Medium | S5-001 (run with no forecast is wholly unreadable, no "no forecast published" state), S5-002 (raw reader path shown to the reader), S5-003 (all 89 library link instances dead-end in the fixture; one shared trace address), S5-004 (trace control is a link, no drawer, state lost on Back), S5-005 (Statements table unreadable at 390 px), S5-008 (tooltips unreachable by touch), S5-009 (Net debt walk table sign label) |
| Low | S5-006, S5-007, S5-010, S5-011, S5-012, S5-016, S5-017, S5-018, S5-019, S5-020, S5-021, S5-025 |
| Info | S5-013, S5-014, S5-015, S5-022, S5-023, S5-024, S5-026 |

## Screens and states reached

| Screen | Fixture, full | Shipped, empty | Other states and how |
| :--- | :--- | :--- | :--- |
| `#/model/runs` (and bare `#/model`) | 1440 and 390 | "No model has been delivered yet" (S5-016) | Mixed list (one readable run, one named unreadable, one unnamed) and an invalid slice (`runs: 'nope'`), from fixture copies |
| `…/front` | 1440 and 390 | "Not found for this run" | Zero and missing headline values, long text, withheld tile: fixture copies |
| `…/analysis` | 1440 and 390 | same | Long text: fixture copy |
| `…/statements` | 1440 and 390; Figures and Bars; 4 statement tabs; both cases | same | Cell reasons on n.a. and Withheld, published model (html and markdown), one case, long text: fixture copies |
| `…/portfolio-fit` | 1440 and 390 | same | Limits and scatter as gaps: fixture copy |
| `…/limitations` | 1440 and 390 | same | Long text only |
| `…/forecast` | 1440 and 390; both cases | same | No forecast, one case: fixture copies (S5-001) |
| `#/model/no-such-issuer/no-run/front` | not found | not found | n/a |

- **Loading:** the static app has no loading state, because data arrives in a synchronous script. A missing or newer `data.js` makes `#/model/*` draw the Library page's notice; that is the shell's behaviour (S1).
- **Error:** an unreadable run and an invalid slice were forced from fixture copies.
- **Missing versus zero:** the fixture holds both (FY23 cash interest n.a., FY23 dividends 0, acquisitions Withheld, 2026 notes 0 against loans n.a.). One copy set a headline value to `$0m` and another to missing.
- **Very long text:** realistic long limitation, bottom-line and label text wraps without overflow. One unbroken word does not wrap (S5-021, hostile input).
- **Narrow window:** all pages at 390 px (S5-005, S5-006, S5-007). A 768 px check was made only for the breadcrumb.

## Controls covered, against the 270 inventory lines for S5

| Bucket | Lines | What was done |
| :--- | :--- | :--- |
| Operated directly (mouse, keyboard or both) | 53 | 4 statement tabs (click, ArrowRight). 36 radios: Figures or Bars (2), case radios (4, with click, ArrowLeft and ArrowRight), Chart or Table toggles (30, each pressed to Table and back). 1 Show sources switch (click, Space, Enter; state across routes and reload). 7 section-index buttons (click, Enter, Space; focus and scroll checked). 1 info button (hover, focus, Escape, click, tap). 1 limitation disclosure (Enter, Space). The Analysis tab link. 2 trace links (click and Enter, then Back). |
| Covered by an identical control on a sibling address | 19 | 5 further Show sources switches, 7 further info buttons, 7 further limitation disclosures |
| Link lines whose own instance was not operated | 187 | Every distinct address they carry was opened directly in a new page and compared with the link's name (`probes/p-links.mjs`). All library links and all model links were enumerated with their hrefs on all seven pages. The 8 "All financial models" links of the empty and error states were opened by address. |
| Not reached | 11 | The 9 `application` and 2 `region` chart surfaces were read by name and role in the accessibility tree; hover and arrow-key chart interaction were not exercised. |

Keyboard alone: Tab order was walked on all seven pages. Every focused control showed a focus ring. The only targets under 24 px were the 16 px info buttons, 18 px breadcrumb links and two 22 px text links, which meet the spacing exception. Trace controls are hidden by opacity until hover, focus or "Show sources". They stay in the Tab order, and are always opaque on a touch context. The skip link and landmarks are the shell's (S1).

## Design critique (rubric applied rule by rule; the impeccable skill is not installed)

Screens were judged at 1440 px and 390 px against `design-rubric.md`. No gradient, glass, emoji, card-in-card, pie, dual axis, status colour as a series or module code was found (D-18, D-19, D-20, D-21, D-02, D-25, D-13). Findings cite: D-42 (S5-005, S5-006, S5-007), D-35 and D-14 (S5-008), D-06 and D-38 (S5-004, S5-012), D-31 and D-04 (S5-001, S5-002, S5-016), D-36 (S5-017, S5-025), D-39 (S5-019), D-16 (S5-011), D-32 (S5-021). The `.impeccable/config.json` ignore entries concern a mockup only and did not apply.

## Harmony

Figures were checked against the fixture `web/fixtures/model.json` (at least five per screen) and against each other:
- The Front tiles agree with Key measures and Analysis: revenue 8,580, EBITDA 4,560, margin 53.1%, net leverage 5.9x (29,700 less 2,790, over 4,560), interest cover 2.9x, and free cash flow to debt 6.6% (1,950 over 29,700).
- The bottom line's "5.9x to 3.8x" and "USD 17 billion between 2028 and 2030" (5,700 + 5,400 + 5,950 = 17,050, 57% of 29,700) agree with the walk, Maturities and the Debt stack.
- The cash flow walk (5,080 - 1,560 - 610 - 170 - 200 = 2,540) and the net debt walk (26,300 - 2,540 - 2,836 = 20,924) agree with Statements.
- Statements bar widths equal the delivered `pos` times 100 percent.
- Choosing Downside changes the forecast columns to the Downside cells (revenue 8,650, 8,780, 9,050).

No figure on screen differs from the fixture. The one sign-label conflict is S5-009. No handoff exists for the static app to be compared with (S5-024), so "handoff" here means the fixture.

Matrix marks:
- Content rows: 22 shown as required, 21 shown but wrong place or form, 11 missing, 20 correctly not shown.
- Control rows: CT-045 decidable as required, CT-047 decides less than the row, CT-041 not reachable here.
- Retired items: 6 not offered. R-14 would be offered by a `published` value the fixture lacks (S5-022).
- Items on screen that no row accounts for: 8 (S5-026).

## Not reached and why

- A real Model run: nothing in `src/`, `react_frontend/`, `tools/` or `proof/` writes the Model slice (S5-024). The only run is the TransDigm fixture, labelled "Sample data".
- The trace target of any Model control: the model fixture has one run and none of its library links resolve in the library fixture (S5-003), so the Evidence destination could not be inspected.
- Shared library parts: `TraceControl`, `ModuleNav` and similar belong to S3 and S4, and the Model has its own `TraceControl`.

Not verified: the impeccable critique (skill not installed, rubric applied by hand); Chrome and Edge on Windows (only Chromium build 1243); hover and arrow-key interaction inside the 11 chart surfaces; a chart whose every value is null; a 320 px width and 200 percent text size; reduced-motion behaviour; contrast ratios (read from the screens, not measured); screen-reader announcements; a negative-cash forecast year; peer sets and real-run content of any Model page.
