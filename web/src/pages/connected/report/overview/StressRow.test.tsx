import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { evidencePath, type OutputEntry } from "../../publishedReport";
import { StressRow } from "./StressRow";
import { downsideCases } from "./stressData";
import { measuredAt } from "./resize.fixture";
import { entry, rowProps, section, table } from "./rows.fixture";

afterEach(cleanup);

const covenants = entry(
  "CP-4",
  [
    {
      title: "Covenant headroom",
      table: 43,
      kind: "bullet",
      direction: 4,
      label: [0],
      threshold: 1,
      current: 2,
      headroom: 3,
      unit: "",
    },
  ],
  [
    section(
      "Chart data: covenant headroom",
      42,
      table(
        43,
        [
          "Test",
          "Threshold",
          "Current",
          "Headroom",
          "Direction",
          "Reporting unit",
          "Basis and limitation",
        ],
        [
          ["Net leverage", "5.0", "4.2", "0.8x", "Passes at or below", "x", ""],
          ["Interest cover", "2.0", "2.6", "0.6x", "Passes at or above", "x", ""],
          [
            "Minimum liquidity",
            "100",
            "Not supplied: not stated",
            "Not supplied: no current",
            "Passes at or above",
            "US$m",
            "",
          ],
        ],
      ),
    ),
  ],
);

const downside = entry(
  "CP-2A",
  [],
  [
    section(
      "T2DS.1 Scenarios",
      95,
      table(
        96,
        [
          "Scenario ID",
          "Name",
          "EBITDA decline s",
          "Cash-interest increase k",
          "Anchor",
          "What the assumption leaves out",
          "Category",
          "Confidence",
        ],
        [
          ["s00", "Control", "0", "0", "As reported", "", "", ""],
          ["s01", "Cost shock", "0.1 (10%)", "0", "", "", "", ""],
          ["s02", "Cost and rate shock", "0.2 (20%)", "0.05 (5%)", "", "", "", ""],
        ],
      ),
    ),
    section(
      "T2DS.4 Stressed flows and metrics",
      105,
      table(
        106,
        ["Metric", "s00", "s01", "s02", "Source"],
        [
          ["All-in cover (x)", "3.10", "2.00", "1.40", "Filing p.1"],
          ["Net leverage (x)", "1.25", "1.30", "Not calculated: net debt is missing", "Filing p.1"],
        ],
      ),
    ),
  ],
);

const cell = (display: string, exact: string | null) =>
  exact === null
    ? { exact, display, reason: "the inputs do not state this period", status: "na" }
    : { exact, display, reason: null, status: "value" };

const model = {
  cashflow: {
    columns: [
      { label: "LTM", group: "Last twelve months", start: null, end: null },
      { label: "FY2025E", group: "Base case", start: "2025-04-01", end: "2026-03-31" },
      { label: "FY2026E", group: "Base case", start: "2026-04-01", end: "2027-03-31" },
      { label: "FY2027E", group: "Base case", start: "2027-04-01", end: "2028-03-31" },
    ],
    rows: [
      {
        band: "Credit metrics",
        label: "Net leverage (net debt / Adj EBITDA)",
        kind: "multiple",
        total: false,
        cells: [cell("n.a.", null), cell("2.00x", "2.0"), cell("n.a.", null), cell("1.00x", "1.0")],
      },
    ],
    limits: ["Arithmetic over stated inputs; not analytical review."],
  },
};

const x = (element: Element | null, name: string) => Number(element?.getAttribute(name));

/** Each SVG text as read: its lines joined by a space. */
const drawnTexts = (region: HTMLElement) =>
  [...region.querySelectorAll("svg text")].map((text) => {
    const lines = [...text.querySelectorAll("tspan")].map((line) => line.textContent);
    return lines.length ? lines.join(" ") : text.textContent;
  });

it("places the current value and the threshold on one scale from zero, and lists every other test", () => {
  render(<StressRow {...rowProps([covenants])} />);
  const tile = screen.getByRole("region", { name: "Covenant headroom" });
  const start = 8;
  const current = x(tile.querySelector("[data-current]"), "cx");
  const threshold = x(tile.querySelector("[data-threshold]"), "x1");
  expect((current - start) / (threshold - start)).toBeCloseTo(4.2 / 5.0, 6);
  expect(within(tile).getByText("0.8x")).toBeVisible();
  expect(
    within(tile).getByText("4.2x against a threshold of 5.0x. Passes at or below."),
  ).toBeVisible();
  const others = within(tile).getAllByRole("listitem");
  expect(others).toHaveLength(2);
  expect(others[1]).toHaveTextContent("Minimum liquidity");
  expect(others[1]).toHaveTextContent("Not supplied");
  expect(others[1]).toHaveTextContent("not stated");
  // The missing current value is not drawn as an empty bar.
  expect(others[1]?.querySelector("[data-current]")).toBeNull();
  expect(others[0]?.querySelector("[data-current]")).not.toBeNull();
});

