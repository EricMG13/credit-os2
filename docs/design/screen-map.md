# Screen and module map

Written 2026-11-24 from the owner's redesign brief. For every screen and every module: who it
is for, what they came to find out, what to show, in what form, where on the page, and how much
it matters. `PRODUCT.md` holds the personas and principles; `DESIGN.md` holds the look and the
tokens. This file is the specification the screens are built from.

## The brief this answers

| Brief | Where it is answered |
|---|---|
| 1. Look: clean, slick, modern, AI, enterprise SaaS and analytics | `DESIGN.md` § Direction, § Tokens |
| 2. Personas; each screen's and module's goal against the insight wanted | § Readers, § Screens, § Modules below |
| 3. Review prior handoffs and output for the information architecture and expected module output | § Modules, column "Carried today"; `DESIGN.md` § Evidence base |
| 4. Tell methodology change from code change | Column "Needs" throughout; § What must change outside the frontend |
| 5. Use the linked libraries to copy, adapt or repurpose | § Patterns |
| 6. Keep only the logo | `DESIGN.md` § What carries over |

## How to read the tables

**Importance** says when the reader must have seen the item.

| Rank | Meaning | Where it goes |
|---|---|---|
| **P1** | Seen in five seconds. If the reader leaves now, they leave with this. | Top of the page, largest tile or largest type |
| **P2** | Seen on the first screen without scrolling far. Carries or qualifies P1. | Tiles beside or directly under P1 |
| **P3** | Found when looked for. Supports a decision already forming. | Lower rows, tabs, disclosures |
| **E** | Machinery. Never on a working page. | Evidence page and the trace drawer only |

**Needs** says what stands between today and the item being drawn truthfully.

| Needs | Meaning |
|---|---|
| Code | The handoff already carries it; the frontend draws it wrongly or not at all |
| Method | The module knows it but writes it as prose or calculation rows; the handoff needs a typed table or field |
| Input | The module is blocked without material the analyst did not supply |
| Proof | No real handoff is retained for this module; build from the contract, then prove on a real run |

Until a Method, Input or Proof item lands, its place shows the designed gap state with the
reason. Nothing is interpolated and missing is never zero.

## Readers

| | Decider | Analyst | Reviewer |
|---|---|---|---|
| Who | Portfolio manager, committee member. Has not read the documents | Credit analyst. Starts and checks runs | Second analyst, risk, audit |
| Came to | Decide: act, wait or pass, and how far to trust it | Commit a paid run; then work inside the numbers | Confirm a figure or sentence is supported |
| First question | "What is the call and why?" | "Will this run do what I need, and did it?" | "Where does this come from, and what is missing?" |
| Then | "What argues against it? What could it not see?" | "What does this module's data say?" | "What was supplied but not used?" |
| Time | 2–5 minutes | Minutes to start; long sessions in modules | Targeted visits from one figure |
| Vocabulary | Credit terms. No module codes, file names or run ids | Credit terms and module names | Everything, including codes and hashes |
| Home screens | Library, Overview, Changes, Calendar | Run start, Run activity, Modules, Forecast | Evidence, trace drawer |

## App map

```
Credit OS
├─ Library                      Decider, Analyst   which names need me
│   └─ Issuer report
│       ├─ Overview             Decider            the call, why, how far to trust it
│       ├─ Changes              Decider            what moved since the earlier run
│       ├─ Modules              Analyst            one module's question, answered
│       │    └─ 5 stages · up to 23 modules
│       ├─ Forecast             Analyst, Decider   where the credit goes, and when it breaks
│       ├─ Evidence             Reviewer           sources, trace, gaps, checks, record
│       ├─ Calendar             Decider            what is coming and when
│       └─ History              Analyst            this issuer's earlier runs
├─ Coverage                     Decider, Analyst   across the book: who has what, who ranks where
├─ Run activity                 Analyst            what is running, what failed
│   └─ Run progress             Analyst            where this run is
├─ Start run                    Analyst            what will this run do, not do, and cost
│   └─ Documents → Purpose → More context → Review and start
└─ Signal                       Analyst, Decider   what happened outside that touches my names
    ├─ Feed                     For you, Latest, Saved, one topic
    ├─ Group → Thread           what colleagues shared and said
    ├─ Digest                   the scheduled brief
    └─ Settings                 Groups, Thread rules, Sources, Topics, Digests, Notifications, AI and cost
```

