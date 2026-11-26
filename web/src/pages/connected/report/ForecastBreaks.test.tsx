import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import type { ReportView } from "../reportView";
import { WhatBreaks } from "./ForecastBreaks";
import { readMeasure } from "./forecastData";

const value = (exact: string) => ({ status: "value", exact, display: exact });
const LIQUIDITY = "Accessible liquidity";

function model(cells: unknown[], labels = ["FY2025E", "FY2026E", "FY2027E"]) {
  return {
    cashflow: {
      units: "USD millions",
      columns: labels.map((label) => ({ label, group: "Base case" })),
      rows: [{ label: LIQUIDITY, band: "Cash", kind: "money", total: false, cells }],
    },
  };
}

function table(line: number, headers: string[], rows: string[][]) {
  return {
    type: "table" as const,
    line,
    headers,
    rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
  };
}

function downside(bottomLine = "The issuer withstands the cost shock."): OutputEntry {
  return {
    selected: true,
    output: {
      id: "downside",
      sha256: "a".repeat(64),
      module: "CP-2A",
      label: "",
      href: "",
      state: { established: true, declared: null },
    },
    sections: [
      { heading: "Findings", level: 2, line: 16, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 18,
        blocks: [{ type: "text", line: 20, end: 20, text: bottomLine }],
      },
      {
        heading: "T2DS.1 Scenarios",
        level: 4,
        line: 94,
        blocks: [
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
              ["s00", "Control (unstressed)", "0", "0", "LTM", "n/a", "Fact", "High"],
              ["s01", "Cost shock", "0.1 (10%)", "0", "Held", "WC", "Interp", "Medium"],
            ],
          ),
        ],
      },
      {
        heading: "T2DS.4 Stressed flows and metrics",
        level: 4,
        line: 104,
        blocks: [
          table(
            106,
            ["Metric", "s00", "s01", "Source"],
            [
              ["All-in cover (x)", "3.10", "2.00", "Filing p.1"],
              ["Net leverage (x)", "1.25", "Not calculated: net debt is missing", "Filing p.1"],
            ],
          ),
        ],
      },
    ],
  };
}

const view = (entries: OutputEntry[]) =>
  ({ catalogue: undefined, lead: undefined, entries, modules: [], models: [] }) as ReportView;

function entryOf(module: string, sections: unknown[], established = true): OutputEntry {
  return {
    selected: true,
    output: {
      id: module,
      sha256: "e".repeat(64),
      module,
      label: "",
      href: "",
      state: { established, declared: null },
      charts:
        module === "CP-4"
          ? [
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
                columns: [1, 2],
              },
            ]
          : [],
    },
    sections,
  } as unknown as OutputEntry;
}
const bottom = (text: string) => ({
  heading: "Bottom line",
  level: 3,
  line: 18,
  blocks: [{ type: "text", line: 20, end: 20, text }],
});
const findings = { heading: "Findings", level: 2, line: 16, blocks: [] };

const liquidity = entryOf("CP-2D", [
  findings,
  bottom("Liquidity lasts to the horizon."),
  {
    heading: "T2E.5 Funding gap",
    level: 3,
    line: 40,
    blocks: [
      table(
        42,
        ["Line", "Value (USD millions)"],
        [
          ["Horizon", "2026-03-31"],
          ["Funding gap", "120.5"],
        ],
      ),
    ],
  },
]);
const legal = entryOf("CP-4", [
  findings,
  bottom("The covenants hold."),
  {
    heading: "Chart data: covenant headroom",
    level: 3,
    line: 41,
    blocks: [
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
        [["Net leverage", "5.0", "4.2", "0.8x", "Passes at or below", "x", "Synthetic."]],
      ),
    ],
  },
]);
const forward = entryOf("CP-2G", [
  findings,
  bottom("The view."),
  {
    heading: "Limitations",
    level: 3,
    line: 30,
    blocks: [
      {
        type: "text",
        line: 32,
        end: 33,
        text: "- The break tests reuse watch levels, not covenant tests; covenant compliance belongs to the legal module.\n- Debt maturities and refinancing feasibility are not modelled; the maturity wall and funding gap belong to the liquidity and refinancing modules.",
      },
    ],
  },
]);

const schedule = {
  years: [
    { year: 2026, label: "FY2026", key: "FY2026", cell: { text: "500", value: 500, reason: null } },
    {
      year: 2028,
      label: "FY2028",
      key: "FY2028",
      cell: { text: "1,250", value: 1250, reason: null },
    },
  ],
  offAxis: [],
  unit: "US$m",
  reason: null,
};