it("draws current and threshold as separate neutral marks, including when they coincide", () => {
  render(
    <StressRow
      {...rowProps([
        covenantsOf([
          ["Net leverage", "5.0", "5.0", "0.0x", "At threshold", "x", ""],
          ["Minimum EBITDA", "-50", "-20", "30", "Passes at or above", "US$m", ""],
        ]),
      ])}
    />,
  );
  const tile = headroomTile();
  const current = tile.querySelector("[data-current]");
  const threshold = tile.querySelector("[data-threshold]");
  expect(current?.tagName.toLowerCase()).toBe("circle");
  expect(threshold?.tagName.toLowerCase()).toBe("line");
  expect(current?.getAttribute("class")).not.toMatch(/chart-1|chart-/);
  expect(current?.getAttribute("cx")).toBe(threshold?.getAttribute("x1"));
  const further = within(tile).getAllByRole("listitem")[0];
  expect(further?.querySelector("[data-current]")).not.toBeNull();
  expect(further?.querySelector("[data-threshold]")).not.toBeNull();
  expect(further?.querySelector(".bg-chart-1")).toBeNull();
});

it("draws the blocked module's own reason in place of the headroom figure", () => {
  const blocked = entry(
    "CP-4",
    [],
    [
      { heading: "Findings", level: 2, line: 3, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 4,
        blocks: [
          {
            type: "text",
            line: 5,
            end: 5,
            text: "Not assessable: no executed governing document available.",
          },
        ],
      },
    ],
  );
  render(<StressRow {...rowProps([blocked])} />);
  const tile = screen.getByRole("region", { name: "Covenant headroom" });
  expect(
    within(tile).getByText("Not assessable: no executed governing document available."),
  ).toBeVisible();
  expect(within(tile).queryByRole("img")).toBeNull();
});

// Restored (round 2, N2): the per-measure small multiples are back, so the base's own test is.
it("draws each stressed metric's bars from zero in proportion, and a gap where a case has no figure", () => {
  render(<StressRow {...rowProps([downside])} />);
  const tile = screen.getByRole("region", { name: "Downside scenarios" });
  const cover = tile.querySelector('[data-panel="All-in cover (x)"]');
  const widths = ["3.10", "2.00", "1.40"].map((text) =>
    x(cover?.querySelector(`[data-bar="${text}"]`) ?? null, "width"),
  );
  expect((widths[1] ?? 0) / (widths[0] ?? 1)).toBeCloseTo(2.0 / 3.1, 6);
  expect((widths[2] ?? 0) / (widths[0] ?? 1)).toBeCloseTo(1.4 / 3.1, 6);
  const leverage = tile.querySelector('[data-panel="Net leverage (x)"]');
  expect(leverage?.querySelectorAll("[data-bar]")).toHaveLength(2);
  expect(leverage?.querySelectorAll("[data-gap]")).toHaveLength(1);
  expect(
    within(tile).getByText("Cost and rate shock, Net leverage (x): net debt is missing."),
  ).toBeVisible();
  expect(
    within(tile).getByText("Cost shock: EBITDA decline 10%, cash interest increase 0%."),
  ).toBeVisible();
});

it("joins only neighbouring forecast periods that both have a figure", () => {
  render(<StressRow {...rowProps([], [model])} />);
  const tile = screen.getByRole("region", { name: "Forward path" });
  expect(tile.querySelectorAll("[data-point]")).toHaveLength(2);
  expect(tile.querySelector('[data-gap="FY2026E"]')).not.toBeNull();
  // FY2025E and FY2027E are not neighbours: no line crosses the period without a figure.
  expect(tile.querySelectorAll("[data-base-line]")).toHaveLength(0);
  const [first, last] = [...tile.querySelectorAll("[data-point]")];
  const base = 130;
  expect((base - x(first ?? null, "cy")) / (base - x(last ?? null, "cy"))).toBeCloseTo(2, 6);
  expect(within(tile).getByText("Base case, by FY2027E")).toBeVisible();
  expect(within(tile).getByText("FY2026E: the inputs do not state this period.")).toBeVisible();
  expect(within(tile).getByText("Net leverage (net debt / Adj EBITDA)")).toBeVisible();
});

it("says why when the run has no covenant module, downside module or forecast model", () => {
  render(<StressRow {...rowProps([])} />);
  expect(screen.getByText("Legal & covenants did not run in this run.")).toBeVisible();
  expect(screen.getByText("Downside did not run in this run.")).toBeVisible();
  expect(screen.getByText("No forecast model was published for this run.")).toBeVisible();
  expect(screen.queryByRole("img")).toBeNull();
});