Signal is in the app where the server is started with `--signal-url`. The static build's Model
area is a design reference, not a reader screen, and is outside this map; the static build also
draws the Signal screens on sample data, as a reference.

## On every screen

| Element | What | How | Where |
|---|---|---|---|
| Top bar | Symbol, "Credit OS", areas (Library, Coverage, Run activity, and Signal where the server has it; Start run as the primary action) | One bar; current area tinted and underlined | Top |
| Report header | Breadcrumb, issuer name, sector line, pathway, as-of date and period, currency and unit | Name large; facts as quiet chips | Under the top bar on every report page |
| Section control | Overview, Changes, Modules (count), Forecast, Evidence, Calendar | One segmented control; current section tinted with a dot | Right of the report header |
| Basis label | Reported, as defined, or pro forma; fiscal year end; unit | One quiet line per tile or table, stated once | Under the tile title |
| Trace control | Opens the sources for one paragraph, row or figure | One small icon button, the same everywhere | Top right of its item |
| Gap state | What is not known and why | Hatched, dashed panel with the reason in words | In the place the figure would be |
| Better / worse | Direction of a change, where the owner's table gives one | Teal with "better", orange with "worse", plus an arrow | Beside the figure |
| Blocked | A module that could not run | Dashed orange outline, slash icon, "Not assessable" and the reason | Wherever the module appears |

## Screens

### Library

For the Decider scanning the book and the Analyst finding a run. Goal: list issuers and runs.
Insight wanted: which names need attention and what changed.

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | Each issuer with its current stance and whether the stance changed in the latest run | One row per issuer, stance as a word chip, change as "was → now" | Main list, sorted by changed first, then weakest stance | Method: typed stance (CP-6) |
| P1 | Search by issuer | Command field | Top of the list | Code |
| P2 | Net leverage, interest cover and liquidity with direction against the prior period | Three aligned mono figures with a two-point mark each | Columns in the issuer row | Code |
| P2 | Pathway, as-of date, run state | Chips | Issuer row | Code |
| P2 | Next dated event per issuer | Date in mono with the event name | Issuer row, right | Code |
| P3 | Filters: sector, pathway, state | Filter chips above the list | Under search | Code |
| P3 | Earlier runs of an issuer | Expanding row, newest first | Under the issuer row | Code |
| P1 (empty) | No runs yet, and the one action that fixes it | Empty state with "Start a run" | Centre | Code |

### Coverage

For the Decider looking across the book and the Analyst checking what each name has. Goal:
read every issuer's latest published run side by side (`docs/rulings/2026-11-24-coverage-page.md`).
Insight wanted: which names are covered by which analysis, and where one name sits against the
others on a figure. The page adds no score, average or difference of its own.

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | Issuer × module: delivered, limited, blocked, not run, missing | Matrix with the five stages as column groups; state as a shape and a word, not colour alone | Modules view, the default | Code |
| P1 | One figure across issuers for a period the reader chooses | Ranked horizontal bars in the figure's own unit; stated gaps listed apart, never ranked or zero | Rank view | Code |
| P2 | Find a sentence or figure across issuers | Search field with results grouped by issuer, each with its trace | Find view | Code |
| P2 | One figure over the periods each issuer published | Small multiples on one scale, one panel per issuer | Trend view | Code; Method for more than two periods |
| P2 | Saved groups of issuers; filters by sector and pathway | Chips above the views | Top | Code |
| P3 | Open the issuer's report at the figure | Link per cell and row | In place | Code |
| E | Module codes, hashes, file names, run folders | Not on this page | Evidence | — |

