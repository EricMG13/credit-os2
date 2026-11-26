// Real handoff labels (TransDigm Lite run, as of 2024-09-30): four periods with long names in the
// earnings figure, and a maturity table whose one row is a long undated bucket. The fixtures the
// figures were built on carried "FY2023"-sized labels only.
import { describe, expect, it } from "vitest";
import { textWidth, SIZE } from "../kit/marks/text";
import { lineLayout, PERIOD_BASE } from "./earningsDebtGeometry";
import type { EarningsAgainstDebt } from "./foundationData";
import { wallLayout, type WallSlot } from "./maturityGeometry";

const PERIODS = [
  "Nine months ended 2023-07-01",
  "Nine months ended 2024-06-29",
  "FY2024",
  "2024-06-29",
];
const number = (text: string) => ({ kind: "number" as const, value: Number(text), text });
const measure = (key: string, label: string, cells: (string | null)[]) => ({
  key,
  label,
  values: PERIODS.map((period, at) => {
    const text = cells[at];
    return { label: period, cell: text == null ? null : number(text), line: 1 };
  }),
  change: null,
  line: 1,
});
const data = {
  unit: "US$m",
  periods: PERIODS.map((label) => ({ label })),
  ordered: false,
  unplaced: [],
  comparison: null,
  measures: [
    measure("sales", "Revenue", ["4733", "5754", null, null]),
    measure("reportedEbitda", "EBITDA (Reported)", [null, null, null, null]),
    measure("adjustedEbitda", "Adjusted EBITDA", ["2432", "3023", null, null]),
    measure("grossDebt", "Gross debt", [null, null, null, "21892"]),
  ],
  absent: [],
  leverage: null,
  leverageBasis: null,
  tableLine: 1,
} as unknown as EarningsAgainstDebt;

describe("earnings small multiple with the real period labels", () => {
  // 646: the figure beside the leverage column at 1440. 486: at 1280. 322 and 230: narrow panels.
  it.each([646, 486, 322, 230])(
    "keeps every period label in its panel and apart at %i px",
    (width) => {
      const layout = lineLayout(data, width);
      for (const panel of layout.panels) {
        const boxes = panel.points.map((point, at) => {
          const lines = panel.periodLines[at] ?? [];
          const half = Math.max(...lines.map((line) => textWidth(line, SIZE.tick))) / 2;
          const top = panel.periodShift[at] ?? 0;
          // In lines: a line of 12 px text on the 13 px pitch is 16 px tall, 16 / 13 of a line.
          const bottom = top + lines.length - 1 + 16 / 13;
          return { left: point.x - half, right: point.x + half, top, bottom };
        });
        for (const box of boxes) {
          expect(box.left).toBeGreaterThanOrEqual(panel.left);
          expect(box.right).toBeLessThanOrEqual(panel.left + panel.width);
        }
        boxes.forEach((a, at) => {
          boxes.slice(at + 1).forEach((b) => {
            const apart = a.right <= b.left || b.right <= a.left;
            const stacked = a.bottom <= b.top || b.bottom <= a.top;
            expect(apart || stacked).toBe(true);
          });
        });
        // Every period keeps its full name: no label is shortened.
        expect(panel.periodLines.map((lines) => lines.join(" "))).toEqual(PERIODS);
      }
    },
  );
});

describe("the zero tick and the first period label", () => {
  it("starts 'Nine months ended 2023-07-01' clear of the '0' tick it runs under", () => {
    const [panel] = lineLayout(data, 646).panels;
    const first = Math.max(
      ...(panel?.periodLines[0] ?? []).map((line) => textWidth(line, SIZE.tick)),
    );
    // The label does run left of the plot, under the tick gutter, where the "0" sits.
    expect((panel?.points[0]?.x ?? 0) - first / 2).toBeLessThan((panel?.left ?? 0) + 50);
    // The tick's 12 px text is drawn with its baseline 4 px under the axis and descends 4 px more.
    const tickBottom = 4 + 4;
    expect(PERIOD_BASE - SIZE.tick).toBeGreaterThanOrEqual(tickBottom + 2);
  });
});

describe("maturity wall with one long undated row", () => {
  const undated: WallSlot[] = [
    {
      label: "All remaining maturities, unallocated at 2024-06-29",
      cell: { text: "22057", value: 22057, reason: null },
    },
  ];
  it.each([426, 298])("keeps the amount and the axis inside the figure at %i px", (width) => {
    const layout = wallLayout([], undated, width);
    expect(layout.layout).toBe("rows");
    const [mark] = layout.marks;
    if (!mark) throw new Error("no mark");
    expect(mark.width).toBeGreaterThan(40);
    expect(mark.x + mark.width + 6 + textWidth("22,057", SIZE.value)).toBeLessThanOrEqual(width);
    for (const tick of layout.ticks)
      expect(tick.at + textWidth(tick.label, SIZE.tick) / 2).toBeLessThanOrEqual(width);
    // The label is whole, on its own lines above the bar where it cannot sit beside it.
    expect((mark.labelLines ?? [mark.label]).join(" ")).toBe(undated[0]?.label);
    for (const line of mark.labelLines ?? [])
      expect(textWidth(line, SIZE.label)).toBeLessThanOrEqual(width);
  });
  it("draws the one column where the label fits under it (640 px)", () => {
    const layout = wallLayout([], undated, 640);
    expect(layout.layout).toBe("columns");
    const [mark] = layout.marks;
    const half = textWidth(undated[0]?.label ?? "", SIZE.tick) / 2;
    expect((mark?.centre ?? 0) - half).toBeGreaterThanOrEqual(0);
    expect((mark?.centre ?? 0) + half).toBeLessThanOrEqual(640);
  });
});
