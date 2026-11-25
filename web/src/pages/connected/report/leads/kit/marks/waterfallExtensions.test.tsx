// Synthetic, built from the Waterfall contract (kit/marks/index.ts: `prior` and `split`); not a
// real handoff. Expected values are written out by hand (e.g. 1,236 − 38 = 1,198 for the earlier
// period's walk), not read back from the mark's own layout code.
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Waterfall, type WaterfallRow } from ".";

const WIDE = 1100;
const PHONE = 340;
const num = (element: Element | null | undefined, name: string) =>
  Number(element?.getAttribute(name));
const svgOf = (container: HTMLElement) => container.querySelector("svg") as SVGSVGElement;
const rect = (container: HTMLElement, selector: string) => {
  const found = container.querySelector(selector);
  return {
    x: num(found, "x"),
    width: num(found, "width"),
    right: num(found, "x") + num(found, "width"),
    from: num(found, "data-from"),
    to: num(found, "data-to"),
    y: num(found, "y"),
  };
};
const texts = (container: HTMLElement, part: string) =>
  [...container.querySelectorAll(`[data-part="${part}"]`)].map((node) => node.textContent);

const LADDER: WaterfallRow[] = [
  {
    kind: "level",
    label: "Free cash flow",
    value: 1880,
    text: "1,880",
    prior: { value: 1236, text: "1,236" },
  },
  {
    kind: "step",
    label: "Dividends",
    value: -2038,
    text: "−2,038",
    prior: { value: -38, text: "−38" },
  },
  {
    kind: "level",
    label: "After distributions",
    value: -158,
    text: "−158",
    prior: { value: 1198, text: "1,198" },
  },
];

/** Text lines as boxes (7 px a character) and the drawn bars; no text may sit on a bar. */
function expectClear(svg: SVGSVGElement, width: number) {
  const bars = [...svg.querySelectorAll("rect[data-bar], rect[data-prior], rect[data-split]")].map(
    (bar) => ({
      left: num(bar, "x"),
      right: num(bar, "x") + num(bar, "width"),
      top: num(bar, "y"),
      bottom: num(bar, "y") + num(bar, "height"),
    }),
  );
  for (const text of svg.querySelectorAll("text")) {
    const size = num(text, "font-size");
    expect(size).toBeGreaterThanOrEqual(11);
    const anchor = text.getAttribute("text-anchor") ?? "start";
    const spans = text.querySelectorAll("tspan");
    const lines = spans.length
      ? [...spans].map((span) => ({
          content: span.textContent,
          x: num(span, "x"),
          y: num(span, "y"),
        }))
      : [{ content: text.textContent, x: num(text, "x"), y: num(text, "y") }];
    for (const { content, x, y } of lines) {
      const length = content.length * 7;
      const left = anchor === "end" ? x - length : anchor === "middle" ? x - length / 2 : x;
      const box = { left, right: left + length, top: y - size * 0.8, bottom: y + size * 0.2 };
      expect(box.left).toBeGreaterThanOrEqual(-0.5);
      expect(box.right).toBeLessThanOrEqual(width + 0.5);
      if (text.closest('[data-part="legend"]')) continue;
      const on = bars.filter(
        (bar) =>
          box.left < bar.right &&
          bar.left < box.right &&
          box.top < bar.bottom &&
          bar.top < box.bottom,
      );
      expect(on, `${content} sits on a bar`).toEqual([]);
    }
  }
}