### Report · Overview

For the Decider. Goal: present the run's result. Insight wanted: the call, why, and how far to
trust it. This is the page the product is judged on.

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | The call: stance word, and the bottom line in full | Largest type on the page in the largest tile; stance as a chip above it | Row 1, 8 columns | Code for the bottom line; Method for a typed stance |
| P1 | How far to trust it: confidence score and band | Meter 0–100 with the band word | Row 1, right column, top | Code |
| P2 | Evidence clearance: status, issue counts by severity, committee use | Status word, one pip per issue, the use restriction in words | Row 1, right column, middle | Method: typed counts and use (CP-5). Until then status and sentence |
| P2 | Since the earlier run: same, better, worse; stance was → now | One sentence and two chips | Row 1, right column, bottom | Code; Method for causes |
| P2 | Gross and net leverage, prior → current, with pro forma where stated | Two large tiles: slope, and a dot strip with the pro forma state in orange | Row 2, left 8 columns | Code; Method for pro forma as a typed row |
| P2 | Revenue, EBITDA, interest cover, liquidity, prior → current | Four small tiles, each a different two-point mark | Row 2, right 4 columns | Code |
| P2 | Key findings | Numbered claims, one sentence each, with a trace each | Row 3, 7 columns | Code |
| P2 | Contrary evidence | Quote on the counter surface (navy tint) so it reads as the counter-argument | Row 3, 5 columns, top | Code |
| P2 | What would change the view | Two outcome wells: resolved favourably, resolved adversely | Row 3, 5 columns, bottom | Method: typed split. Until then the passage as written |
| P2 | When the debt falls due | Maturity wall on a true time axis; "thereafter" after an axis break | Row 4, 8 columns | Code |
| P2 | Who ranks ahead of whom | Proportional stack in rank order with instrument segments | Row 4, 4 columns | Code; Method for a full stack (today secured notes only) |
| P2 | Room to the covenant or incurrence level | Bullet against the limit; "not tested" when the legal module is blocked | Row 5, 4 columns | Input: executed documents |
| P2 | Which downside case breaks | Three cases side by side: leverage against the limit, cover | Row 5, 5 columns | Code |
| P3 | Where leverage goes | Path by year with the peak labelled; missing years hatched | Row 5, 3 columns | Method: per-year path (CP-2G) |
| P2 | What this run could not do | First-class tile: one hatched well per module with its limitation sentences; blocked modules first | Row 6, full width | Code |
| P3 | The run as a pipeline | Five stages, modules as nodes, edges animated from delivered modules, blocked nodes dashed | Row 7, full width, top | Code |
| P3 | Each module's bottom line | Three balanced columns under the pipeline, each linking to its module | Row 7, bottom | Code |
| P3 | Dates to watch | Events on a true horizontal time axis, then a numbered list | Row 8, full width | Code; Method for event type and amount |
| E | File names, hashes, run code, registers | Not on this page | Evidence | — |

### Report · Changes

For the Decider on a name they already know. Goal: compare with the earlier run. Insight
wanted: what moved, and why.

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | Verdict in one sentence: about the same, better, worse | Largest type, with stance was → now | Top tile | Code; Method for typed stance |
| P1 | Measures that moved, earlier → current, with the stated cause | Ranked list, largest move first; dumbbell per measure; cause in words | Main column | Code; Method: causes are often "Unresolved" |
| P2 | Which modules changed their conclusion | Module × status matrix: unchanged, revised, new, missing | Right column | Code |
| P2 | Maturities then and now | Two walls on one axis | Under the measures | Code |
| P3 | Measures that did not move | Collapsed count, expandable | Bottom | Code |
| P3 | Limitations added or removed | Two short lists | Bottom | Code |
| P1 (empty) | No earlier run, in one fixed sentence | Empty state | Centre | Code |

### Report · Modules (frame shared by every module)