const HEADS = [
  "Test",
  "Threshold",
  "Current",
  "Headroom",
  "Direction",
  "Reporting unit",
  "Basis and limitation",
];

function covenantsOf(rows: string[][]) {
  return entry(
    "CP-4",
    [
      {
        title: "Covenant headroom",
        table: 43,
        kind: "bullet",
        direction: 4,
        label: [0],
        threshold: 1,
        current: 2,
        headroom: 3,
        unit: "",
      },
    ],
    [section("Chart data: covenant headroom", 42, table(43, HEADS, rows))],
  );
}

const headroomTile = () => screen.getByRole("region", { name: "Covenant headroom" });

it("draws a negative stated value as a figure, and keeps the module's own word for a gap", () => {
  render(
    <StressRow
      {...rowProps([
        covenantsOf([
          ["Net leverage", "5.0", "4.2", "0.8x", "Passes at or below", "x", ""],
          ["Minimum EBITDA", "-50", "-20", "30", "Passes at or above", "US$m", ""],
          ["Fixed charge", "1.1", "Not calculated: covenant suspended", "", "", "x", ""],
        ]),
      ])}
    />,
  );
  const [ebitda, charge] = within(headroomTile()).getAllByRole("listitem");
  expect(ebitda).toHaveTextContent("-$20m / -$50m");
  expect(ebitda).not.toHaveTextContent("Not supplied");
  expect(ebitda?.querySelector("[data-current]")).not.toBeNull();
  expect(charge).toHaveTextContent("Not calculated");
  expect(charge).toHaveTextContent("covenant suspended");
  expect(charge).not.toHaveTextContent("Not supplied");
});

it("places a negative lead test and its threshold on one scale that holds zero", () => {
  render(
    <StressRow
      {...rowProps([
        covenantsOf([["Minimum EBITDA", "-50", "-20", "30", "Passes at or above", "US$m", ""]]),
      ])}
    />,
  );
  const tile = headroomTile();
  const current = x(tile.querySelector("[data-current]"), "cx");
  const threshold = x(tile.querySelector("[data-threshold]"), "x1");
  const zeroTick = [...tile.querySelectorAll("[data-axis] text")].find((tick) =>
    /^\$?0(?:\.0+)?(?:m)?$/.test(tick.textContent),
  );
  if (zeroTick === undefined) throw new Error("Zero tick is missing from the scale");
  const zero = x(zeroTick, "x");
  expect(Math.abs(current - zero) / Math.abs(zero - threshold)).toBeCloseTo(20 / 50, 2);
  expect(
    within(tile).getByText("-$20m against a threshold of -$50m. Passes at or above."),
  ).toBeVisible();
});

it("prints the test label as written and draws each test reason through the reader rule", () => {
  const covenants = covenantsOf([
    ["Net Leverage (CFR)", "5.0", "4.2", "0.8x", "Passes at or below", "x", ""],
    ["Liquidity", "100", "Not supplied: facility agreement page 45", "", "", "US$m", ""],
    ["Cover", "2.0", "Not supplied: CP-1C did not reconcile it", "", "", "x", ""],
    ["Cover", "2.0", "2.5", "0.5x", "", "x", ""],
  ]);
  const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<StressRow {...rowProps([covenants])} />);
  const tile = headroomTile();
  expect(within(tile).getByText("headroom, Net Leverage (CFR)")).toBeVisible();
  expect(tile).not.toHaveTextContent(/page 45|CP-1C/);
  expect(within(tile).getByText("Peer benchmark did not reconcile it")).toBeVisible();
  expect(within(tile).getByRole("link", { name: "Read the reason in Evidence" })).toHaveAttribute(
    "href",
    evidencePath("run", covenants, 46),
  );
  expect(errors.mock.calls.flat().join(" ")).not.toMatch(/same key/);
  errors.mockRestore();
});

function downsideWith(rows: string[][]) {
  const [scenarios] = downside.sections;
  return entry(
    "CP-2A",
    [],
    [
      scenarios as OutputEntry["sections"][number],
      section(
        "T2DS.4 Stressed flows and metrics",
        105,
        table(106, ["Metric", "s00", "s01", "s02", "Source"], rows),
      ),
    ],
  );
}

