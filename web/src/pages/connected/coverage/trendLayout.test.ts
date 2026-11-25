import { describe, expect, it } from "vitest";
import { layoutTrend, type TrendLayoutInput } from "./trendLayout";

/**
 * Every width below is written by hand; nothing here calls the production estimate.
 * A panel 320 wide and 170 high; the plot box runs 20..308 across and 22..140 down.
 */
const PLOT = { left: 20, right: 308, top: 22, bottom: 140 };
const SIX = ["2021", "2022", "2023", "2024", "2025", "2026"].map((y) => `LTM Dec ${y}`);
/** Six period ticks 48 apart: 44, 92, 140, 188, 236, 284. */
const TICKS = SIX.map((text, i) => ({ x: 44 + 48 * i, text }));

/** The '0' beside the zero line is 7 wide in every case; other text as each case writes it. */
function input(over: Partial<TrendLayoutInput> = {}): TrendLayoutInput {
  const metrics = over.metrics ?? { width: () => 70, ascent: 10, descent: 3 };
  return {
    geometry: { width: 320, height: 170, plot: PLOT, zero: 140, axis: 140 },
    points: [],
    segments: [],
    ticks: TICKS,
    gaps: [],
    dotRadius: 4,
    labelled: [],
    ...over,
    metrics: { ...metrics, width: (t) => (t === "0" ? 7 : metrics.width(t)) },
  };
}

