/**
 * The lead marks: one waterfall, one dumbbell, one bullet, one axis, one gap slot, one legend. Code against
 * this file; no lead keeps a private waterfall, dumbbell, bullet, `niceStep` or `GapSlot`. Import
 * the Overview marks (`../../overview/marks`: Slope, DotStrip, MiniSlope, Ruler, DeltaBar,
 * SplitBar, GapBar) where one fits; they are not redrawn here.
 *
 * Every mark draws ONE SVG at the measured width (`viewBox="0 0 {width} {height}"`, one unit one
 * pixel), so its text is its real size: 12 px labels and figures, 11 px ticks, never smaller.
 * Below 520 px (`NARROW`) a mark draws its narrow layout: one measure per row, the row's label
 * above its mark, the figures beside the mark; it never scrolls sideways. The SVG carries
 * `role="img"`, an `aria-label` (yours, or the default reading with every figure) and
 * `data-layout="wide" | "narrow"`. Direction is carried by position and the sign or word, never
 * by colour alone. Test hooks: `data-bar`, `data-step`, `data-gap`, `data-axis-break`,
 * `data-prior`, `data-current`, `data-mark`, `data-part` (label | value | tick | reason | …).
 *
 * ── Width ─────────────────────────────────────────────────────────────────────────────────
 *   useFigureWidth(fallback: number): [RefObject<HTMLDivElement | null>, number]   (../useWidth)
 *   <Measured fallback={n}>{(width) => mark}</Measured>   the same, as a wrapper
 *
 *     const [ref, width] = useFigureWidth(520);
 *     return <div ref={ref}><Waterfall width={width} … /></div>;
 *
 * ── Waterfall ─────────────────────────────────────────────────────────────────────────────
 *   type WaterfallRow =
 *     | { kind: "level" | "closing" | "step"; label: string; value: number; text: string }
 *     | { kind: "gap"; label: string; reason: string };
 *   <Waterfall rows unit width axisStart?: number | "auto" label? legend?: { level?, step?,
 *     closing?, gap? } />
 *   Levels and the closing are drawn from the axis start (level blue, closing plum); a step
 *   floats from the running total, its tone from its sign (`tone?: "increase" | "decrease"`:
 *   increase a blue outline on a blue tint, decrease the signal outline on its tint; the legend
 *   names them "Increase" and "Decrease" whenever a legend is given, `legend.step` is not drawn),
 *   its figure signed (`+70`, `−10`), a fall drawn leftward. `asWritten: true` on a step prints its
 *   text (and its prior's) exactly as given, grouped, a minus only where written ("1158" paid →
 *   "1,158", never "−1,158"), and reads it "Cash Interest Paid 1,158, decrease"; a text that
 *   already carries a sign is always printed as written. Bars are `BAR` (16) tall, priors `SLIM`. A gap row is the hatched slot with its reason; a step after a gap has no known
 *   start until the next level and is written, not placed. `axisStart` omitted: from zero;
 *   "auto": cut where the values sit high (CP-1's rule); a number: start there. A cut axis has
 *   the break glyph on every total and the line "Axis starts at …, marked on the total bars."
 *
 *     <Waterfall
 *       width={width}
 *       unit="USD m"
 *       axisStart="auto"
 *       legend={{ level: "Reported EBITDA", step: "Add-back", closing: "EBITDA As Defined" }}
 *       rows={[
 *         { kind: "level", label: "Reported EBITDA", value: 3813, text: "3,813" },
 *         { kind: "step", label: "Stock compensation", value: 217, text: "217" },
 *         { kind: "gap", label: "Other", reason: "Not supplied: not itemised in the source" },
 *         { kind: "closing", label: "EBITDA As Defined", value: 4173, text: "4,173" },
 *       ]}
 *     />
 *
 *   Optional, per row (additive; a row without them draws as above):
 *   `prior?: { value, text } | { gap }` — the row in an earlier period: a 5 px bar beneath the
 *     row's mark with its figure written beside it (`data-prior`, `data-part="prior-value"`); a
 *     level from the axis start, a step from the earlier period's own running total; a stated gap
 *     is a small hatched slot with its reason (`prior-reason`); a step after an earlier gap is
 *     written, not placed (`prior-unplaced`). The axis holds the earlier figures; `legend.prior`
 *     names the period. On a gap row, `of?: "level" | "step"` says what the row stands for, so its
 *     prior can be placed. Used by CP-1's cash ladder (FY2023 beneath FY2024).
 *   `split?: { text, value, tone: "primary" | "secondary" | "worse" }[]` — on a step only: the
 *     step drawn as consecutive segments from its start, in order (`data-split`), each part's
 *     words with its swatch under the bar (`data-part="split"`); the step's own figure and running
 *     total are unchanged, parts that do not add up are drawn as written. For a step whose parts
 *     the module states, e.g. CP-1D's accepted / not accepted amounts of one add-back.
 *
 *     { kind: "level", label: "Free cash flow", value: 1880, text: "1,880",
 *       prior: { value: 1236, text: "1,236" } },
 *     { kind: "step", label: "Acquisition costs", value: 200, text: "200", split: [
 *       { text: "Accepted 120", value: 120, tone: "primary" },
 *       { text: "Not accepted 80", value: 80, tone: "worse" } ] },
 *
 * ── Dumbbell ──────────────────────────────────────────────────────────────────────────────
 *   type DumbbellSide = { value: number; text: string } | { gap: string };
 *   type DumbbellRow = { label; prior: DumbbellSide; current: DumbbellSide; change?: string;
 *     note?: string; tone?: MarkTone };
 *   <Dumbbell rows width periods={{ prior, current }} unit axisStart? label? legend? />
 *   Prior ring → current dot on one shared scale from zero (or a cut axis, stated under it);
 *   each figure written outward, away from the other mark; a ring and dot closer than their
 *   diameter are drawn offset (ring above the row line, dot below: `data-offset`). The label
 *   column takes at most 28 % and the change slot at most 22 %, so the plot has half the width.
 *   `caption?: string` prints a group caption above the plot: rows of very different size are
 *   drawn as small multiples, one Dumbbell per group, each on its own scale with its caption; `change` and `note` (direction and
 *   the better/worse word from signal.ts `tone()`) in the row's change slot; `tone: "worse"`
 *   draws the dot in the signal colour (the word must be in `note`). A side the module did not
 *   state: a hatched strip under the row and "{period}: {reason}" in the change slot.
 *
 *     <Dumbbell
 *       width={width}
 *       unit="USD m"
 *       periods={{ prior: "FY2023", current: "FY2024" }}
 *       rows={[
 *         { label: "Net sales", prior: { value: 6585, text: "6,585" },
 *           current: { value: 7940, text: "7,940" }, change: "+1,355", note: "up" },
 *         { label: "Gross debt", prior: { gap: "Not supplied: outside scope" },
 *           current: { value: 24880, text: "24,880" } },
 *       ]}
 *     />
 *
 * ── Bullet ────────────────────────────────────────────────────────────────────────────────
 *   <Bullet name value: BulletSide limit: { value, text } proposed?: BulletSide width
 *     status?: string names?: { value?, limit?, proposed? } plotLeft?: number labelWidth?: number
 *     legend?: boolean unit? label? />
 *   Current as a bar, proposed as a ring, the limit as a rule ("Limit 12.0" above it), all on one
 *   scale from zero, with their figures as stated in ONE line under the scale ("Current 9.5%
 *   Proposed 12.6%"), the same on every row, never inside a bar. The mark judges nothing: no
 *   "above/below the limit", no signal colour; `status` prints the row's own status or
 *   compliance cell as written (through `safeText`), nothing without one. A missing side prints
 *   once, "Proposed: no proposal" (a stated gap's reason, not "Not supplied: …" twice). The track
 *   runs to the figure's edge at every width. `plotLeft` (or `labelWidth`) starts every bullet of
 *   one figure at one x. `limitKind` and `beyond` are removed (round 3, L3).
 *
 *     <Bullet
 *       width={width}
 *       name="Single-name exposure"
 *       unit="%"
 *       plotLeft={240}
 *       value={{ value: 9.5, text: "9.5%" }}
 *       proposed={{ value: 12.6, text: "12.6%" }}
 *       limit={{ value: 12, text: "12.0%" }}
 *       status={row.compliance}
 *     />
 *
 * ── Legend ────────────────────────────────────────────────────────────────────────────────
 *   type LegendEntry = { kind: "ring" | "dot" | "line" | "bar" | "slim" | "square" | "hatch";
 *     tone?: "primary" | "secondary" | "prior" | "worse" | "increase" | "decrease" | "neutral";
 *     text: string; dashed?: boolean };
 *   <Legend items className? />   the ONE legend (HTML, 12 px, wrapping): each entry drawn as its
 *   real mark (ring a hollow circle, dot a filled one, line a short stroke, bar/slim/square a
 *   swatch, hatch the gap texture). FigureTile's `legend` takes these entries too; pass them
 *   instead of square keys for rings, dots and lines. Inside an SVG the marks draw the same
 *   swatches (`MarkSwatch`, parts.tsx `SvgLegend`).
 *
 *     legend={[{ kind: "ring", tone: "prior", text: "FY2023" }, { kind: "dot", text: "FY2024" },
 *       { kind: "ring", tone: "secondary", text: "Proposed exposure" }]}
 *
 * ── Axis and gap ──────────────────────────────────────────────────────────────────────────
 *   niceAxis(values, { zero: boolean; start?: number; suffix?: string }): NiceAxis
 *     { start, end, ticks: { value, label }[], cut, place(value, from, to) }
 *   zero: true holds zero (the `ticks()` steps of visuals/visualData); zero: false cuts where the
 *   values sit high, or starts at `start`; a value is never clipped.
 *     const axis = niceAxis([3813, 4173], { zero: false });   // 3,600 … 4,200, cut
 *     const x = (v: number) => axis.place(v, 180, 440);
 *   fittingTicks(axis, from, to, measure): the ticks whose labels fit side by side.
 *   <GapSlot x y width height reason? text? />   the ONE hatched not-known slot inside any SVG;
 *   with `text` the words sit on a solid chip (card fill, 12 px, padded) inside the hatch, never
 *   on the texture; `gapSlotHeight(width, height, text)` is the height it then takes.
 *     <GapSlot x={0} y={10} width={120} height={BAR} reason="Not supplied: no segment schedule"
 *       text={reasonText("no segment schedule")} />
 *   <GapChip reason />   the same style in HTML (a list, a stat): hatch, solid chip, reason.
 *   BAR (16) and SLIM (5): the only two bar heights. A gap whose reason is "source dash" is
 *   drawn "—" by every mark.
 *   NARROW, SIZE, textWidth(text, size), wrap(text, width, size), signedText(text, value).
 *
 * ── Tile parts (../LeadFrame) ─────────────────────────────────────────────────────────────
 *   FigureTile: the Table view button sits in the tile head beside the trace control
 *   (aria-expanded/aria-controls; the panel with the real <table> opens under the figure);
 *   `caption?: ReactNode` is a small line in the head under the kicker.
 *   TableView: the same button and panel, standalone. Link: `<Link href="#forecast">Open the
 *   forecast</Link>` at 32 px (44 px at 480 px and below).
 *   UnreadFigures (../UnreadFigures): `<UnreadFigures lead={props} drawn={["Leverage", …]} />`
 *   one tile per `Chart data:` section the lead does not draw, its rows as stated;
 *   `chartTitles(entry)` lists the titles the store publishes.
 *
 * ── Kit data (../changes, ../tables, ../numbers, ../reader) ──────────────────────────────
 *   changeBetween({ period, cell, unit? }, { period, cell, unit? }, stated?): Change | null — the
 *   one change a page prints: the stated change as written, else the exact difference only for
 *   one kind of period exactly a year apart on one unit. periodKey(label), yearApart(a, b).
 *   orderByPeriod / periodRows / statementColumns: time order inside a year (Q1 < Q2, H1 < H2,
 *   LTM by end month), two-digit years; `isUnordered(read)` → draw `read.stated` in handoff order
 *   with no connecting line and `UNORDERED_SENTENCE`; comparisonOf(read) is then null.
 *   readCell: "(12.3)" is −12.3 (`written` keeps the brackets); "n.m." stays words.
 *   safeText strips `[E3]`-style markers; reasonText(reason): "—" for "source dash".
 */
export { fittingTicks, niceAxis, type NiceAxis } from "./axis";
export { Bullet } from "./Bullet";
export { Dumbbell, type DumbbellRow, type DumbbellSide } from "./Dumbbell";
export { GapChip, GapSlot, Measured, gapSlotHeight } from "./GapSlot";
export { Legend, type LegendEntry } from "./Legend";
export { BAR, LINE, NARROW, SIZE, SLIM, signedText, textWidth, wrap } from "./text";
export {
  Waterfall,
  waterfallAxis,
  waterfallReading,
  type WaterfallPrior,
  type WaterfallRow,
} from "./Waterfall";
export { useFigureWidth } from "../useWidth";
