# Coverage Analytics Implementation Plan

Owner approved this plan on 2026-11-27 ("Approve plan"); Phase 2 is not yet tasks and is not covered by that approval.

Plan critique (2026-11-26, `mx-autonomous` standing in for `mx-advisor`): two High and seven Medium findings, all applied below. The answer key recomputed with no mismatch (22 cases).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The coordinator dispatches `mx-*` agents and writes no code (`CLAUDE.md`).

**Goal:** Add the Monitor, Patterns, Refinancing, Headroom and Market tabs to `/coverage`, drawing only the five ruled computations on figures the reply already carries.

**Architecture:** One pure arithmetic module on the written decimal text, one cohort module that decides who qualifies, then one React file per tab under `web/src/pages/connected/coverage/`. `Coverage.tsx` only gains the tab switch. The service reply gains one thing: each covenant and trigger row fact carries the Direction the module wrote.

**Tech Stack:** TypeScript, React, `react-aria-components` (vendored Untitled UI), `recharts` 3.10.1, Vitest, Testing Library. New dev dependency: `fast-check` (pre-approved test tool).

**Spec:** `docs/superpowers/specs/2026-11-26-coverage-analytics.md`. Ruling: `docs/rulings/2026-11-26-coverage-analytics.md`. Colour: `DESIGN.md` "Colour as signal". Form reference: `docs/design/mockups/coverage-analytics.html` (invented figures; layout only).

## Global Constraints