it("prints a stress cell whole and draws its gap reasons through the reader rule", () => {
  const stressed = downsideWith([
    ["All-in cover (x)", "3.10", "2.00", "Not calculated: CP-1C did not reconcile it", "Filing"],
    [
      "Net leverage (x)",
      "4.0",
      "5.1 (covenant breached)",
      "Not calculated: notes_2024.pdf page 88",
      "Filing",
    ],
  ]);
  render(<StressRow {...rowProps([stressed])} />);
  const tile = screen.getByRole("region", { name: "Downside scenarios" });
  // A long value wraps over lines inside its panel; its words stay whole and in order.
  expect(drawnTexts(tile)).toContain("5.1 (covenant breached)");
  // A long value widens its panel, so the panels may sit on separate rows, one figure each.
  const readings = within(tile)
    .getAllByRole("img")
    .map((figure) => figure.getAttribute("aria-label") ?? "")
    .join(" ");
  expect(readings).toContain("Net leverage (x) 5.1 (covenant breached)");
  expect(tile).not.toHaveTextContent(/notes_2024|page 88|CP-1C/);
  expect(
    within(tile).getByText(
      "Cost and rate shock, All-in cover (x): Peer benchmark did not reconcile it.",
    ),
  ).toBeVisible();
  expect(within(tile).getByRole("link", { name: "Read the reason in Evidence" })).toHaveAttribute(
    "href",
    evidencePath("run", stressed, 109),
  );
});

// Rewritten (round 2, D3): the downside figure no longer scrolls at any width. It is drawn at its
// frame's own width; on a narrow frame its panels stack, one measure a row, each with the cases.
it("fits the downside figure to its frame, stacking the measures on a narrow one, and never scrolls", () => {
  render(<StressRow {...rowProps([downside])} />);
  expect(screen.queryByRole("region", { name: /scrolls sideways/ })).toBeNull();
  const wide = within(downsideTile()).getAllByRole("img");
  expect(wide[0]).toHaveAttribute("width", "100%");
  expect(wide[0]).toHaveAttribute("viewBox", expect.stringMatching(/^0 0 600 /));
  cleanup();
  const restore = measuredAt(320);
  try {
    render(<StressRow {...rowProps([downside])} />);
    expect(screen.queryByRole("region", { name: /scrolls sideways/ })).toBeNull();
    const figures = within(downsideTile()).getAllByRole("img");
    expect(figures).toHaveLength(2);
    for (const figure of figures) {
      expect(figure.querySelectorAll("[data-panel]")).toHaveLength(1);
      expect(figure.parentElement).not.toHaveAttribute("tabindex");
    }
  } finally {
    restore();
  }
});

it("names the base case in the headline and draws model reasons through the reader rule", () => {
  const coded = structuredClone(model);
  const [row] = coded.cashflow.rows;
  if (row?.cells[2]) row.cells[2].reason = "CP-2G could not roll forward";
  coded.cashflow.limits = ["Not reviewed by CP-1C.\nBasis: model notes"];
  render(<StressRow {...rowProps([], [coded])} />);
  const tile = screen.getByRole("region", { name: "Forward path" });
  expect(within(tile).getByText("Base case, by FY2027E")).toBeVisible();
  expect(
    within(tile).getByText("FY2026E: Forward credit model could not roll forward."),
  ).toBeVisible();
  expect(within(tile).getByText("Not reviewed by Peer benchmark.")).toBeVisible();
  expect(tile).not.toHaveTextContent(/CP-2G|CP-1C|model notes/);
});

it("draws no headline figure when the model marks no case as the base case", () => {
  const unmarked = structuredClone(model);
  for (const column of unmarked.cashflow.columns) {
    if (column.group === "Base case") column.group = "Management case";
  }
  render(<StressRow {...rowProps([], [unmarked])} />);
  const tile = screen.getByRole("region", { name: "Forward path" });
  expect(within(tile).queryByText(/by FY2027E/)).toBeNull();
  expect(within(tile).getByText("The model marks no case as the base case.")).toBeVisible();
  expect(within(tile).getByText("Management case")).toBeVisible();
});

// Round 2 review: N2, N10, N5, N6.

const downsideTile = () => screen.getByRole("region", { name: "Downside scenarios" });
const panelNames = () =>
  [...downsideTile().querySelectorAll("[data-panel]")].map((panel) =>
    panel.getAttribute("data-panel"),
  );

it("draws every measure the handoff states, in its order and as written, each on its own scale", () => {
  render(
    <StressRow
      {...rowProps([
        downsideWith([
          ["Stressed FCF (USD millions)", "10.00", "0.00", "-5.1250 (−USD 5.13 million)", "F"],
          ["Covenant cover headroom (x)", "0.9", "0.5", "0.2", "F"],
          ["Interest cover (x)", "3.1", "2.0", "1.4", "F"],
          ["Net debt / EBITDA (x)", "4.0", "4.5", "5.0", "F"],
          ["EBITDA / cash interest (x)", "3.0", "2.5", "2.0", "F"],
        ]),
      ])}
    />,
  );
  expect(panelNames()).toEqual([
    "Stressed FCF (USD millions)",
    "Covenant cover headroom (x)",
    "Interest cover (x)",
    "Net debt / EBITDA (x)",
    "EBITDA / cash interest (x)",
  ]);
  expect(downsideTile()).not.toHaveTextContent(/states no stressed/);
  expect(drawnTexts(downsideTile())).toContain("-5.1250 (−USD 5.13 million)");
  // Each panel on its own scale from zero: in proportion within a panel, not across panels.
  const width = (name: string, text: string) =>
    x(downsideTile().querySelector(`[data-panel="${name}"] [data-bar="${text}"]`) ?? null, "width");
  expect(width("Net debt / EBITDA (x)", "4.0") / width("Net debt / EBITDA (x)", "5.0")).toBeCloseTo(
    0.8,
    6,
  );
  expect(
    width("Net debt / EBITDA (x)", "5.0") / width("Interest cover (x)", "3.1"),
  ).not.toBeCloseTo(5.0 / 3.1, 1);
});

