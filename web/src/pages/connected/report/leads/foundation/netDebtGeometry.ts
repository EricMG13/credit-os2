import { LINE, SIZE, fittingTicks, gapSlotHeight, niceAxis, textWidth, wrap } from "../kit/marks";
import { group, type Reading } from "../kit/numbers";
import type { LiquidityPeriod, NetDebtPeriod, NetDebtView, ProForma } from "./foundationData";
import { written } from "./periodsData";

const safeText = written;

// The words and positions of the net debt tile. Every figure drawn is one the handoff states; the
// bars place stated numbers and never make them add up; nothing here prints a sum or an equation.

/** A cell as the page writes it: the figure grouped, or a gap or words exactly as written. */
const words = (cell: Reading) => (cell.kind === "number" ? group(cell.text) : safeText(cell.text));

/** A ratio cell: "4.88x", or the gap or words as written. */
const ratioWords = (cell: Reading | null) =>
  cell === null ? "not stated" : cell.kind === "number" ? `${group(cell.text)}x` : words(cell);

/** A date as written, the stated gap with its reason included; null when the cell is empty. */
const dateWords = (cell: Reading) => (cell.text.trim() ? safeText(cell.text) : null);

/** The most pro forma net debt bars the figure draws; more are the strip's marks and the table. */
const MOST_BARS = 2;

/**
 * The adjustments drawn as pro forma net debt bars: those that state a pro forma net debt, in
 * handoff order, only when there are at most two. With more, none is chosen (by size or
 * otherwise): the periods are the bars and every adjustment is a mark on the strip.
 */
export function proFormaBars(view: NetDebtView): ProForma[] {
  const priced = view.adjustments.filter((item) => item.netDebt.kind === "number");
  return priced.length <= MOST_BARS ? priced : [];
}

/** "Net 16,278 · cash 3,472 · gross debt 19,750"; a stated gap as written, once when all share it. */
function periodReading(period: NetDebtPeriod) {
  const cells = [period.net, period.cash, period.gross];
  const [first] = cells;
  if (first && cells.every((cell) => cell.kind !== "number" && cell.text === first.text))
    return words(first);
  return [
    period.net.kind === "number" ? `Net ${words(period.net)}` : `Net debt ${words(period.net)}`,
    `cash ${words(period.cash)}`,
    `gross debt ${words(period.gross)}`,
  ].join(" · ");
}

/** "Net 22,967 · Special dividend … · 2024-10-18 · amount 4,348": the stated facts, no equation. */
function proFormaReading(item: ProForma) {
  const date = dateWords(item.date);
  return [
    `Net ${words(item.netDebt)}`,
    safeText(item.event),
    ...(date ? [date] : []),
    `amount ${words(item.amount)}`,
  ].join(" · ");
}

// ---------------------------------------------------------------------------------------------
// The bars
// ---------------------------------------------------------------------------------------------

const BAR = 16;
const ROW_GAP = 12;
const LABEL_WIDTH = 76;
/** From this measured width the period label sits beside its bar; below it, above. */
const BESIDE = 360;

type Span = { x: number; width: number };

export type NetBar = {
  label: string;
  kind: "prior" | "current" | "proForma";
  top: number;
  barY: number;
  /** The stated net debt's bar (a stated zero is a hairline, still a value). */
  net: (Span & { value: number }) | null;
  /** Where the net debt is not stated: the hatched slot, with the cell as written. */
  netGap: (Span & { reason: string }) | null;
  /** Cash drawn beyond net debt at its own stated length; only where both are zero or more. */
  cash: Span | null;
  cashGap: (Span & { reason: string }) | null;
  /** Where the stated gross debt sits. */
  gross: number | null;
  /** The pro forma's seam: where the reported net debt ends inside the pro forma bar. */
  seam: number | null;
  reading: string[];
};

const value = (cell: Reading) => (cell.kind === "number" ? cell.value : null);

function spanOf(x: (v: number) => number, from: number, to: number): Span {
  return { x: Math.min(x(from), x(to)), width: Math.abs(x(to) - x(from)) };
}

