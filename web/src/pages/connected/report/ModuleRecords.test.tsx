import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RunContext } from "@/pages/library/parts/RunContext";
import {
  evidencePath,
  type OutputEntry,
  type Section,
  type Snapshot,
  type Table,
} from "../publishedReport";
import { PublishedTable, sectionTraces } from "../ReportContent";
import { traceKey } from "../reportView";
import { ModuleRecords } from "./ModuleRecords";

afterEach(cleanup);

const table = (line: number, headers: string[], rows: string[][]): Table => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const text = (line: number, value: string) => ({
  type: "text" as const,
  line,
  end: line,
  text: value,
});
const section = (heading: string, level: number, line: number, blocks: Section["blocks"] = []) => ({
  heading,
  level,
  line,
  blocks,
});

function entryOf(sections: Section[]): OutputEntry {
  return {
    selected: true,
    output: { id: "a", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
    sections,
  };
}

const REFERENCE = "10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120";
const statement = table(
  11,
  ["Line item", "FY2024", "FY2023", "Unit"],
  [
    ["Net sales", "7940", "6585", "USD millions"],
    ["Operating income", "3,463", "2,839", "USD millions"],
  ],
);
const debt = table(
  21,
  ["Instrument", "Principal", "Spread (bps)", "Maturity", "Note"],
  [
    ["Term loan I", "1,871", "275", "2028", "Secured"],
    ["Term loan J", "(3,742)", "250", "2031", REFERENCE],
    ["Revolver", "Not supplied: synthetic", "225", "2029", ""],
  ],
);
const risks = table(71, ["Risk", "Probability", "Impact"], [["Refinancing", "Low", "High"]]);
const calc = table(41, ["ID", "Result"], [["C01", "24880"]]);
const source = table(51, ["Source", "File"], [["S1", "x.pdf"]]);

const SECTIONS: Section[] = [
  section("Findings", 2, 1),
  section("Bottom line", 3, 2, [text(3, "Leverage rose.")]),
  section("T4.4 Income statement", 3, 10, [statement]),
  section("T4.18 Debt instruments", 3, 19, [text(20, "All money columns are USD millions."), debt]),
  section("T4.1 Source register", 3, 50, [source]),
  section("Risk register", 3, 70, [risks]),
  section("Calculations", 2, 40, [calc]),
];
const FOLDER = "tdg-2024";

function draw(sections: Section[] = SECTIONS) {
  const entry = entryOf(sections);
  const open = vi.fn();
  const traces = sectionTraces({ chips: {} } as Snapshot, entry, entry.sections);
  const view = render(
    <RunContext.Provider value={{ traces, open }}>
      <ModuleRecords run={{ folder: FOLDER }} entry={entry} />
    </RunContext.Provider>,
  );
  return { entry, open, ...view };
}

const openRecords = () => {
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
};
const kinds = () => within(screen.getByRole("group", { name: "Record kind" }));

it("is closed by default, stating its count, with no table drawn", () => {
  draw();
  const region = screen.getByRole("region", { name: "Statements and records" });
  expect(
    within(region).getByRole("heading", { level: 3, name: "Statements and records" }),
  ).toBeInTheDocument();
  expect(within(region).getByText("4 tables · 1 held in Evidence")).toBeInTheDocument();
  const toggle = within(region).getByRole("button", { name: "Show records" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  // The body is not drawn while closed, so the toggle points at nothing until it is open.
  expect(toggle).not.toHaveAttribute("aria-controls");
  expect(screen.queryByRole("table")).toBeNull();
  fireEvent.click(toggle);
  const controls = toggle.getAttribute("aria-controls") ?? "";
  expect(document.getElementById(controls)).not.toBeNull();
  fireEvent.click(toggle);
  expect(screen.queryByRole("group", { name: "Record kind" })).toBeNull();
});

it("opens to the kinds that hold a table, in order, with their counts", () => {
  draw();
  openRecords();
  const toggle = screen.getByRole("button", { name: "Hide records" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(document.getElementById(toggle.getAttribute("aria-controls") ?? "")).not.toBeNull();
  expect(
    kinds()
      .getAllByRole("button")
      .map((item) => item.textContent),
  ).toEqual(["Statements 2", "Registers 1", "Calculations 1"]);
  expect(kinds().getByRole("button", { name: "Statements 2" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("heading", { level: 4, name: "Income statement" })).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(screen.queryByRole("table")).toBeNull();
});

it("switches kind and table, and resets the table when the kind changes", () => {
  draw();
  openRecords();
  const tablesGroup = () => screen.getByRole("group", { name: "Table" });
  fireEvent.click(within(tablesGroup()).getByRole("button", { name: "Debt instruments" }));
  expect(screen.getByRole("heading", { level: 4, name: "Debt instruments" })).toBeInTheDocument();
  expect(screen.getByText("All money columns are USD millions.")).toBeInTheDocument();

  fireEvent.click(kinds().getByRole("button", { name: "Registers 1" }));
  expect(screen.queryByRole("group", { name: "Table" })).toBeNull();
  expect(screen.getByRole("heading", { level: 4, name: "Risk register" })).toBeInTheDocument();
  expect(screen.getByText("Refinancing")).toBeInTheDocument();

  fireEvent.click(kinds().getByRole("button", { name: "Statements 2" }));
  expect(screen.getByRole("heading", { level: 4, name: "Income statement" })).toBeInTheDocument();
  expect(within(tablesGroup()).getByRole("button", { name: "Income statement" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

it("draws a statement table with period columns as plain figures, without bars", () => {
  const { container } = draw();
  openRecords();
  expect(screen.getByText("7940")).toBeInTheDocument();
  expect(screen.getByText("3,463")).toBeInTheDocument();
  expect(container.querySelector('[style*="width"]')).toBeNull();
});

function openDebt() {
  openRecords();
  fireEvent.click(
    within(screen.getByRole("group", { name: "Table" })).getByRole("button", {
      name: "Debt instruments",
    }),
  );
  return screen.getByRole("region", { name: "Debt instruments" });
}

it("bars an amount column with the figures as written and a stated gap in words", () => {
  draw();
  const wide = openDebt();
  expect(wide).toHaveAttribute("tabindex", "0");
  expect(within(wide).getByRole("table")).toHaveAccessibleName(
    "Debt instruments · bars on one scale per column",
  );
  const rows = within(wide).getAllByRole("row");
  const first = rows.find((row) => row.textContent.includes("Term loan I"));
  const second = rows.find((row) => row.textContent.includes("Term loan J"));
  const revolver = rows.find((row) => row.textContent.includes("Revolver"));
  if (!first || !second || !revolver) throw new Error("debt rows were not drawn");
  expect(within(first).getByText("1,871")).toBeInTheDocument();
  expect(first.querySelector('[style*="width"]')).toHaveStyle({ width: "50%" });
  expect(within(second).getByText("(3,742)")).toBeInTheDocument();
  expect(second.querySelector('[style*="width"]')).toHaveStyle({ width: "100%" });
  expect(second.querySelector('[style*="width"]')).toHaveClass("bg-chart-2");
  expect(within(revolver).getByText("Not supplied: synthetic")).toBeInTheDocument();
  expect(revolver.querySelector('[style*="width"]')).toBeNull();
  expect(within(revolver).queryByText("0")).toBeNull();
  expect(within(revolver).getByLabelText("Left blank")).toHaveTextContent("—");
  expect(within(first).getByText("275")).toBeInTheDocument();
});

it("draws a source reference cell as an Evidence link, never as text", () => {
  const { entry } = draw();
  const wide = openDebt();
  expect(within(wide).queryByText(/tdg-20240930/)).toBeNull();
  expect(within(wide).getByRole("link", { name: "In Evidence" })).toHaveAttribute(
    "href",
    evidencePath(FOLDER, entry, 24),
  );
});

it("gives every row a trace control that opens the row's trace", () => {
  const { entry, open } = draw();
  const wide = openDebt();
  for (const name of ["Term loan I", "Term loan J", "Revolver"])
    expect(
      within(wide).getByRole("button", { name: `Show sources for ${name}` }),
    ).toBeInTheDocument();
  fireEvent.click(within(wide).getByRole("button", { name: "Show sources for Term loan J" }));
  expect(open).toHaveBeenCalledWith(traceKey(entry, 24));

  fireEvent.click(kinds().getByRole("button", { name: "Calculations 1" }));
  // The ID column is not drawn, so the row is named by the first column the reader sees.
  fireEvent.click(screen.getByRole("button", { name: "Show sources for 24880" }));
  expect(open).toHaveBeenLastCalledWith(traceKey(entry, 43));
});

it("lists the registers held in Evidence with links to their place", () => {
  const { entry } = draw();
  openRecords();
  const held = screen.getByRole("list", { name: "Held in Evidence" });
  expect(within(held).getByRole("link", { name: "Source register" })).toHaveAttribute(
    "href",
    evidencePath(FOLDER, entry, 50),
  );
  expect(screen.getByRole("link", { name: "Open this module in Evidence" })).toHaveAttribute(
    "href",
    evidencePath(FOLDER, entry),
  );
});

it("states the singular count and draws only the Evidence list when no table is drawn", () => {
  draw([section("Findings", 2, 1), section("T4.4 Income statement", 3, 10, [statement])]);
  expect(screen.getByText("1 table")).toBeInTheDocument();
  cleanup();
  draw([section("Findings", 2, 1), section("T4.1 Source register", 3, 50, [source])]);
  expect(screen.getByText("1 held in Evidence")).toBeInTheDocument();
  openRecords();
  expect(screen.queryByRole("group", { name: "Record kind" })).toBeNull();
  expect(screen.getByRole("link", { name: "Source register" })).toBeInTheDocument();
});

it("draws nothing when the module has no tables and nothing held in Evidence", () => {
  const { container } = draw([
    section("Findings", 2, 1),
    section("Bottom line", 3, 2, [text(3, "Leverage rose.")]),
  ]);
  expect(container).toBeEmptyDOMElement();
});

const FIXTURES = path.join(import.meta.dirname, "../../../../../tests/fixtures/live_2026_11_15");
const cellsOf = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

/** The first table under a heading of a retained handoff, as the published report parses it. */
function fixtureTable(heading: string, file = "earnings_update-CP-1-draft3-accepted.md"): Table {
  const lines = readFileSync(path.join(FIXTURES, file), "utf8").split("\n");
  const start = lines.findIndex((line) => line === `### ${heading}`);
  const at = lines.findIndex((line, index) => index > start && line.startsWith("|"));
  const rows: Table["rows"] = [];
  for (let index = at + 2; lines[index]?.startsWith("|"); index += 1)
    rows.push({ line: index + 1, cells: cellsOf(lines[index] ?? "") });
  return { type: "table", line: at + 1, headers: cellsOf(lines[at] ?? ""), rows };
}

const one = (heading: string, item: Table) => [
  section("Findings", 2, 1),
  section(heading, 3, item.line - 2, [item]),
];

describe("records tables take the mockup's form", () => {
  it("draws statement numerals mono, tabular and right-aligned, and states a single unit once", () => {
    draw(one("T4.4 Income statement", fixtureTable("T4.4 Income statement")));
    openRecords();
    const region = screen.getByRole("region", { name: "Income statement" });
    expect(within(region).getByRole("columnheader", { name: "FY2024" })).toHaveClass("text-right");
    const sales = within(region).getByRole("cell", { name: "7940" });
    expect(sales).toHaveClass("text-right", "font-mono", "tabular-nums");
    expect(within(region).getByRole("cell", { name: "NET SALES" })).not.toHaveClass("text-right");
    expect(within(region).queryByRole("columnheader", { name: "Unit" })).toBeNull();
    expect(screen.getAllByText("$m")).toHaveLength(1);
    expect(screen.getByText("$m").closest("p")).toHaveTextContent("Unit: $m");
    expect(
      within(region).getAllByRole("cell", { name: /^Not supplied: source dash$/ }),
    ).toHaveLength(2);
  });

  it("makes a four-column table a named, focusable scroll region", () => {
    draw(one("T4.13 Readiness", fixtureTable("T4.13 Readiness")));
    openRecords();
    const region = screen.getByRole("region", { name: "Readiness" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getAllByRole("columnheader")).toHaveLength(5);
  });

  it("opens a wide register on the mockup's columns, with every column one press away", () => {
    const debt = fixtureTable("T4.18 Debt instruments");
    draw(one("T4.18 Debt instruments", debt));
    openRecords();
    const region = screen.getByRole("region", { name: "Debt instruments" });
    const headers = () =>
      within(region)
        .getAllByRole("columnheader")
        .map((header) => header.textContent);
    expect(headers()).toEqual([
      "Instrument",
      "Ranking",
      "Principal",
      "Coupon or Margin",
      "Maturity",
      "Sources",
    ]);
    const toggle = screen.getByRole("button", { name: "All columns" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "All columns" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(headers()).toHaveLength(17);
    expect(headers()).toContain("Floor (bps)");
    fireEvent.click(screen.getByRole("button", { name: "All columns" }));
    expect(headers()).toHaveLength(6);
  });

  it("draws a stated gap of the compact view as a short chip, keeping its full text", () => {
    draw(one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments")));
    openRecords();
    const full = "Not supplied: full priority terms not established";
    const row = screen.getByRole("row", { name: /^Tranche I / });
    const [chip] = within(row).getAllByTitle(full);
    if (!chip) throw new Error("no chip was drawn");
    expect(within(chip).getByText("Not supplied")).toHaveAttribute("aria-hidden", "true");
    expect(within(chip).getByText(full)).toHaveClass("sr-only");
    fireEvent.click(screen.getByRole("button", { name: "All columns" }));
    const wide = screen.getByRole("row", { name: /^Tranche I / });
    expect(within(wide).queryByTitle(full)).toBeNull();
    expect(within(wide).getAllByText(full)[0]).not.toHaveClass("sr-only");
  });

  it("bars the principal across like instruments in a wide column, and states the scale once", () => {
    const { container } = draw(
      one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments")),
    );
    openRecords();
    const row = screen.getByRole("row", { name: /^Tranche J / });
    const bar = row.querySelector('[style*="width"]');
    expect(bar).not.toBeNull();
    expect(bar?.closest("td")).toHaveClass("min-w-64");
    expect(screen.getByText(/^Bars: one scale per column\./)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "All columns" }));
    const adjustment = screen.getByRole("row", { name: /^Financing cost adjustment / });
    expect(within(adjustment).getByText("-188")).toBeInTheDocument();
    // The table marks no row as a total, so the adjustment is barred like the rest, by its size.
    expect(adjustment.querySelector('[style*="width"]')).not.toBeNull();
    expect(container.querySelectorAll('[style*="width"]').length).toBeGreaterThan(1);
  });

  it("draws an aggregate control row's figures as text, out of the scale", () => {
    const file = "relative_value-CP-1-draft1.md";
    draw(one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments", file)));
    openRecords();
    const control = screen.getByRole("row", { name: /^Term loans — aggregate control/ });
    expect(within(control).getAllByText("8702").length).toBeGreaterThan(0);
    expect(control.querySelector('[style*="width"]')).toBeNull();
    const tranche = screen.getByRole("row", { name: /^Tranche J / });
    expect(tranche.querySelector('[style*="width"]')).toHaveStyle({ width: "100%" });
    // The reporting unit is one value in every row: stated once, its column not drawn.
    expect(screen.getByText("$m").closest("p")).toHaveTextContent("Currency: $m");
  });

  it("draws no bars and no scale line in a bridge", () => {
    const { container } = draw([
      section("Findings", 2, 1),
      section("Chart data: EBITDA bridge", 3, 418, [fixtureTable("Chart data: EBITDA bridge")]),
    ]);
    openRecords();
    expect(screen.getByRole("heading", { level: 4, name: "EBITDA bridge" })).toBeInTheDocument();
    expect(container.querySelector('[style*="width"]')).toBeNull();
    expect(screen.queryByText(/^Bars:/)).toBeNull();
    expect(screen.getByRole("cell", { name: "3813" })).toHaveClass("text-right");
  });

  it("chooses among more than six tables of a kind with tabs in one scrolling row", () => {
    const many = Array.from({ length: 9 }, (_, at) =>
      section(`Schedule ${String(at + 1)}`, 3, 100 + at * 10, [
        table(101 + at * 10, ["Line item", "FY2024"], [[`Line ${String(at + 1)}`, "1"]]),
      ]),
    );
    draw([section("Findings", 2, 1), ...many]);
    openRecords();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("option")).toBeNull();
    const row = screen.getByRole("region", { name: "Tables" });
    expect(row).toHaveAttribute("tabindex", "0");
    expect(row).toHaveClass("overflow-x-auto");
    const tabs = within(row).getByRole("group", { name: "Table" });
    expect(tabs).toHaveClass("flex-nowrap");
    expect(tabs).not.toHaveClass("flex-wrap");
    expect(within(tabs).getAllByRole("button")).toHaveLength(9);
    // A title stays on one line: the row scrolls rather than wrapping.
    expect(within(tabs).getByRole("button", { name: "Schedule 6" })).toHaveClass(
      "whitespace-nowrap",
    );
    expect(within(tabs).getByRole("button", { name: "Schedule 6" }).innerHTML).not.toContain(
      "whitespace-normal",
    );
    fireEvent.click(within(tabs).getByRole("button", { name: "Schedule 6" }));
    expect(screen.getByRole("heading", { level: 4, name: "Schedule 6" })).toBeInTheDocument();
    expect(screen.getByText("Line 6")).toBeInTheDocument();
  });

  it("sets the record kinds in one non-wrapping row inside a named, focusable scroll region", () => {
    draw();
    openRecords();
    const row = screen.getByRole("region", { name: "Record kinds" });
    expect(row).toHaveAttribute("tabindex", "0");
    expect(row).toHaveClass("overflow-x-auto");
    const group = within(row).getByRole("group", { name: "Record kind" });
    expect(group).toHaveClass("flex-nowrap");
    expect(group).not.toHaveClass("flex-wrap");
  });
});

describe("records tables are dense and keep their figures on one line", () => {
  it("draws tighter rows in the small text size, only for records tables", () => {
    draw(one("T4.4 Income statement", fixtureTable("T4.4 Income statement")));
    openRecords();
    const region = screen.getByRole("region", { name: "Income statement" });
    expect(within(region).getByRole("table")).toHaveClass("text-small");
    expect(within(region).getByRole("cell", { name: "7940" })).toHaveClass("py-1.5");
    expect(within(region).getByRole("columnheader", { name: "FY2024" })).toHaveClass("py-1.5");
    cleanup();
    // A caller that does not ask for the records form draws the table exactly as before.
    render(<PublishedTable table={fixtureTable("T4.4 Income statement")} heading="Plain" />);
    const plain = screen.getByRole("region", { name: "Plain" });
    expect(within(plain).getByRole("table")).toHaveClass("text-sm");
    expect(within(plain).getByRole("table")).not.toHaveClass("text-small");
    const cell = within(plain).getByRole("cell", { name: "7940" });
    expect(cell).toHaveClass("py-2.5");
    expect(cell).not.toHaveClass("whitespace-nowrap");
    expect(plain.querySelector('[class*="28ch"], [class*="12ch"]')).toBeNull();
  });

  it("wraps text cells between 12 and 28 characters and never wraps a date or a figure", () => {
    draw(one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments")));
    openRecords();
    fireEvent.click(screen.getByRole("button", { name: "All columns" }));
    const row = screen.getByRole("row", { name: /^2027 subordinated notes / });
    // Text longer than 28 characters wraps at 28 and is never squeezed below 20.
    const long = within(row).getByText("Not supplied: security not independently established");
    expect(long).toHaveClass("block", "min-w-[20ch]", "max-w-[28ch]");
    const short = within(row).getByText("Senior subordinated");
    expect(short).toHaveClass("block", "min-w-[12ch]", "max-w-[28ch]");
    expect(within(row).getByRole("cell", { name: "2027-11-15" })).toHaveClass("whitespace-nowrap");
    expect(within(row).getByRole("cell", { name: "5.50%" })).toHaveClass("whitespace-nowrap");
    // The first column holds its minimum at every width, not only where it is pinned.
    const first = within(row).getByRole("cell", { name: "2027 subordinated notes" });
    expect(first).toHaveClass("min-w-[12ch]", "sm:sticky");
  });

  it("keeps a period label such as FY2023 / 2023-09-30 on one line", () => {
    draw(one("Net debt data", fixtureTable("Net debt data")));
    openRecords();
    expect(screen.getByRole("cell", { name: "FY2023 / 2023-09-30" })).toHaveClass(
      "whitespace-nowrap",
    );
  });
});

describe("bars on records tables", () => {
  it("gives a bar column room for its bar and sets its header over the figures", () => {
    draw(one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments")));
    openRecords();
    const region = screen.getByRole("region", { name: "Debt instruments" });
    const header = within(region).getByRole("columnheader", { name: "Principal" });
    expect(header.querySelector(".text-right.w-20")).toHaveTextContent("Principal");
    const row = screen.getByRole("row", { name: /^Tranche J / });
    expect(row.querySelector('[style*="width"]')?.closest("td")).toHaveClass("min-w-64");
  });

  it("draws a small principal as a visible bar and keeps it apart from zero", () => {
    draw(one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments")));
    openRecords();
    const advances = screen.getByRole("row", { name: /^Government refundable advances / });
    expect(advances.querySelector('[style*="width"]')).toHaveStyle({ minWidth: "2px" });
  });
});

describe("reference columns", () => {
  it("drops a column that is a source reference in every row and states it once under the table", () => {
    draw(one("Post-balance-sheet adjustments", fixtureTable("Post-balance-sheet adjustments")));
    openRecords();
    const region = screen.getByRole("region", { name: "Post-balance-sheet adjustments" });
    expect(within(region).queryByRole("columnheader", { name: "Basis and limitation" })).toBeNull();
    expect(within(region).queryByRole("link", { name: "In Evidence" })).toBeNull();
    expect(screen.getAllByText("Basis and limitation: in Evidence, by row.")).toHaveLength(1);
    expect(screen.queryByText(/Annual p63/)).toBeNull();
    // The single reporting unit is still one statement in the handoff's words.
    expect(screen.getAllByText("$m")).toHaveLength(1);
    expect(screen.getByText("$m").closest("p")).toHaveTextContent("Reporting unit: $m");
    // Each row still leads to its sources.
    expect(
      within(region).getByRole("button", {
        name: "Show sources for Remaining securitization draw",
      }),
    ).toBeInTheDocument();
  });

  it("keeps a column that holds a reference in only some rows", () => {
    draw();
    const wide = openDebt();
    expect(within(wide).getByRole("columnheader", { name: "Note" })).toBeInTheDocument();
    expect(within(wide).getByRole("link", { name: "In Evidence" })).toBeInTheDocument();
    expect(screen.queryByText(/in Evidence, by row\./)).toBeNull();
  });
});

/** A phone-width screen: every `(max-width: 639px)` query matches. */
function phone() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("max-width: 639px"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}
const desktop = () => {
  // @ts-expect-error jsdom has no matchMedia; remove the stub
  delete window.matchMedia;
};

describe("a wide register at phone width", () => {
  afterEach(desktop);

  it("draws one card per row with its label, compact columns and trace control", () => {
    phone();
    const { entry, open } = draw(
      one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments")),
    );
    openRecords();
    expect(screen.queryByRole("table")).toBeNull();
    const cards = screen.getByRole("list", { name: "Debt instruments" });
    const items = within(cards).getAllByRole("listitem");
    expect(items).toHaveLength(18);
    const tranche = items.find((item) => item.textContent.startsWith("Tranche J"));
    if (!tranche) throw new Error("no card for Tranche J");
    const terms = within(tranche)
      .getAllByRole("term")
      .map((term) => term.textContent);
    expect(terms).toEqual(["Ranking", "Principal", "Coupon or Margin", "Maturity"]);
    const principal = within(tranche).getByText("Principal", { selector: "dt" });
    expect(principal.nextElementSibling).toHaveTextContent("3632");
    expect(within(tranche).getByText("3632")).toHaveClass("font-mono", "tabular-nums");
    expect(within(tranche).getByText("SOFR + 2.50%")).toBeInTheDocument();
    expect(within(tranche).getByText("2031-02-28")).toHaveClass("whitespace-nowrap");
    expect(tranche.querySelector("[style]")).toBeNull();
    fireEvent.click(within(tranche).getByRole("button", { name: "Show sources for Tranche J" }));
    const line = fixtureTable("T4.18 Debt instruments").rows[1]?.line ?? -1;
    expect(open).toHaveBeenCalledWith(traceKey(entry, line));
    // No bar is drawn in a card, so no scale is stated.
    expect(screen.queryByText(/^Bars:/)).toBeNull();
  });

  it("opens the scrolled full table from All columns", () => {
    phone();
    draw(one("T4.18 Debt instruments", fixtureTable("T4.18 Debt instruments")));
    openRecords();
    fireEvent.click(screen.getByRole("button", { name: "All columns" }));
    expect(screen.queryByRole("list", { name: "Debt instruments" })).toBeNull();
    const region = screen.getByRole("region", { name: "Debt instruments" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getAllByRole("columnheader")).toHaveLength(17);
  });

  it("keeps a register of seven or fewer columns as a table", () => {
    phone();
    draw(one("T4.4 Income statement", fixtureTable("T4.4 Income statement")));
    openRecords();
    expect(screen.getByRole("region", { name: "Income statement" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Income statement" })).toBeNull();
  });
});

describe("records states and targets", () => {
  it("names its title for the page navigator when given an anchor", () => {
    const entry = entryOf(SECTIONS);
    render(
      <RunContext.Provider value={{ traces: {}, open: vi.fn() }}>
        <ModuleRecords run={{ folder: FOLDER }} entry={entry} anchorId="module-records" />
      </RunContext.Provider>,
    );
    const anchor = document.getElementById("module-records");
    expect(anchor).toHaveAttribute("tabindex", "-1");
    expect(anchor).toHaveTextContent("Statements and records");
    expect(anchor?.closest("h3")).not.toBeNull();
    expect(screen.getByRole("region", { name: "Statements and records" })).toContainElement(
      screen.getByRole("button", { name: "Show records" }),
    );
  });

  it("says a table without rows has no rows", () => {
    draw(one("Segment schedule", table(11, ["Segment", "Revenue"], [])));
    openRecords();
    expect(screen.getByText(/This table has no rows\./)).toBeInTheDocument();
    expect(screen.queryByText(/no columns drawn/)).toBeNull();
  });

  it("says a table with rows but no column for this page has no columns drawn", () => {
    draw(one("Segment schedule", table(11, ["Source", "sha256"], [["S1", "a"]])));
    openRecords();
    expect(screen.getByText(/This table has no columns drawn on this page\./)).toBeInTheDocument();
  });

  it("makes each Evidence link itself a full-size target", () => {
    draw();
    openRecords();
    const held = screen.getByRole("list", { name: "Held in Evidence" });
    for (const link of [
      within(held).getByRole("link", { name: "Source register" }),
      screen.getByRole("link", { name: "Open this module in Evidence" }),
    ])
      expect(link).toHaveClass("min-h-8", "max-[480px]:min-h-11");
  });
});

it("draws a figure kept off the scale in the figure slot, with no bar", () => {
  const entry: OutputEntry = {
    selected: true,
    output: { id: "r/CP-1.md", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
    sections: [
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "T4.18 Debt instruments",
        level: 3,
        line: 2,
        blocks: [
          {
            type: "table",
            line: 3,
            headers: ["Instrument", "Principal"],
            rows: [
              { line: 5, cells: ["Tranche I", "1871"] },
              { line: 6, cells: ["Tranche J", "3632"] },
              { line: 7, cells: ["Term loans — aggregate control, not additive", "8702"] },
            ],
          },
        ],
      },
    ],
  };
  const traces = sectionTraces({ chips: {} } as Snapshot, entry, entry.sections);
  render(
    <RunContext.Provider value={{ traces, open: () => undefined }}>
      <ModuleRecords run={{ folder: "r" }} entry={entry} />
    </RunContext.Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
  const figure = screen.getByText("8702");
  expect(figure).toHaveClass("font-mono", "text-right");
  expect(figure.closest("td")?.querySelector("[style]")).toBeNull();
  expect(screen.getByText("3632").closest("td")?.querySelector("[style]")).not.toBeNull();
});

describe("money units are drawn as the currency's symbol (owner ruling 2026-11-26)", () => {
  it("draws each Unit cell of a mixed-unit table as its symbol, and the Evidence table as written", () => {
    const mixed = table(
      11,
      ["Line item", "FY2024", "Unit"],
      [
        ["Net sales", "7940", "USD millions"],
        ["Operating income", "3,463", "GBP millions"],
        ["Margin", "43", "%"],
      ],
    );
    draw(one("T4.4 Income statement", mixed));
    openRecords();
    const region = screen.getByRole("region", { name: "Income statement" });
    expect(within(region).getByRole("cell", { name: "$m" })).toBeVisible();
    expect(within(region).getByRole("cell", { name: "£m" })).toBeVisible();
    expect(within(region).getByRole("cell", { name: "%" })).toBeVisible();
    expect(region.textContent).not.toMatch(/USD millions|GBP millions/);
    // Evidence draws the same table through PublishedTable with no cell drawer: as written.
    cleanup();
    render(<PublishedTable table={mixed} evidence />);
    expect(screen.getByRole("cell", { name: "USD millions" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "GBP millions" })).toBeVisible();
  });
});