it("draws a measure the module could not calculate, with its reasons, beside the one it did", () => {
  render(
    <StressRow
      {...rowProps([
        downsideWith([
          [
            "Net leverage (x)",
            "Not calculated: net debt is missing",
            "Not calculated: net debt is missing",
            "Not calculated: net debt is missing",
            "F",
          ],
          ["Net leverage pro forma (x)", "1.2", "1.4", "1.9", "F"],
        ]),
      ])}
    />,
  );
  expect(panelNames()).toEqual(["Net leverage (x)", "Net leverage pro forma (x)"]);
  expect(
    within(downsideTile()).getByText("Control, Net leverage (x): net debt is missing."),
  ).toBeVisible();
  expect(
    downsideTile().querySelectorAll('[data-panel="Net leverage (x)"] [data-gap]'),
  ).toHaveLength(3);
});

function scenariosOf(rows: string[][]) {
  return entry(
    "CP-2A",
    [],
    [
      section(
        "T2DS.1 Scenarios",
        95,
        table(
          96,
          [
            "Scenario ID",
            "Name",
            "EBITDA decline s",
            "Cash-interest increase k",
            "Anchor",
            "What the assumption leaves out",
            "Category",
            "Confidence",
          ],
          rows,
        ),
      ),
      section(
        "T2DS.4 Stressed flows and metrics",
        105,
        table(
          106,
          ["Metric", "s00", "s01", "s02", "Source"],
          [["Net leverage (x)", "1.2", "1.4", "1.9", "F"]],
        ),
      ),
    ],
  );
}

it("names no control when two cases state no shock, and calls the one unshocked case what it is", () => {
  render(
    <StressRow
      {...rowProps([
        scenariosOf([
          ["s00", "As reported", "0", "0", "", "", "", ""],
          ["s01", "Flat", "0", "0", "", "", "", ""],
          ["s02", "Cost shock", "0.1 (10%)", "0", "", "", "", ""],
        ]),
      ])}
    />,
  );
  expect(downsideTile()).not.toHaveTextContent(/control|no shock applied/i);
  expect(within(downsideTile()).getByText("As reported")).toBeInTheDocument();
  cleanup();
  render(
    <StressRow
      {...rowProps([
        scenariosOf([
          ["s00", "As reported", "0", "0", "", "", "", ""],
          ["s01", "Cost shock", "0.1 (10%)", "0", "", "", "", ""],
          ["s02", "Rate shock", "0", "0.05 (5%)", "", "", "", ""],
        ]),
      ])}
    />,
  );
  expect(
    within(downsideTile()).getByText("As reported: the case with no shock applied."),
  ).toBeVisible();
  expect(downsideTile()).not.toHaveTextContent(/control/i);
});

// Round 3, X6: the note says only what the page checked, not that the module named none.
it("never draws a scenario id as a case name, and says the page could not read the names", () => {
  const unnamed = entry(
    "CP-2A",
    [],
    [
      section(
        "T2DS.4 Stressed flows and metrics",
        105,
        table(106, ["Metric", "s00", "s01", "Source"], [["Net leverage (x)", "1.2", "1.4", "F"]]),
      ),
    ],
  );
  render(<StressRow {...rowProps([unnamed])} />);
  const tile = downsideTile();
  expect(tile).not.toHaveTextContent(/s00|s01/);
  expect(within(tile).getByText("Case 1")).toBeInTheDocument();
  expect(within(tile).getByText("Case 2")).toBeInTheDocument();
  expect(
    within(tile).getByText(
      "This page could not read case names; cases are numbered in the order stated.",
    ),
  ).toBeVisible();
});