/** The net debt bars at `width`, on one scale from zero (through it for a net cash position). */
export function barsLayout(view: NetDebtView, proForma: readonly ProForma[], width: number) {
  const beside = width >= BESIDE;
  const left = beside ? LABEL_WIDTH : 0;
  const segmented = (p: NetDebtPeriod) => {
    const [net, cash] = [value(p.net), value(p.cash)];
    return net !== null && cash !== null && net >= 0 && cash >= 0 ? net + cash : null;
  };
  const positions = [
    ...view.periods.flatMap((p) => [value(p.net), value(p.gross), segmented(p)]),
    ...proForma.map((item) => value(item.netDebt)),
  ].filter((v): v is number => v !== null);
  const axis = niceAxis(positions, { zero: true });
  // The last tick's label is centred on its line, inside the figure.
  const right = width - textWidth(axis.ticks.at(-1)?.label ?? "", SIZE.tick) / 2 - 2;
  const x = (v: number) => axis.place(v, left, right);
  const slot = Math.min(96, (right - left) * 0.3);
  const last = view.periods.length - 1;
  let y = 2;
  const take = (bar: Omit<NetBar, "top" | "barY" | "reading">, text: string): NetBar => {
    const reading = wrap(text, right - left, SIZE.label);
    const barY = beside ? y : y + LINE;
    const laid = { ...bar, top: y, barY, reading };
    y = barY + BAR + 4 + reading.length * LINE + ROW_GAP;
    return laid;
  };
  const bars = view.periods.map((p, index) => {
    const [net, cash, gross] = [value(p.net), value(p.cash), value(p.gross)];
    const netEnd = net === null ? x(0) + slot : x(Math.max(net, 0));
    return take(
      {
        label: p.label,
        kind: index === last ? "current" : "prior",
        net: net === null ? null : { ...spanOf(x, 0, net), value: net },
        netGap: net === null ? { x: x(0), width: slot, reason: words(p.net) } : null,
        cash:
          net !== null && cash !== null && net >= 0 && cash >= 0
            ? spanOf(x, net, net + cash)
            : null,
        cashGap:
          cash === null && net !== null
            ? { x: netEnd + 2, width: Math.min(40, slot), reason: words(p.cash) }
            : null,
        gross: gross === null ? null : x(gross),
        seam: null,
      },
      periodReading(p),
    );
  });
  const base = view.periods.at(-1);
  const reported = base ? value(base.net) : null;
  const proBars = proForma.flatMap((item) => {
    const pf = value(item.netDebt);
    if (pf === null) return [];
    const inside =
      reported !== null && reported !== 0 && Math.sign(reported) === Math.sign(pf)
        ? Math.abs(reported) < Math.abs(pf)
        : false;
    return [
      take(
        {
          label: "Pro forma",
          kind: "proForma",
          net: { ...spanOf(x, 0, pf), value: pf },
          netGap: null,
          cash: null,
          cashGap: null,
          gross: null,
          seam: inside && reported !== null ? x(reported) : null,
        },
        proFormaReading(item),
      ),
    ];
  });
  const plotBottom = y - ROW_GAP;
  const ticks = fittingTicks(axis, left, right, (text) => textWidth(text, SIZE.tick));
  return {
    beside,
    left,
    bars: [...bars, ...proBars],
    axis,
    x,
    ticks,
    plotBottom,
    height: plotBottom + 22,
  };
}

// ---------------------------------------------------------------------------------------------
// The leverage strip, liquidity and the table
// ---------------------------------------------------------------------------------------------

export type StripEntry = { label: string; cell: Reading | null; proForma: boolean };

/**
 * Net debt / EBITDA per period, then each stated adjustment's pro forma net leverage in handoff
 * order, each named; none is chosen or ranked.
 */
export function stripEntries(view: NetDebtView): StripEntry[] {
  return [
    ...view.leverageStrip.map((p) => ({ label: p.label, cell: p.cell, proForma: false })),
    ...view.adjustments.map((item) => ({
      label: `Pro forma · ${safeText(item.event)}`,
      cell: item.leverage,
      proForma: true,
    })),
  ];
}

/** True when the strip has at least two stated ratios to set against each other. */
export const stripDrawn = (entries: readonly StripEntry[]) =>
  entries.filter((entry) => entry.cell?.kind === "number").length > 1;

/** The stated ratios as a plain list: where the strip has fewer than two to set against each other. */
export const stripList = (entries: readonly StripEntry[]) =>
  entries.flatMap((entry) =>
    entry.cell?.kind === "number"
      ? [{ label: entry.label, text: `${group(entry.cell.text)}x` }]
      : [],
  );