describe("period ticks", () => {
  it("thins six 70-wide labels 48 apart to the first, the last and those that clear", () => {
    // Boxes: [9,79] [57,127] [105,175] [153,223] [201,271] [249,319]; 4 units between labels.
    // 0 and 5 fit together; 1 meets 0; 2 clears both; 3 meets 2; 4 meets 5.
    const out = layoutTrend(input());
    expect(out.ticks.map((tick) => tick.index)).toEqual([0, 2, 5]);
    expect(out.ticks.map((tick) => tick.box.left)).toEqual([9, 105, 249]);
    // Clear of a '0' centred on a zero line at the axis: top 140 + 13 / 2 + 2, baseline + ascent 10.
    expect(out.ticks.map((tick) => tick.y)).toEqual([158.5, 158.5, 158.5]);
  });

  it("shifts an end label inward to stay inside the panel, keeping its tick under it", () => {
    const ticks = [
      { x: 30, text: "a" },
      { x: 300, text: "b" },
    ];
    const out = layoutTrend(input({ ticks }));
    // 70 wide: centred on 30 would start at -5; it starts at the edge, 1. At 300 it would end at 335.
    expect(out.ticks.map((tick) => [tick.index, tick.box.left, tick.box.right])).toEqual([
      [0, 1, 71],
      [1, 249, 319],
    ]);
  });

  it("keeps the first alone when the first and last cannot fit together", () => {
    const ticks = [
      { x: 140, text: "a" },
      { x: 180, text: "b" },
    ];
    expect(layoutTrend(input({ ticks })).ticks.map((tick) => tick.index)).toEqual([0]);
  });

  it("measures each label: narrow labels all show", () => {
    const out = layoutTrend(input({ metrics: { width: () => 30, ascent: 10, descent: 3 } }));
    expect(out.ticks.map((tick) => tick.index)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

/** One point, labelled, at period index `at` of TICKS. */
const point = (at: number, y: number, text: string) => ({
  x: 44 + 48 * at,
  y,
  text,
  period: SIX[at] ?? "",
});

describe("value labels", () => {
  it("labels a value whose tick shows with the figure alone, above its dot", () => {
    const out = layoutTrend(
      input({
        metrics: { width: (t) => (t === "3.2x" ? 28 : 70), ascent: 10, descent: 3 },
        points: [point(0, 80, "3.2x")],
        labelled: [0],
      }),
    );
    // Single label: centred first. Box bottom = 80 - 4 - 2 = 74, so baseline 71; left 44 - 14.
    expect(out.labels).toEqual([
      expect.objectContaining({ index: 0, text: "3.2x", withPeriod: false, x: 30, y: 71 }),
    ]);
    expect(out.fallback).toEqual([]);
  });

  it("names the period in the label when its tick is thinned out", () => {
    const widths: Record<string, number> = { "4.1x": 28, "4.1x · LTM Dec 2022": 120 };
    const out = layoutTrend(
      input({
        metrics: { width: (t) => widths[t] ?? 70, ascent: 10, descent: 3 },
        points: [point(1, 80, "4.1x")],
        labelled: [0],
      }),
    );
    expect(out.ticks.map((tick) => tick.index)).not.toContain(1);
    expect(out.labels.map((label) => [label.text, label.withPeriod])).toEqual([
      ["4.1x · LTM Dec 2022", true],
    ]);
  });

  it("sends a value to the written line when its label with period has no clear spot", () => {
    // 320 wide: no spot fits inside a 320 panel with its 1-unit edge, so it is written under it.
    const out = layoutTrend(
      input({
        metrics: { width: (t) => (t.includes("·") ? 320 : 70), ascent: 10, descent: 3 },
        points: [point(1, 80, "4.1x")],
        labelled: [0],
      }),
    );
    expect(out.labels).toEqual([]);
    expect(out.fallback).toEqual([0]);
  });

  it("moves a label off a gap mark it would otherwise cross", () => {
    // A dot at x 140, y 120. With no mark its label sits centred above, [126,154] x [101,114];
    // a mark at x 150 rising from the axis (140) to 100 runs through that spot.
    const base = {
      metrics: { width: () => 28, ascent: 10, descent: 3 },
      points: [point(2, 120, "5.0x")],
      labelled: [0],
    };
    const free = layoutTrend(input(base));
    expect(free.labels[0]?.box).toEqual({ left: 126, right: 154, top: 101, bottom: 114 });
    const out = layoutTrend(input({ ...base, gaps: [{ x: 150, top: 100, bottom: 140 }] }));
    const box = out.labels[0]?.box;
    expect(box).toBeDefined();
    // It no longer spans x 149..151 at any height of the mark.
    expect(box && box.left < 151 + 1 && box.right > 149 - 1 && box.top < 140 && box.bottom > 100).toBe(false);
    expect(out.fallback).toEqual([]);
  });

  it("falls back to the written line when gap marks fence every spot", () => {
    const gaps = Array.from({ length: 33 }, (_, i) => ({ x: 4 + i * 10, top: 1, bottom: 169 }));
    const out = layoutTrend(
      input({
        metrics: { width: () => 28, ascent: 10, descent: 3 },
        points: [point(2, 80, "5.0x")],
        labelled: [0],
        gaps,
      }),
    );
    expect(out.labels).toEqual([]);
    expect(out.fallback).toEqual([0]);
  });

  it("clamps a long label at the right edge inside the panel", () => {
    // Dot at 317: centred, leaning out and leaning in all leave the panel; clamped, it ends at 319.
    const out = layoutTrend(
      input({
        ticks: [{ x: 317, text: "FY" }],
        metrics: { width: (t) => (t === "FY" ? 20 : 100), ascent: 10, descent: 3 },
        points: [{ x: 317, y: 80, text: "1,250.00x", period: "FY" }],
        labelled: [0],
      }),
    );
    expect(out.labels[0]?.box.right).toBe(319);
    expect(out.labels[0]?.box.left).toBe(219);
  });

  it("keeps the two labels apart and off the line between their dots", () => {
    const points = [point(2, 80, "900.00"), point(3, 80, "1,250.00")];
    const out = layoutTrend(
      input({
        metrics: { width: (t) => (t.length > 3 ? 60 : 70), ascent: 10, descent: 3 },
        points,
        segments: [[points[0] as { x: number; y: number }, points[1] as { x: number; y: number }]],
        labelled: [0, 1],
      }),
    );
    expect(out.labels.map((label) => label.index)).toEqual([0, 1]);
    const [a, b] = out.labels.map((label) => label.box);
    expect(a && b && a.right <= b.left).toBe(true);
    // Neither box holds y 80 across 140..188, the line between them.
    for (const box of [a, b]) expect(box && box.top < 80 && box.bottom > 80 && box.right > 140 && box.left < 188).toBe(false);
  });

  it("keeps a label off the zero line and its '0'", () => {
    // Zero at y 100; a dot just above it; the label must not cross y 100 or the '0' box.
    const out = layoutTrend(
      input({
        geometry: { width: 320, height: 170, plot: PLOT, zero: 100, axis: 140 },
        metrics: { width: (t) => (t === "0" ? 7 : 40), ascent: 10, descent: 3 },
        points: [{ x: 44, y: 96, text: "0.40x", period: SIX[0] ?? "" }],
        labelled: [0],
      }),
    );
    const box = out.labels[0]?.box;
    expect(box && box.top < 100 && box.bottom > 100).toBe(false);
    // The '0' sits right-aligned at 16, centred on zero: [9,16] x [93.5,106.5].
    expect(out.zeroLabel.box).toEqual({ left: 9, right: 16, top: 93.5, bottom: 106.5 });
    expect(box && box.left < 16 && box.top < 106.5 && box.bottom > 93.5).toBe(false);
  });
});

/** A seeded pseudo-random generator (mulberry32). */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type B = { left: number; right: number; top: number; bottom: number };
type P = { x: number; y: number };
const overlaps = (a: B, b: B) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const near = (box: B, c: P) =>
  Math.hypot(
    Math.max(box.left - c.x, 0, c.x - box.right),
    Math.max(box.top - c.y, 0, c.y - box.bottom),
  );
const sampled = (box: B, a: P, b: P) =>
  Array.from({ length: 401 }, (_, i) => i / 400).some((t) => {
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  });

describe("seeded panels with hand-made widths", () => {
  it("draws no text into another, a dot, a line, a gap mark or past the panel", () => {
    const next = seeded(20261125);
    // Not the production estimate: digits 8, separators 4, letters 6.5, spaces 3.
    const width = (t: string) =>
      Array.from(t).reduce((sum, c) => sum + (/\d/.test(c) ? 8 : /[.,·]/.test(c) ? 4 : c === " " ? 3 : 6.5), 0);
    const found: string[] = [];
    for (let i = 0; i < 80; i += 1) {
      const n = String(i);
      const count = 1 + Math.floor(next() * 6);
      const ys = Array.from({ length: 6 }, () => 22 + next() * 118);
      const zero = next() < 0.5 ? 140 : 22 + next() * 118;
      const stated = Array.from({ length: 6 }, (_, i) => i).filter(() => next() < count / 6);
      const points = stated.map((i) => ({
        x: 44 + 48 * i,
        y: ys[i] ?? 0,
        text: `${(next() * 2_000_000 - 500_000).toFixed(2)}x`,
        period: SIX[i] ?? "",
      }));
      const segments = points.slice(1).flatMap((p, i): [P, P][] => {
        const prev = points[i];
        return prev && p.x - prev.x === 48 ? [[prev, p]] : [];
      });
      const gaps = TICKS.filter((t) => !points.some((p) => p.x === t.x)).map((t) => ({
        x: t.x,
        top: 126,
        bottom: 140,
      }));
      const labelled = points.length === 0 ? [] : [...new Set([0, points.length - 1])];
      const out = layoutTrend(
        input({
          metrics: { width, ascent: 10, descent: 3 },
          geometry: { width: 320, height: 170, plot: PLOT, zero, axis: 140 },
          points,
          segments,
          gaps,
          labelled,
        }),
      );
      const texts = [out.zeroLabel.box, ...out.ticks.map((t) => t.box), ...out.labels.map((l) => l.box)];
      texts.forEach((box, i) => {
        if (box.left < 0 || box.right > 320 || box.top < 0 || box.bottom > 170) found.push(`${n}: edge ${String(i)}`);
        texts.slice(i + 1).forEach((other) => {
          if (overlaps(box, other)) found.push(`${n}: texts ${String(i)}`);
        });
      });
      for (const label of out.labels) {
        const box = label.box;
        if (points.some((p) => near(box, p) < 4)) found.push(`${n}: dot`);
        for (const [a, b] of segments) if (sampled(box, a, b)) found.push(`${n}: line`);
        if (sampled(box, { x: 20, y: zero }, { x: 308, y: zero })) found.push(`${n}: zero`);
        if (sampled(box, { x: 20, y: 140 }, { x: 308, y: 140 })) found.push(`${n}: axis`);
        for (const g of gaps) if (sampled(box, { x: g.x, y: g.top }, { x: g.x, y: g.bottom })) found.push(`${n}: gap`);
      }
      // Every labelled value is drawn with a readable period or written under the panel.
      const shown = new Set(out.ticks.map((t) => TICKS[t.index]?.x));
      for (const i of labelled) {
        const label = out.labels.find((l) => l.index === i);
        const p = points[i];
        if (!p) continue;
        if (!label && !out.fallback.includes(i)) found.push(`${n}: lost ${String(i)}`);
        if (label && !shown.has(p.x) && !label.text.includes(p.period)) found.push(`${n}: no period ${String(i)}`);
      }
    }
    expect(found).toEqual([]);
  });
});