For the Analyst, and the Decider who clicked through. Goal: show one module's output. Insight
wanted: that module's own question, answered visually.

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | The module's bottom line | Large type in the header tile, with status and basis | Top of the content column | Code |
| P1 | The module's lead visual (§ Modules) | Specific to the module; never the generic chart card | Directly under the header | Per module |
| P2 | Headline figures of that module | Stats strip divided by hairlines; mono numerals; prior value, delta, direction | Under the header | Code |
| P2 | Key findings; contrary evidence; what would change the view | Numbered claims; counter surface | After the lead visual | Code |
| P2 | Limitations of this module | Gap wells | After findings | Code |
| P3 | Navigator: modules by stage with status | Left column, grouped by the five stages; current tinted; blocked marked | Left, 232 px | Code |
| P3 | Statements, registers, calculations | One region with tabs, closed by default; tables with inline bars | Bottom | Code |
| P3 | Next module | One forward link | End | Code |
| E | Source register, entity keys, definition conflicts, handoff file | Not on the module page | Evidence | — |

### Report · Forecast

For the Analyst and the Decider. Goal: show the forward model. Insight wanted: where leverage,
cover and liquidity go under each case, when leverage peaks, and whether anything breaks before
the maturity wall.

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | The forward view in one sentence | Bottom line in the header tile, with the case switch | Top | Code |
| P1 | Net leverage path by case against the limits and the maturity wall | Line per case on a fiscal-year axis; limits dashed; the wall marked on the axis; peak labelled | Lead tile, 8 columns | Method: per-year path per case |
| P2 | Peak leverage and year, end leverage, minimum cover, shortfall at the wall | Stats strip | Under the header | Code |
| P2 | What breaks, and when | Shortfall as a share of the wall; stress cases as small multiples | Beside the lead tile, 4 columns | Code |
| P2 | Assumptions by case | Three-column table; cells that differ from base tinted | Under the lead | Code |
| P3 | Uses of cash by year | Stacked column: dividends, repayments | Beside assumptions | Code |
| P3 | The yearly grid | Rows by measure, columns by year; given cells filled, others the gap cell | Lower | Method: the model writes drivers and selected points only |
| P3 | Scope and limits; the published model and its calculation download | List; one control | Bottom | Code |

### Report · Evidence

For the Reviewer. Goal: hold all machinery. Insight wanted: is this figure supported, and what
is missing.

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | The trace asked for: the sentence or figure, its source passage and location | Split view: claim left, source right | Top, when arrived from a trace control | Code |
| P1 | Gaps by severity | Three counts, then the list, most severe first | Summary tab | Code |
| P2 | Sources: used, and supplied but not used | Table with file, type, pages, hash, used by | Sources tab | Code |
| P2 | Script checks: pass, fail, not run | Matrix of check × module | Checks tab | Code |
| P3 | Handoffs, calculation JSON and Model downloads | File list with hashes | Record tab | Code |
| P3 | Run record: calls, cap, spend, models, timings | Key-value table, closed by default | Record tab | Code |

### Report · Calendar and History

| Screen | Rank | What to show | How | Where | Needs |
|---|---|---|---|---|---|
| Calendar | P1 | Everything dated, on one axis | Lanes by kind (maturity, test, reporting, corporate) on a true time axis; today marked | Top | Code; Method for typed event kind |
| Calendar | P2 | The list behind the axis | Table sorted by date with the owning module and a trace | Under the axis | Code |
| History | P1 | This issuer's runs, newest first, with stance and the as-of date | Vertical timeline | Main | Code |
| History | P2 | Pathway, state and who started each run | Chips | Timeline rows | Code |

### Start run

For the Analyst. Goal: collect documents and purpose, and commit spend. Insight wanted: what
this run will do, will not do, and cost, before Submit.

