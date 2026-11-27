import { ticks } from "../../visuals/visualData";
import { textWidth, thinTicks, wrapText } from "./chartText";
import { figureText } from "./notes";
import { panelScale, stressLabel, type DownsidePanel } from "./stressData";

/**
 * The downside figure, drawn at its frame's own width (one user unit a pixel). The case names sit
 * in the first `names` pixels; each panel is one measure on its own scale, at least `panel` wide,
 * as many side by side as fit and the rest below. `line` is one line of 12 px text.
 */
export const DOWNSIDE = {
  width: 524,
  names: 132,
  panel: 180,
  gutter: 20,
  line: 15,
  row: 30,
  bar: 12,
  foot: 26,
  labels: 48,
  /** The case's colour swatch, and the gap between it and the name. */
  swatch: 10,
  swatchGap: 4,
} as const;

/** Where a case's name starts: after its swatch and the gap. */
export const NAME_INDENT = DOWNSIDE.swatch + DOWNSIDE.swatchGap;

/** How many panels sit side by side in a frame `width` pixels wide: at least one. */
export function perRow(width: number) {
  const room = width - DOWNSIDE.names;
  return Math.max(1, Math.floor((room + DOWNSIDE.gutter) / (DOWNSIDE.panel + DOWNSIDE.gutter)));
}

/** A panel `room` pixels wide: its head in lines, room right of the bars for its values as
 * written (each in lines that fit), the bars' room, and its axis. */
function panelLayout(panel: DownsidePanel, room: number) {
  const longest = Math.max(
    0,
    ...panel.cells.map((cell) =>
      cell.value === null ? 0 : textWidth(figureText(stressLabel(cell.text)), "mono"),
    ),
  );
  const labels = Math.min(Math.max(DOWNSIDE.labels, longest + 8), room / 2);
  const bars = room - labels;
  const scale = ticks(panel.cells.map((cell) => cell.value));
  const low = scale[0]?.value ?? panel.min;
  const top = scale.at(-1)?.value ?? panel.max;
  const { zero, at } = panelScale({ ...panel, min: low, max: top }, bars);
  return {
    panel,
    room,
    head: wrapText(panel.measure, room),
    values: panel.cells.map((cell) =>
      cell.value === null ? [] : wrapText(figureText(stressLabel(cell.text)), labels - 8, "mono"),
    ),
    bars,
    zero,
    at,
    // A panel with no figure placed on it has no scale to read: no axis is drawn for it.
    axis: panel.cells.some((cell) => cell.value !== null)
      ? thinTicks(
          scale.map((tick) => ({ label: tick.label, x: at(tick.value), value: tick.value })),
          bars,
        )
      : [],
  };
}

export type PanelLayout = ReturnType<typeof panelLayout>;

/** One row of panels across `width` pixels: each panel's layout and where it starts, the case
 * names in lines, and the heights every panel in the row shares. */
export function rowLayout(
  names: readonly string[],
  panels: readonly DownsidePanel[],
  width: number,
) {
  const room = (width - DOWNSIDE.names - DOWNSIDE.gutter * (panels.length - 1)) / panels.length;
  const laid = panels.map((panel, at) => ({
    ...panelLayout(panel, room),
    x: DOWNSIDE.names + at * (room + DOWNSIDE.gutter),
  }));
  const nameLines = names.map((name) => wrapText(name, DOWNSIDE.names - 8 - NAME_INDENT));
  const most = Math.max(
    1,
    ...nameLines.map((lines) => lines.length),
    ...laid.flatMap(({ values }) => values.map((lines) => lines.length)),
  );
  const head = DOWNSIDE.line * Math.max(1, ...laid.map(({ head: lines }) => lines.length)) + 8;
  const row = Math.max(DOWNSIDE.row, DOWNSIDE.line * most + 12);
  return {
    room,
    panels: laid,
    nameLines,
    head,
    row,
    height: head + names.length * row + DOWNSIDE.foot,
  };
}

/** Where a case's gap mark and word go in a panel `room` wide: by zero, the word on the side it
 * fits, in lines when it fits neither. */
export function gapPlace(word: string, zero: number, room: number) {
  const mark = zero + 28 <= room ? zero : Math.max(0, zero - 28);
  const right = room - (mark + 34);
  const left = mark - 6;
  const fits = (space: number) => textWidth(word) <= space;
  const side = fits(right) || (!fits(left) && right >= left) ? "right" : "left";
  const space = side === "right" ? right : left;
  return {
    mark,
    side,
    x: side === "right" ? mark + 34 : left,
    lines: fits(space) ? [word] : wrapText(word, space),
  } as const;
}
