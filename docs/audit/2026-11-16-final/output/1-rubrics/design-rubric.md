# Design rubric (stage 1, agent A)

Answer key for the stage 2 design, accessibility and harmony checks. Scope is both browser
surfaces (connected app and static app); Signal (`web/src/pages/signal/`,
`src/deploy_workflow/signal/`, `docs/signal/`) is out of scope and no rule here applies to it.
Written 2026-11-17 for the audit of 2026-11-16 (`docs/audit/2026-11-16-final/README.md`).

## How to use this rubric

- Each rule has an id (`D-01` to `D-44`), a severity hint, what to look for, how to tell on a
  screenshot and in code, one `Pass:` and one `Fail:` example, and a source.
- A stage 2 finding cites the rule id in its `expected` field (FINDINGS-SCHEMA.md). The finding's
  `check` is `design` unless the rule says `accessibility` or `code`.
- Severity hints map to FINDINGS-SCHEMA.md. They are defaults: escalate to the next level when
  the defect misleads the reader about a figure, hides a limitation, or blocks the keyboard;
  lower it only when the defect is cosmetic and isolated.
- The design system (`docs/design/design-system.md`, version 0.8) outranks any outside guideline
  and the older component map where they differ. The project's own rules outrank the brand guide
  (`brand-tokens.md`: the guide "is a reference, not a rule").
- Several outside guidelines were dropped because the design system rules otherwise; they are in
  "Dropped outside rules" below. Do not raise a finding from a dropped rule.
- Two project documents disagree, and the later or more specific one is used here:
  1. Component map F1 says metric tiles sit "in a joined strip"; design system "Card and tile"
     (review 2) says a metric is "one card per metric, never a joined strip". The design system
     wins (D-23, D-03).
  2. Ruling 2026-11-11 decision 5 says a module entry shows "the plain module name first and the
     code second"; the owner's later prompts (2026-11-10 and 2026-11-12, design system "Rules from
     the owner's prompts") and the audit brief say module codes appear only on Evidence and in the
     trace drawer. The later rule wins (D-13).

## Already-ruled exceptions (`.impeccable/config.json` `ignoreValues`)

| Rule | Value | Scope | Reason in the file | Qualifies |
| :--- | :--- | :--- | :--- | :--- |
| `tiny-text` | `*` | `docs/design/mockups/module-report.html` only | The mockup follows the older Credit OS DESIGN.md type ramp (label 11px, compact 12px, body 13px) | D-30 (no text under 13px) and D-26 (type sizes). A 11 or 12px size in that one mockup file is not a finding. It is not a licence for any file under `web/src/`. |
| `cramped-padding` | `*` | `docs/design/mockups/module-report.html` only | Untitled UI Tag-with-avatar anatomy: avatar tile sits 4px inside the chip border, text keeps 8px | D-26 (spacing) and D-24 (badge forms). Same limit: that mockup only. A source component's own padding in `web/src/components/base/` is already governed by the source-look rule (D-08), not by this ignore. |

No `ignoreRules` and no `ignoreFiles` are set. Both entries concern a mockup, not a screen of
either app, so a stage 2 auditor will rarely meet them.

## Severity map

| Schema severity | Used by this rubric for |
| :--- | :--- |
| High | R8 offline breaches (D-10); a wrong, invented or placeholder figure drawn as real (D-15); a missing value drawn as zero (D-14) |
| Medium | Reader misled or blocked: machinery on a findings page (D-05, D-07, D-12, D-13); a keyboard, focus or name failure (D-34 to D-38); information by colour alone (D-39); missing designed state (D-31); markdown-looking page (D-04) |
| Low | Polish: spacing, radius, badge overuse, hover on non-interactive, sibling inconsistency (D-18 to D-27, D-30) |
| Info | An observation or a fragile assumption |

---

## A. Owner rules (2026-11-13) and the offline rule

### D-01 Designed for the reader, with what, how and why

**Severity hint:** Medium (a screen that serves the builder, not the reader). **Check:** design.

**Look for:** a screen whose content and form answer three questions for a portfolio manager or
credit committee member who has not read the source documents: what do they need here, how will
they use it, why does it look like this. The decision comes first (verdict, then findings), then
the challenge material on Evidence. The analyst's run-start pages answer the same questions for a
credit analyst who does not know JSON, module codes or launcher flags.

**Screenshot:** the first screen of Overview shows the credit view (bottom line band, headline
figures) before any table; run start shows pathway, cap and what will not be done before Submit.
**Code:** page components compose the kit rows the component map names (P1 banner, P2 numbered
list, F1 metric card) in that order; no raw field names, no snake_case, no JSON keys as labels.

Pass: Overview opens on the Navy bottom-line band (`surface-inverse`, white text), then four to
six metric cards, then numbered key findings; a committee member can state the credit view without
scrolling.

Fail: Overview opens on a table of module names, states and run ids and the credit view appears
only on a lower tab.

**Source:** owner 2026-11-13 ("Always consider user persona regarding what, how and why",
`docs/design/design-system.md` "Rules from the owner's prompts"); `PRODUCT.md` Users;
`docs/rulings/2026-11-11-reader-and-issuer-report.md` decision 8.

### D-02 Chart and component match the data type

**Severity hint:** Medium. **Check:** design.

**Look for:** each kind of information drawn by the component the component map names for it:
amounts by period as grouped columns (C1), a trend as one line (C2), paths by case as multi-line
(C3), parts of a whole as a stack, never a pie (C4), headroom as a bullet with a target line (C6),
risk as a heat grid (C7), ranked thresholds as ranked bars (C8), earlier against current as a
dumbbell (C11), a statement as a table (R1), cause and effect as a step chain (R5), dated records
as a timeline (R4), questions and answers as an accordion (R3). A chart is a chart, not a
sparkline column inside a table. A record shape never falls back to "a table with a Side column".

**Screenshot:** the form of the drawing matches the kind of the data, and a missing value leaves a
gap, not a zero. **Code:** `web/src/components/chart/` (`ColumnsChart`, `TrendChart`, `PathChart`,
`StackChart`, `BulletChart`, `DumbbellChart`, `WaterfallChart`, `RangeStripChart`, `LimitsChart`,
`ScatterPlot`); `Timeline.tsx`; record-shape routing in `web/src/pages/connected/visuals/`. A
`<table>` that holds a column of bars or sparkline cells for a time series is the signal.

Pass: recovery by class and case is `ColumnsChart` with bars side by side on one zero baseline and
its table form behind the Chart or Table toggle.

Fail: the same recovery data as a five-column table whose cells hold small inline bars, or a pie
for a debt stack.

**Source:** owner 2026-11-13 ("Match the chart to the data type"); component map sections 2.5 and
4 (record shapes and their "Not" column); design system "Rules from the owner's prompts" (a chart
is drawn as a chart, not inside a table; periods on the x-axis).

### D-03 No flat, repetitive page; one design is not reused for unlike information

**Severity hint:** Medium for a page where the sameness hides a distinction the reader needs (for
example findings, contrary evidence and limitations look the same); Low otherwise. **Check:**
design, harmony.

**Look for:** a page that is one component repeated down its length; a grid of identical cards for
content of different kinds; the same chart type or the same table used for unlike information.
"Do not overuse a design for same grouping." Unlike kinds must look different: contrary evidence
(warning-toned alert, P3) from key findings (numbered list, P2) from the "what would change the
view" callout (P4) from limitations (collapsible card, P5). The component map allows a few
deliberate reuses (section 7: R2, R13, R15, R17, P2, F4, I6, N6); anything beyond them is a
finding.

**Screenshot:** squint test: if the page reads as one texture the rule fails. **Code:** the same
component (`Card`, `MetricCard`, `ModuleTable`) mapped over heterogeneous arrays in one page
component; no kit-row variety in `Modules.tsx`, `Overview*`, `OverviewModules.tsx`.

Pass: a module page shows a Navy bottom-line band, a numbered findings list, an amber contrary
evidence alert, a callout for what would change the view and a collapsible limitations card, each
visibly a different component.

Fail: all four passages are the same white card with an `h3`, so contrary evidence cannot be told
from a finding.