| Step | Rank | What to show | How | Where | Needs |
|---|---|---|---|---|---|
| All | P1 | Readiness per module for the chosen pathway, and the cap | Persistent panel: module list by stage with ready, conditional, blocked; "USD x of USD cap" | Right rail, every step | Code |
| All | P2 | Where I am | Four-step stepper | Top | Code |
| Documents | P1 | Drop zone; each file's detected type and what it unlocks | Upload list with a type chip and "unlocks: covenants, liquidity…" | Main | Code |
| Documents | P2 | What is missing for the modules I will want | Gap rows with the module they block | Under the list | Code |
| Purpose | P1 | Eight pathways as what they answer, their module count and cap | Cards: question, modules, cap. Not a dropdown | Main | Code |
| More context | P2 | Questions for deep research, legal document status, portfolio workbook, ratings | Short form in groups | Main | Code |
| Review and start | P1 | What the run will do, what it will not do, and what it will cost | Three blocks; each limit is a checkbox the analyst accepts | Main | Code |
| Review and start | P1 | Submit with the cap in the button label | One primary button; confirmation dialog | Bottom | Code |
| Review and start | P2 | For a private issuer: what leaves the building | Plain statement before Submit | Above the button | Code |

### Run activity and run progress

For the Analyst. Goal: show progress. Insight wanted: is it working, where is it, what failed.

| Screen | Rank | What to show | How | Where | Needs |
|---|---|---|---|---|---|
| Activity | P1 | Runs in flight and their state | List, running first; state chip; progress as modules done of total | Main | Code |
| Activity | P2 | Failed, capped or interrupted runs with the reason | Reason in words on the row | Main | Code |
| Progress | P1 | The pipeline live: which module is running, which are done, which failed | The same staged node graph as Overview, animated on the running edge | Top | Code |
| Progress | P1 | Spend against the cap | Meter with the amount in mono | Beside the pipeline | Code |
| Progress | P2 | What just happened | Feed, newest first | Under the pipeline | Code |
| Progress | P1 (done) | Open report | One primary button | Top right | Code |
| Progress | P1 (failed) | What failed, why, and what to do | Notice with retry or resume | Top | Code |

### Signal

For the Analyst following outside sources and the Decider reading what was shared. Goal: one
feed of stories from approved sources, and group threads about them. Insight wanted: what
happened outside that touches my names, and what colleagues make of it. It is a news feed, not
analysis: it is tied to no run, and nothing on it is a finding. Its issuers are a watchlist of
names that stories are gathered under; the only tie to the Library is a link
(`docs/superpowers/specs/2026-11-13-signal-design.md`; issuers, filings and the market post:
`docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md`; look and widths:
`docs/design/component-map.md` § 3.4).

