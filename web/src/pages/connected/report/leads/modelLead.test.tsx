// The model is faked in the shape `forwardPath` reads (overview/StressRow.test.tsx); no retained real
// published model is used. The lead reads only the model's net leverage row: Synthetic, built from the
// published-model contract (overview/stressData.ts `forwardPath`); not a real run.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { entry } from "../overview/rows.fixture";
import { leadProps } from "./fixtures/load";
import { ModelLead } from "./modelLead";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Measure every figure box as `width` px wide (jsdom has no layout). */
function measuredAs(width: number) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);
}

const cell = (display: string, exact: string | null) =>
  exact === null
    ? { exact, display, reason: "the inputs do not state this period", status: "na" }
    : { exact, display, reason: null, status: "value" };

const col = (label: string, group: string) => ({
  label,
  group,
  start: "2025-04-01",
  end: "2026-03-31",
});

function model(
  cases: Record<string, [string, string | null][]>,
  limits = ["Arithmetic over stated inputs; not analytical review."],
) {
  const columns: { label: string; group: string; start: string | null; end: string | null }[] = [
    { label: "LTM", group: "Last twelve months", start: null, end: null },
  ];
  const cells = [cell("n.a.", null)];
  for (const [group, values] of Object.entries(cases))
    values.forEach(([display, exact], at) => {
      columns.push(col(`FY${String(2025 + at)}E`, group));
      cells.push(cell(display, exact));
    });
  return {
    cashflow: {
      columns,
      rows: [
        {
          band: "Credit metrics",
          label: "Net leverage (net debt / Adj EBITDA)",
          kind: "multiple",
          total: false,
          cells,
        },
      ],
      limits,
    },
  };
}

const TWO = model({
  "Base case": [
    ["2.00x", "2.0"],
    ["n.a.", null],
    ["1.00x", "1.0"],
  ],
  "Downside case": [
    ["2.50x", "2.5"],
    ["3.50x", "3.5"],
    ["3.00x", "3.0"],
  ],
});

const module_ = entry("CP-MODEL", [], [{ heading: "Findings", level: 2, line: 3, blocks: [] }]);
const props = (models: unknown[]) => leadProps(module_, models);
const num = (element: Element | null | undefined, name: string) =>
  Number(element?.getAttribute(name));
const zeroOf = (container: Element) => num(container.querySelector("svg[data-zero]"), "data-zero");