it("reads a figure with its unit, and draws a cell with no figure through the reader rule", () => {
  render(
    <StressRow
      {...rowProps([
        downsideWith([
          ["Net leverage (x)", "1.25", "7.5x", "1.40", "F"],
          ["All-in cover (x)", "3.10", "n.m. per notes_2024.pdf page 88", "1.40", "F"],
        ]),
      ])}
    />,
  );
  const tile = downsideTile();
  expect(tile.querySelector('[data-panel="Net leverage (x)"] [data-bar="7.5x"]')).not.toBeNull();
  expect(tile).not.toHaveTextContent(/notes_2024|No value stated/);
  expect(within(tile).getByRole("img").getAttribute("aria-label")).not.toMatch(/notes_2024/);
  expect(within(tile).getByRole("link", { name: "Read the reason in Evidence" })).toBeVisible();
});

it("draws every covenant cell and label through the reader rule", () => {
  const covenants = covenantsOf([
    ["Net leverage [E3]", "5.0", "4.2", "0.8x (CP-4-CALC-01)", "Passes at or below", "x", ""],
    [
      "Interest cover",
      "2.0",
      "n.m. per notes_2024.pdf page 88",
      "",
      "Passes at or above per credit_agreement.pdf page 88",
      "x",
      "Unaudited; see notes_2024.pdf page 9",
    ],
  ]);
  render(<StressRow {...rowProps([covenants])} />);
  const tile = headroomTile();
  expect(tile).not.toHaveTextContent(/\[E3\]|CP-4-CALC-01|notes_2024|credit_agreement|page 88/);
  expect(within(tile).getByText("0.8x")).toBeVisible();
  expect(within(tile).getByText("headroom, Net leverage")).toBeVisible();
  const [cover] = within(tile).getAllByRole("listitem");
  expect(cover).toHaveTextContent("No figure");
  expect(cover).not.toHaveTextContent("No value stated");
  expect(within(tile).getAllByRole("link", { name: "Read the reason in Evidence" })).toHaveLength(
    3,
  );
});

it("keeps the per-measure exports callable with their earlier arguments", async () => {
  const { downsidePanels, panelScale } = await import("./stressData");
  const data = downsidePanels(downside);
  expect(Object.keys(data ?? {}).sort()).toEqual(["assumptions", "cases", "line", "panels"]);
  const [panel] = data?.panels ?? [];
  expect(panel?.measure).toBe("All-in cover (x)");
  expect([panel?.min, panel?.max]).toEqual([0, 3.1]);
  const { zero, at } = panelScale(panel as NonNullable<typeof panel>, 310);
  expect(zero).toBe(0);
  expect(at(3.1)).toBeCloseTo(310, 6);
});

it("keeps downsideCases for other pages: the first stated leverage and cover measures, with the cases", () => {
  const stressed = downsideWith([
    ["Stressed FCF (USD millions)", "10.00", "0.00", "-5.1250", "Filing"],
    ["All-in cover (x)", "3.10", "2.00", "1.40", "Filing"],
    ["Net leverage (x)", "1.25", "1.30", "Not calculated: net debt is missing", "Filing"],
  ]);
  const read = downsideCases(stressed);
  expect(read?.leverage?.measure).toBe("Net leverage (x)");
  expect(read?.cover?.measure).toBe("All-in cover (x)");
  expect(read?.cases).toHaveLength(3);
  expect(
    downsideCases(downsideWith([["Stressed FCF (USD millions)", "1", "2", "3", "F"]])),
  ).toBeNull();
});

// Round 3: X1, X3, X5, X6.

it("says nothing about a limit on the downside tile, in any state", () => {
  const blockedLegal = entry(
    "CP-4",
    [],
    [
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 3,
        blocks: [{ type: "text", line: 4, end: 4, text: "Not assessable: no document." }],
      },
    ],
  );
  for (const entries of [[downside], [downside, blockedLegal], [downside, covenants]]) {
    render(<StressRow {...rowProps(entries)} />);
    expect(downsideTile()).not.toHaveTextContent(/limit/i);
    cleanup();
  }
});

function registerOf(headers: string[], rows: string[][]) {
  return entry(
    "CP-2A",
    [],
    [
      section("T2DS.1 Scenarios", 95, table(96, headers, rows)),
      section(
        "T2DS.4 Stressed flows and metrics",
        105,
        table(
          106,
          ["Metric", "s00", "s01", "s02", "Source"],
          [["Net leverage (x)", "1.2", "1.4", "1.9", "F"]],
        ),
      ),
    ],
  );
}

const SHOCKS = ["EBITDA decline s", "Cash-interest increase k"];

it("reads case names from a column headed with 'name', keeps a cited name's words, and numbers an id", () => {
  render(
    <StressRow
      {...rowProps([
        registerOf(
          ["Scenario ID", "Scenario name", ...SHOCKS],
          [
            ["s00", "As reported", "0", "0"],
            ["s01", "Cost shock (notes_2024.pdf page 3)", "0.1 (10%)", "0"],
            ["s02", "T4.18", "0.2 (20%)", "0.05 (5%)"],
          ],
        ),
      ])}
    />,
  );
  const tile = downsideTile();
  expect(within(tile).getByText("As reported")).toBeInTheDocument();
  expect(within(tile).getByText("Cost shock")).toBeInTheDocument();
  expect(within(tile).getByText("Case 3")).toBeInTheDocument();
  expect(tile).not.toHaveTextContent(/T4\.18|notes_2024|module names none/);
  expect(
    within(tile).getByText(
      "This page could not read some case names; those cases are numbered in the order stated.",
    ),
  ).toBeVisible();
});

