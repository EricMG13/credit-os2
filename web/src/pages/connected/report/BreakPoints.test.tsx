import { fireEvent, render, screen, within } from "@testing-library/react";
import type { OutputEntry } from "../publishedReport";
import { BreakPoints, breakPointView } from "./BreakPoints";

function entry(heading: string, headers: string[], rows: string[][]): OutputEntry {
  return {
    output: { module: "CP-2A", id: "output", sha256: "hash", href: "output.md", label: "Downside" },
    selected: true,
    sections: [
      {
        heading,
        line: 1,
        level: 3,
        blocks: [
          {
            type: "table",
            line: 3,
            headers,
            rows: rows.map((cells, i) => ({ line: 5 + i, cells })),
          },
        ],
      },
    ],
  };
}

const tile = () => screen.getByRole("region", { name: "EBITDA break points" });
const items = (node: HTMLElement) => [...node.querySelectorAll("li")];

it("J3-016 gives the break-point decline one percentage form", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [["Cash flow reaches zero", "0.10 (10%)"]],
    ),
  );
  if (!data) throw new Error("Missing break-point fixture");
  render(<BreakPoints data={data} href={(line) => `#evidence/${String(line)}`} />);
  // The row's figure (the axis also ends at 10%).
  const row = within(tile()).getByRole("img").querySelector("li") as HTMLElement;
  expect(within(row).getByText("10%", { exact: true })).toBeInTheDocument();
  expect(screen.queryByText("0.10 (10%)", { exact: true })).toBeNull();
});