describe("ModelLead", () => {
  it("draws each case from zero in proportion, and joins only neighbouring periods that both have a figure", () => {
    const { container } = render(<ModelLead {...props([TWO])} />);
    const point = (name: string) => container.querySelector(`[data-point="${name}"]`);
    const zero = zeroOf(container);
    const height = (name: string) => zero - num(point(name), "data-cy");
    expect(height("Downside case FY2026E") / height("Downside case FY2025E")).toBeCloseTo(
      3.5 / 2.5,
      6,
    );
    expect(height("Base case FY2027E") / height("Base case FY2025E")).toBeCloseTo(1.0 / 2.0, 6);
    expect(height("Downside case FY2027E") / height("Base case FY2027E")).toBeCloseTo(3.0, 6);
    // Base case has no figure for FY2026E: nothing joins FY2025E to FY2027E.
    expect(container.querySelectorAll('[data-line="Base case"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-line="Downside case"]')).toHaveLength(2);
  });

  it("marks a case's gap on that case's own line, not as a full-height column, and never as zero", () => {
    const { container } = render(<ModelLead {...props([TWO])} />);
    const marks = container.querySelectorAll("[data-gap-mark]");
    expect(marks).toHaveLength(1);
    const mark = container.querySelector(
      '[data-gap-mark="Base case FY2026E"] rect[stroke-dasharray]',
    );
    expect(mark).not.toBeNull();
    // A small slot: nowhere near the plot's full height (216), and not at the zero line.
    expect(num(mark, "height")).toBeLessThan(30);
    expect(num(mark, "y") + num(mark, "height") / 2).toBeLessThan(zeroOf(container) - 20);
    // It sits at the height of the base case's own stated neighbour, in that case's colour.
    const neighbour = num(container.querySelector('[data-point="Base case FY2025E"]'), "data-cy");
    expect(num(mark, "y") + num(mark, "height") / 2).toBeCloseTo(neighbour, 6);
    expect(container.querySelector('[data-point="Base case FY2026E"]')).toBeNull();
    expect(
      screen.getByText("Base case, FY2026E: the inputs do not state this period."),
    ).toBeVisible();
  });

  it("marks only the case that lacks the year when the other case states it", () => {
    const { container } = render(
      <ModelLead
        {...props([
          model({
            "Base case": [
              ["5.10x", "5.1"],
              ["4.60x", "4.6"],
              ["4.10x", "4.1"],
            ],
            Downside: [
              ["5.50x", "5.5"],
              ["6.00x", "6.0"],
              ["n.a.", null],
            ],
          }),
        ])}
      />,
    );
    expect(container.querySelectorAll("[data-gap-mark]")).toHaveLength(1);
    expect(container.querySelector('[data-gap-mark="Downside FY2027E"]')).not.toBeNull();
    expect(container.querySelector('[data-point="Base case FY2027E"]')).not.toBeNull();
    expect(container.querySelector('[data-line="Downside"]')).not.toBeNull();
  });

  it("gives each case its own colour, dash and marker, in the lines and in the legend", () => {
    const three = model({
      "Base case": [
        ["2.00x", "2.0"],
        ["2.10x", "2.1"],
      ],
      Downside: [
        ["3.00x", "3.0"],
        ["3.10x", "3.1"],
      ],
      Severe: [
        ["4.00x", "4.0"],
        ["4.10x", "4.1"],
      ],
    });
    const { container } = render(<ModelLead {...props([three])} />);
    const lineLook = (name: string) => {
      const line = container.querySelector(`[data-line="${name}"]`);
      return [line?.getAttribute("class"), line?.getAttribute("stroke-dasharray")].join("|");
    };
    expect(new Set(["Base case", "Downside", "Severe"].map(lineLook)).size).toBe(3);
    const marker = (name: string) =>
      container.querySelector(`[data-point="${name} FY2025E"]`)?.tagName;
    expect(new Set(["Base case", "Downside", "Severe"].map(marker)).size).toBe(3);
    const legend = [...container.querySelectorAll("ul li svg")].map((svg) => svg.innerHTML);
    expect(new Set(legend).size).toBe(3);
  });

  it("labels each case at its line end with the model's own text, singles out no high or peak, and the title is plain", () => {
    const { container } = render(<ModelLead {...props([TWO])} />);
    expect(container.querySelector('[data-case-label="Base case"]')?.textContent).toBe(
      "Base case1.00x",
    );
    expect(container.querySelector('[data-case-label="Downside case"]')?.textContent).toBe(
      "Downside case3.00x",
    );
    expect(container.querySelector("[data-peak]")).toBeNull();
    const tile = screen.getByRole("region", { name: "Forward net leverage" });
    expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(
      /^Net leverage by case$/,
    );
    expect(tile.textContent).not.toMatch(/\bhigh\b|highest|peak|derived/i);
    expect(within(tile).getByRole("img")).toHaveAccessibleName(
      "Net leverage (net debt / Adj EBITDA), from zero. Base case: FY2025E 2.00x, FY2026E no figure, FY2027E 1.00x. Downside case: FY2025E 2.50x, FY2026E 3.50x, FY2027E 3.00x.",
    );
  });

  it("shows the model's first limit sentences beneath, one trace control and a table view", () => {
    render(<ModelLead {...props([TWO])} />);
    expect(screen.getByText("Arithmetic over stated inputs; not analytical review.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Source for the forward path" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Table view/ }));
    expect(
      within(screen.getByRole("region", { name: "Forward net leverage" })).getByRole("table"),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/CP-MODEL|CP-2G/);
  });

  it("puts the link to the Forecast page in the chart tile's head: one tile, spanning the row", () => {
    render(<ModelLead {...props([TWO])} />);
    expect(screen.queryByRole("region", { name: "Open the forecast" })).toBeNull();
    const tile = screen.getByRole("region", { name: "Forward net leverage" });
    expect(tile.className).toContain("lg:col-span-12");
    const link = within(tile).getByRole("link", { name: "Open the forecast" });
    expect(link).toHaveAttribute("href", "#forecast");
    // In the head, above the legend and the figure.
    const head = tile.querySelector("h3")?.parentElement;
    expect(head?.contains(link)).toBe(true);
    expect(tile.querySelectorAll("section")).toHaveLength(0);
    // No arbitrary radius anywhere: the swatches are the kit's.
    expect(tile.querySelector('ul [class*="rounded-["], svg [class*="rounded-["]')).toBeNull();
  });

  it("says the true condition: no model at all, or a model without a net leverage row; the link stays", () => {
    const { unmount } = render(<ModelLead {...props([])} />);
    expect(
      screen.getByText(/This page could not read a published model for this run\./),
    ).toBeVisible();
    expect(screen.queryByText(/a net leverage path from the published model/)).toBeNull();
    expect(screen.getByRole("link", { name: "Open the forecast" })).toHaveAttribute(
      "href",
      "#forecast",
    );
    expect(screen.queryByRole("img")).toBeNull();
    unmount();
    const noRow = { cashflow: { ...TWO.cashflow, rows: [] } };
    render(<ModelLead {...props([noRow])} />);
    expect(
      screen.getByText(/This page could not read a net leverage path from the published model\./),
    ).toBeVisible();
    expect(screen.queryByText(/a published model for this run/)).toBeNull();
    expect(screen.getByRole("link", { name: "Open the forecast" })).toBeVisible();
  });

  it("draws one case with one period as a single point, and ignores a second model", () => {
    const one = model({ "Base case": [["2.00x", "2.0"]] });
    const { container } = render(<ModelLead {...props([one, TWO])} />);
    expect(container.querySelectorAll("[data-point]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-line]")).toHaveLength(0);
    expect(container.querySelector('[data-case-label="Downside case"]')).toBeNull();
  });

  it("draws a case whose only stated value is zero as a value", () => {
    const { container } = render(
      <ModelLead
        {...props([
          model({
            "Base case": [
              ["0.00x", "0"],
              ["1.00x", "1.0"],
            ],
          }),
        ])}
      />,
    );
    expect(num(container.querySelector('[data-point="Base case FY2025E"]'), "data-cy")).toBe(
      zeroOf(container),
    );
    expect(container.querySelectorAll("[data-gap-mark]")).toHaveLength(0);
  });

  it("keeps overlapping end labels apart", () => {
    const { container } = render(
      <ModelLead
        {...props([
          model({
            "Base case": [
              ["2.00x", "2.0"],
              ["2.00x", "2.0"],
            ],
            "Downside case": [
              ["2.10x", "2.1"],
              ["2.10x", "2.1"],
            ],
          }),
        ])}
      />,
    );
    const top = (name: string) => num(container.querySelector(`[data-case-label="${name}"]`), "y");
    expect(Math.abs(top("Base case") - top("Downside case"))).toBeGreaterThanOrEqual(14);
  });

  it("a blocked module draws nothing: the frame states it", () => {
    const blocked = entry(
      "CP-MODEL",
      [],
      [
        { heading: "Findings", level: 2, line: 3, blocks: [] },
        {
          heading: "Bottom line",
          level: 3,
          line: 4,
          blocks: [{ type: "text", line: 5, end: 5, text: "Not assessable: no model inputs." }],
        },
      ],
    );
    const { container } = render(<ModelLead {...leadProps(blocked, [TWO])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("declares that it draws none of the module's typed figures, events or maps", () => {
    expect(ModelLead.draws).toEqual([]);
  });

  it("draws at the measured width: a 390 px phone gets the narrow viewBox, real text sizes and labels inside it", () => {
    measuredAs(390);
    const three = model({
      "Base case": [
        ["5.10x", "5.1"],
        ["4.60x", "4.6"],
        ["4.10x", "4.1"],
      ],
      "Downside case": [
        ["5.50x", "5.5"],
        ["6.00x", "6.0"],
        ["n.a.", null],
      ],
    });
    const { container } = render(<ModelLead {...props([three])} />);
    const svg = container.querySelector("svg[data-zero]");
    expect(svg?.getAttribute("viewBox")).toMatch(/^0 0 390 /);
    expect(svg?.getAttribute("data-layout")).toBe("narrow");
    for (const text of svg?.querySelectorAll("text") ?? [])
      expect(Number(text.getAttribute("font-size")), text.textContent).toBeGreaterThanOrEqual(11);
    // Nothing is drawn past the right edge, end labels included (7.2 px a character at 12 px).
    for (const label of svg?.querySelectorAll("[data-case-label]") ?? []) {
      const widest = Math.max(
        ...[...label.querySelectorAll("tspan")].map((t) => t.textContent.length),
      );
      expect(num(label, "x") + widest * 7.2).toBeLessThanOrEqual(390);
    }
    for (const point of svg?.querySelectorAll("[data-point]") ?? [])
      expect(num(point, "data-cx")).toBeLessThanOrEqual(390);
  });

  it("never doubles a full stop: a reason that ends in one is not followed by another", () => {
    const stop = {
      cashflow: {
        ...TWO.cashflow,
        rows: [
          {
            ...TWO.cashflow.rows[0],
            cells: TWO.cashflow.rows[0]?.cells.map((c) =>
              c.status === "na" ? { ...c, reason: "the inputs do not state this period." } : c,
            ),
          },
        ],
      },
    };
    render(<ModelLead {...props([stop])} />);
    for (const el of document.querySelectorAll("[aria-label]"))
      expect(el.getAttribute("aria-label"), el.getAttribute("aria-label") ?? "").not.toContain(
        "..",
      );
    expect(document.body.textContent).not.toContain("..");
    expect(
      screen.getByText(/Base case, FY2026E: the inputs do not state this period\./),
    ).toBeVisible();
  });
});

// The real model publishes the upside case in `cashflow.other` (net leverage 4.86x, 3.96x, 3.19x in the
// replayed TDG forecast); figures typed by hand from that run.
describe("ModelLead other grid", () => {
  it("draws the upside case the model publishes in its other grid", () => {
    const withUpside = {
      cashflow: {
        ...TWO.cashflow,
        other: {
          columns: ["FY2025E", "FY2026E", "FY2027E"].map((label) => col(label, "Upside case")),
          rows: [
            {
              band: "Credit metrics",
              label: "Net leverage (net debt / Adj EBITDA)",
              kind: "multiple",
              total: false,
              cells: [cell("4.86x", "4.8593"), cell("3.96x", "3.9612"), cell("3.19x", "3.19")],
            },
          ],
        },
      },
    };
    const { container } = render(<ModelLead {...props([withUpside])} />);
    expect(container.querySelectorAll('[data-line="Upside case"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Table view/ }));
    expect(screen.getByRole("row", { name: /Upside case.*FY2027E.*3\.19x/ })).toBeInTheDocument();
  });
});