| Screen | Rank | What to show | How | Where | Needs |
|---|---|---|---|---|---|
| All | P2 | Where I am among views, topics, issuers, groups and digests, with what is unread | Channel list: a tile beside the page from 960px, behind a "Channels" button below it; current item tinted with an accent edge; counts in mono; a follow star on each topic and issuer; no Issuers heading while the watchlist is empty | Left | Code |
| Feed | P1 | The stories, newest or most relevant first: kind, source, time, headline, one-line summary | One tile, a row per story with hairlines between; headline at the h4 size, linked to the source | Main | Code |
| Feed | P1 | Whether the sources were checked, and whether one is failing | One badge beside the title: the state's shape and words; orange with an icon when a source fails | Beside the title | Code |
| Feed | P2 | Kind filter, search, Top or Latest | Tabs (All, Regulators, News, Ratings, Research, Filings; a market post is under All only), a search field, a two-way toggle | Above the tile | Code |
| Feed | P2 | New stories waiting | A pill with the accent dot and "Show" | Above the tile | Code |
| Feed | P2 | Rating move, case stage, signal strength, the AI line, who shared it | Marks on the story row, each with its word; AI text under an "AI" label | In the row | Code; a paid-call ruling for the AI parts |
| Feed | P3 | The source's logo, where the service holds one | The image in the source's own tile, in place of its letters: same size and radius, whole, on white; the letters while it loads and whenever there is none. Also in the "also in" avatars, the thread's story and a small tile in the Sources table | In the row | Code; the page's image policy must allow `data:` images |
| Feed | P2 | Which watchlist issuers a story is about | A row of its own, "About:" and a link to each issuer's page, apart from the tags | In the row | Code |
| Feed | P2 | A company filing: whose it is and which form | The story row with the "Filing" kind and the form type as its first tag; no AI mark | In the row | Code |
| Feed | P2 | The day's market backdrop: each series' value, the value's own date, and its change since the previous observation, a week and a month | A compact table in the story row: figures and dates in mono, right-aligned; the date under each value and under each change; a sign and a number for a move, no better or worse colour or arrow; the note in place of figures for a series not read; a dash for a change with no earlier observation; the series' full name and source behind its short name. Narrower than the table (a phone), it scrolls sideways in a named region with the series names kept in view | In the row | Code |
| Feed | P3 | Save, Comment, Share to group, Open source | Text buttons under the story; Share opens a dialog | In the row | Code |
| Issuer | P1 | The stories that name one issuer of the watchlist | The feed page under the issuer's name, with Follow; "Open in Library" where a writer gave the issuer a library key (it opens the Library: the Library has no address for one issuer yet) | Main | Code |
| Group | P1 | What was shared in the group, with its note, comment count and last activity | The feed's tile and rows, each with "Open thread" | Main | Code |
| Thread | P1 | The story or note, the comments and replies, the reply box | Side panel over the group, from the right; comment times in mono | Right | Code |
| Digest | P1 | The newest issue: its numbered points, each with the stories behind it | Numbered panel; the issue title as the page title; earlier issues on a tile under it | Main | Code; a paid-call ruling |
| Settings | P2 | One section at a time: groups, thread rules, sources, topics, issuers, digests, notifications, AI and cost | Section tabs (beside from 1280px, a row above below it); each section on one tile; sources as a sortable table | Main | Code |
| Settings, Issuers | P2 | The watchlist as writers keep it: each issuer's name, aliases, SEC number and library key, what the service does with its filings, and whether filings are fetched at all | A row per issuer; the service's sentence on filings once above the list; New issuer, Edit and Delete in a dialog, a refusal as the service's sentence in it. Writers only | Main | Code |
| All | P1 (empty, failed) | Nothing followed, nothing saved, no approved source, no match; the service cannot be reached; a write was refused | Empty state with one sentence and one action; error notice with Retry; a refusal as a red notice that stays in view | In place | Code |
| All | E | Source feed addresses and ids | Not on a reading screen | Settings, Sources; the service's own records | — |

### States every screen draws

Loading (skeleton in the final layout), empty (one sentence and one action), not published
(the run exists but has no report: say why and link to progress), unreachable service, read-only
preview, synthetic test mode (a persistent chip so a test is never mistaken for a real run).

## Modules

One row per module, grouped by the five stages. "Lead visual" is P1 on the module's page. "On
Overview" says what, if anything, the module contributes to the decision page.

### Sources

| Module | Reader | Question | Lead visual (P1) | Also show (P2) | On demand (P3) | On Overview | Carried today | Needs |
|---|---|---|---|---|---|---|---|---|
| CP-0 Source readiness | Analyst | Can each module run on these files? | Readiness matrix: module × ready, conditional, blocked, with the reason | Key evidence located (about 20 figures); conflicts and duplicates | Source assessment; source timeline | A pipeline node | Structured tables | Code |

### Financials