function breaks(entries: OutputEntry[], cells = [value("212"), value("295"), value("397")]) {
  return render(
    <WhatBreaks
      view={view(entries)}
      folder="current"
      liquidity={readMeasure(model(cells), "accessible liquidity", /^Accessible liquidity\b/)}
      group="Base case"
      caseName="Base case"
      schedule={schedule}
      source={(name) => <button type="button">{`Show sources for ${name}`}</button>}
    />,
  );
}

it("states the liquidity module's funding gap as that module's figure, with horizon, unit and trace", () => {
  breaks([liquidity]);
  const part = within(screen.getByRole("region", { name: "Funding gap" }));
  expect(part.getByText("120.5")).toBeInTheDocument();
  // Named by the module and the row's own label, never the page's own wording.
  expect(part.getByText("Liquidity: Funding gap · 2026-03-31 · USD millions")).toBeInTheDocument();
  expect(part.queryByText(/horizon end/)).toBeNull();
  expect(part.getByRole("link", { name: "Source for Liquidity's Funding gap" })).toHaveAttribute(
    "href",
    expect.stringContaining("-45") as string,
  );
  expect(screen.queryByText(/No module states a shortfall/)).toBeNull();
});

it("names the modules it looked at when neither states a funding gap", () => {
  breaks([]);
  expect(
    within(screen.getByRole("region", { name: "Funding gap" })).getByText(
      "Liquidity did not run in this run. Refinancing & LME did not run in this run.",
    ),
  ).toBeInTheDocument();
});

it("shows the liquidity path and the maturity schedule apart, with a trace per figure, picking no sentence", () => {
  breaks([forward]);
  const path = within(screen.getByRole("region", { name: "Accessible liquidity, Base case" }));
  for (const [year, figure] of [
    ["FY2025E", "212"],
    ["FY2026E", "295"],
    ["FY2027E", "397"],
  ] as const) {
    expect(path.getByText(year)).toBeInTheDocument();
    expect(path.getByText(figure)).toBeInTheDocument();
    expect(
      path.getByRole("button", { name: `Show sources for Accessible liquidity, ${year}` }),
    ).toBeInTheDocument();
  }
  const debt = within(screen.getByRole("region", { name: "Debt maturing" }));
  expect(debt.getByText("FY2028")).toBeInTheDocument();
  expect(debt.getByText("1,250")).toBeInTheDocument();
  expect(path.queryByText("1,250")).toBeNull();
  // The page says what it does and links to the model's own limitations; it quotes no sentence.
  expect(
    screen.getByText(
      "This page shows the model's liquidity and the maturity schedule apart; it does not set one against the other.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Forward credit model's limitations" })).toHaveAttribute(
    "href",
    "#modules/CP-2G",
  );
  expect(screen.queryByText(/refinancing feasibility/)).toBeNull();
});

it("shows each covenant test as the legal module writes it, with the model's caveat in words", () => {
  breaks([legal, forward]);
  const part = within(screen.getByRole("region", { name: "Covenant tests" }));
  expect(part.getByText("Net leverage")).toBeInTheDocument();
  // Each cell as written, the unit column once: the page joins no unit to a figure.
  expect(part.getByText("5.0")).toBeInTheDocument();
  expect(part.getByText("4.2")).toBeInTheDocument();
  expect(part.getByText("0.8x")).toBeInTheDocument();
  expect(part.queryByText("5.0 x")).toBeNull();
  expect(part.getAllByText("Unit x").length).toBeGreaterThan(0);
  expect(part.getByText("Passes at or below")).toBeInTheDocument();
  expect(
    part.getByText("This forecast's figures are not set against the covenant tests above."),
  ).toBeInTheDocument();
  expect(part.queryByText(/break tests reuse/)).toBeNull();
  expect(part.getByRole("link", { name: "Source for the Net leverage test" })).toBeInTheDocument();
});

it("draws a covenant test as its current figure against its level, on the test's own scale", () => {
  const { container } = breaks([legal, forward]);
  const test = screen
    .getByRole("region", { name: "Covenant tests" })
    .querySelector("li") as HTMLElement;
  expect(within(test).getByText("Net leverage")).toBeInTheDocument();
  // 4.2 against 5.0 on a scale of 5.0 x 1.15: position only, no figure of its own.
  const bar = test.querySelector("[data-limit-bar]") as HTMLElement;
  expect(bar).toHaveAttribute("aria-hidden", "true");
  expect(bar).toHaveTextContent("");
  expect(bar.querySelector("[data-current]")).toHaveAttribute("data-current", "73%");
  expect(bar.querySelector("[data-level]")).toHaveAttribute("data-level", "87%");
  // A test whose current figure is not given draws its level alone, never a bar at zero.
  for (const drawn of container.querySelectorAll("[data-limit-bar]"))
    expect(drawn.querySelector("[data-level]")).not.toBeNull();
});