**Source:** owner 2026-11-13 ("A flat, repetitive page is a defect"; "do not overuse a design for
same grouping", design system "Rules from the owner's prompts"); component map "How to read it"
and sections 2.2, 7; seed list (a grid of identical cards for unlike content).

### D-04 Nothing looks extracted directly from Markdown

**Severity hint:** Medium. **Check:** design.

**Look for:** a page that reads as rendered Markdown: bare `h2`/`h3` headings followed by bullet
lists and plain tables with no designed component; literal `**bold**`, `-` bullets, pipes, `###`,
`Basis:` lines or HTML comments visible in text; handoff section names ("Findings", "Request",
"Next module") used as visible headings; `react-markdown` or `dangerouslySetInnerHTML` output
styled only by prose defaults.

**Screenshot:** the page is a column of text blocks and grey-lined tables without surfaces, status
shapes, figures or charts. **Code:** a module's `## Findings` body rendered by a generic markdown
component into `<ul>`, `<table>` without the kit's `Table`, `Alert`, `Item` or `MetricCard`;
search rendered text for `###`, `|---`, `**`.

Pass: Modules renders the four reader passages as banner, numbered list panel, alert and
collapsible, and registers as the kit's sortable table with a Source column.

Fail: a module page shows `Key findings` as an `h3` over a bullet list, followed by a bare table
with a literal `Basis:` line under each bullet.

**Source:** owner 2026-11-13 ("Nothing may look extracted directly from Markdown"); AGENTS.md
Final Workflow (Markdown handoffs are intermediate artifacts); seed list (a page that reads as
rendered Markdown).

### D-05 Findings pages show findings and links; machinery lives on Evidence and in the trace drawer

**Severity hint:** Medium (High if a leaked local path, secret or run identifier). **Check:**
design.

**Look for:** on every page other than Evidence and the trace drawer, none of: source references,
file names, hashes, table and row ids, registers, calculations shown as steps, gap ledgers, run
codes, instruction text. Exception: file names where the analyst is choosing documents on run
start (an input control; component map 3.3). On Evidence and in the drawer these appear complete
and linked, in Geist Mono only there.

**Screenshot:** scan Overview, Changes, Modules and Forecast for strings that look like
`sha256`, `*.pdf`, `CP-`, `run-…`, `row_id`, `calc_…`. **Code:** `font-mono` or Geist Mono used
outside `report/Evidence.tsx`, `PublishedTrace`, `Record`, trace drawer; ids rendered as text in
findings components; grep rendered DOM text on non-Evidence routes.

Pass: Forecast shows case drivers and charts with one trace control per figure; the formula
inputs and file names open only in the drawer or on Evidence.

Fail: the Forecast page prints "Source: 2025_AnnualReport.pdf p. 47, calc FCF-03" under a chart.

**Source:** owner 2026-11-13 (findings sections; `docs/design/design-system.md` "Rules from the
owner's prompts" row 1); AGENTS.md (voice standard, "every other page shows findings and one trace
control"); `PRODUCT.md` Capabilities and Principle 3; ruling 2026-11-11 decision 7.

### D-06 One trace control per paragraph, row or figure; Evidence and the drawer are complete and linked

**Severity hint:** Medium (a figure or paragraph with no way to its source is also a wiring
finding). **Check:** design, wiring.

**Look for:** exactly one trace control (icon only, accessible name, tooltip; shown on hover and
focus, always shown on touch) per paragraph, row or figure, plus the page-level "Show sources"
switch. Not two controls on one paragraph, not a citation chip, not a bracket. The drawer shows
the paragraph's basis items, the figure's source, page, quoted passage and calculation steps where
the handoff carries them, and "Open in Evidence". Evidence lists every reference, none dropped.

**Screenshot:** hover and focus each paragraph; count controls. **Code:** `TraceControl` in
`web/src/pages/connected/` (`ReportContent.tsx` lines around 258 and 454 pass `label="Show sources
for …"`); `ChartFrame.tsx` carries one per chart; check the count per block, and that its
accessible name is specific (names the passage), not "Info".

Pass: each key finding has one icon-only control named "Show sources for this passage" that opens
the slide-out with the basis items and "Open in Evidence".

Fail: a paragraph shows a trailing `[CP-2, p.14]` chip and a "Basis" link and a second source icon.

**Source:** owner 2026-11-13; ruling 2026-11-11 decisions 7 and H3 (the app does not print the
Basis line); component map "Trace drawer" and ruling 7 (trace control); design system "Badge forms".

### D-07 Text written for another module is drawn nowhere

**Severity hint:** Medium. **Check:** design.

**Look for:** inter-module communication: `## Next module` content, routing text, "for CP-x"
instructions, "upstream handoff" notes, repair requests, scope reduction notes aimed at another
module, prompts. Not drawn on any page, not on Evidence either (it may be a handoff download).

**Screenshot:** search every page for "next module", "downstream", "for the reviewer module",
"hand off to". **Code:** a renderer that maps all `##` handoff sections to the page without an
allow-list; `Next module` or routing fields reaching a component.

Pass: Modules shows reader passages and registers; the `Next module` section is absent from the
page and present only in the downloadable handoff.

Fail: a module page ends with a "Next module: CP-3 should reconcile covenant definitions" block.

**Source:** owner 2026-11-13 ("Text written for another module is drawn nowhere"; design system
"Rules from the owner's prompts": "do not display anything also considered intermodule
communication"); AGENTS.md; ruling 2026-11-13 appendix and routing scope.

### D-08 Components and animations come only from the eight approved sources, copied in their source's look

**Severity hint:** Low for a one-off custom visual; Medium where a component from a non-approved
library (shadcn/ui, Kibo UI, Material, Radix, Base UI) or a runtime loader appears. **Check:**
design, code.

**Look for:** every non-atom component traceable to one of reactbits.dev,
shadcnblocks.com/components, flowbite-react.com/docs/components, uiverse.io/loaders,
hyperui.dev/components/application, preline.co/blocks, untitledui.com/react/components,
ant.design/components/grid, or to a piece written here (card, tile, gap panel, withheld bar,
blocked module, skeleton, status shapes, trace control) per the design system. The component keeps
its source page's look (layout, sizes, radius, shadow), in this system's colours and typefaces;
it is not restyled. The map's actual sources in use are Untitled UI (base), HyperUI and
Shadcnblocks (rebuilt on React Aria); React Bits, Flowbite React, Preline, Uiverse and Ant Design
are unused by decision 0003 (React Bits: licence; Ant: runtime CSS-in-JS breaks the CSP). Their
being on the owner's list is a ceiling, not a requirement to use them.

**Screenshot:** a control whose shape, radius or states look unlike any source page (for example a
button with a gradient fill). **Code:** `web/src/components/base/**` and `application/**` follow
UUI file names; `package.json` has no `@radix-ui`, `@mui`, `shadcn`, `framer-motion` unless a
decision record exists; new components record a source URL in the design system component list.

Pass: the Drawer is UUI `SlideoutMenu` with its own radius and shadow; the Timeline is the HyperUI
Vertical timeline recoloured to this system.

Fail: a hand-written accordion with custom chevrons and a spring animation from a library not on
the list.

**Source:** owner 2026-11-13 (list of eight sources, AGENTS.md "Components and animations come only
from"); `docs/design/component-sources.md` (table and "Rules for taking a component"); design
system "What this system supplies" and "Components"; decision 0003 (cited by the design system).

### D-09 Animation is for live state only

**Severity hint:** Low (Medium if an animation loops outside a live run or moves a numeral).
**Check:** design, code.

**Look for:** the only loops are the Running badge halo (1.6s), the Queued shimmer (1.8s) and the
spinner on a live run page with no step count yet. Everything else is a one-off transition of at
most 200ms (`cubic-bezier(.2,0,0,1)`: progress fill, activity entry rise of 8px, drawer, tabs,
accordion) or none. Numerals never animate (no count-up). Loading anywhere else is the static
skeleton, never a spinner. Hover and focus change state at once.

**Screenshot:** record or watch a static page for motion; reload and watch for count-ups.
**Code:** `@keyframes` and `animation:` in `web/src/styles/theme.css` (`status-halo`,
`queued-shimmer`) and `web/src/pages/run/activity/activity.css`; any `infinite` outside
`.status-halo`, `.queued-shimmer`, the loading indicator; `transition-duration` over 200ms;
`animate-pulse`, `animate-bounce`, `animate-spin` on non-live elements; scroll-reveal, parallax,
number tickers.

Pass: a finished run's header shows a static filled-circle "Finished" badge; only a live run's
badge pulses.

Fail: headline metrics count up on load, or a hover lift scales a card by 1.03.

**Source:** owner 2026-11-13 ("Animation is for live state, such as run status"); design system
"Motion" and "The idea in four lines"; component map section 5 (Run queued, Run running).

### D-10 The application works offline: nothing is loaded from another host at run time (ruling R8)

**Severity hint:** **High** (any request to another host, and any built address of another host,
is High under R8). **Check:** code, wiring.

**Look for:** every font, icon, script, style, chart, image and data file loads from the local
machine (`file:` or loopback). No request to a CDN, font service (Google Fonts, Adobe, Bunny),
icon service, analytics, image host or the approved source's own site. An approved-source
component is copied into the repository and bundled; nothing is fetched from its site. Exception:
a live paid model run, and CP-DR's lookups to the hosts in `src/deploy_workflow/research/web_allowlist.json`
(R8 recorded exception); neither is a page load. Installing packages during setup is not run time.

**Screenshot:** open the built page with the network disabled; text must render in Geist, Schibsted
Grotesk and Geist Mono, not the `system-ui` fallback, and charts and icons must draw.
**Code:** `@font-face` `src:` in `web/src/styles/theme.css` points at files under `web/public/fonts/`
(check the URL form resolves under `file:`); grep built `dist/` and `web/connected.html`,
`web/index.html` for `https?://` (other than XML namespaces such as `www.w3.org/2000/svg`),
`<link rel="stylesheet" href="http`, `@import url(http`, `fonts.googleapis`, `cdn.`, `unpkg`,
`jsdelivr`, `cdnjs`; `fetch(` or `import()` of a remote URL; CSP `connect-src`, `font-src`,
`script-src 'self'` (connected page). HyperUI charts that load Chart.js from a CDN are the known
example the map already refused.

Pass: the built `dist/` has no `https://` address except SVG namespaces, fonts are `.woff2` files
bundled locally, and the page renders identically with the network off.

Fail: `<link href="https://fonts.googleapis.com/css2?family=Geist">` in `index.html`, or an icon
fetched from a CDN at first paint.

**Source:** owner 2026-11-16 ("the app functions entirely offline", `docs/audit/2026-11-16-final/README.md`
R8 and its recorded exception); `docs/design/component-sources.md` (CSP forbids CDNs, runtime
`<style>` injection and fetch); `PRODUCT.md` Capabilities (CSP `script-src 'self'`); outside:
https://centralcsp.com/docs/font-src (self-hosted fonts under `font-src 'self'`).

---

## B. The reader and voice standard, and honest values

### D-11 Prose modules lead with judgement, in the fixed order

**Severity hint:** Medium. **Check:** design.

**Look for:** on every page that shows module prose, in this order: bottom line (the view and its
consequence for creditors), key findings (judgement first, only figures that move the view),
contrary evidence and what would change the view, limitations (only those that change a
conclusion; the rest in the gaps table on Evidence). Data modules (source readiness, canonical
data, peers) owe the bottom line, then their tables. A blocked module still shows its bottom line,
"Not assessable" and why. Evidence, risk mechanism and credit implication read as ordinary
sentences, never as "Evidence:" or "Implication:" labels. Overview leads with the credit view
(CP-6 chair conclusion, else CP-2; pathway variants: CP-L10 on a short snapshot, CP-1B on an
earnings update, kicker "Earnings view"), then one bottom line per module that ran, then the
limitations that change a conclusion (each once), key charts and the nearest five dates.

**Screenshot:** read first paragraph per module: is it the view? **Code:** passage order in
`ReportContent.tsx`, `Modules.tsx`, `OverviewModules.tsx`; the exact H3 headings `Bottom line`,
`Key findings`, `Contrary evidence and what would change the view`, `Limitations`.

Pass: a module opens "The group can service its 2027 maturities from cash and a refinanced RCF,
which protects senior creditors", then findings, then the case against.

Fail: a module opens with a restatement of leverage, margin and liquidity figures and ends with
"Implication:" labels.

**Source:** `docs/rulings/2026-11-11-reader-and-issuer-report.md` decisions 6 and 8, H1, H2, H5;
AGENTS.md (voice standard, "judgement first"); `PRODUCT.md` Brand Commitments.

### D-12 Source references live in the Basis, Source columns and Sources, never in narrative sentences

**Severity hint:** Medium. **Check:** design.

**Look for:** no chip, module code, page number, bracket, file name or "according to the annual
report p. 12" in sentences. A figure in prose is itself clickable (or carries the trace control)
and opens the inspector; a paragraph with no figure gets one quiet trace link. Tables keep a Source
column in plain words; the full set is on the Evidence page. A source is named in words only when
it matters to the argument.

**Screenshot:** read prose for `[`, `]`, "p.", "page", `CP-`, hashes. **Code:** regexes of the
H6 prose checks (`\bCP-[A-Z0-9]+\b`, `\bpp?\.\s*\d`, `[`/`]`) applied to rendered DOM text of
passages; "Earlier format" runs move a trailing bracket behind the trace link (H7).

Pass: "Liquidity covers the next 18 months of maturities" with one trace control; the quoted source
page opens in the drawer.

Fail: "Liquidity covers the next 18 months of maturities [CP-2D, p. 14, 10-K FY2024.pdf]".

**Source:** AGENTS.md ("Source references live in each paragraph's Basis line, tables' Source
columns and `## Sources`, never in narrative sentences"); ruling 2026-11-11 decision 7, H3, H6
checks 2 to 4; design system "Rules from the owner's prompts" (a sentence leads to its sources by
a control, never by a citation).

### D-13 No module codes, method step ids or table ids outside Evidence and the trace drawer; the plain module name is used

**Severity hint:** Medium (each page is one finding listing its screens). **Check:** design.

**Look for:** the module's plain name ("Liquidity") wherever a module is named, in navigation,
tabs, tiles and the model's file navigator; no `CP-2D`, `CP-L10`, `M12`, step ids, `cpos`, `RBOT`
ids, `table_id`, `row_id`, register ids on a working page. Codes may appear on Evidence and in
the drawer.

**Screenshot:** scan rails, tab labels, tile titles and chart titles. **Code:** `moduleCodes.ts`
mapping and `plainModuleNames()` used by every module label (`ReportContent.tsx` line about 173 shows
the pattern); a raw `module.code` or `id` printed in JSX outside Evidence.

Pass: the Changes page lists "Liquidity: Unchanged" with the square shape and word.

Fail: the module rail lists "CP-2D Liquidity" and a chart title reads "CP-1C peer scatter".

**Source:** owner 2026-11-10 and 2026-11-12 ("Remove all cp-IDs and methodology step IDs from
user facing screens", design system "Rules from the owner's prompts"); owner 2026-11-13 ("no table
IDs", same table; the design system records this as "nowhere yet": treat it as an owner rule); audit
brief (run codes only on Evidence and the drawer). Ruling 2026-11-11 decision 5 ("code second") is
superseded by the later prompts, see "How to use".

### D-14 Missing, zero, gap, withheld and blocked each have their own form; a missing value is never drawn as zero

**Severity hint:** High when a missing value is shown as 0 or a chart mark at zero (wrong figure);
Medium for a gap in an error colour, an empty cell or a mislabelled state. **Check:** design.

**Look for:** Missing figure is the text "n.a." in `text-tertiary`, right-aligned like a number;
zero is the figure 0. Missing value in a chart: no mark, an empty slot with "n.a." on the baseline,
a line that breaks, a scatter point not drawn and listed under "Not plotted", a heat-grid item
listed under "Not placed". A gap ("Not established for this run") is a hatched dashed panel
(`gap-hatch`, 1px dashed `border-gap` `#827BCC`, violet text `#514D80`), or in a table cell or on a
chart an inline gap badge, never a status colour and never an empty cell. A withheld value is a
short neutral striped bar (`withheld-stripes`) with a neutral "Withheld" badge. A blocked module is
a neutral badge with a slashed circle, the words "Not assessable" and one sentence saying why;
the item keeps its place. A failed module inside a run reads "Not assessable", not "Failed". Missing
confidence is "Not scored", never 0.

**Screenshot:** find a column with a missing period: does it read "n.a."? **Code:**
`web/src/components/gap/` (`GapPanel.tsx`, `Missing.tsx`, `Withheld.tsx`, `Blocked.tsx`); a
number formatter returning `0`, `"0"`, `"-"` or `""` for `null`/`undefined`; chart data mapped with
`?? 0`; `connectNulls` set on a line.

Pass: a bar chart with a missing FY2023 leaves the slot empty with "n.a." at the baseline; the
line chart breaks at the missing period.

Fail: the missing FY2023 EBITDA is drawn as a zero-height bar, or the cell is blank.

**Source:** design system "Gap states" and "Chart palette" marks; component map section 2.5 and
section 5; `PRODUCT.md` Positioning (what a run could not do is stated, missing is never shown as
zero); AGENTS.md (missing versus zero).

### D-15 Figures are exact, labelled and real: no placeholder or invented numbers

**Severity hint:** **High** (a wrong or invented figure, period, unit or source). **Check:**
design, wiring.

**Look for:** every number on a screen is the module's number with its period, unit, currency and
scale (`USD 1,250 million`, `4.1x`, `250 bps`); two decimals at most; the same figure reads the
same on Overview, Modules, Forecast and Evidence. No lorem ipsum, "$0.0M", "XX%", "TBD", "1,234",
demo testimonials, customer counts, benchmarks or prices (PRODUCT.md: none may be invented). The
synthetic proof case is allowed only where labelled as synthetic.

**Screenshot:** compare headline figures with the handoff and the Evidence calculation. **Code:**
fixtures (`web/public/data.js`, `web/fixtures/*.json`) shown as live data without a label;
hard-coded numerals in JSX; formatters that round or change scale (`moneyUnits.ts`).

Pass: "Net debt USD 4,173 million at 30 June 2025" matches the calculation the drawer opens.

Fail: "Net debt $4.2B" on Overview and "4,173" on Evidence with no unit, or a placeholder "$1,234M"
on a card.

**Source:** AGENTS.md ("Preserve exact amounts, missing versus zero, quantity family, currency,
dates"); `PRODUCT.md` Evidence on Hand and Principle 4; seed list (placeholder or invented
numbers); outside: https://www.saasui.design/blog/saas-ui-looks-ai-generated (invented metrics
and fake dashboards as a tell).

### D-16 Headings carry information; copy is plain, specific, sentence case

**Severity hint:** Low. **Check:** design.

**Look for:** a heading that restates the page title or its tab ("Overview" under the tab
"Overview", "Findings" over a page of findings); marketing filler ("seamless", "powerful",
"elevate", "unlock", "insights at your fingertips", "AI-powered"); hero-style taglines on a
working page; Title Case or ALL CAPS headings; helper text that says what the control is called.
Sentence case everywhere, with the guide's exceptions (acronyms, names, navigation items).

**Screenshot:** read each heading beside the page title. **Code:** `<h2>` text equal to the `<h1>`
text or tab label; strings containing the filler words above; `uppercase` on headings.

Pass: page title "Westbridge: credit view" over sections "Liquidity is tight until the 2027 refinancing"
(a finding as heading).

Fail: `h1` "Overview", `h2` "Overview of the issuer", subtitle "A powerful, seamless view of your
credit".

**Source:** seed list (headings that restate the page title; filler copy); design system "Type"
(sentence case); outside: https://www.saasui.design/blog/saas-ui-looks-ai-generated and
https://pub.towardsai.net/10-signs-of-ai-generated-design-and-how-to-make-yours-not-look-like-it-482ff7da81fc
(filler microcopy).

### D-17 Run start commits money once, knowingly; a limit is a decision, not a scrolled-past line

**Severity hint:** Medium (High if Submit can start a paid run without the cap shown). **Check:**
design, wiring.

**Look for:** before Submit the analyst sees the pathway, its cap (Lite USD 15, Full 25, Deep 40,
the five purpose pathways 20), what will run and what will not be done, the readiness items
grouped by state, and, for a private case with web search, the notice that the issuer's name and
research questions go to OpenAI's search. The confirmation is the warning-style modal (I4), stating
the cap, and it looks different from the plain form modal (I10). Limits are choices the analyst
makes in the step where they apply. The synthetic test mode spends nothing and is labelled.

**Screenshot:** the review sheet and the Submit dialog. **Code:** `StartRun.tsx`, `start/ReviewSheet.tsx`,
`start/StartReadiness.tsx`, `start/limits.ts`; the Submit dialog is `components/application/modals`.

Pass: the Submit dialog says "This run can cost up to USD 25" with Cancel and a primary Start.

Fail: Submit starts immediately from a button on the summary, or the cap appears only in a footnote.

**Source:** `PRODUCT.md` Operating Context and Principles 1 and 2; AGENTS.md (run start
page and the pathway caps; `docs/rulings/2026-11-11-run-start-submit.md`,
`docs/rulings/2026-11-15-pathway-tiers-and-caps.md`); component map I3, I4, I10.

---

## C. Signs of machine-generated design, as they apply to this design system

### D-18 No gradients as decoration, and no gradient text

**Severity hint:** Low. **Check:** design, code.

**Look for:** purple, blue or violet gradients on backgrounds, buttons, cards, headings or hero
areas; text filled with a gradient (`background-clip: text`, `text-transparent bg-gradient-*`).
Allowed, by ruling: `gap-hatch` and `withheld-stripes` repeating hatch fills (state, not
decoration), the queued shimmer `linear-gradient` (live state), the status halo box-shadow.

**Screenshot:** any smooth colour transition on a surface or text. **Code:** `bg-gradient-to-*`,
`from-*`/`via-*`/`to-*`, `linear-gradient(`, `radial-gradient(`, `conic-gradient(`,
`bg-clip-text`; each use outside `theme.css` `.gap-hatch`, `.withheld-stripes`, `.queued-shimmer`
is a finding.

Pass: the primary button is solid `action` `#001AFF`; the page background is flat `surface-canvas`
`#F6F5FF`.

Fail: a hero band with `bg-gradient-to-r from-indigo-500 to-purple-600` and a headline in gradient text.

**Source:** seed list; design system "The idea in four lines" (one accent) and "Chart palette"
(flat fills); outside: https://pub.towardsai.net/10-signs-of-ai-generated-design-and-how-to-make-yours-not-look-like-it-482ff7da81fc,
https://www.superdesign.dev/blog/why-ai-design-looks-generic and
https://scour.ing/@emschwartz/p/https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website
(purple and indigo gradients as the most cited tell).

### D-19 No glass, blur or glow without a purpose

**Severity hint:** Low. **Check:** design, code.

**Look for:** translucent frosted panels, backdrop blur, neon glows, 3D blobs, mesh backgrounds.
The two ruled shadows are `shadow-1` on cards and `shadow-2` on the chart tooltip; a source drawer,
modal or menu keeps its source's own shadow and its scrim.

**Code:** `backdrop-blur`, `backdrop-filter`, `blur-`, `bg-white/xx` over imagery, `drop-shadow-`,
`shadow-[0_0_`, `ring-offset` glows, `mix-blend-mode`.

Pass: the Submit modal is the UUI modal with its scrim and standard shadow.

Fail: a status card with `backdrop-blur-xl bg-white/30` and a cyan glow.

**Source:** seed list; design system "Space, radius, elevation, borders" ("Depth separates layers
and never decorates"); outside: https://cerebras.ai/blog/generating-beautiful-uis and
https://pub.towardsai.net/10-signs-of-ai-generated-design-and-how-to-make-yours-not-look-like-it-482ff7da81fc
(glassmorphism, neon glow, 3D blobs as defaults).

### D-20 No emoji as icons and no decorative icons that carry no meaning

**Severity hint:** Low (Medium if emoji appears in a figure or status). **Check:** design.

**Look for:** emoji in headings, buttons, navigation, empty states, status; icon-in-a-circle beside
every heading or bullet that adds nothing. Icons come only from the Untitled UI line set via
`@untitledui/icons`, inherit text colour, are 16px beside `small` text and 20px beside `body`, and
never stand alone without a label, except the trace control, which has an accessible name. Status
shapes are the ten CSS shapes (10px), not icons.

**Screenshot:** pictographs, checkmark/rocket/sparkle glyphs. **Code:** Unicode emoji ranges in
JSX strings; `<img>` icons; icons from other packages; an icon with no adjacent text and no
`aria-label`.

Pass: "Contrary evidence" alert shows the Warning triangle shape with its title; the empty state
uses the UUI Featured icon with a sentence and an action.

Fail: section headings prefixed with a lightbulb emoji; a sparkle icon next to every key finding.

**Source:** seed list; design system "Icons"; outside:
https://adriankrebs.ch/blog/design-slop/ (emoji icons in navigation), https://pub.towardsai.net/10-signs-of-ai-generated-design-and-how-to-make-yours-not-look-like-it-482ff7da81fc.

### D-21 No cards inside cards; not every box is a card

**Severity hint:** Low. **Check:** design.

**Look for:** a card (`radius-lg` 28px, 32px padding, `shadow-1`) containing a card or tile used
only to subdivide content; every list item in its own bordered box; border and surface around
content that needs none. Allowed: a card holding a group of source components or a chart (page
layout); the P6 for-and-against columns (DS tiles, the one ruled use of a tile); one metric card per
metric; a gap panel inside a card where content would have been.

**Screenshot:** two nested rounded rectangles with a visible edge each. **Code:** `Card` rendered
inside `Card`; `rounded-*` plus `border` plus `shadow` on a child of an element that has the same.

Pass: a chart card holds the chart frame and its legend directly on the white card surface.

Fail: a module card holds three "section cards" each holding a bordered "item card" for one bullet.

**Source:** seed list (cards nested in cards); design system "Card and tile"; outside:
https://cerebras.ai/blog/generating-beautiful-uis ("nested containers all the way down"),
https://www.saasui.design/blog/saas-ui-looks-ai-generated.

### D-22 Hierarchy: one clear first thing per screen; not everything centred

**Severity hint:** Low (Medium if it buries the bottom line). **Check:** design.

**Look for:** a clear priority (the bottom line, the metrics, the next action); left-aligned prose
columns capped near 72 characters; figures right-aligned with tabular numerals in tables; centred
text only in empty states and short titles of centred components. A centred hero over three
equal cards, centred long paragraphs, uniform spacing with no emphasis are the tell.

**Screenshot:** where does the eye land? **Code:** `text-center` on prose containers; `mx-auto
text-center` page wrappers; `max-w-` on prose; `tabular-nums` and `text-right` on figure cells.

Pass: left-aligned Overview with the Navy bottom-line band first, then metric cards, then findings.

Fail: a centred "hero" heading and subhead, three identical cards beneath it, then a centred table.

**Source:** seed list (everything centred); design system "Type" (prose columns near 72
characters, right-aligned figures); outside: https://www.saasui.design/blog/saas-ui-looks-ai-generated
and https://pub.towardsai.net/10-signs-of-ai-generated-design-and-how-to-make-yours-not-look-like-it-482ff7da81fc
(centred hero plus three equal cards, no clear first thing).

### D-23 Radius and shadow follow the ladder; not every corner rounded and every box shadowed

**Severity hint:** Low. **Check:** design, code.

**Look for:** radius from the five tokens only on pieces written here (6 skeleton, 12 small pieces,
20 tiles and gap panels, 28 cards, full for status shapes, gap badge, withheld bar); a source
component keeps its source's radius. Elevation only `shadow-1` (card at rest) and `shadow-2` (chart
tooltip); no shadow on rows, badges, buttons or inputs unless the source has it. A nested element
has a smaller radius than its container. Metric cards are separate cards, not a joined strip
(design system wins over component map F1).

**Code:** `rounded-[Npx]` or `rounded-2xl/3xl` not mapped to `--radius-ds-*`; `shadow-md/lg/xl/2xl`;
more than two shadow definitions in `theme.css`; `border-radius` values 8, 10, 14, 16, 24 on
written-here pieces.

Pass: card 28px, tile 20px inside a P6 column, chart tooltip 12px with `shadow-2`.

Fail: every list row has `rounded-2xl shadow-lg`, and a 28px card holds a 28px inner box.

**Source:** seed list (every corner rounded and every box shadowed); design system "Space, radius,
elevation, borders" and "Card and tile"; outside:
https://cerebras.ai/blog/generating-beautiful-uis (inner radius smaller than its container).

### D-24 A badge or pill is used only for what its form is for

**Severity hint:** Low. **Check:** design.

**Look for:** the five badge forms only: status badge (leading shape, word, status colour; a state
and nothing else), label badge (word only, neutral: pathway, kind, qualifier, "AI"), count badge
(number only, neutral), dot badge (8px `action`, unread), trace control. A state shown as a label
badge, a label shown as a status badge, a colourful pill on every row, a badge duplicating the text
beside it, a confidence band wearing a status colour (a band is not a state).

**Screenshot:** count pills per row. **Code:** `components/base/badges` and `StatusBadge.tsx`
usage; `Badge` with arbitrary colour props; badge text equal to adjacent text.

Pass: module items carry one trailing status badge each; the count of repeated states collapses to
one item with a count badge.

Fail: every table row carries a green "Verified" pill, a blue "AI" pill and a grey "Q3" pill.

**Source:** seed list (a badge or pill on everything); design system "Badge forms"; component map
section 2 (atoms).

### D-25 One accent colour; no competing accents; status and chart colours used only for their job

**Severity hint:** Low (Medium if a status colour is used as decoration or a series). **Check:**
design.

**Look for:** Navy carries text; Ultramarine `#001AFF` is the only action colour (links, primary
button, selected state, progress fill). Secondaries appear only as tints (L steps) and dark steps
(D steps), never at full strength. Status colours (success, warning, error, info) only for
status; gap uses violet `#827BCC`/`#514D80`, never a status colour. Chart series follow the fixed
order (Ultramarine, Violet D2, Reef D4, Orange D3, Green D5, Yellow D4, then Other `#7F848D`); status
colours are never a series; labels use text colours, never the series colour. Hex values not in
`theme.css` are inventions.

**Screenshot:** count distinct hues beyond navy, ultramarine and neutrals. **Code:** hex or
`oklch()` literals outside `theme.css`; Tailwind default palette classes (`bg-blue-500`,
`text-emerald-600`, `bg-purple-*`) when `--color-*: initial` removes defaults; series colours
reordered.

Pass: the one action colour is Ultramarine; a success badge uses `#0C6639` on `#E8FFF4` with a
filled circle.

Fail: a teal secondary button, an orange primary link and a green hero accent on one screen.

**Source:** seed list (several competing accent colours); design system "Colour roles", "Chart
palette", "Where this departs from the brand guide"; `brand-tokens.md` (colour values fixed).

### D-26 Spacing, type sizes and structure agree between sibling screens

**Severity hint:** Low (Medium if the divergence confuses the reader about which run or page they
are on). **Check:** harmony.

**Look for:** sibling pages (Overview, Changes, Modules, Forecast, Evidence; library home and
history; run start and run activity; connected and static twins of the same page) share the page
header (issuer name, as-of date, pathway and state as badges), gutters (32), card padding (32),
tile padding (24), card gap (24), section gap (64), the `h1` 36/42 page title, `h2` 28/34, `h3`
22/30, `body` 16/26, `small` 14/22, `caption` 13/18. Spacing steps are multiples of 4 from the
ladder 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. An ignored value (mockup file only) does not
apply to app screens.

**Screenshot:** overlay or flip between sibling screens. **Code:** `p-[13px]`, `mt-[22px]`, odd
`gap-` values, `text-[Npx]` not in the type tokens, `font-size` literals outside `theme.css`;
different header components per page.

Pass: every Overview, Changes, Modules, Forecast and Evidence page opens with the same `PageHeader`
and section gap.

Fail: Forecast uses a 20px gutter and a 30px title while Modules uses 32 and 36.

**Source:** seed list (inconsistent spacing and type sizes between sibling screens); design system
"Type" and "Space, radius, elevation, borders"; `.impeccable/config.json` `ignoreValues` as above.

### D-27 Hover and focus effects only on interactive things

**Severity hint:** Low. **Check:** design.

**Look for:** a hover lift, tint, pointer cursor or underline on a thing that does nothing (a card,
a figure, a non-clickable row). Hover on a neutral surface (table row, nav item, secondary button)
is `surface-subtle`; primary hover is `action-hover`; changes are immediate, not animated.

**Code:** `hover:` classes, `cursor-pointer`, `:hover` on non-`button`/`a`/`[role]` elements;
`group-hover` scale or translate.

Pass: a sortable column head and a navigation item tint on hover; a static metric card does not.

Fail: every metric card rises 4px and shows a shadow on hover though it opens nothing.

**Source:** seed list (hover effects on things that are not interactive); design system "Action,
hover and focus" and "Motion" (hover and focus change state at once).

### D-28 Charts follow the frame and the palette, and carry their own text alternative

**Severity hint:** Medium (High if a mark misstates a figure); Low for polish. **Check:** design,
accessibility.

**Look for:** every chart sits in one frame (`ChartFrame.tsx`): title, Chart or Table toggle (joined
button group, single selection), direct labels on the values that matter (at most four labelled),
a legend for two or more series, the module's basis note, one trace control. Periods on the
x-axis, oldest left; one y-axis, never two; 1px `border-control` baseline; faint solid horizontal
`border-hairline` gridlines only; flat fills, no 3D; bars up to 32px wide with 6px top corners;
compared bars side by side; lines carry dash and marker (circle, square, triangle, diamond, ring,
cross) so series differ without colour; no pie, no dual axis, no status colour as a series; at most
three series on a scatter or small multiple. Every chart has its table form on the other side of
the toggle (`ChartTable.tsx`).

**Screenshot:** convert to grayscale: can two series still be told apart? **Code:**
`web/src/components/chart/`; `<PieChart>`, `<YAxis yAxisId=...>` twice, 3D, `fill` series colours
not from `series.ts`.

Pass: a three-case path chart has dashed Violet D2 and solid Ultramarine lines with different
markers, a legend, direct labels on the last actuals and a Table toggle.

Fail: a legend-less four-colour line chart with red and green lines, no markers and no table form.

**Source:** design system "Chart palette" and marks; component map section 2.5; owner 2026-11-10
(periods on the x axis); outside: https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts,
https://www.datawrapper.de/blog/colorblindness-part2, https://data.europa.eu/apps/data-visualisation-guide/accessible-colours
(label directly, vary shape as well as colour, 3:1 chart elements, a data table alternative).

### D-29 Within one set of states, every state has its own shape, word and colour family

**Severity hint:** Medium. **Check:** design, accessibility.

**Look for:** the sets the design system defines (status, run states, module state, change state,
gap severity, file state, answer state, met or not met, source readiness, security recommendation,
freshness, run limits, dated records, approval, activity that cannot be read). Two states in one
list never share a shape; a shape keeps its meaning across sets (filled circle good or complete,
half-filled under way, ring idle or not started, square settled, triangle caution or changed,
diamond problem, cross rejected, pause bars interrupted, slashed circle "Not assessable" only,
dashed ring a gap only). Run states: Queued ring, Running half-filled circle with halo while live,
Finished filled circle, Failed diamond, Capped triangle, Rejected cross, Interrupted pause bars.
Module state and change state sit together on Changes, so across the two sets no shape has two
meanings.

**Screenshot:** list every badge on the page; each distinct state, a distinct shape and word.
**Code:** `web/src/components/status/sets.ts` and `shapes.tsx`; a state defined only by a colour
class; a shape reused inside one set.

Pass: Changes shows "Changed" (triangle, action colours), "Unchanged" (square, neutral) and "Not
assessable" (slashed circle, neutral).

Fail: "Changed" and "Unchanged" both a filled dot, one green, one blue.

**Source:** design system "Status", "Run states", "Status shapes" and the set table; component map
section 5.

### D-30 Type: the three families, none under 13px, tabular figures, mono only on Evidence

**Severity hint:** Low. **Check:** design, code.

**Look for:** Schibsted Grotesk (600, 700) for headings; Geist (400, 500, 600, tabular numerals)
for body, interface and figures; Geist Mono (400, 500) only on Evidence and in the trace drawer for
ids, hashes and file names. Nothing written here set below 13px (caption 13/18, mono 13/20). Fallback
stack `system-ui, sans-serif`. Sentence case. Figures in tables right-aligned with tabular
numerals. A source component keeps its source's sizes, in these families.

**Screenshot:** text visibly smaller than the caption size; Inter or Arial rendering. **Code:**
`text-[10px]`, `text-[11px]`, `text-[12px]`, `font-size: 11px|12px` in `web/src` (not
`docs/design/mockups/module-report.html`, which is an ignored value); `font-family` literals; `font-mono`
outside Evidence and trace.

Pass: a column header is `caption` 13/18 `text-tertiary`; ids appear in Geist Mono on Evidence only.

Fail: a 11px grey footnote under a chart; Inter used in the model view.

**Source:** design system "Type"; `.impeccable/config.json` `ignoreValues` (mockup only).

### D-31 Loading, empty, error and partial states are designed, not blank or spinning

**Severity hint:** Medium (a missing state, per FINDINGS-SCHEMA). **Check:** state.

**Look for:** loading anywhere but a live run page is a static skeleton in the shape of what will
arrive (`surface-subtle`, `radius-xs`, no animation); a live run with no step count shows the
spinner with a label; empty ("no runs yet", "no earlier run", "no search match") is the UUI empty
state with featured icon, title, one sentence and where it exists the next action; errors and
system messages ("cannot reach the service", run capped, run rejected) are the alert with tone by
severity and an action; a small finished action (copied) is a success toast. No blank white
screen, no raw error string, no infinite spinner, no stack trace, no layout jump when content lands.

**Screenshot:** force each state in the proof server and in the static app. **Code:**
`components/gap/Skeleton.tsx`, `application/empty-state`, `alert/Alert.tsx`,
`ConnectedLoadBoundary.tsx`; a component returning `null` for no data; `loading` rendering
`<Spinner>` off a run page.

Pass: Library home with no runs shows the empty state "No runs yet" with "Start a run".

Fail: a blank canvas while the service is unreachable, or a console error text in a red box.

**Source:** design system "Gap states" (empty rows) and "Motion" ("Loading anywhere else is the
static skeleton, never a spinner"); component map S2, S4, S5, S6, S7 and section 5; FINDINGS-SCHEMA
(`state` check).

### D-32 Long text wraps in full; a qualification is never truncated

**Severity hint:** Medium (a cut-off limitation or contrary point misleads). **Check:** design.

**Look for:** passages (bottom line, key findings, contrary evidence, what would change the view)
and long record cells wrap inside their row and show in full; nothing cut with an ellipsis; only
the limitations card collapses (open by default, prints open) with its count. Two-line titles wrap
at heading line height. No horizontal scrolling for prose.

**Screenshot:** a long module name, a long finding, a long limitation. **Code:** `truncate`,
`line-clamp-*`, `text-ellipsis`, `overflow-hidden whitespace-nowrap` on passages and record cells.

Pass: a 60-word limitation wraps in its card with its count heading above.

Fail: a limitation cut at 80 characters with "…".

**Source:** component map section 5 (Long text); design system "Type" (long analytical titles wrap
to two lines).

---

## D. Accessibility (WCAG 2.2 AA is the working assumption, `PRODUCT.md`)

### D-33 Contrast meets WCAG 2.2 AA

**Severity hint:** Medium (a text pair under 4.5:1, or a meaningful mark under 3:1). **Check:**
accessibility.

**Look for:** text 4.5:1 against its background (large text, 24px or 18.66px bold, 3:1); interface
component boundaries and states, icons, status shapes, chart marks and focus indicators 3:1 against
adjacent colours (1.4.11). The design system's table already gives passing pairs: primary text
`#000533` on card (19.64), secondary `#474A4F` on card (8.90), tertiary `#63676E` on card (5.68) and
canvas (5.26), link `#001AFF` on card (8.10), gap text `#514D80` on card (7.71), control border
`#7F848D` on card (3.76), gap edge `#827BCC` on card (3.71). Not allowed as text or thin lines on
light surfaces: the seven bright secondaries (Green `#1EFF8F`, Yellow `#EAFF00`, Gold `#FFE900`,
Cyan `#4AD4FF`, Orange `#FFC600`, Violet `#A29AFF`, Reef `#FF7C56`). `text-disabled` `#A4A9B1` is
for inactive controls only. Decorative edges (`border-subtle`, `border-hairline`, `border-container`,
`connector`) carry no meaning. Text over a hatch or striped fill is measured on the darker stripe.

**Screenshot:** sample foreground and background pixels; compute the ratio. **Code:** `text-disabled`
on live text; neon hexes in `color:`; `opacity-*` on text; text on `bg-gradient`; any pair not in the
design system's contrast table.

Pass: caption "n.a." in `text-tertiary` `#63676E` on the white card (5.68:1).

Fail: a cyan `#4AD4FF` link on white (about 1.8:1) or grey `text-disabled` helper text.

**Source:** WCAG 2.2 SC 1.4.3 and 1.4.11; `docs/design/design-system.md` "Contrast"; outside:
https://webaim.org/articles/contrast/, https://w3.org/WAI/WCAG22/Understanding/non-text-contrast,
https://alphagov.github.io/guide-to-wcag.

### D-34 Focus is always visible and never hidden

**Severity hint:** Medium. **Check:** accessibility.

**Look for:** every focusable element shows a focus indicator on keyboard focus (`:focus-visible`)
at 3:1 or better against its surroundings: `focus` `#001AFF` on light surfaces (8.10 on card), 2px
wide with a 2px offset on pieces written here, `focus-inverse` `#4AD4FF` on Navy (11.36). A source
component keeps its own ring width. A focused element is not entirely covered by sticky headers,
a drawer or a banner (2.4.11 Focus Not Obscured, AA in WCAG 2.2). No `outline: none` without a
replacement.

**Screenshot:** tab through each page; the ring is visible on every stop, including the trace
control, tabs, table sort heads, drawer close, toggles. **Code:** `outline-none`, `outline: 0`,
`focus:outline-none` without a `focus-visible:ring`; `tabindex="-1"` on controls; sticky
`position: fixed` headers with no `scroll-padding-top`.

Pass: the trace control reveals on focus with a 2px Ultramarine ring; the sticky header does not
cover the focused row.

Fail: `focus:outline-none` on the tab list with no replacement style.

**Source:** WCAG 2.2 SC 2.4.7 (AA) and 2.4.11 (AA); design system "Action, hover and focus";
outside: https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2 and
https://dequeuniversity.com/resources/wcag-2.2 (Focus Not Obscured). Note: sources disagree on
the level of 2.4.13 Focus Appearance (the Recommendation has it at AAA); it is not required here.

### D-35 Everything is operable from the keyboard, with no trap and no pointer-only action

**Severity hint:** Medium (High if a journey cannot be completed by keyboard). **Check:**
accessibility, wiring.

**Look for:** every control reachable and operable with Tab, Shift+Tab, Enter, Space, arrow keys
(tabs, radio cards, menus), Escape (drawer, modal, tooltip); logical tab order that follows
reading order; no keyboard trap; the trace control, hidden until hover, is reachable and revealed
on focus; no action that needs drag (the Gantt and status list are read-only; any drag also has a
single-pointer alternative, 2.5.7); no hover-only information; the chart's data is reachable via the
table toggle; skip link or landmark to reach content.

**Screenshot:** none; this is a keyboard probe. **Code:** `onClick` on `div`/`span` without
`role`, `tabIndex` and key handlers; `onMouseEnter` only; `jsx-a11y` rules disabled
(`click-events-have-key-events`, `no-static-element-interactions`); `tabIndex` above 0.

Pass: run start can be completed, and Submit confirmed or cancelled, with the keyboard only.

Fail: a card opens its drawer only by mouse click on a `div`.

**Source:** WCAG 2.2 SC 2.1.1, 2.1.2, 2.5.7 (AA); `PRODUCT.md` Accessibility (the web gates run `eslint-plugin-jsx-a11y`); outside: https://www.w3.org/TR/2021/NOTE-wai-aria-practices-1.2-20211129/examples/dialog-modal/dialog.html
and https://accessibleweb.com/wcag/whats-new-in-wcag-2-2/ (dragging alternatives).

### D-36 One `h1` per page; headings in order

**Severity hint:** Low (Medium if headings misorder blocks screen-reader navigation of Evidence or
Modules). **Check:** accessibility.

**Look for:** exactly one `h1` per page, the page title (36/42); `h2` for sections, `h3` for
sub-sections; no skipped level going down (an `h2` followed by an `h4`); no heading used only for
size (styled `div` or `p` for visual headings, headings for styling); an `h1` that names the page,
not the application; landmarks (`main`, `nav`, `aside`) present. Going back up is fine.

**Screenshot:** none. **Code:** query rendered DOM per route: count of `h1`; sequence of `h1..h6`;
`PageHeader.tsx` renders the single `h1`; a UUI component that carries its own heading level
(modal title, empty state title, drawer title) must not create a second `h1`.

Pass: `/library/:issuer/modules` has one `h1` (issuer and module), `h2` per passage, `h3` below.

Fail: Overview renders two `h1`s (page title and bottom-line band) and jumps from `h2` to `h4`.

**Source:** WCAG 2.2 SC 1.3.1 and 2.4.6; owner brief 2026-11-16; outside: https://accessibility.iu.edu/creating-content/web-content/headings.html
and https://rocketvalidator.com/accessibility-validation/axe/4.12/heading-order (levels may rise
by one; the single `h1` is best practice rather than a WCAG failure, here made a rule by the owner brief).

### D-37 Every control has a name, and the visible label is part of it

**Severity hint:** Medium. **Check:** accessibility.

**Look for:** every button, link, input, select, switch, toggle, tab, table sort head, icon-only
control and chart toggle has an accessible name that says what it does; icon-only controls (trace
control, drawer close, copy) carry `aria-label` or `aria-labelledby`, with the icon `aria-hidden`;
form fields have visible labels, not placeholder only; where a visible label exists the name starts
with it (2.5.3); the trace control's name names the passage ("Show sources for this passage" is
the floor; a specific name is better); no two different actions share the same generic name ("OK",
"Info", "More") on one page; chart and drawn figures have a name and description.

**Screenshot:** none. **Code:** accessibility-tree dump per route; `<button>` with only an icon
child and no `aria-label`; `<input>` with no `<label>` or `aria-label`; empty `aria-label=""`;
`aria-labelledby` to a missing id; `jsx-a11y/control-has-associated-label` disabled.

Pass: the drawer close button is named "Close" and the trace control "Show sources for Liquidity
findings".

Fail: an icon button with no name, or twenty links all called "View".

**Source:** WCAG 2.2 SC 4.1.2, 2.5.3, 1.3.1; design system "Icons" (the trace control carries an
accessible name); outside: https://primer.style/guides/accessibility/descriptive-buttons,
https://sarasoueidan.com/blog/accessible-icon-buttons/,
https://www.levelaccess.com/blog/aria-labels-and-accessible-names-a-developers-guide/.

### D-38 Focus returns to the opener when a drawer or dialog closes; focus moves in on open

**Severity hint:** Medium. **Check:** accessibility.

**Look for:** opening a trace drawer, the Submit dialog or a form modal moves focus inside it (to
the title, first field or close control); focus is contained while a modal is open (the page behind
is inert); Escape and the close control and the scrim all close it; on close, focus returns to the
element that opened it (the trace control, the Submit button); if the opener has gone, focus goes
to a logical place. The drawer has a title and a dialog role.

**Screenshot:** none. **Code:** UUI `SlideoutMenu` and `Modal` (React Aria `Dialog`/`Modal`) restore
focus by default; a custom open state that unmounts the opener, `autoFocus` resets, or
`document.activeElement` lost to `body` after close; `restoreFocus` disabled. Probe: open with
keyboard, close with Esc, read `document.activeElement`.

Pass: Enter on a trace control opens the drawer; Esc closes it; focus is back on that same trace
control.

Fail: after closing the drawer, focus sits on `body` and the next Tab starts at the top of the page.

**Source:** audit brief (accessibility rules); WAI-ARIA Authoring Practices modal dialog pattern;
outside: https://primer.style/product/components/dialog/accessibility,
https://ux.redhat.com/elements/dialog/accessibility/ and
https://www.w3.org/TR/2021/NOTE-wai-aria-practices-1.2-20211129/examples/dialog-modal/dialog.html
(return focus to the invoking control on close).

### D-39 No information is carried by colour alone

**Severity hint:** Medium. **Check:** accessibility, design.

**Look for:** every state, status, series and link has a second cue: a shape and a word for states
(D-29), dash and marker for lines, direct labels and legend for series, the heat-grid cell labelled
with a value, a delta with a shape and a sign, links distinguishable by more than hue where in
running text (underline or weight, or 3:1 against the surrounding text), the selected tab by a 2px
line as well as colour, error text with a mark, required fields not by colour. The design must
survive grayscale and the common forms of colour blindness.

**Screenshot:** convert the screen to grayscale; every distinction remains. **Code:** a class that
changes only `text-*`, `bg-*` or `border-*` colour between states; a legend with colour swatches only;
a delta coloured red or green without arrow or sign.

Pass: "Failed" is a diamond with the word and the error colour; "Finished" a filled circle with the
word and the success colour.

Fail: a green dot and a red dot with no words as the only difference between "Met" and "Not met".

**Source:** WCAG 2.2 SC 1.4.1 (A); design system "The idea in four lines" (colour never works
alone) and "Status shapes"; outside: https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts,
https://www.datawrapper.de/blog/colorblindness-part2 (vary shape as well as colour).

### D-40 Reduced motion is respected

**Severity hint:** Medium (a loop that ignores `prefers-reduced-motion`); Low (a missed transition).
**Check:** accessibility, code.

**Look for:** under `prefers-reduced-motion: reduce` every animation and transition stops or is
instant: the halo, the shimmer, the spinner rotation, progress easing, activity entry rise, drawer
slide, tab and accordion transitions. The running state still reads, because its half-filled circle
differs from Finished by shape. The loops sit inside `@media (prefers-reduced-motion: no-preference)`
and a global reduce rule backs them up. No autoplaying video or auto-advancing carousel; moving
content that lasts over 5 seconds and runs beside other content (the live halo) is limited to a
live run (WCAG 2.2.2: where it applies, a way to pause or stop; the project's mechanism is the OS
preference, record anything that loops beyond a live run).

**Screenshot:** none; emulate reduced motion and watch. **Code:** `theme.css` lines 358 onward
(`@media (prefers-reduced-motion: no-preference)` around `.status-halo` and `.queued-shimmer`),
`web/src/index.css` line 14 (`prefers-reduced-motion: reduce`), `web/src/pages/run/activity/activity.css`
line 8; any `animation`, `transition`, `scroll-behavior: smooth` or JS animation outside those
rules; `web/src/motion.test.ts` covers the contract.

Pass: with reduce set, the Running badge is a static half-filled circle and the drawer opens with
no slide.

Fail: a `transition-all duration-500` on a card or a smooth-scroll rule that ignores the setting.

**Source:** WCAG 2.2 SC 2.3.3 (AAA, advisory) and 2.2.2 (A); design system "Motion"; outside:
https://web.dev/learn/accessibility/motion and https://primer.style/accessibility/design-guidance/motion-and-animation
(respect the OS setting; motion that is not needed to understand content should be off by default).

### D-41 Pointer targets are at least 24 by 24 CSS pixels

**Severity hint:** Low (Medium if the trace control or a table action cannot be hit reliably).
**Check:** accessibility.

**Look for:** every pointer target at least 24 by 24 CSS px, or with enough spacing that a 24px
circle centred on it does not meet another target (WCAG 2.5.8 AA); exceptions: inline links in text,
and user-agent controls. The icon-only trace control uses a `radius-sm` hit area larger than its
16px icon; badges used as buttons, table row actions, chart legend toggles and dense Evidence rows
(`sm` size) must still meet it.

**Screenshot:** measure with the inspector. **Code:** `h-4 w-4`, `size-4`, `p-0` on a `button`;
`min-h`/`min-w` missing on icon buttons; dense `sm` table row actions.

Pass: the trace control is a 24px hit area around a 16px icon.

Fail: a 16px copy icon button with 2px spacing from the next control.

**Source:** WCAG 2.2 SC 2.5.8 (AA); outside: https://dequeuniversity.com/resources/wcag-2.2 and
https://accessibleweb.com/wcag/whats-new-in-wcag-2-2/. The 44px AAA target size is not required (see
"Dropped outside rules").

### D-42 Text resizes and content reflows without loss

**Severity hint:** Low (the design system was not checked at narrow widths). **Check:**
accessibility, design.

**Look for:** at 200 percent text size nothing is cut off or overlapped; at 320 CSS px (400
percent zoom) content reflows to one column without two-direction scrolling, except data tables
and charts which may scroll or offer their table form; text spacing overrides do not break the
layout; bars narrow to 16px on narrow screens (the source rule); the sidebar rail does not eat the
width.

**Screenshot:** the page at 200 percent and at 1280 wide zoomed to 400 percent. **Code:** fixed
`px` heights on text containers, `overflow-hidden` on cards, `min-w-[...]` wider than 320, `vw`
font sizes.

Pass: a metric card's figure and label wrap at 200 percent without clipping.

Fail: a tile with `h-[120px] overflow-hidden` that cuts its caption at larger text sizes.

**Source:** WCAG 2.2 SC 1.4.4 and 1.4.10; `PRODUCT.md` Accessibility; design system Not verified
(not checked at narrow widths).

### D-43 Status changes are announced without moving focus

**Severity hint:** Medium on Run activity (a run state change is invisible to a screen-reader user);
Low elsewhere. **Check:** accessibility.

**Look for:** run state and progress changes ("Module 3 of 12 finished", Finished, Failed, Capped),
a floating alert, a copied toast and an inline validation message are exposed in a live region
(`role="status"`, `aria-live="polite"`; `role="alert"` for errors that need action) without taking
focus; the live region exists before the change; numerals are not re-announced every tick.

**Screenshot:** none. **Code:** `aria-live`, `role="status"`, `role="alert"` in `RunActivity.tsx`,
`RunProgress.tsx`, `alert/Alert.tsx`; a state badge updated with no live region.

Pass: when a run finishes, a polite status region says "Run finished" while focus stays put.

Fail: the badge changes silently, or the alert steals focus on every poll.

**Source:** WCAG 2.2 SC 4.1.3 (AA); component map S4, S6 and I5.

### D-44 Non-text content has a text alternative; decoration is hidden

**Severity hint:** Medium for a chart or drawn figure with no accessible alternative; Low for
decorative marks. **Check:** accessibility.

**Look for:** every chart has a name, a short description (kind of chart and what it shows) and the
table form as the full alternative (D-28); informative images and drawn figures have an accessible
name; decorative icons and the status shapes' duplicates are `aria-hidden` (the word beside the shape
carries the meaning); the status shape is not announced twice; the hatch and stripe backgrounds
carry no meaning.

**Screenshot:** none. **Code:** `role="img"` with `aria-label` on chart wrappers, `<title>`/`<desc>`
in SVG, `aria-hidden="true"` on decorative SVG, `alt=""` on decorative images; Recharts surfaces
(`accessibilityLayer`) are not the only alternative.

Pass: a bar chart carries `aria-label="Revenue and EBITDA by year, columns"` and the Table toggle holds
every value.

Fail: a chart is an unlabelled SVG with a tooltip as the only way to read a value.

**Source:** WCAG 2.2 SC 1.1.1 (A); design system "Chart palette" (table form on the other side of the
toggle); outside: https://data.europa.eu/apps/data-visualisation-guide/accessible-colours and
https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts
(describe the chart type and kind of data; offer a table).

---

## Dropped outside rules

Outside guidelines read for this rubric that conflict with, or are not needed by, the project's
design system. They produce no findings.

| Outside rule (source) | Why dropped |
| :--- | :--- |
| "Purple or violet means AI slop" as a colour ban (towardsai, superdesign, prg.sh) | The canvas is Violet L9 `#F6F5FF` and the gap colours are Violet D5 and D2 by owner ruling (design system "Colour roles"; owner accepted at review 1). Only gradient or decorative use of purple is a defect (D-18). |
| "Avoid large radii and soft shadows; use sharper, flatter corners" (cerebras, saasui) | Radii 6/12/20/28 and `shadow-1`/`shadow-2` are ruled ("Rounded tiles", owner's "rounded"; design system "Where this departs from the brand guide"). Only the unruled radius or shadow is a defect (D-23). |
| "Looks like a stock component library / default shadcn or Tailwind UI" as a tell (saasui, vibe-coded lists) | Decision 0003 "source look" requires source components to be copied closely, not restyled (design system "What this system supplies"; component-sources). |
| "Cards are overused; avoid putting content in cards" in general | The white card on a violet canvas is the design system's central idea; only nested and gratuitous cards are defects (D-21). |
| "Offer a dark mode / `prefers-color-scheme`" (web.dev motion page lists it alongside) | Owner: "No dark mode" (design system "Rulings"). |
| "Offer an in-app toggle for animation, and default to reduced motion" (web.dev) | The project's mechanism is the OS `prefers-reduced-motion` setting and one live-state loop set; a toggle is not required (D-40). |
| "Use 44 by 44 CSS px targets" (WCAG 2.1 SC 2.5.5, AAA) | AA is the working assumption; 24 by 24 (2.5.8) is the rule (D-41). Dense `sm` Evidence rows are ruled. |
| "Avoid legends; label directly only" (some data-viz guides) | The design system always shows a legend for two or more series and also labels at most four directly (D-28). |
| "Do not use Inter, Roboto or Arial" as a typeface ban (anti-slop lists) | Not in conflict: the project uses Schibsted Grotesk, Geist and Geist Mono, with `system-ui` as fallback. No rule needed. |
| Brand guide: "no gridlines", Sharp Grotesk headlines, Inter body, WCAG 2.1 AA target, no shadows stated | Superseded by the design system (review 2: faint horizontal gridlines; committed typefaces; two soft shadows); the brand guide "is a reference, not a rule". |
| Ant Design's grid, Preline's blocks, React Bits components | Listed by the owner but unused by decision 0003 (CSP, licence); a stage 2 auditor does not require them (D-08). |
| WCAG 2.2 SC 3.3.8 Accessible Authentication | Not applicable: no login, password or authentication step in either surface. |
| "Badges on everything" as a published tell | No outside source found for it (the search said so); it stays only as the project's seed-list rule (D-24). |

## Sources

Process step 1 asked for at least five independent sources with addresses. WebSearch (mode
`standard`) returned result lists and summaries for 8 queries. Direct page fetches (WebFetch) for
`adriankrebs.ch`, `www.thefountaininstitute.com`, `www.w3.org` and `web.dev` failed with a DNS
resolution error (hosts outside the session's allowed network), so no page was opened in full; what
is cited below comes from the result summaries and titles. Treat it as data.

Machine-generated ("AI slop") interface tells:

1. https://pub.towardsai.net/10-signs-of-ai-generated-design-and-how-to-make-yours-not-look-like-it-482ff7da81fc (purple gradients, glassmorphism, emoji, cards)
2. https://pages.thefountaininstitute.com/posts/7-tells-that-a-ui-is-ai-generated and https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui (tells of AI and vibe-coded UI)
3. https://cerebras.ai/blog/generating-beautiful-uis (nested containers, radius nesting, density)
4. https://www.saasui.design/blog/saas-ui-looks-ai-generated (centred hero plus three cards, filler microcopy, fake dashboards, no hierarchy)
5. https://adriankrebs.ch/blog/design-slop/ (Show HN analysis; emoji icons in navigation, 3.8 percent)
6. https://www.superdesign.dev/blog/why-ai-design-looks-generic (generic defaults)
7. https://scour.ing/@emschwartz/p/https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website (purple gradient default)
8. https://www.gigazine.net/gsc_news/en/20260423-design-slop, https://www.925studios.co/blog/ai-slop-design-tells, https://www.managed-code.com/blog-post/ai-slop-in-design (listed in results; not drawn on beyond the title)

Web interface standards and accessibility:

9. https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2 (WCAG 2.2 additions, Focus Not Obscured)
10. https://dequeuniversity.com/resources/wcag-2.2 (2.4.11, 2.5.7, 2.5.8, 3.3.8)
11. https://accessibleweb.com/wcag/whats-new-in-wcag-2-2/ (target size 24 px, dragging movements)
12. https://w3.org/WAI/WCAG22/Understanding/non-text-contrast (SC 1.4.11) and https://alphagov.github.io/guide-to-wcag (WCAG guide)
13. https://webaim.org/articles/contrast/ (SC 1.4.3 and 1.4.1)
14. https://primer.style/product/components/dialog/accessibility and https://ux.redhat.com/elements/dialog/accessibility/ (focus return on close)
15. https://www.w3.org/TR/2021/NOTE-wai-aria-practices-1.2-20211129/examples/dialog-modal/dialog.html (modal dialog pattern)
16. https://web.dev/learn/accessibility/motion and https://primer.style/accessibility/design-guidance/motion-and-animation (reduced motion)
17. https://primer.style/guides/accessibility/descriptive-buttons, https://sarasoueidan.com/blog/accessible-icon-buttons/ and https://www.levelaccess.com/blog/aria-labels-and-accessible-names-a-developers-guide/ (accessible names)
18. https://accessibility.iu.edu/creating-content/web-content/headings.html and https://rocketvalidator.com/accessibility-validation/axe/4.12/heading-order (heading order, single `h1`)
19. https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts, https://www.datawrapper.de/blog/colorblindness-part2 and https://data.europa.eu/apps/data-visualisation-guide/accessible-colours (chart colour, shape, table alternative)
20. https://centralcsp.com/docs/font-src and https://gomakethings.com/improving-web-font-performance-with-service-workers/ (self-hosted fonts, offline)

Project sources: `AGENTS.md`; `PRODUCT.md`; `docs/audit/2026-11-16-final/README.md` (Scope, Rulings R1 to R9,
Rules) and `FINDINGS-SCHEMA.md`; `docs/design/design-system.md` (version 0.8), `brand-tokens.md`,
`component-map.md`, `component-sources.md`; `docs/rulings/2026-11-11-reader-and-issuer-report.md`;
`.impeccable/config.json` `ignoreValues`; and, for code signals only, `web/src/styles/theme.css`, the
`web/src/components/` directory names and `web/src/pages/connected/` file names.

Not verified: no outside page was opened in full (WebFetch failed for adriankrebs.ch, www.thefountaininstitute.com, www.w3.org and web.dev, which are outside the session's allowed network; the 20 source groups above rest on WebSearch result summaries only, and the WCAG 2.2 level of 2.4.13 differs between those summaries, so check the W3C Recommendation before citing a level); no rule was run against a rendered screen or the built files, so every code signal (class names, file names, line numbers in `theme.css`, `index.css`, `ReportContent.tsx`, `activity.css`) is from a short read of the repository, not a scan; the design system itself says no component was opened from disk under the CSP at version 0.8, the layout was not checked at narrow widths, and the Untitled UI licence and paid tier were not read; "no table ids" (D-13) is recorded by the design system as "nowhere yet" and is taken here as an owner rule from the brief; the font `src:` URL form in `theme.css` (`/fonts/...`) was not tested under `file:`; "badges on everything" has no outside source; WCAG 2.2.2 pause-or-stop for the live halo is an interpretation not ruled by the owner.