it("reads case names from the scenario name column, not a source file name column before it", () => {
  render(
    <StressRow
      {...rowProps([
        registerOf(
          ["Scenario ID", "Source file name", "Scenario name", ...SHOCKS],
          [
            ["s00", "register_2024.xlsx", "As reported", "0", "0"],
            ["s01", "register_2024.xlsx", "Cost shock", "0.1 (10%)", "0"],
            ["s02", "register_2024.xlsx", "Cost and rate shock", "0.2 (20%)", "0.05 (5%)"],
          ],
        ),
      ])}
    />,
  );
  const tile = downsideTile();
  // Each case is named in its assumption line (the chart may wrap a long name over two lines).
  for (const name of ["As reported", "Cost shock", "Cost and rate shock"])
    expect(tile).toHaveTextContent(`${name}: `);
  expect(tile).not.toHaveTextContent(/register_2024|could not read/);
});

it("says only that the page could not read the names when it finds no name column", () => {
  render(
    <StressRow
      {...rowProps([
        registerOf(
          ["Scenario ID", ...SHOCKS],
          [
            ["s00", "0", "0"],
            ["s01", "0.1 (10%)", "0"],
            ["s02", "0.2 (20%)", "0"],
          ],
        ),
      ])}
    />,
  );
  const tile = downsideTile();
  expect(within(tile).getByText("Case 1")).toBeInTheDocument();
  expect(
    within(tile).getByText(
      "This page could not read case names; cases are numbered in the order stated.",
    ),
  ).toBeVisible();
  expect(tile).not.toHaveTextContent(/module names/);
});

it("draws forward-path case names and the measure through the reader rule", () => {
  const coded = structuredClone(model);
  for (const column of coded.cashflow.columns)
    if (column.group === "Base case") column.group = "Management case [E3]";
  coded.cashflow.rows[0] = { ...coded.cashflow.rows[0], label: "Net leverage per T4.18" } as never;
  render(<StressRow {...rowProps([], [coded])} />);
  const tile = screen.getByRole("region", { name: "Forward path" });
  expect(tile).not.toHaveTextContent(/\[E3\]|T4\.18/);
  expect(within(tile).getByText("Management case")).toBeVisible();
});

it("gives other pages forward-path limits already in reader words", async () => {
  const { forwardPath } = await import("./stressData");
  const coded = structuredClone(model);
  coded.cashflow.limits = [
    "Not reviewed by CP-1C.\nBasis: model notes",
    "See notes_2024.pdf page 4.",
    "Base period is FY2024.",
  ];
  expect(forwardPath(coded)?.limits).toEqual([
    "Not reviewed by Peer benchmark.",
    "Base period is FY2024.",
  ]);
});

it("gives other pages the base fixture's panels, cases and notes in this shape", async () => {
  const { downsidePanels } = await import("./stressData");
  const data = downsidePanels(downside);
  expect(data?.cases).toEqual([
    { id: "s00", name: "Control", control: true },
    { id: "s01", name: "Cost shock", control: false },
    { id: "s02", name: "Cost and rate shock", control: false },
  ]);
  expect(data?.panels.map(({ measure, min, max, line }) => [measure, min, max, line])).toEqual([
    ["All-in cover (x)", 0, 3.1, 108],
    ["Net leverage (x)", 0, 1.3, 109],
  ]);
  expect(data?.panels[1]?.cells[2]).toEqual({
    text: "Not calculated: net debt is missing",
    value: null,
    reason: "net debt is missing",
  });
  expect(data?.assumptions).toEqual([
    "Control: the case with no shock applied.",
    "Cost shock: EBITDA decline 10%, cash interest increase 0%.",
    "Cost and rate shock: EBITDA decline 20%, cash interest increase 5%.",
  ]);
  expect(data?.line).toBe(106);
});