| Module | Reader | Question | Lead visual (P1) | Also show (P2) | On demand (P3) | On Overview | Carried today | Needs |
|---|---|---|---|---|---|---|---|---|
| CP-1 Financial foundation | Analyst, Decider | How are the financials trending, and what does that mean for debt service? | Visual financial analysis: earnings against debt and leverage in one composed figure, prior → current | Cash conversion ladder; EBITDA bridge; net debt with pro forma; segments; maturity wall | Statements, debt instruments (inline bars), calculations, definitions | Headline figures, maturity wall, capital structure | Statements for two annual periods; seven chart tables | Code. Method for more than two periods, last twelve months, a full debt stack |
| CP-1B Earnings delta | Analyst | What changed this period, and why? | Variance waterfall, prior → current | Ranked movers; margin and KPI changes as dumbbells | Variance register | The lead on an Earnings Update | Structured | Code |
| CP-1C Peer benchmark | Analyst, Decider | Better or worse than peers, on what? | Range strip per metric with the issuer marked | Outliers; peer table | Peer universe and normalisation | — | Blocked at the peer data gate | Input |
| CP-1D Earnings quality | Analyst | How much of adjusted EBITDA is supported? | Add-back bridge: supported against unsupported | Leverage restated on supported earnings | Add-back register | — | No retained handoff | Proof |
| CP-MODEL Model | Analyst | The gridded forecast | Forecast page | — | Calculation JSON | Forward path | Calculation JSON | Code |
| CP-L10 Short snapshot | Decider | The ten lines that matter | Key-figure strip | Change screen | — | The lead on a short snapshot | No retained handoff | Proof |

### Credit

| Module | Reader | Question | Lead visual (P1) | Also show (P2) | On demand (P3) | On Overview | Carried today | Needs |
|---|---|---|---|---|---|---|---|---|
| CP-1A Business & governance | Decider, Analyst | What drives the cash, and who controls it? | Revenue mix and the operating-model map: segment → cash driver → credit effect | The transaction and new debt; ownership and control map | Issuer history timeline | Sector line in the header; dates | Prose and edge tables | Code. Method for a typed mix table |
| CP-DR Deep research | Analyst | Which questions were answered, and what is the answer? | Question list with answered / not answered and the answer in one line | Coverage; causal scenarios | Workstream plan; catalysts | Dates; a limitation when coverage is low | Prose and a coverage figure | Code. Method for a typed question table |
| CP-2 Fundamental credit | Decider | Is the credit sound, and what carries the risk? | Strengths against weaknesses ledger beside leverage, cover and headroom | Credit-risk transmission map | Metric table | Often the lead; key findings | Prose, a metric table, a register | Code |
| CP-2A Downside | Decider, Analyst | How far is the first break? | Break-point ladder: fall in EBITDA needed to reach each limit | Scenario comparison: leverage, cover, cash flow | Stress design; catalysts | Downside tile | Scenario table; break points in prose | Code. Method for a break-point table |
| CP-2D Liquidity | Decider, Analyst | Does cash last, and until when? | Liquidity bridge: opening → sources → uses → closing | Funding dates; runway | Facility table | Liquidity figure; dates | No retained real handoff | Proof. Method for a monthly runway |
| CP-2E Rates, FX & hedging | Analyst | What does a rate or currency move cost? | Sensitivity ladder: cost per shock step | Hedged against unhedged; foreign share | Hedge schedule | — | Sensitivity rows | Code |
| CP-2G Forward model | Analyst, Decider | Where does leverage go, and when does it peak? | Case paths against limits (the Forecast lead) | Drivers by case | Calculation rows | Forward path tile | Driver JSON; path in calculation rows | Method |
| CP-2H Ratings migration | Decider | How far to a downgrade trigger? | Trigger bullets per agency: current against trigger | Rating register; outlook | Trigger terms | Rating chip in the header | No retained handoff | Proof |

### Structure and market

