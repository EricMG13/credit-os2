// Synthetic, built from the mark contracts in kit/marks/index.ts and the review's round 3 inputs
// (L9, N2, N4, N5, N8); not a real handoff. Expected values are written out by hand.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { cp1Entry, leadProps } from "../../fixtures/load";
import { FigureTile } from "../LeadFrame";
import {
  BAR,
  Dumbbell,
  GapChip,
  GapSlot,
  Legend,
  SLIM,
  Waterfall,
  gapSlotHeight,
  type WaterfallRow,
} from ".";

const WIDE = 1100;
const num = (element: Element | null | undefined, name: string) =>
  Number(element?.getAttribute(name));
const values = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-part="value"]')].map((text) => text.textContent);
const svgOf = (container: HTMLElement) => container.querySelector("svg") as SVGSVGElement;

describe("Waterfall: figures as written (L9) and steps by tone (N5)", () => {
  const rows = (step: WaterfallRow): WaterfallRow[] => [
    {
      kind: "level",
      label: "EBITDA",
      value: 4173,
      text: "4,173",
      prior: { value: 3395, text: "3,395" },
    },
    step,
    { kind: "closing", label: "After", value: 3015, text: "3,015" },
  ];

  it("prints a payment written 1158 as 1,158, never −1,158, and still draws it as a fall", () => {
    const { container } = render(
      <Waterfall
        width={WIDE}
        unit="US$m"
        legend={{ level: "EBITDA", closing: "After" }}
        rows={rows({
          kind: "step",
          label: "Cash Interest Paid",
          value: -1158,
          text: "1158",
          asWritten: true,
          prior: { value: -1160, text: "1160" },
        })}
      />,
    );
    expect(values(container)).toEqual(["4,173", "1,158", "3,015"]);
    expect(
      [...container.querySelectorAll('[data-part="prior-value"]')].map((t) => t.textContent),
    ).toEqual(["3,395", "1,160"]);
    const step = container.querySelector('[data-step="Cash Interest Paid"]');
    expect([num(step, "data-from"), num(step, "data-to")]).toEqual([4173, 3015]);
    expect(step?.getAttribute("data-tone")).toBe("decrease");
    const label = svgOf(container).getAttribute("aria-label") ?? "";
    expect(label).toContain("Cash Interest Paid 1,158, decrease (prior 1160)");
    expect(label).not.toContain("−1,158");
    expect(label).not.toContain("less");
  });

  it("prints a stated sign as written, and a bridge change 70 as 70 with the word Increase", () => {
    const signed = render(
      <Waterfall
        width={WIDE}
        unit="US$m"
        rows={rows({ kind: "step", label: "Dividends", value: -2038, text: "−2,038" })}
      />,
    );
    expect(values(signed.container)).toContain("−2,038");
    signed.unmount();
    const { container } = render(
      <Waterfall
        width={WIDE}
        unit="US$m"
        legend={{ level: "Reported", step: "Add-back", closing: "Adjusted" }}
        rows={[
          { kind: "level", label: "Reported", value: 3813, text: "3813" },
          { kind: "step", label: "Acquisition costs", value: 70, text: "70", asWritten: true },
          { kind: "step", label: "Disposal", value: -10, text: "-10" },
          { kind: "closing", label: "Adjusted", value: 3873, text: "3873" },
        ]}
      />,
    );
    expect(values(container)).toEqual(["3813", "70", "−10", "3873"]);
    const legend = [...container.querySelectorAll('[data-part="legend-text"]')].map(
      (text) => text.textContent,
    );
    expect(legend).toEqual(["Reported", "Increase", "Decrease", "Adjusted"]);
    expect(svgOf(container).getAttribute("aria-label")).toContain("Acquisition costs 70, increase");
    expect(
      container.querySelector('[data-step="Acquisition costs"]')?.getAttribute("class"),
    ).toContain("stroke-chart-1");
    expect(container.querySelector('[data-step="Disposal"]')?.getAttribute("class")).toContain(
      "stroke-warning-mark",
    );
  });

  it("keeps the default sign for a figure written without one when not asked otherwise", () => {
    const { container } = render(
      <Waterfall
        width={WIDE}
        unit="US$m"
        rows={rows({ kind: "step", label: "Uplift", value: 70, text: "70" })}
      />,
    );
    expect(values(container)).toContain("+70");
  });

  it("draws every bar at the kit's bar height and the prior at the slim height", () => {
    const { container } = render(
      <Waterfall
        width={WIDE}
        unit="US$m"
        rows={rows({
          kind: "step",
          label: "Step",
          value: -1158,
          text: "1158",
          prior: { value: -10, text: "10" },
        })}
      />,
    );
    const heights = [...container.querySelectorAll("rect[data-bar]")].map((bar) =>
      num(bar, "height"),
    );
    expect(heights).toEqual([BAR, BAR - 1.5, BAR]);
    for (const prior of container.querySelectorAll("rect[data-prior]"))
      expect(num(prior, "height")).toBe(SLIM);
  });
});