it("draws the legal module blocked in the designed blocked state with its reason", () => {
  const blockedLegal = entryOf("CP-4", [
    findings,
    bottom("Not assessable: no executed governing document available."),
  ]);
  breaks([blockedLegal]);
  const part = within(screen.getByRole("region", { name: "Covenant tests" }));
  expect(part.getByText("Not assessable")).toBeInTheDocument();
  expect(part.getByText(/no executed governing document available/)).toBeInTheDocument();
});

it("draws the stress scenarios as one small multiple with each cell's figure and gaps in words", () => {
  breaks([downside()]);
  const stress = within(screen.getByRole("group", { name: "Point-in-time stress" }));
  const reading = stress.getByRole("img").getAttribute("aria-label") ?? "";
  expect(reading).toContain("Control (unstressed): All-in cover (x) 3.10");
  expect(reading).toContain("Cost shock: All-in cover (x) 2.00, Net leverage (x) not calculated");
  expect(
    stress.getByText(/Cost shock, Net leverage \(x\): net debt is missing/),
  ).toBeInTheDocument();
});

it("names why a part cannot be drawn: no downside module, no liquidity for the case", () => {
  breaks([], []);
  expect(screen.getByText("Downside did not run in this run.")).toBeInTheDocument();
  expect(
    screen.getByText("The model publishes no accessible liquidity figure."),
  ).toBeInTheDocument();
});

it("draws every scenario name whole, wrapped onto more lines where the column is narrow", () => {
  const long = "Cost, cash-interest and refinancing shock combined";
  const entry = downside();
  const scenarios = entry.sections.find(({ heading }) => heading === "T2DS.1 Scenarios");
  const block = scenarios?.blocks[0];
  if (block?.type !== "table") throw new Error("fixture");
  const second = block.rows[1];
  if (second) second.cells[1] = long;
  breaks([entry]);
  const drawing = within(screen.getByRole("group", { name: "Point-in-time stress" })).getByRole(
    "img",
  );
  const names = [...drawing.querySelectorAll("text")]
    .filter((text) => text.querySelector("tspan"))
    .map((text) => [...text.querySelectorAll("tspan")].map((line) => line.textContent));
  const drawn = names.find((lines) => lines[0]?.startsWith("Cost,"));
  expect(drawn?.length).toBeGreaterThan(1);
  expect(drawn?.join(" ")).toBe(long);
  expect(drawing.textContent).not.toContain("…");
});

it("draws a figure below zero on its own side of zero and tells zero apart from a small figure", () => {
  const entry = downside();
  const flows = entry.sections.find(
    ({ heading }) => heading === "T2DS.4 Stressed flows and metrics",
  );
  const block = flows?.blocks[0];
  if (block?.type !== "table") throw new Error("fixture");
  block.rows.unshift({
    line: 105,
    cells: ["Stressed FCF (US$m)", "0.00", "-5.1250", "Filing p.1"],
  });
  const cover = block.rows.find(({ cells }) => cells[0] === "All-in cover (x)");
  if (cover) cover.cells = ["All-in cover (x)", "0.04", "0.00", "Filing p.1"];
  breaks([entry]);
  const drawing = within(screen.getByRole("group", { name: "Point-in-time stress" })).getByRole(
    "img",
  );
  // A figure below zero is drawn left of the zero line in its row's own colour, its sign as
  // written: no signal colour stands without a word.
  expect(within(drawing).getByText("-5.1250")).toBeInTheDocument();
  expect(drawing.querySelector(".fill-chart-4")).toBeNull();
  // Zero is a tick on the zero line; a figure above zero is a bar of its own, however small.
  expect(drawing.querySelectorAll("[data-zero]").length).toBe(2);
  const small = drawing.querySelector('[data-bar="All-in cover (x) 0.04"]');
  expect(Number(small?.getAttribute("width"))).toBeGreaterThanOrEqual(3);
});

