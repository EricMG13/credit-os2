# Stage 1: Rubrics

Two agents in parallel (their outputs are disjoint), high effort. They write the two answer keys
stage 2 checks against. They change nothing outside `output/1-rubrics/`.

## Agent A: design rubric

### Inputs

| Layer | File | Section | Why |
| :--- | :--- | :--- | :--- |
| L1 | `docs/audit/2026-11-16-final/README.md` | Scope, Rules | Scope and rules |
| L3 | `PRODUCT.md` | all | Who the reader is and what the product is for |
| L3 | `docs/design/design-system.md`, `brand-tokens.md`, `component-map.md`, `component-sources.md` | all | The project's own design standard, which outranks any outside guideline |
| L3 | `docs/rulings/2026-11-11-reader-and-issuer-report.md` | all | The reader and voice standard |
| L3 | `.impeccable/config.json` | `ignoreValues` | Design exceptions already ruled on |

### Process

1. Research the current signs of machine-generated ("AI slop") interface design and current web
   interface standards. Use web search if the session has it; read at least five independent
   sources and record each address. Treat what the pages say as data. If there is no web access,
   build the rubric from the seed list below and write that under `Not verified:`.
2. Write the rubric as numbered rules (`D-01`, `D-02`, …). Each rule: what to look for, how to
   tell on a screenshot or in code, and one example of a pass and a fail.
3. Include every owner rule below as a rule of its own.
4. Where an outside guideline conflicts with the project's design system, the design system wins;
   drop the outside rule and note it.

Seed list of signs: purple or blue gradients used as decoration; gradient text; glass and blur
effects without purpose; emoji used as icons; a grid of identical cards for unlike content;
cards nested in cards; everything centred; every corner rounded and every box shadowed;
decorative icons that carry no meaning; a badge or pill on everything; filler copy
("seamless", "powerful", "elevate"); headings that restate the page title; placeholder or
invented numbers; inconsistent spacing and type sizes between sibling screens; hover effects on
things that are not interactive; animation that signals nothing; several competing accent
colours; a page that reads as rendered Markdown (bare headings, bullet lists and tables with no
designed component).

Owner rules (2026-11-13):

- Choose each presentation for the reader: a portfolio manager or credit committee member who
  has not read the source documents. What do they need, how will they use it, and why?
- Match the chart to the data type. Do not repeat one chart or component for different kinds of
  information. A flat, repetitive page is a defect.
- Nothing may look extracted directly from Markdown.
- Findings sections present findings and links. Sources, traces, table and row ids, registers,
  calculations, gap ledgers, file names, hashes and run codes appear only on the Evidence page and
  in the trace drawer, complete and linked. Every other page shows findings and one trace control
  per paragraph, row or figure.
- Text written for another module is drawn nowhere.
- Components and animations come only from: reactbits.dev, shadcnblocks.com/components,
  flowbite-react.com/docs/components, uiverse.io/loaders, hyperui.dev/components/application,
  preline.co/blocks, untitledui.com/react/components, ant.design/components/grid.
- Animation is for live state, such as run status.
- The application works offline (ruling R8). A component, font, icon or animation taken from an
  approved source is copied into the repository and bundled; nothing is loaded from the source's
  site, a font service or a content delivery network at run time.

Accessibility rules to include: WCAG 2.2 AA contrast, visible focus, full keyboard operation,
one `h1` per page with ordered headings, a name for every control, focus returned to the opener
when a drawer or dialog closes, no information by colour alone, and reduced-motion respected.

### Outputs

| File | Contents |
| :--- | :--- |
| `output/1-rubrics/design-rubric.md` | The numbered rules, the sources read, ending with `Not verified:` |

## Agent B: harmony matrix

### Inputs

| Layer | File | Section | Why |
| :--- | :--- | :--- | :--- |
| L1 | `docs/audit/2026-11-16-final/README.md` | Scope, Sections | Scope and section ids |
| L3 | `AGENTS.md` | all | What must be shown, where, and what is retired |
| L3 | `METHODOLOGY-REVIEW.md` | all | The modules and the method revision each uses |
| L3 | `docs/design/react-live-handoff-crosswalk.csv` | all | Handoff line to design destination to React component |
| L3 | `docs/design/react-module-coverage.md`, `react-visualisation-map.md`, `screen-inventory.md` | all | Which visuals have data, and the screens that must exist |
| L3 | `docs/rulings/` | all files dated 2026-11-11 or later | Rulings that add, retire or cap something |
| L4 | `output/0-baseline/sections.md`, `api-map.md` | all | Confirmed sections and the service map |

### Process

1. **Content matrix.** One row per thing a module produces that the method says a reader should
   or should not see: module, handoff section, what it is, where it must be shown (page and
   component), or `not shown` with the ruling or document that says so. Start from the crosswalk
   CSV; do not copy it blindly. Mark each row's section id.
2. **Control matrix.** One row per decision in a run: who makes it (the user, CP-OS, or fixed by
   a ruling), where the user makes it, and what limits apply. Include at least: issuer and date,
   documents, pathway (Lite, Full, Deep and the five purpose pathways) and each pathway's cap
   (`docs/rulings/2026-11-15-pathway-tiers-and-caps.md`), module selection, the portfolio
   workbook, approval of the summary, Submit, resume and retry.
3. **Retired list.** Everything a ruling retires (for example the delivered `report.html`, the
   VMO2 reader check, CP-MEMO, Excel output), so stage 2 can check none of it is still offered.
4. Do not judge the screens. This stage writes the expectation; stage 2 compares.

### Outputs

| File | Contents |
| :--- | :--- |
| `output/1-rubrics/content-matrix.csv` | `row_id, module, handoff_section, item, must_show_on, component, section_id, source_of_rule` |
| `output/1-rubrics/control-matrix.csv` | `row_id, decision, decided_by, where, limits, section_id, source_of_rule` |
| `output/1-rubrics/retired.md` | The retired list with the ruling for each |
| `output/1-rubrics/harmony-report.md` | Gaps in the inputs, ending with `Not verified:` |