export const stripGaps = (entries: readonly StripEntry[]) =>
  entries.flatMap((entry) =>
    entry.cell?.kind === "number" ? [] : [`${entry.label}: ${ratioWords(entry.cell)}`],
  );

export function stripReading(entries: readonly StripEntry[]) {
  const parts = entries.map(
    (entry) => `${entry.label.replace(/^Pro forma · /, "pro forma ")} ${ratioWords(entry.cell)}`,
  );
  return `Net debt / EBITDA on its own scale: ${parts.join(", ")}.`;
}

const STRIP_ROW = 26;
const DOT = 5;

export type StripRow = {
  entry: StripEntry;
  /** The row's label lines: beside the mark for a period, above it for a pro forma. */
  label: string[];
  labelBeside: boolean;
  labelY: number;
  top: number;
  centre: number;
  /** The mark's x, null where the ratio is not a number. */
  x: number | null;
  value: number | null;
  valueText: string | null;
  /** A stated gap: the hatched slot across the plot with the reason on its solid chip. */
  gap: { x: number; y: number; width: number; height: number; reason: string } | null;
  /** The earlier of two reported periods draws in the prior colour; the latest in the current. */
  tone: "prior" | "current" | "proForma";
};

export type StripLayout = {
  rows: StripRow[];
  height: number;
  ticks: { value: number; label: string }[];
  x: (value: number) => number;
  plotTop: number;
  plotBottom: number;
  /** Consecutive reported periods that both state a ratio are joined, in order. */
  joins: { from: number; to: number }[];
  /** The latest reported ratio's x, a hairline down the pro forma rows (null with none). */
  reference: { x: number; top: number } | null;
};

/** The strip's rows at `width` px: one row per stated entry, on one scale, nothing overlapping. */
export function stripLayout(
  entries: readonly StripEntry[],
  width: number,
  /** False for periods that cannot be put in time order: nothing is joined. */
  joined = true,
): StripLayout {
  const numbers = entries.flatMap((entry) =>
    entry.cell?.kind === "number" ? [entry.cell.value] : [],
  );
  const axis = niceAxis(numbers, { zero: false, suffix: "x" });
  const texts = entries.map((entry) =>
    entry.cell?.kind === "number" ? `${group(entry.cell.text)}x` : "",
  );
  const periods = entries.filter((entry) => !entry.proForma);
  const left = periods.length
    ? Math.max(...periods.map((entry) => textWidth(entry.label, SIZE.label))) + 12
    : 8;
  const right = width - Math.max(...texts.map((text) => textWidth(text, SIZE.value))) - DOT - 14;
  const x = (value: number) => axis.place(value, left, right);
  const lastPeriod = periods.length - 1;
  let top = 4;
  const rows = entries.map((entry, at): StripRow => {
    const beside = !entry.proForma;
    const label = beside ? [entry.label] : wrap(entry.label, width, SIZE.label);
    const block = beside ? 0 : label.length * LINE + 2;
    const reading = entry.cell;
    const isNumber = reading?.kind === "number";
    const reason = !isNumber ? ratioWords(reading) : "";
    const slotWidth = Math.max(80, right - left);
    const slotHeight = isNumber ? 0 : gapSlotHeight(slotWidth, 14, reason);
    const height = block + Math.max(STRIP_ROW, slotHeight + 8);
    const centre = top + block + STRIP_ROW / 2;
    const row: StripRow = {
      entry,
      label,
      labelBeside: beside,
      labelY: beside ? centre + 4 : top + 12,
      top,
      centre,
      x: isNumber ? x(reading.value) : null,
      value: isNumber ? reading.value : null,
      valueText: isNumber ? (texts[at] ?? null) : null,
      gap: isNumber
        ? null
        : { x: left, y: top + block + 4, width: slotWidth, height: slotHeight, reason },
      tone: entry.proForma ? "proForma" : at === lastPeriod ? "current" : "prior",
    };
    top += height;
    return row;
  });
  const joins = rows.flatMap((row, at) => {
    const next = rows[at + 1];
    return joined &&
      next &&
      !row.entry.proForma &&
      !next.entry.proForma &&
      row.x !== null &&
      next.x !== null
      ? [{ from: at, to: at + 1 }]
      : [];
  });
  const latest = rows.filter((row) => !row.entry.proForma && row.x !== null).at(-1);
  const firstPro = rows.find((row) => row.entry.proForma);
  const plotBottom = top;
  return {
    rows,
    height: plotBottom + 22,
    ticks: fittingTicks(axis, left, right, (text) => textWidth(text, SIZE.tick)),
    x,
    plotTop: 2,
    plotBottom,
    joins,
    reference: latest?.x != null && firstPro ? { x: latest.x, top: firstPro.top } : null,
  };
}