describe("Waterfall prior", () => {
  it("draws the earlier period's walk beneath, in proportion on the same scale", () => {
    const { container } = render(
      <Waterfall rows={LADDER} unit="USD m" width={WIDE} legend={{ prior: "FY2023" }} />,
    );
    const fcf = rect(container, '[data-bar="level"][data-label="Free cash flow"]');
    const priorFcf = rect(container, '[data-prior="Free cash flow"]');
    const priorDividends = rect(container, '[data-prior="Dividends"]');
    const priorAfter = rect(container, '[data-prior="After distributions"]');
    // One scale: 1,236 is drawn to the same pixels per unit as 1,880.
    expect(priorFcf.width / 1236).toBeCloseTo(fcf.width / 1880, 6);
    expect(priorFcf.x).toBeCloseTo(fcf.x, 6);
    // The earlier step hangs from the earlier level: 1,236 → 1,198, leftward.
    expect([priorDividends.from, priorDividends.to]).toEqual([1236, 1198]);
    expect(priorDividends.right).toBeCloseTo(priorFcf.right, 6);
    expect(priorDividends.width / 38).toBeCloseTo(fcf.width / 1880, 6);
    // A level's prior is drawn from the axis start to its own stated value.
    expect([priorAfter.from, priorAfter.to]).toEqual([0, 1198]);
    // Beneath its own row's bar.
    expect(priorFcf.y).toBeGreaterThan(fcf.y + 16);
    expect(texts(container, "prior-value")).toEqual(["1,236", "−38", "1,198"]);
    expect(texts(container, "legend-text")).toContain("FY2023");
    expect(svgOf(container).getAttribute("aria-label")).toBe(
      "Waterfall, USD m: Free cash flow 1,880 (FY2023 1,236), less Dividends 2,038 (FY2023 −38), After distributions −158 (FY2023 1,198). Axis starts at −500.",
    );
  });

  it("writes an earlier gap with its reason and leaves the next earlier step unplaced", () => {
    const rows: WaterfallRow[] = [
      {
        kind: "level",
        label: "Free cash flow",
        value: 1880,
        text: "1,880",
        prior: { gap: "Not supplied: outside the comparison scope" },
      },
      {
        kind: "step",
        label: "Dividends",
        value: -2038,
        text: "−2,038",
        prior: { value: -38, text: "−38" },
      },
    ];
    const { container } = render(<Waterfall rows={rows} unit="USD m" width={WIDE} />);
    expect(
      container.querySelector('[data-gap="Not supplied: outside the comparison scope"] rect'),
    ).not.toBeNull();
    expect(texts(container, "prior-reason")).toEqual([
      "Not supplied: outside the comparison scope",
    ]);
    expect(texts(container, "prior-unplaced")).toEqual([
      "−38 · not placed: an earlier step is not stated",
    ]);
    expect(container.querySelectorAll("rect[data-prior]")).toHaveLength(0);
    expect(svgOf(container).getAttribute("aria-label")).toContain(
      "Free cash flow 1,880 (prior: Not supplied: outside the comparison scope)",
    );
  });

  it("places a gap row's prior only when the row says what it stands for", () => {
    const rows = (of?: "level" | "step"): WaterfallRow[] => [
      { kind: "level", label: "EBITDA", value: 4173, text: "4,173" },
      {
        kind: "gap",
        label: "Operating cash flow",
        reason: "Not supplied: not stated",
        prior: { value: 1375, text: "1,375" },
        ...(of ? { of } : {}),
      },
    ];
    const known = render(<Waterfall rows={rows("level")} unit="USD m" width={WIDE} />);
    expect(rect(known.container, '[data-prior="Operating cash flow"]').to).toBe(1375);
    known.unmount();
    const unknown = render(<Waterfall rows={rows()} unit="USD m" width={WIDE} />);
    expect(unknown.container.querySelector("rect[data-prior]")).toBeNull();
    expect(texts(unknown.container, "prior-unplaced")).toEqual([
      "1,375 · not placed: an earlier step is not stated",
    ]);
  });

  it("holds an earlier figure larger than every current one on the axis, never clipped", () => {
    const rows: WaterfallRow[] = [
      { kind: "level", label: "Cash", value: 100, text: "100", prior: { value: 900, text: "900" } },
    ];
    const { container } = render(<Waterfall rows={rows} unit="USD m" width={WIDE} />);
    const ticks = texts(container, "tick");
    expect(ticks.at(-1)).toBe("1,000");
    const prior = rect(container, "[data-prior]");
    const current = rect(container, "[data-bar]");
    expect(prior.width / 900).toBeCloseTo(current.width / 100, 6);
  });

  it("is unchanged without a prior: no prior marks, no prior key", () => {
    const rows = LADDER.map((row): WaterfallRow => ({ ...row, prior: undefined }));
    const { container } = render(
      <Waterfall rows={rows} unit="USD m" width={WIDE} legend={{ prior: "FY2023" }} />,
    );
    expect(container.querySelector("[data-prior]")).toBeNull();
    expect(texts(container, "legend-text")).not.toContain("FY2023");
  });

  it.each([WIDE, PHONE])(
    "at %i px: real text sizes, no figure on a bar, nothing off the edge",
    (width) => {
      const { container } = render(
        <Waterfall
          rows={LADDER}
          unit="USD m"
          width={width}
          legend={{ level: "FY2024 level", step: "Deduction", prior: "FY2023, beneath" }}
        />,
      );
      expectClear(svgOf(container), width);
    },
  );
});