describe("Dumbbell: coincident marks, plot share and caption (N2)", () => {
  const PERIODS = { prior: "FY2023", current: "FY2024" };

  it("draws a ring and a dot that coincide offset, ring above and dot below the row line", () => {
    const { container } = render(
      <Dumbbell
        width={WIDE}
        unit="US$m"
        periods={PERIODS}
        rows={[
          {
            label: "SG&A",
            prior: { value: 1100, text: "1,100" },
            current: { value: 1115, text: "1,115" },
          },
          {
            label: "Net sales",
            prior: { value: 6585, text: "6,585" },
            current: { value: 7940, text: "7,940" },
          },
        ]}
      />,
    );
    const [ring, far] = [...container.querySelectorAll("circle[data-prior]")];
    const [dot, apart] = [...container.querySelectorAll("circle[data-current]")];
    expect(ring?.getAttribute("data-offset")).toBe("above");
    expect(dot?.getAttribute("data-offset")).toBe("below");
    expect(num(ring, "cy")).toBeLessThan(num(dot, "cy"));
    // Both seen: the ring's top is above the dot's top, the dot's bottom below the ring's.
    expect(num(ring, "cy") - num(ring, "r")).toBeLessThan(num(dot, "cy") - num(dot, "r"));
    expect(far?.getAttribute("data-offset")).toBeNull();
    expect(num(far, "cy")).toBe(num(apart, "cy"));
  });

  it("gives the plot at least half the width: labels at most 28 %, the change slot at most 22 %", () => {
    const { container } = render(
      <Dumbbell
        width={WIDE}
        unit="US$m"
        periods={PERIODS}
        rows={[
          {
            label: "Depreciation and amortization of acquired intangible assets and other items",
            prior: { gap: "Not supplied: outside the comparison scope of this module" },
            current: { value: 7940, text: "7,940" },
            change: "+1,355 against the earlier period, stated",
            note: "up, better on the module's own reading of the measure",
          },
        ]}
      />,
    );
    const slot = container.querySelector("[data-gap] > rect") as Element;
    const plotLeft = num(slot, "x");
    const plotRight = plotLeft + num(slot, "width");
    const change = [...container.querySelectorAll('[data-part="change"], [data-part="reason"]')];
    // The plot starts after the label column (at most 28 %) and the 16 px pad before the marks.
    expect(plotLeft).toBeLessThanOrEqual(WIDE * 0.28 + 16 + 1);
    for (const text of change) expect(num(text, "x")).toBeGreaterThanOrEqual(WIDE * 0.78 - 1);
    // The plot's band (label column's end to the change slot) is at least half the width; the
    // marks sit inside it with room for the figures written outward.
    const changeX = Math.min(...change.map((text) => num(text, "x")));
    expect(changeX - 12 - (plotLeft - 16)).toBeGreaterThanOrEqual(WIDE * 0.5 - 1);
    expect(plotRight).toBeLessThan(changeX);
  });

  it("prints a group caption above the plot", () => {
    const { container } = render(
      <Dumbbell
        width={WIDE}
        unit="US$m"
        periods={PERIODS}
        caption="Large amounts, US$m"
        rows={[
          {
            label: "Net sales",
            prior: { value: 6585, text: "6,585" },
            current: { value: 7940, text: "7,940" },
          },
        ]}
      />,
    );
    const caption = container.querySelector('[data-part="caption"]');
    expect(caption?.textContent).toBe("Large amounts, US$m");
    expect(num(caption, "y")).toBeLessThan(
      num(container.querySelector("circle[data-current]"), "cy"),
    );
  });
});