/** A stated figure as written, and whether it is a number (a gap or words is drawn in the gap ink). */
export type Stated = { text: string; number: boolean };

const stated = (cell: Reading): Stated => ({ text: words(cell), number: cell.kind === "number" });

export type LiquidityLine = {
  label: string;
  /** The handoff's own stated total for the period, as written; null where it writes none. */
  total: Stated | null;
  cash: Stated | null;
  undrawn: Stated | null;
};

/** Liquidity per period: the stated total where the handoff writes one, and the stated parts. */
export function liquidityLines(view: NetDebtView): LiquidityLine[] {
  const parts = new Map<string, LiquidityPeriod>(view.liquidity.map((row) => [row.label, row]));
  const totals = view.liquidityTotal?.values ?? [];
  const labels = [
    ...view.liquidity.map((row) => row.label),
    ...totals.map((total) => total.label).filter((label) => !parts.has(label)),
  ];
  return labels.map((label) => {
    const row = parts.get(label);
    const total = totals.find((item) => item.label === label)?.cell ?? null;
    return {
      label,
      total: total ? stated(total) : null,
      cash: row ? stated(row.cash) : null,
      undrawn: row ? stated(row.undrawn) : null,
    };
  });
}

/** The bars' reading: every period's stated figures and the drawn pro forma's. */
export function barsReading(view: NetDebtView, proForma: readonly ProForma[]) {
  const periods = view.periods.map((p) => `${p.label} ${periodReading(p)}`);
  const pro = proForma.map((item) => `pro forma ${proFormaReading(item)}`);
  return `Net debt, ${view.unit}, on one scale from zero: ${[...periods, ...pro].join("; ")}.`;
}

const NOT_APPLICABLE = "Not applicable";

/** The table view: every period, then every stated adjustment in handoff order. */
export function netDebtTable(view: NetDebtView) {
  return {
    caption: `Net debt, ${view.unit}`,
    headers: [
      "Period or adjustment",
      "Date",
      "Amount",
      "Gross debt",
      "Cash",
      "Net debt",
      "Net debt / EBITDA",
    ],
    rows: [
      ...view.periods.map((p) => [
        p.label,
        NOT_APPLICABLE,
        NOT_APPLICABLE,
        words(p.gross),
        words(p.cash),
        words(p.net),
        ratioWords(p.leverage),
      ]),
      ...view.adjustments.map((item) => [
        `Pro forma: ${safeText(item.event)}`,
        dateWords(item.date) ?? "Not stated",
        words(item.amount),
        "Not stated",
        "Not stated",
        words(item.netDebt),
        ratioWords(item.leverage),
      ]),
    ],
  };
}

/** One cell of the Adjustments table: its text as written, and whether it is a stated gap or words. */
export type AdjustmentCell = { text: string; gap: boolean };

const cellOf = (cell: Reading): AdjustmentCell => ({
  text: words(cell),
  gap: cell.kind !== "number",
});

/** The compact Adjustments table: headed columns, every stated adjustment in handoff order. */
export function adjustmentsTable(view: NetDebtView) {
  return {
    caption: "Stated adjustments",
    headers: ["Adjustment", "Date", "Amount", "Pro forma net debt", "Pro forma net leverage"],
    rows: view.adjustments.map((item): AdjustmentCell[] => [
      { text: safeText(item.event), gap: false },
      dateWords(item.date) === null
        ? { text: "Not stated", gap: true }
        : {
            text: dateWords(item.date) ?? "",
            gap: /^Not (?:supplied|calculated)/i.test(item.date.text),
          },
      cellOf(item.amount),
      cellOf(item.netDebt),
      { ...cellOf(item.leverage), text: ratioWords(item.leverage) },
    ]),
  };
}