it("reads the canonical ranking's shares, drawing zero and keeping the original exact values", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [
        ["Cash flow reaches zero", "0.125000"],
        ["Cover already below watch level", "0"],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  render(<BreakPoints data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  const figure = within(tile()).getByRole("img");
  expect(figure).toHaveAccessibleName(
    /Cover already below watch level 0%.*Cash flow reaches zero 12\.5%/,
  );
  expect(items(figure)[0]).toHaveTextContent("Cover already below watch level");
  // A stated zero is a bar of no length on the fall-in-EBITDA axis, never a missing mark.
  const zero = figure.querySelector('[data-decline="0"]');
  expect(zero).toHaveStyle({ width: "0%" });
  // ...and it keeps a visible mark at the origin; a non-zero bar has none.
  const origins = figure.querySelectorAll("[data-origin]");
  expect(origins).toHaveLength(1);
  expect(items(figure)[0]?.contains(origins[0] ?? null)).toBe(true);
  expect(origins[0]).toHaveClass("w-1", "bg-category-3");
  // The axis ends at a round maximum at or above the largest break: 12.5% is itself one.
  expect(figure.querySelector('[data-decline="0.125"]')).toHaveStyle({ width: "100%" });
  expect(within(tile()).getByText("Fall in EBITDA")).toBeInTheDocument();
  fireEvent.click(within(tile()).getByRole("button", { name: "Table" }));
  expect(within(tile()).getByRole("cell", { name: "12.5%" })).toBeInTheDocument();
  expect(within(tile()).getByRole("cell", { name: "0%" })).toBeInTheDocument();
  expect(
    within(tile())
      .getAllByRole("link", { name: /^Source for / })
      .at(-1),
  ).toHaveAttribute("href", "#evidence/0-5");
});

it("keeps incompatible spellings visible without plotting them", () => {
  const data = breakPointView(
    entry(
      "T2B.7 First-break ranking",
      ["Rank", "Break point", "Required EBITDA decline"],
      [
        ["Rank 1", "Cover falls to 1.25x", "0.10 (90%)"],
        ["Rank 2", "FCF reaches zero", "12.50%"],
        ["Rank 3", "Liquidity dries up", "Not calculated: facility terms missing"],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  const { container } = render(<BreakPoints data={data} href={() => "#evidence"} />);
  expect(container.querySelectorAll("[data-decline]")).toHaveLength(1);
  expect(screen.getByText("0.10 (90%)")).toBeInTheDocument();
  expect(screen.getByText("Not calculated: facility terms missing")).toBeInTheDocument();
  // No row reads as a zero: only the axis says 0%.
  const list = within(tile()).getByRole("img").querySelector("ol") as HTMLElement;
  expect(within(list).queryByText("0%")).toBeNull();
});

const RETAINED_HEADERS = [
  "Break ID",
  "Break",
  "EBITDA decline at break (interest held)",
  "EBITDA decline at break (k = 0.05)",
  "Status",
  "Source",
];
const RETAINED_ROWS = [
  ["B1", "FCF reaches zero", "0.10 (10%)", "0.20 (20%)", "Calculated", "Filing p.2"],
  ["B2", "Cover reaches watch level", "0.15 (15%)", "0.12 (12%)", "Watch level", "Filing p.1"],
  ["B3", "Net leverage watch level", "0.30 (30%)", "0.25 (25%)", "Calculated", "Filing p.1"],
];

// AGENTS.md: delivery adds no analysis. A table without a module-written ranking keeps its order.
it("keeps the handoff's row order for the break points table, as a list that ranks nothing", () => {
  const data = breakPointView(entry("T2DS.6 Break points", RETAINED_HEADERS, RETAINED_ROWS));
  if (!data) throw new Error("break points were rejected");
  render(<BreakPoints data={data} href={() => "#evidence"} />);
  const basis = within(tile()).getByRole("group", { name: "Cash-interest basis" });
  expect(within(basis).getByRole("button", { name: "Interest held" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(within(basis).getByRole("button", { name: "Cash-interest increase 5%" }));
  const figure = within(tile()).getByRole("img");
  expect(figure.querySelector("ol")).toBeNull();
  const order = (nodes: Element[]) => nodes.map((node) => node.textContent.slice(0, 5));
  expect(order(items(figure))).toEqual(["FCF r", "Cover", "Net l"]);
  expect(within(figure).getByText("12%")).toBeInTheDocument();
  expect(within(figure).getByText("Watch level")).toBeInTheDocument();
  fireEvent.click(within(tile()).getByRole("button", { name: "Table" }));
  expect(order(within(tile()).getAllByRole("row").slice(1))).toEqual(["FCF r", "Cover", "Net l"]);
  expect(within(tile()).getByRole("cell", { name: "25%" })).toBeInTheDocument();
});

it("keeps drawing a module-written first-break ranking as an ordered list", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [
        ["Cash flow reaches zero", "0.125000"],
        ["Cover already below watch level", "0"],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  const { container } = render(<BreakPoints data={data} href={() => "#evidence"} />);
  expect(container.querySelector("ol")).not.toBeNull();
});

it("states when the table does not establish a comparable ranking and keeps its rows", () => {
  const data = breakPointView(
    entry(
      "T2DS.6 Break points",
      ["Break ID", "Break", "EBITDA decline at break (interest held)", "Status", "Source"],
      [["B1", "FCF reaches zero", "Not calculated: no base FCF", "Open", "Filing p.2"]],
    ),
  );
  if (!data) throw new Error("break points were rejected");
  render(<BreakPoints data={data} href={() => "#evidence/1"} />);
  expect(within(tile()).queryByRole("img")).toBeNull();
  expect(
    within(tile()).getByText("This page could not read a fall in EBITDA for each break point."),
  ).toBeInTheDocument();
  fireEvent.click(within(tile()).getByRole("button", { name: "Table" }));
  expect(within(tile()).getByRole("cell", { name: "Not calculated: no base FCF" })).toBeVisible();
  expect(within(tile()).queryByRole("cell", { name: "Filing p.2" })).toBeNull();
});

it("reads the break points under the heading the real handoffs use, header checks unchanged", () => {
  const titled = "T2DS.6 — Breakpoints with unchanged cash interest";
  const data = breakPointView(entry(titled, RETAINED_HEADERS, RETAINED_ROWS));
  expect(data?.bases.map(({ name }) => name)).toEqual([
    "Interest held",
    "Cash-interest increase 5%",
  ]);
  expect(data?.table.line).toBe(3);
  // The same heading with a header the reader does not know is still found, but draws no basis.
  const other = breakPointView(
    entry(
      titled,
      ["Break ID", "Break", "EBITDA decline at break (interest held)", "Status", "Source"],
      [["B1", "FCF reaches zero", "0.10 (10%)", "Calculated", "Filing p.2"]],
    ),
  );
  expect(other?.bases).toEqual([]);
  expect(breakPointView(entry("Breakpoints T2DS.6", RETAINED_HEADERS, RETAINED_ROWS))).toBeNull();
});

// Review 3, P10: a reading ends with one full stop, never "n.m..".
it("ends the reading with one full stop when the last value is n.m.", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [
        ["Cash flow reaches zero", "0.10"],
        ["Cover below one", "n.m."],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  render(<BreakPoints data={data} href={(line) => `#evidence/0-${String(line)}`} />);
  expect(within(tile()).getByRole("img")).toHaveAccessibleName(
    "EBITDA break points, required ebitda decline: Cash flow reaches zero 10%, Cover below one n.m.",
  );
});

// Review 4, Q3(c): the ladder's axis runs to a nice maximum above the largest stated break.
it("scales the axis to a round maximum above the largest break and says so", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [
        ["Cover reaches watch level", "15%"],
        ["Net leverage watch level", "32%"],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  render(<BreakPoints data={data} href={() => "#evidence"} />);
  const figure = within(tile()).getByRole("img");
  // 32 of 40 and 15 of 40, worked by hand.
  expect(figure.querySelector('[data-decline="0.32"]')).toHaveStyle({ width: "80%" });
  expect(figure.querySelector('[data-decline="0.15"]')).toHaveStyle({ width: "37.5%" });
  expect(within(figure).getByText("40%")).toBeInTheDocument();
  expect(within(figure).queryByText("100%")).toBeNull();
  expect(within(tile()).getByText("Fall in EBITDA")).toBeInTheDocument();
});

it("keeps a stated break above 100% as written and scales the axis to it", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [
        ["Cash flow reaches zero", "40%"],
        ["Net debt exceeds the facility", "120%"],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  render(<BreakPoints data={data} href={() => "#evidence"} />);
  const figure = within(tile()).getByRole("img");
  expect(within(figure).getByText("120%")).toBeInTheDocument();
  // 120 of 125 (ticks of 25 to 125) and 40 of 125, worked by hand.
  expect(figure.querySelector('[data-decline="1.2"]')).toHaveStyle({ width: "96%" });
  expect(figure.querySelector('[data-decline="0.4"]')).toHaveStyle({ width: "32%" });
  expect(within(tile()).getByText("Fall in EBITDA")).toBeInTheDocument();
});

// Colour-signal-build ruling R2/C6: the cash-interest basis is the case, with its colour and words.
it("draws each cash-interest basis in its own category colour, named in the legend", () => {
  const data = breakPointView(entry("T2DS.6 Break points", RETAINED_HEADERS, RETAINED_ROWS));
  if (!data) throw new Error("break points were rejected");
  const { container } = render(<BreakPoints data={data} href={() => "#evidence"} />);
  const legend = () => [...container.querySelectorAll('[data-part="legend"] li')];
  expect(legend().map((item) => item.textContent)).toEqual([
    "Fall in EBITDA at the break, interest held",
  ]);
  expect(legend()[0]).toHaveAttribute("data-legend", "dot");
  expect(legend()[0]?.querySelector("[data-swatch]")).toHaveClass("fill-category-3");
  const bars = () => [...within(tile()).getByRole("img").querySelectorAll("[data-decline]")];
  expect(bars().every((bar) => bar.classList.contains("bg-category-3"))).toBe(true);
  fireEvent.click(within(tile()).getByRole("button", { name: "Cash-interest increase 5%" }));
  expect(legend().map((item) => item.textContent)).toEqual([
    "Fall in EBITDA at the break, cash-interest increase 5%",
  ]);
  expect(legend()[0]).toHaveAttribute("data-legend", "square");
  expect(legend()[0]?.querySelector("[data-swatch]")).toHaveClass("fill-category-4");
  expect(bars().every((bar) => bar.classList.contains("bg-category-4"))).toBe(true);
  expect(bars().some((bar) => bar.classList.contains("bg-chart-1"))).toBe(false);
  expect(tile().innerHTML).not.toMatch(/better-mark|worse-mark|scale-better|scale-worse|✕/);
});

it("names the break legend without a basis when the module wrote one basis", () => {
  const data = breakPointView(
    entry(
      "T2B.7 First-break ranking",
      ["Rank", "Break point", "Required EBITDA decline"],
      [["Rank 1", "Cover falls to 1.25x", "0.10 (10%)"]],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  const { container } = render(<BreakPoints data={data} href={() => "#evidence"} />);
  expect(
    [...container.querySelectorAll('[data-part="legend"] li')].map((item) => item.textContent),
  ).toEqual(["Fall in EBITDA at the break"]);
  expect(container.querySelector("[data-decline]")).toHaveClass("bg-category-3");
});