// Verbatim from the replayed TDG CP-2A stressed-metrics table: FCF / debt is stated as a unitless
// fraction under no unit bracket, so it is stated and not drawn.
it("says a stated unitless fraction is stated and not drawn, with no empty axis", () => {
  render(
    <StressRow
      {...rowProps([
        downsideWith([
          ["Net leverage (x)", "4.88x", "6.10x", "9.77x", "Filing"],
          [
            "FCF / debt, fraction",
            "0.075562700964630225080385852090032154341",
            "0.043706101286173633440514469453376205788",
            "-0.0034760610932475884244372990353697749196",
            "Filing",
          ],
        ]),
      ])}
    />,
  );
  const tile = downsideTile();
  const panel = tile.querySelector('[data-panel="FCF / debt, fraction"]');
  expect(panel).not.toBeNull();
  expect(panel).not.toHaveTextContent("No figure");
  expect(panel).toHaveTextContent("Stated, not drawn");
  const readings = within(tile)
    .getAllByRole("img")
    .map((figure) => figure.getAttribute("aria-label") ?? "")
    .join(" ");
  expect(readings).toContain("FCF / debt, fraction stated, not drawn");
  expect(readings).not.toMatch(/FCF \/ debt, fraction no figure/);
  // The full value stays in the note beneath.
  expect(tile).toHaveTextContent("0.075562700964630225080385852090032154341");
  // No scale is drawn for a panel with nothing placed on it.
  expect(panel?.querySelectorAll("[data-axis] text")).toHaveLength(0);
});

it("S17-2-1 says why a case named in the key has no figure", () => {
  const value = (display: string, exact: string) => ({
    exact,
    display,
    reason: null,
    status: "value",
  });
  const gap = { exact: null, display: "n.m.", reason: "EBITDA is not positive", status: "na" };
  const col = (label: string, group: string) => ({
    label,
    group,
    start: "2025-04-01",
    end: "2026-03-31",
  });
  const gapModel = {
    cashflow: {
      columns: [
        col("FY2026E", "Base case"),
        col("FY2027E", "Base case"),
        col("FY2026E", "Downside case"),
        col("FY2027E", "Downside case"),
      ],
      rows: [
        {
          band: "Credit metrics",
          label: "Net leverage (net debt / Adj EBITDA)",
          kind: "multiple",
          total: false,
          cells: [value("2.00x", "2.0"), value("1.00x", "1.0"), gap, gap],
        },
      ],
      limits: [],
    },
  };
  render(<StressRow {...rowProps([], [gapModel])} />);
  const tile = screen.getByRole("region", { name: "Forward path" });
  expect(
    within(tile).getAllByText(/Downside case: no figure, EBITDA is not positive/i),
  ).toHaveLength(1);
});

// Colour-signal-build rulings R1 and R2: expected values are written out by hand.
it("draws no band, share or better/worse colour on the covenant tile", () => {
  render(<StressRow {...rowProps([covenants])} />);
  const tile = screen.getByRole("region", { name: "Covenant headroom" });
  expect(tile.innerHTML).not.toMatch(
    /better-mark|worse-mark|scale-better|scale-worse|cap-band|scale-amount|category-|warning-|error-|success-/,
  );
  expect(tile.textContent).not.toContain("%");
});

it("draws one colour a case, the same in every panel, with a swatch beside each name", () => {
  render(<StressRow {...rowProps([downside])} />);
  const tile = downsideTile();
  const fill = (element: Element | null) => (element as SVGElement | null)?.style.fill;
  const colours = ["var(--color-category-1)", "var(--color-category-3)", "var(--color-category-4)"];
  const panels = [...tile.querySelectorAll("[data-panel]")];
  expect(panels.length).toBeGreaterThan(1);
  for (const panel of panels) {
    const bars = [...panel.querySelectorAll("[data-bar]")].map(fill);
    expect(bars).toEqual(colours.slice(0, bars.length));
  }
  for (const svg of within(tile).getAllByRole("img")) {
    expect([...svg.querySelectorAll("[data-swatch]")].map(fill)).toEqual(colours);
  }
  expect(tile.innerHTML).not.toMatch(
    /better-mark|worse-mark|scale-better|scale-worse|cap-band|category-2|category-7/,
  );
  for (const gap of tile.querySelectorAll("[data-gap]")) expect(fill(gap)).toBe("");
});

it("colours a bar by its case, so a gap in the middle case leaves the other two their own colours", () => {
  render(
    <StressRow
      {...rowProps([
        downsideWith([
          ["All-in cover (x)", "3.10", "2.00", "1.40", "Filing p.1"],
          ["Net leverage (x)", "1.25", "Not calculated: net debt is missing", "1.40", "Filing p.1"],
        ]),
      ])}
    />,
  );
  const fill = (element: Element) => (element as SVGElement).style.fill;
  const panel = (name: string) =>
    [...downsideTile().querySelectorAll(`[data-panel="${name}"] [data-bar]`)].map(fill);
  expect(panel("All-in cover (x)")).toEqual([
    "var(--color-category-1)",
    "var(--color-category-3)",
    "var(--color-category-4)",
  ]);
  expect(panel("Net leverage (x)")).toEqual(["var(--color-category-1)", "var(--color-category-4)"]);
});