describe("Waterfall split", () => {
  const SPLIT: WaterfallRow[] = [
    { kind: "level", label: "Reported EBITDA", value: 1000, text: "1,000" },
    {
      kind: "step",
      label: "Add-back",
      value: 200,
      text: "200",
      split: [
        { text: "Accepted 120", value: 120, tone: "primary" },
        { text: "Not accepted 80", value: 80, tone: "worse" },
      ],
    },
    { kind: "closing", label: "Adjusted EBITDA", value: 1200, text: "1,200" },
  ];

  it("draws one step as consecutive segments in proportion, each with its words", () => {
    const { container } = render(<Waterfall rows={SPLIT} unit="USD m" width={WIDE} />);
    const step = rect(container, '[data-step="Add-back"]');
    const accepted = rect(container, '[data-split="Accepted 120"]');
    const rest = rect(container, '[data-split="Not accepted 80"]');
    expect([accepted.from, accepted.to, rest.from, rest.to]).toEqual([1000, 1120, 1120, 1200]);
    expect(accepted.x).toBeCloseTo(step.x, 6);
    expect(rest.x).toBeCloseTo(accepted.right, 6);
    expect(rest.right).toBeCloseTo(step.right, 6);
    expect(accepted.width / 120).toBeCloseTo(rest.width / 80, 6);
    expect(container.querySelector('[data-split="Not accepted 80"]')?.getAttribute("class")).toBe(
      "fill-warning-mark",
    );
    expect(texts(container, "split")).toEqual(["Accepted 120", "Not accepted 80"]);
    expect(svgOf(container).getAttribute("aria-label")).toContain(
      "plus Add-back 200 (Accepted 120; Not accepted 80)",
    );
    // The step's figure and the running total are the step's own, as before.
    expect(texts(container, "value")).toEqual(["1,000", "+200", "1,200"]);
  });

  it("runs a falling step's parts leftward, and ignores a split on a total", () => {
    const rows: WaterfallRow[] = [
      {
        kind: "level",
        label: "Opening",
        value: 1000,
        text: "1,000",
        split: [{ text: "Ignored 5", value: 5, tone: "primary" }],
      },
      {
        kind: "step",
        label: "Disposal",
        value: -30,
        text: "−30",
        split: [
          { text: "Closed −20", value: -20, tone: "secondary" },
          { text: "Pending −10", value: -10, tone: "worse" },
        ],
      },
    ];
    const { container } = render(<Waterfall rows={rows} unit="USD m" width={WIDE} />);
    expect(container.querySelector('[data-split="Ignored 5"]')).toBeNull();
    const closed = rect(container, '[data-split="Closed −20"]');
    const pending = rect(container, '[data-split="Pending −10"]');
    expect([closed.from, closed.to, pending.from, pending.to]).toEqual([1000, 980, 980, 970]);
    expect(pending.right).toBeCloseTo(closed.x, 6);
  });

  it.each([WIDE, PHONE])("at %i px: the split key wraps and sits clear of the bars", (width) => {
    const { container } = render(<Waterfall rows={SPLIT} unit="USD m" width={width} />);
    expectClear(svgOf(container), width);
  });
});

describe("Waterfall tick labels", () => {
  it("thins the ticks until no two labels touch with the end labels held inside", () => {
    // CP-1's ladder range at a phone width: centred, −4,000 and −2,000 fit; held inside, they touch.
    const rows: WaterfallRow[] = [
      { kind: "level", label: "EBITDA", value: 4173, text: "4,173" },
      { kind: "step", label: "Outflows", value: -6678, text: "−6,678" },
    ];
    const { container } = render(<Waterfall rows={rows} unit="USD m" width={348} />);
    const boxes = [...container.querySelectorAll('[data-part="tick"]')].map((tick) => {
      const x = num(tick, "x");
      const size = tick.textContent.length * 11 * 0.6;
      const anchor = tick.getAttribute("text-anchor");
      const left = anchor === "start" ? x : anchor === "end" ? x - size : x - size / 2;
      return [left, left + size] as const;
    });
    expect(boxes.length).toBeGreaterThan(1);
    boxes.slice(1).forEach((box, at) => {
      expect(box[0]).toBeGreaterThan((boxes[at]?.[1] ?? 0) + 6);
    });
  });
});