| Module | Reader | Question | Lead visual (P1) | Also show (P2) | On demand (P3) | On Overview | Carried today | Needs |
|---|---|---|---|---|---|---|---|---|
| CP-3 Security selection | Decider | Which security, at what value? | Instrument table: rank, yield, spread, recommendation per instrument | Relative value against peers; portfolio fit | Instrument events | Stance when CP-6 is absent | Recommendation in prose; no yields or spreads | Input (market quotes). Method for a typed recommendation |
| CP-3C Refinancing | Decider | What must be refinanced, when, with what? | Refinancing need on the maturity axis against available sources | Liability-management risk | Instrument terms | Maturity wall annotations | No retained real handoff | Proof |
| CP-3D Market-implied risk | Analyst | What is the market pricing in? | Yield against maturity with the issuer's curve | Market-implied default | Market levels | — | No retained handoff | Input (market data) |
| CP-4 Legal & covenants | Decider, Analyst | How much headroom, and what do the documents allow? | Headroom bullet per test: actual against limit | Baskets and capacity; legal entity and intercreditor maps | Document register; legal events | Headroom tile | Blocked without executed documents | Input |
| CP-4C Restructuring | Decider | Who recovers what? | Value waterfall by class with the fulcrum marked | Recovery by class; plan treatment | Claims table | — | No retained handoff | Proof |

### Validation and decision

| Module | Reader | Question | Lead visual (P1) | Also show (P2) | On demand (P3) | On Overview | Carried today | Needs |
|---|---|---|---|---|---|---|---|---|
| CP-5 Evidence validation | Reviewer, Decider | Can the committee rely on this? | Clearance status with issues by severity | Remediation list by priority | Support and contradiction map | Clearance tile | Structured prose | Code. Method for typed counts and use |
| CP-6 Committee decision | Decider | What is the stance, and what moves it? | Stance and the bull against bear ledger with a verdict per claim | Conditions and watch items; portfolio limits | Debate record | The call, confidence, what would change the view | Prose; score in front matter | Code. Method for typed stance and action |
| CP-8 Changes | Decider | What moved since the earlier run, and why? | The Changes page | — | Limitations ledger | Changes tile | `changes.json`; causes often "Unresolved" | Code. Method for causes |

## What must change outside the frontend

Ranked by how much of the design each one unlocks.

| # | Change | Kind | Unlocks |
|---|---|---|---|
| 1 | CP-6 writes stance and action as typed fields; CP-3 writes its recommendation the same way | Method | The call chip on Overview, Library ranking by stance, was → now on Changes |
| 2 | CP-5 writes clearance status, issue counts by severity and committee use as fields | Method | The clearance tile as designed |
| 3 | CP-1 writes pro forma states as typed rows, a full debt stack, and more than two periods where supplied | Method | Pro forma marks, the full capital structure, trend charts |
| 4 | CP-2G writes a per-year path per case | Method | The Forecast lead and grid without gaps |
| 5 | CP-2A writes break points as a table | Method | The break-point ladder |
| 6 | CP-8 attributes a cause to each changed measure | Method | Changes that explain, not just list |
| 7 | Events carry a typed kind and amount; CP-DR writes a question table; CP-6 splits "what would change the view" into outcomes | Method | Calendar lanes, research coverage, outcome wells |
| 8 | Executed legal documents at run start | Input | Covenant headroom (CP-4) |
| 9 | Market quotes and peer data at run start | Input | Relative value (CP-3, CP-3D), peer benchmark (CP-1C) |
| 10 | A real run of CP-1D, CP-2D, CP-2H, CP-3C, CP-4C and CP-L10 | Proof | Their module pages |

Each Method item is selected per METHODOLOGY-REVIEW.md and proven on a real run before the
frontend relies on it.

## Patterns

Which of the owner's references each element adapts.

| Element | Adapted from |
|---|---|
| Top bar, report header, section control | shadcnblocks application shell (top navigation) |
| Overview bento, tile ranking by area | React Bits Pro bento grid; shadcnblocks bento |
| Module and run pipeline | React Bits Pro pipeline |
| Stats strip, chart cards, tabbed chart groups | shadcnblocks dashboard, chart card, chart group |
| Tables with inline bars, badges, inputs, menus | Untitled UI React; ui-sdk menu |
| Dates, history, activity feed | shadcnblocks timeline |