- Handoffs only: no new service route and no new parser. The one reply change is `direction` on row facts (Task 2), read from the table's existing Direction column.
- Arithmetic is exact on the written text (`fact.text` with commas removed, only when `fact.at !== null`). `fact.at` is used for sorting only. No `Number` arithmetic on any figure the page prints. `Number` is allowed only to place a mark in pixels and to pick a colour step.
- Only the five computations of the ruling. No mean, percentage, ratio across modules, fitted line, score, or currency conversion. A sum is over one identical unit text; any other unit is left out with its reason (the ruling's power-of-ten rescale is not built in this plan).
- A cohort is: newest run per issuer, exactly one figure, same field, same heading as written, same unit text, same period text. Fewer than three gives no statistic.
- Covenant and trigger rows are never ranked or sorted across issuers.
- Every computed figure is labelled "computed" once per column group or figure, and its title names its rule in plain words (difference, median, quartile, distance from median, total, tightest) and the figures it used. Every row ends in "Open run" (`evidenceLink(run, fact)` from `coverageData.ts`), which is the row's one trace control. Missing is hatched, never zero.
- Reader words only: no module codes, "handoff", file names or hashes. Modules by name. No judgement word except "better" and "worse" in a legend, and only for a field in the direction table.
- Colour: one scale per meaning as `DESIGN.md` gives them. A difference on a field with no ruled direction is grey (`NEUTRAL`) with an up or down glyph. No share of a limit is computed or coloured: a division is not one of the five computations (coordinator's ruling after the plan critique; the mockup's green-to-red bars are not built). Text on a tint holds 4.5:1. Colour never alone: a glyph, word or legend carries it too.
- Desktop only. Density: rows 28 px, tile padding 12 px, mono 12 px figures.
- Existing views keep their names (Modules, Rank, Find, Trend) and behaviour; removing Rank and Trend is a later change (coordinator's ruling). Monitor becomes the default view, so the address carries no `view=` for Monitor and `view=matrix` for Modules; the existing tests that assert the old default (`Coverage.test.tsx` near lines 751 to 757) are updated for that and nothing else.
- Each PR is at most 800 changed lines outside lock files. PR 0 is the docs. Tasks 1 and 2 share PR A; every later task is its own PR (B to F), stacked because all share `Coverage.tsx`. A task whose diff passes 800 lines stops and reports; the coordinator splits it.
- Gates per task, in `web/`: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run unused`, `npm run duplication`, `npx vitest run <the task's test files>`. Once per PR: `npm run build`, `npm test` (80% line coverage), `uv run python tools/quality_gate.py`. Nothing is exported before the task that first imports it (knip).
- Tests that need Refinancing, Headroom or Market data use synthetic replies written by hand in the test file and say so in the test name; only Financial foundation figures exist in retained fixtures.

## Review Focus

1. A figure written with a unit the page has not seen ("USD thousands" beside "USD millions"): expected left out of the sum with the reason, never added. Test in Task 2.
2. An issuer whose newest run states the period twice: expected left out of every statistic with "more than one figure". Test in Task 2.
3. Periods the page cannot order (`periodsOrdered` false): expected no difference, no sparkline line, figures still shown. Test in Task 4.
4. A cohort of exactly two after the reader leaves issuers out: expected the table without tint, strip, median or band. Test in Task 4.
5. A negative leverage multiple: expected no better or worse colour. Test in Task 3.

---

## File structure

| File (under `web/src/pages/connected/coverage/`) | Responsibility |
|---|---|
| `coverageMath.ts` | Exact decimal difference, sum, statistics, band on written text |
| `coverageMath.cases.json` | Hand-written answer key (exists; implementers do not edit) |
| `cohort.ts` | Who qualifies for one field, heading, unit and period; who is left out and why |
| `direction.ts` | The owner-approved better/worse table by field id |
| `scales.ts` | The four colour scales and the sector palette |
| `Sparkline.tsx` | Inline SVG sparkline and mini columns |
| `Monitor.tsx`, `Patterns.tsx`, `Refinancing.tsx`, `Headroom.tsx`, `Market.tsx` | One tab each |
| `LeftOut.tsx` | The left-out list every tab ends with |

Modified: `web/src/pages/connected/Coverage.tsx` (the `View` type, the tab list, the switch), `web/package.json` (`fast-check`).

Field ids, confirmed by running the reply on the test snapshot: `cp-1/leverage/total-debt-ebitda`, `cp-1/leverage/net-debt-ebitda` (series `period`); `cp-4/covenant-headroom/threshold`, `cp-4/covenant-headroom/current` (series `row`). The others follow the same `module/chart-title/measure` slug and are confirmed in Task 2, step 1.

---

### Task 0 (PR 0): land the documents first

The ruling, the `AGENTS.md` exception, the `DESIGN.md` section, the amended 2026-11-24 ruling, the spec, this plan, the mockup and `coverageMath.cases.json` go to `main` in one docs-only PR before any code, because the arithmetic contradicts the `AGENTS.md` on `main` until they do. Review: one `mx-feature` review (docs and config rule). Gate: `uv run pytest tests/test_repo_rules.py -q`. Committed and pushed on the owner's instruction (2026-11-27); the owner merges. Opened as EricMG13/credit-os2#136 at 1,384 changed lines, over the 800-line cap: an exception for this docs-only PR (the mockup, spec and plan are most of it), stated in the PR body; every code PR holds the cap.

### Task 1 (PR A): exact arithmetic

**Files:**
- Create: `web/src/pages/connected/coverage/coverageMath.ts`
- Test: `web/src/pages/connected/coverage/coverageMath.test.ts`
- Answer key (read only): `web/src/pages/connected/coverage/coverageMath.cases.json`
- Modify: `web/package.json` (add dev dependency `fast-check`, pinned)

**Interfaces — Produces:**

```ts
/** A written figure as an exact decimal string: optional "-", digits, optional "." digits. No exponent. */
export type Dec = string;
export function dec(text: string): Dec | null;            // exactly the service's PLAIN_AMOUNT: /^-?\d[\d,]*(?:\.\d+)?$/, commas removed
export function abs(value: Dec): Dec;
export function difference(a: string, b: string): Dec | null;   // a minus b; null if either is not a figure
export function sum(values: readonly string[]): Dec | null;      // null for an empty list or any non-figure
export type Stats = { count: number; min: Dec; q1: Dec; median: Dec; q3: Dec; max: Dec };
export function stats(values: readonly string[]): Stats | null;  // null under three figures or any non-figure
export function band(value: string, of: Stats): 0 | 1 | 2 | 3;   // <= q1: 0; <= median: 1; <= q3: 2; else 3
export function compare(a: Dec, b: Dec): -1 | 0 | 1;
```

Results are normalised: no trailing zeros, no trailing point, no "-0".

- [ ] **Step 1: Write the failing tests.** In `coverageMath.test.ts`, load `coverageMath.cases.json` and assert every `dec`, `stats`, `difference`, `sum` and `band` case equals its `expect` exactly (string equality). Add `fast-check` properties: `sum` is the same for any order of its inputs; `difference(a, b)` equals the negation of `difference(b, a)`; for any list of three or more decimals `min <= q1 <= median <= q3 <= max` by `compare`; `stats` of a list equals `stats` of the same list with trailing zeros added to every figure.
- [ ] **Step 2: Run** `npx vitest run src/pages/connected/coverage/coverageMath.test.ts` in `web/`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** the functions with `BigInt` on a common scale (shift every operand to the largest count of decimal places, operate, shift back). The mean of two middle figures divides by two by adding one decimal place. Median: the middle figure, or half the sum of the two middle figures. Quartiles: the medians of the lower and upper halves, the middle figure left out of both when the count is odd.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then `npm run lint && npm run typecheck && npm run format:check`.
- [ ] **Step 5: Commit** `feat(coverage): exact arithmetic for the five ruled computations`.

Review: `mx-precise` (deterministic calculation). The reviewer reruns the answer key and saves any probe as a script.

### Task 2 (PR A): cohort and direction

**Files:**
- Create: `cohort.ts`, `direction.ts` in `web/src/pages/connected/coverage/`
- Test: `cohort.test.ts`, `direction.test.ts` beside them
- Modify: `react_frontend/coverage.py` (`_chart_facts`: a row fact gains `"direction"`, the text of the table's Direction column when the table has one), `web/src/pages/connected/coverageData.ts` (`Fact` gains `direction?: string`), `tests/test_react_coverage.py` (one test: the synthetic covenant row's fact carries `"Passes at or below"`; a period fact carries no `direction`)

**Interfaces — Consumes:** `Coverage`, `CoverageRun`, `Issuer`, `Fact`, `latestRun`, `factsOf`, `periodsOrdered` from `../coverageData`; `stats`, `Stats`, `Dec`, `dec`, `difference` from `./coverageMath`.

**Interfaces — Produces:**

```ts
export type Reason =
  | "no figure" | "more than one figure" | "other unit" | "other heading" | "other period" | "left out by you";
export type Member = { issuer: Issuer; run: CoverageRun; fact: Fact; value: Dec };
export type Cohort = {
  field: string; period: string; unit: string; heading: string;   // heading: the fact's heading, or the field label
  members: Member[];
  out: { issuer: Issuer; reason: Reason; fact?: Fact; stated?: string[] }[];
  stats: Stats | null;
};
/** unit and heading default to the most common among the candidates; ties take the first in issuer order. */
export function cohort(
  data: Coverage, issuers: readonly Issuer[], field: string, period: string,
  pick?: { unit?: string; heading?: string; excluded?: ReadonlySet<string> },
): Cohort;
/** The issuer's own figures for a field, oldest to newest, when the page can order its periods; else null. */
export function series(data: Coverage, issuer: Issuer, field: string, heading: string, unit: string): Member[] | null;
export const DIRECTION: Readonly<Record<string, "lower" | "higher">>;
/** null when the field has no ruled direction, or the figure is a negative multiple of a "lower" field. */
export function verdict(field: string, value: Dec, change: Dec): "better" | "worse" | "none" | null;
/** Room against a limit, from the module's Direction: threshold minus current for "Passes below" and
 *  "Passes at or below"; current minus threshold for "Passes above" and "Passes at or above". Positive is
 *  room, negative is beyond the limit. null when either is not a figure, the units differ, or there is no Direction. */
export function headroom(threshold: Fact, current: Fact): Dec | null;
```

A row's threshold and current are paired by the same run and the same `line`.

`DIRECTION`, copied from `DESIGN.md`: `cp-1/leverage/total-debt-ebitda` lower, `cp-1/leverage/net-debt-ebitda` lower, `cp-1/interest-cover/ebitda-cash-interest` higher, `cp-1/liquidity/undrawn-committed-facilities` higher, `cp-1/revenue-and-ebitda/revenue` higher, `cp-1/revenue-and-ebitda/adjusted-ebitda` higher, `cp-3c/refinancing-need/committed-resources` higher. Nothing else. (Headroom's direction is carried by `headroom`'s sign, not by this table.)

- [ ] **Step 1: Confirm the field ids.** Write `cohort.test.ts` with a hand-written synthetic `Coverage` of five issuers. First test: assert the seven `DIRECTION` keys each match the id pattern `^cp-(1|3c)/[a-z-]+/[a-z-]+$`, and record in the task report the output of running `react_frontend.coverage.coverage` on `tests/test_react_coverage.py::_snapshot()` and on one retained fixture, listing every numeric field id. If a `DIRECTION` key is not among the retained fixture's ids, report BLOCKED with the list; do not rename silently.
- [ ] **Step 2: Write the failing tests** (synthetic data, values by hand):
  - five issuers on one field, period `FY2025`, unit `x`: three qualify with `4.8`, `6.0`, `4.0`; one states the period twice; one states only `FY2024`. Expect `members` of three, `out` reasons `more than one figure` and `other period` (with `stated: ["FY2024"]`), `stats.median === "4.8"`.
  - one issuer's fact has `heading: "Net debt / adjusted EBITDA"`: expect reason `other heading`, and with `pick.heading` set to it, that issuer alone.
  - one issuer's unit is `USD thousands` among `USD millions`: reason `other unit`.
  - `excluded` holding two of three members: `members` of one, `stats === null`, reasons `left out by you`.
  - `series` returns null when `periodsOrdered` is false.
  - `verdict("cp-1/leverage/net-debt-ebitda", "4.4", "-0.4") === "better"`; with value `"-1.2"` it is `null`; change `"0"` gives `"none"`; an unlisted field gives `null`; `verdict("cp-1/liquidity/undrawn-committed-facilities", "511", "-39") === "worse"`; `verdict("cp-1/liquidity/cash", "637", "-39") === null` (cash has no direction, owner 2026-11-27).
  - `headroom`: threshold `4.5`, current `3.2`, "Passes at or below" gives `"1.3"`; threshold `2.0`, current `2.4`, "Passes at or above" gives `"0.4"`; threshold `4.5`, current `5.0`, "Passes below" gives `"-0.5"`; differing units, a non-figure, or no direction give `null`.
- [ ] **Step 3: Run** `npx vitest run src/pages/connected/coverage/cohort.test.ts src/pages/connected/coverage/direction.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement** the two files and the reply change (write the Python test first and see it fail: `uv run pytest tests/test_react_coverage.py -q`).
- [ ] **Step 5: Run** the tests (PASS), then lint, typecheck, format check, and `uv run python tools/quality_gate.py`.
- [ ] **Step 6: Commit** `feat(coverage): cohort qualification and the ruled direction table`.

Review: `mx-precise`. PR A ends here.

### Task 3 (PR B): tab shell, sparkline and left-out list

> **Shared primitives (coordinator's ruling, 2026-11-27; updated with the colour session's plan).**
> The app-wide colour session ("Colour-as-signal mockups for the other screens") owns
> `web/src/pages/connected/visuals/signal/`. `scales.ts` (the names below, items as `var(--…)`
> token strings) lands in its PR 1, stacked after PR 0; this task imports it and creates no
> `scales.ts`. `Sparkline.tsx` lives at `web/src/pages/connected/visuals/signal/Sparkline.tsx` with
> the signature below: if that session's PR 4a has merged first, this task imports it; otherwise
> this task creates it there, and PR 4a imports it. `MiniColumns` stays this plan's (Task 6 adds it
> to that same file). This task keeps `LeftOut.tsx`, the tab shell and their tests. PR B waits for
> the colour session's PR 1 to merge. If either changes a name or signature below, this plan is
> updated first.

**Files:**
- Create: `LeftOut.tsx` (+ test) in `web/src/pages/connected/coverage/`; `web/src/pages/connected/visuals/signal/Sparkline.tsx` (+ test) only if the colour session's PR 4a has not landed it (see the note above)
- Modify: `web/src/pages/connected/Coverage.tsx` (`type View` at line 41, the view list at lines 42 to 47, `addressState`, the render switch near line 671)
- Test: `web/src/pages/connected/Coverage.test.tsx` (add cases; keep the existing ones passing unchanged)

**Interfaces — Produces:**

```ts
export function Sparkline(props: { values: readonly (Dec | null)[]; width?: number; height?: number;
  end?: string /* end-dot colour */; label: string }): JSX.Element;      // a gap for null; no line when fewer than two figures
export function LeftOut(props: { out: Cohort["out"]; title: string }): JSX.Element | null;
// Coverage.tsx
type View = "monitor" | "patterns" | "refinancing" | "headroom" | "market" | "matrix" | "rank" | "find" | "trend";
```

`scales.ts` (owned by the colour session's PR 1, see the note above) exports `POSITION` (4 steps), `BETTER` (3), `WORSE` (3), `NEUTRAL` (3), `AMOUNT` (5), `SECTOR` (8, in `DESIGN.md`'s order) and `step(share: number, of: readonly string[]): string`. Their items are `var(--color-scale-…)` and `var(--color-category-…)` strings, not hexes: `web/src/styles/theme.test.ts` allows a hex only in `theme.css`, and only one that `DESIGN.md` or the token register lists. The hexes, in this order, live as tokens in `theme.css`: position `#FFFFFF`, `#EFF6FF`, `#DBEAFE`, `#BFDBFE`; better `#DCFCE7`, `#BBF7D0`, `#86EFAC`; worse `#FFEDD5`, `#FED7AA`, `#FDBA74`; neutral `#F4F4F5`, `#E4E4E7`, `#D4D4D8`; amount `#FEF3C7`, `#FDE68A`, `#FCD34D`, `#F59E0B`, `#D97706`; category `#1D4ED8`, `#EA580C`, `#0F766E`, `#7E22CE`, `#B45309`, `#BE123C`, `#15803D`, `#475569`. That PR's contrast test reads them from `theme.css` and asserts #0A0A0A on every tint step is at least 4.5. This plan's tests assert the `var(--…)` names, never a hex, and no file this plan adds under `web/src` contains a hex.

Tab names in this order: Monitor, Patterns, Refinancing, Headroom, Market, then the existing Modules, Rank, Find, Trend. `monitor` is the default when the address names no view; the address writer near `Coverage.tsx:125` omits `view` for `monitor` and writes `view=matrix` for Modules. The footer sentence near line 687 becomes: "Every figure and sentence is as its module wrote it, except those marked computed, which this page works out from them by the ruled arithmetic. Views read each issuer's newest run." A selected issuer key is one piece of state in `Dashboard`, passed to every new tab.

- [ ] **Step 1: Write the failing tests:** the page opens on Monitor; the address `?view=rank` still opens Rank and `?view=matrix` opens Modules; the footer reads as above; choosing each new tab renders a region with that accessible name; `Sparkline` with `["4.8", null, "4.4"]` draws two points and no joining path across the null and exposes `label` as its accessible name; `LeftOut` lists each issuer with its reason in words and returns nothing for an empty list; no rendered text matches `/CP-[0-9A-Z]/`.
- [ ] **Step 2: Run** `npx vitest run src/pages/connected/Coverage.test.tsx src/pages/connected/coverage`. Expected: FAIL.
- [ ] **Step 3: Implement.** Each new tab is a placeholder region naming itself until its own task. Scale the sparkline to its own minimum and maximum; position by `compare`, not by `Number`, except the final pixel mapping, which may use `Number` for drawing only.
- [ ] **Step 4: Run** the tests (PASS) and the web gates.
- [ ] **Step 5: Commit** `feat(coverage): analytics tabs shell, sparkline and left-out list`.

Review: `mx-precise`.

### Task 4 (PR C): Monitor

**Files:**
- Create: `Monitor.tsx`, `Monitor.test.tsx` in `web/src/pages/connected/coverage/`
- Modify: `Coverage.tsx` (render `Monitor` for `monitor`)

**Interfaces — Consumes:** `cohort`, `series`, `verdict`, `DIRECTION` (Task 2); `difference`, `band`, `stats` (Task 1); `Sparkline`, `LeftOut` (Task 3); `POSITION`, `BETTER`, `WORSE`, `SECTOR`.

**Interfaces — Produces:**

```ts
export const MONITOR_GROUPS: readonly { name: string; fields: readonly string[] }[];
export function Monitor(props: { data: Coverage; issuers: readonly Issuer[];
  selected: string | null; onSelect: (issuer: string) => void }): JSX.Element;
```

`MONITOR_GROUPS`: Leverage (the two leverage ids), Cover (`cp-1/interest-cover/ebitda-cash-interest`), Liquidity (`cp-1/liquidity/cash`, `cp-1/liquidity/undrawn-committed-facilities`), Scale (`cp-1/revenue-and-ebitda/revenue`, `cp-1/revenue-and-ebitda/adjusted-ebitda`). The Refinancing column reads `cp-3c/refinancing-need/debt-maturing`; the Covenants group reads `cp-4/covenant-headroom/current` and `.../threshold`, showing per issuer the row with the smallest `headroom` among its tests in the issuer's most common unit (rule 5), with the test's name, level, limit and headroom, "beyond the limit" in words when it is negative, and no row when none has a headroom. It is not sortable.

Behaviour, each a test with hand-written expected values on a synthetic five-issuer reply:

- [ ] **Step 1: Write the failing tests:**
  - the period control lists the periods of the first measure, newest chosen; the stat strip shows each measure's `median` and "n of m";
  - a measure cell shows the figure as written and a sparkline, and nothing else; its `title` reads `"<label>, <period>: <figure>; difference from <prior period> <signed>; <band words>"` with band words `bottom quartile`, `lower middle half`, `upper middle half`, `top quartile`;
  - tint "difference" (the default): a `better` cell takes a `BETTER` step, a `worse` cell a `WORSE` step, by the size of the change in thirds of the cohort's largest absolute change; a field with no direction or a `null` verdict takes a `NEUTRAL` step by the same thirds and its title carries "up" or "down"; a negative multiple likewise (Review Focus 5); every row ends in "Open run" with the href `evidenceLink` gives;
  - tint "position": the cell takes `POSITION[band]`;
  - a not-qualifying cell shows the figure, no tint and "n/c" with the reason as its title; a missing figure is a hatched cell with a title and no text;
  - with periods the page cannot order, cells show figures, no sparkline line and no difference in the title (Review Focus 3);
  - with two qualifying issuers the strip shows no median and cells have no tint (Review Focus 4);
  - activating a measure header sorts rows by `fact.at`, missing last, and again reverses; activating a Covenants header does not reorder and shows "Tests are each issuer's own; they are not ranked across issuers.";
  - selecting a row calls `onSelect`; Arrow Down and Arrow Up move it; the selected-issuer strip shows per measure the figure, signed difference, band words and cohort median;
  - "computed" appears once per column group; the left-out list names every issuer missing from any measure with its reason.
- [ ] **Step 2: Run** `npx vitest run src/pages/connected/coverage/Monitor.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** with the vendored Untitled UI table at its small size. Layout follows the mockup's Monitor tab.
- [ ] **Step 4: Run** the tests (PASS) and the web gates and the quality gate.
- [ ] **Step 5: Commit** `feat(coverage): Monitor grid`.

Review: `mx-precise`. The coordinator opens the page against the test preview publication and checks it against the mockup at 1440 × 900 before the PR's pre-merge review.

### Task 5 (PR D): Patterns

**Files:** Create `Patterns.tsx`, `Patterns.test.tsx`; modify `Coverage.tsx` (render).

**Interfaces — Produces:** `export function Patterns(props: { data: Coverage; issuers: readonly Issuer[]; selected: string | null; onSelect: (issuer: string) => void }): JSX.Element;`

Four figures for one measure and period chosen at the top; each has a table view listing exactly the marks it draws.

- [ ] **Step 1: Write the failing tests** (synthetic reply, hand values; assert on each figure's table view):
  - Level against difference: one row per qualifying issuer with figure and `difference` from the prior period; the two cohort medians stated; the axis ends labelled "better" and "worse" only for a field in `DIRECTION`;
  - Two measures: only issuers qualifying on both for the period; the others in its left-out list; no line element with the fitted-line role;
  - Cohort band: per period with three or more qualifying issuers, `q1`, `median`, `q3`; a period with fewer is absent; (the Peer benchmark strip is not built: see "Not in this plan");
  - Difference heat grid: one row per issuer whose periods order, one cell per consecutive pair, each `difference`, tinted by `verdict`; an issuer whose periods do not order is in the left-out list.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** with `recharts` `ScatterChart` and `ComposedChart` (`Area` for the band, `Line` for the median), marks coloured by `SECTOR` of the issuer's sector, the selected issuer ringed in ink.
- [ ] **Step 4: Run** tests (PASS), web gates, quality gate.
- [ ] **Step 5: Commit** `feat(coverage): Patterns tab`.

Review: `mx-precise`.

### Task 6 (PR E): Refinancing and Headroom

**Files:** Create `Refinancing.tsx`, `Headroom.tsx` and their tests; modify `Coverage.tsx` (render).

**Interfaces — Produces:** the same props shape as `Patterns` for both components.

- [ ] **Step 1: Write the failing tests** (synthetic replies written by hand in the test file, named as synthetic):
  - Refinancing: source is `cp-3c/refinancing-need/debt-maturing` where the issuer's newest run has it, else `cp-1/debt-maturities/debt-maturing`, never both, and the row names the source module by name; one currency (unit text) at a time; each period column's total equals `sum` of its drawn amounts and carries "computed"; an amount in another unit is left out with `other unit` (Review Focus 1); a period with no amount is hatched, not zero; the heat grid tints by fifths of the drawn amounts with `AMOUNT`; the axis is called a calendar-year axis only when every period label matches `^(FY)?20\d\d$`, otherwise the page says the columns are in period order; debt maturing and committed resources are two marks per issuer with no difference and no ratio rendered;
  - Headroom: rows grouped by issuer in cohort order, tests in the order written, the issuer's tightest first; headroom is `headroom(threshold, current)` shown with its sign and "computed", else "not computed"; a negative headroom reads "beyond the limit" in words; a missing level is a gap row; no control sorts across issuers; the bar draws the level and the limit as two marks on the row's own scale in one neutral colour, with no share computed or coloured; rating triggers (`cp-2h/rating-triggers/...`) render in the same form; the base and downside place holds exactly "This page could not read base and downside cases.".
- [ ] **Step 2: Run** both test files. Expected: FAIL.
- [ ] **Step 3: Implement.** The wall is a `recharts` stacked `BarChart` by sector colour. Add `MiniColumns(props: { values: readonly (Dec | null)[]; colour: string; label: string })` to `Sparkline.tsx` here, with its test, and use it per issuer.
- [ ] **Step 4: Run** tests (PASS), web gates, quality gate.
- [ ] **Step 5: Commit** `feat(coverage): Refinancing and Headroom tabs`.

Review: `mx-precise`, and `mx-adversary` on `Refinancing.tsx` (sums of money).

### Task 7 (PR F): Market gap state and records

**Files:** Create `Market.tsx`, `Market.test.tsx`; modify `Coverage.tsx` (render), `PRODUCT.md` (one line naming the tabs), `VERIFICATION.md` (the coordinator writes this entry at merge).

- [ ] **Step 1: Write the failing tests:** with no `cp-3d/yield-against-maturity/yield` fact, the tab shows "This page could not read yields and maturities for N issuers." with N the cohort size, and a table of issuers each marked not read; with synthetic yield facts present it still shows the gap note and lists each bond's yield as written in the table (maturity is not a typed figure, so no scatter is built).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** tests (PASS), web gates, quality gate, then the full web suite once: `npm test` in `web/`.
- [ ] **Step 5: Commit** `feat(coverage): Market tab gap state`.

Review: `mx-precise`. Then, once on the last PR's branch diff: `confidence-review`, `rewrite-tournament`, `/sweep refactoring discover changed-update`, and the pre-merge review.

---

## Phase 2 (after PR F; not yet tasks)

Owner additions of 2026-11-26 (spec "Additions"): the RV book as a market-data source, qualitative
columns with a Sponsors panel, and the filter bar with multi-key sort and saved views. They are
not split into tasks yet because three facts are missing:

- the RV book's columns: read 2026-11-27 from a synthetic Sector RV sheet (spec, open question
  2): 18 columns, nine beyond `credit_snapshot.MARKET_COLUMNS` (Core Business Description,
  Sub-Sector, Public/Private, Ratings, Bid, Ask, Δ 1M, Δ YTD, Mid YTM, Mid 3Y DM; FIGI is absent
  from that sheet). Still to confirm: that the owner's real book has the same header row;
- whether the admitted publication carries the run's RV worksheet rows and context quotes, or only
  the run folder does (the Coverage reply reads the publication only): a read-only check of
  `react_frontend/coverage.py`'s snapshot against `credit_snapshot.read` on a run with an RV book;
- Questions 1 and 3 are answered (2026-11-27): a margin may be compared with its ranking's cohort
  median; sponsors come from Business & governance's ownership register
  (`("CP-1A", "ownership_register")`), matched as written; PR G must carry that register's
  sponsor rows in the reply, which it does not today.

Order once known: G, the reply carries RV rows and qualitative words (Python, with its answer
key); H, the filter bar, multi-key sort and saved views (these also serve PRs C to F and may move
ahead of them); I, the Profile column group and Sponsors panel; J, Relative value replacing the
Market gap state. Sorting and filtering in PR C (Monitor) already covers single-key sort.

All of it is code with hand-written answer keys. No model call is made by this page.

## Not in this plan

- The app-wide adoption of the "Colour as signal" palette in `theme.css` and `docs/design/design-system.md` (tests parse those tables): its own plan.
- Removing the old Rank and Trend views.
- Power-of-ten rescaling of amounts; percentage growth; a spread and duration view; base against downside. Each needs data or a ruling that does not exist yet.
- The Peer benchmark strip: its rows are keyed by a free-text metric name and its peer count is not a typed figure, so it cannot be matched to a measure without a parser.
- A yield-against-maturity scatter: maturity is not a typed figure.
- Colouring a bar by the share of a limit used: a division, outside the five computations. It needs a ruling.

## Not verified

- Field ids beyond the four the test snapshot emits (Task 2, step 1 checks them and blocks if they differ).
- Any cross-issuer case on real runs: none is retained in the repository.
- Public GitHub search for prior art returned no rows; that does not prove nothing exists.
- `fast-check`'s current version and API were not fetched; the coordinator fetches its docs into the Task 1 brief before dispatch.