describe("Legend: one legend, each mark its real shape (N4)", () => {
  it("draws ring, dot, line, bar, slim, square and hatch as those shapes, with their words", () => {
    render(
      <Legend
        items={[
          { kind: "ring", tone: "prior", text: "FY2023" },
          { kind: "dot", text: "FY2024" },
          { kind: "line", tone: "secondary", text: "Net leverage", dashed: true },
          { kind: "bar", tone: "increase", text: "Increase" },
          { kind: "slim", tone: "prior", text: "Earlier period" },
          { kind: "square", tone: "secondary", text: "Debt" },
          { kind: "hatch", text: "Not stated" },
        ]}
      />,
    );
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "FY2023",
      "FY2024",
      "Net leverage",
      "Increase",
      "Earlier period",
      "Debt",
      "Not stated",
    ]);
    const shape = (at: number) => items[at]?.querySelector("[data-swatch]");
    expect(shape(0)?.tagName).toBe("circle");
    expect(shape(0)?.getAttribute("class")).toContain("fill-surface-card");
    expect(shape(1)?.tagName).toBe("circle");
    expect(shape(1)?.getAttribute("class")).toContain("fill-chart-1");
    expect(shape(2)?.tagName).toBe("line");
    expect(shape(2)?.getAttribute("stroke-dasharray")).toBe("3 2");
    expect(num(shape(4), "height")).toBe(SLIM);
    expect(items[6]?.querySelector("[data-gap], rect[fill^='url(']")).not.toBeNull();
    expect(list.className).toContain("flex-wrap");
    expect(list.className).toContain("text-caption");
  });

  it("is drawn in a FigureTile's head with the caption under the kicker", () => {
    render(
      <FigureTile
        props={leadProps(cp1Entry())}
        span={6}
        label="Earnings"
        kicker="US$m"
        caption="FY2023 and FY2024 as stated"
        title="Earnings and debt"
        source="the earnings chart"
        legend={[
          { kind: "ring", tone: "prior", text: "FY2023" },
          { kind: "dot", text: "FY2024" },
        ]}
      >
        <p>figure</p>
      </FigureTile>,
    );
    const region = screen.getByRole("region", { name: "Earnings" });
    const caption = region.querySelector('[data-part="caption"]');
    expect(caption?.textContent).toBe("FY2023 and FY2024 as stated");
    expect(caption?.previousElementSibling?.textContent).toBe("US$m");
    expect(region.querySelectorAll('[data-legend="ring"]')).toHaveLength(1);
    expect(region.querySelectorAll('[data-legend="dot"]')).toHaveLength(1);
  });
});

describe("GapSlot and GapChip: the reason on a solid chip (N8)", () => {
  it("draws the words on a card-coloured chip inside the hatch, growing to hold them", () => {
    const { container } = render(
      <svg>
        <GapSlot
          x={10}
          y={0}
          width={200}
          height={BAR}
          reason="Not supplied: maturity note not in the filing read"
          text="maturity note not in the filing read"
        />
      </svg>,
    );
    const chip = container.querySelector('[data-part="gap-chip"] rect');
    expect(chip?.getAttribute("class")).toContain("fill-surface-card");
    const lines = [...container.querySelectorAll('[data-part="reason"] tspan')].map(
      (line) => line.textContent,
    );
    expect(lines.join(" ")).toBe("maturity note not in the filing read");
    const hatch = container.querySelector("[data-gap] > rect") as Element;
    expect(num(hatch, "height")).toBe(
      gapSlotHeight(200, BAR, "maturity note not in the filing read"),
    );
    expect(num(hatch, "height")).toBeGreaterThan(BAR);
    expect(num(chip, "x")).toBeGreaterThan(num(hatch, "x"));
    expect(num(chip, "x") + num(chip, "width")).toBeLessThanOrEqual(
      num(hatch, "x") + num(hatch, "width"),
    );
    expect(gapSlotHeight(200, BAR)).toBe(BAR);
  });

  it("has an HTML form with the same chip", () => {
    render(<GapChip reason="no split" />);
    const chip = screen.getByText("no split");
    expect(chip.className).toContain("bg-surface-card");
    expect(chip.parentElement?.className).toContain("gap-hatch");
  });
});

describe("one system", () => {
  it("has no rounded-[3px] and no hex colour in the kit", () => {
    const root = join(__dirname, "..");
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
        item.isDirectory()
          ? files(join(dir, item.name))
          : /\.tsx?$/.test(item.name) && !item.name.includes(".test.")
            ? [join(dir, item.name)]
            : [],
      );
    for (const file of files(root)) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toContain("rounded-[3px]");
      expect(text, file).not.toMatch(/#[0-9a-fA-F]{6}\b/);
      expect(text.toLowerCase(), file).not.toMatch(/"[^"]*\bderived\b[^"]*"/);
      expect(text, file).not.toMatch(/"[^"]*from the handoff[^"]*"/);
    }
  });
});