it("draws a funding-gap figure as written with the unit it states, and the row's notes", () => {
  const liquidity = entryOf("CP-2D", [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    {
      heading: "T2E.5 Funding gap",
      level: 4,
      line: 40,
      blocks: [
        table(
          42,
          ["Line", "Value", "Notes", "Source"],
          [["Funding gap", "USD 120m", "uses RCF", "T2E.5.r01"]],
        ),
      ],
    },
  ]);
  breaks([liquidity]);
  const part = within(screen.getByRole("region", { name: "Funding gap" }));
  // As written: not the gap chip, and no "unit not stated" beside a figure that states its unit.
  expect(part.getByText("USD 120m")).not.toHaveClass("border-dashed");
  expect(part.getByText("USD 120m").closest(".gap-hatch")).toBeNull();
  expect(part.queryByText(/unit not stated/)).toBeNull();
  expect(part.getByText(/horizon not stated/)).toBeInTheDocument();
  expect(part.getByText("uses RCF")).toBeInTheDocument();
  expect(part.queryByText(/T2E\.5/)).toBeNull();
});

it("opens each stress measure's own matrix row from its trace", () => {
  breaks([downside()]);
  const stress = within(screen.getByRole("group", { name: "Point-in-time stress" }));
  const cover = stress
    .getByRole("link", { name: "Source for stress, All-in cover (x)" })
    .getAttribute("href");
  const leverage = stress
    .getByRole("link", { name: "Source for stress, Net leverage (x)" })
    .getAttribute("href");
  // The table's rows sit at lines 108 and 109: each measure opens its own.
  expect(cover).toMatch(/108$/u);
  expect(leverage).toMatch(/109$/u);
});

it("names the table, not a row, where the matrix records no row line", () => {
  const entry = downside();
  const flows = entry.sections.find(
    ({ heading }) => heading === "T2DS.4 Stressed flows and metrics",
  );
  const block = flows?.blocks[0];
  if (block?.type !== "table") throw new Error("fixture");
  for (const row of block.rows) delete (row as { line?: number }).line;
  breaks([entry]);
  const stress = within(screen.getByRole("group", { name: "Point-in-time stress" }));
  expect(
    stress.getByRole("link", { name: "Source table for stress, All-in cover (x)" }),
  ).toHaveAttribute("href", expect.stringMatching(/106$/u) as string);
});

it("labels a figure with its leading multiple and keeps the module's qualification as a note", () => {
  const QUALIFIED = "4.88x; separate 2024-10-18 dividend-only pro forma 6.02x";
  const entry = downside();
  const metrics = entry.sections.find(
    (item) => item.heading === "T2DS.4 Stressed flows and metrics",
  );
  const block = metrics?.blocks[0];
  if (block?.type !== "table") throw new Error("metrics table missing");
  block.rows = [{ line: 108, cells: ["Net leverage", QUALIFIED, "6.10x", "Filing p.1"] }];
  render(
    <WhatBreaks
      view={view([entry])}
      folder="current"
      liquidity={readMeasure(
        model([value("212"), value("295"), value("397")]),
        "accessible liquidity",
        /^Accessible liquidity\b/,
      )}
      group="Base case"
      caseName="Base case"
      schedule={schedule}
      source={(name) => <button type="button">{`Show sources for ${name}`}</button>}
    />,
  );
  const stress = within(screen.getByRole("group", { name: "Point-in-time stress" }));
  const labels = [...stress.getByRole("img").querySelectorAll("text")].map(
    (item) => item.textContent,
  );
  expect(labels).toContain("4.88x");
  expect(labels).not.toContain(QUALIFIED);
  expect(stress.getByText(new RegExp(`Net leverage: ${QUALIFIED}`))).toBeInTheDocument();
});

// Verbatim rows of the replayed TDG refinancing handoff's "Funding gap" table: the Horizon row states a
// dash under Amount and its one year under Years; the Funding gap row states 0 under Amount.
it("draws the refinancing module's stated zero as 0 and no bare dash as its horizon", () => {
  const refinancing = entryOf("CP-3C", [
    findings,
    bottom("Refinancing is covered."),
    {
      heading: "Funding gap",
      level: 3,
      line: 92,
      blocks: [
        table(
          94,
          ["Line", "Amount", "Drawn", "Years", "Committed", "Currency", "Scale"],
          [
            ["Horizon", "—", "—", "1", "—", "USD", "million"],
            ["Available liquidity", "7104", "—", "1", "—", "USD", "million"],
            ["Funding gap", "0", "—", "1", "—", "USD", "million"],
          ],
        ),
      ],
    },
  ]);
  breaks([refinancing]);
  const part = within(screen.getByRole("region", { name: "Funding gap" }));
  // The horizon is the one year the Horizon row states under Years, not the dash under Amount.
  expect(
    part.getByText("Refinancing & LME: Funding gap · Years: 1 · USD million"),
  ).toBeInTheDocument();
  expect(part.queryByText(/ · — · /)).toBeNull();
  const amount = part.getByText("Amount").closest("div");
  expect(amount).toHaveTextContent("Amount0");
});
