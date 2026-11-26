import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { evidencePath } from "../../publishedReport";
import { StructureRow } from "./StructureRow";
import { entry, rowProps, section, table } from "./rows.fixture";
import { wallGeometry, wallWidth } from "./structureData";

afterEach(cleanup);

const BASIS = ["Reporting unit", "Basis and limitation"];

function foundation(maturities: string[][], stack: string[][]) {
  return entry(
    "CP-1",
    [
      { title: "Debt maturities", table: 10, unit: "US$m", columns: [1] },
      {
        title: "Debt stack",
        table: 30,
        kind: "stack",
        label: 0,
        rank: 1,
        secured: 2,
        amount: 3,
        leverage: 4,
        unit: "US$m",
      },
    ],
    [
      section(
        "Chart data: debt maturities",
        9,
        table(10, ["Period", "Debt maturing", ...BASIS], maturities),
      ),
      section(
        "Chart data: debt stack",
        29,
        table(
          30,
          ["Facility", "Ranking", "Secured", "Amount", "Cumulative leverage", ...BASIS],
          stack,
        ),
      ),
    ],
  );
}

const STACK = [
  ["Senior notes", "2", "No", "800", "4.0", "US$m", "Unaudited."],
  ["Term loan", "1", "Yes", "1,200", "2.4", "US$m", "Unaudited."],
  [
    "Subordinated notes",
    "3",
    "No",
    "Not supplied: balance not stated",
    "Not supplied: no balance",
    "US$m",
    "Unaudited.",
  ],
];

const height = (element?: Element | null) => Number(element?.getAttribute("height"));
const left = (element?: Element | null) => Number(element?.getAttribute("x"));

it("draws each maturity bar in proportion to its amount and a stated gap as a gap, not a bar", () => {
  const { container } = render(
    <StructureRow
      {...rowProps([
        foundation(
          [
            ["FY2026", "500", "US$m", "Unaudited."],
            ["FY2027", "Not supplied: the schedule stops here", "US$m", "Unaudited."],
            ["FY2028", "1,250", "US$m", "Unaudited."],
          ],
          STACK,
        ),
      ])}
    />,
  );
  const wall = screen.getByRole("region", { name: "Maturity wall" });
  const near = wall.querySelector('[data-bar="FY2026"]');
  const far = wall.querySelector('[data-bar="FY2028"]');
  expect(height(far) / height(near)).toBeCloseTo(1250 / 500, 6);
  expect(wall.querySelector('[data-bar="FY2027"]')).toBeNull();
  expect(wall.querySelector('[data-gap="FY2027"]')).not.toBeNull();
  expect(within(wall).getByText("FY2027: the schedule stops here.")).toBeVisible();
  expect(within(wall).getByText("1,250")).toBeInTheDocument();
  expect(within(wall).getByText("Unaudited.")).toBeVisible();
  expect(within(wall).getByRole("img").getAttribute("aria-label")).toBe(
    "Debt maturing by period, $m: FY2026 500, FY2027 not supplied, FY2028 1,250.",
  );
  expect(container.querySelector("[data-axis-break]")).toBeNull();
  expect(within(wall).getByRole("link", { name: "Source for the maturity wall" })).toHaveAttribute(
    "href",
    expect.stringContaining("/report/run#evidence/"),
  );
});

it("keeps a year the schedule has no row for on the axis, and sets an undated bucket after a break", () => {
  render(
    <StructureRow
      {...rowProps([
        foundation(
          [
            ["Thereafter", "900", "US$m", ""],
            ["FY2028", "300", "US$m", ""],
            ["FY2026", "600", "US$m", ""],
          ],
          STACK,
        ),
      ])}
    />,
  );
  const wall = screen.getByRole("region", { name: "Maturity wall" });
  expect(wall.querySelector('[data-gap="FY2027"]')).not.toBeNull();
  expect(within(wall).getByText("No row")).toBeInTheDocument();
  const [first, second, third] = ["FY2026", "FY2028", "Thereafter"].map((label) =>
    wall.querySelector(`[data-bar="${label}"]`),
  );
  // Two years apart is twice one slot; the undated bucket sits one slot and the break further on.
  const slot = (left(second) - left(first)) / 2;
  expect(left(third) - left(second)).toBeGreaterThan(slot + 30);
  expect(wall.querySelector("[data-axis-break]")).not.toBeNull();
});

it("stacks the debt in rank order with segment heights in proportion, and no segment for a missing balance", () => {
  render(<StructureRow {...rowProps([foundation([["FY2026", "500", "US$m", ""]], STACK)])} />);
  const tile = screen.getByRole("region", { name: "Capital structure by rank" });
  const loan = tile.querySelector('[data-segment="Term loan"]');
  const notes = tile.querySelector('[data-segment="Senior notes"]');
  // Each segment is drawn one pixel short, so the tile shows between them.
  expect((height(loan) + 1) / (height(notes) + 1)).toBeCloseTo(1200 / 800, 6);
  expect(Number(loan?.getAttribute("y"))).toBeLessThan(Number(notes?.getAttribute("y")));
  expect(tile.querySelector('[data-segment="Subordinated notes"]')).toBeNull();
  expect(tile.querySelector('[data-gap="Subordinated notes"]')).not.toBeNull();
  expect(within(tile).getByText("Not supplied: balance not stated")).toBeVisible();
  expect([...(tile.querySelector("ol")?.children ?? [])].map((item) => item.textContent)).toEqual([
    expect.stringContaining("Term loan"),
    expect.stringContaining("Senior notes"),
    expect.stringContaining("Subordinated notes"),
  ]);
  expect(within(tile).getByText("Secured · 2.4x cumulative leverage")).toBeVisible();
});

it("says why when the run has no financial foundation, and draws no figure", () => {
  render(<StructureRow {...rowProps([])} />);
  for (const name of ["Maturity wall", "Capital structure by rank"]) {
    const tile = screen.getByRole("region", { name });
    expect(within(tile).getByText("Financial foundation did not run in this run.")).toBeVisible();
    expect(within(tile).queryByRole("img")).toBeNull();
  }
});

it("draws the gap when no period states an amount", () => {
  render(
    <StructureRow
      {...rowProps([
        foundation(
          [["FY2026", "Not supplied: no schedule", "US$m", ""]],
          [["Term loan", "1", "Yes", "Not supplied: no balance", "", "US$m", ""]],
        ),
      ])}
    />,
  );
  expect(screen.getByText("The maturity schedule states no amount for any period.")).toBeVisible();
  expect(screen.getByText("The debt stack states no amount for any facility.")).toBeVisible();
  expect(screen.queryByRole("img")).toBeNull();
});

it("draws the wall at the frame's own width, widened to keep each period's room only on a narrow screen", () => {
  expect(wallWidth(null)).toBe(872);
  // Above the narrow threshold the wall fits its frame: drawn at the frame's own width.
  expect(wallWidth(600)).toBe(600);
  expect(wallWidth(342.4)).toBe(342);
  expect(wallWidth(200)).toBe(300);
  // Eleven periods of 56 px each, plus a 16 px margin either side: 648 px.
  expect(wallWidth(342, 11)).toBe(648);
  expect(wallWidth(342, 3)).toBe(342);
  expect(wallWidth(700, 11)).toBe(700);
  const slots = [
    { label: "FY2026", cell: { text: "500", value: 500, reason: null } },
    { label: "FY2027", cell: { text: "1,250", value: 1250, reason: null } },
  ];
  const narrow = wallGeometry(slots, [], 342);
  expect(narrow.marks.at(-1)?.centre).toBeLessThan(342);
  expect(wallGeometry(slots as never, [], 872).marks.at(-1)?.centre).toBeGreaterThan(600);
});

const wallOf = (rows: string[][], stack: string[][] = STACK) => {
  const found = foundation(rows, stack);
  render(<StructureRow {...rowProps([found])} />);
  return { found, wall: screen.getByRole("region", { name: "Maturity wall" }) };
};

it("draws a gap reason in the module's words, codes named, and links a cited reason to Evidence", () => {
  const { found, wall } = wallOf([
    ["FY2026", "500", "US$m", ""],
    ["FY2027", "Not supplied: CP-1 gap G12 in notes_2024.pdf page 88 [E3].", "US$m", ""],
    ["FY2028", "Not supplied: CP-1C did not reconcile the schedule", "US$m", ""],
  ]);
  expect(wall).not.toHaveTextContent(/notes_2024|G12|E3|CP-1/);
  expect(
    within(wall).getByText("FY2028: Peer benchmark did not reconcile the schedule."),
  ).toBeVisible();
  expect(within(wall).getByRole("link", { name: "Read the reason in Evidence" })).toHaveAttribute(
    "href",
    evidencePath("run", found, 13),
  );
});

it("draws a stack note in the module's words and links a cited one to Evidence", () => {
  const found = foundation(
    [["FY2026", "500", "US$m", ""]],
    [
      ["Term loan", "1", "Yes", "1,200", "2.4", "US$m", ""],
      ["Notes", "2", "No", "Not supplied: see notes_2024.pdf page 12", "", "US$m", ""],
      ["Bridge", "3", "No", "Not supplied: CP-1C did not reconcile it", "", "US$m", ""],
    ],
  );
  render(<StructureRow {...rowProps([found])} />);
  const tile = screen.getByRole("region", { name: "Capital structure by rank" });
  expect(tile).not.toHaveTextContent(/notes_2024|page 12|CP-1C/);
  expect(within(tile).getByText("Not supplied: Peer benchmark did not reconcile it")).toBeVisible();
  expect(within(tile).getByRole("link", { name: "Read the reason in Evidence" })).toHaveAttribute(
    "href",
    evidencePath("run", found, 33),
  );
});

it("draws a stated zero as a figure, never as the gap, and prints a leverage cell as written", () => {
  const { wall } = wallOf(
    [
      ["FY2026", "500", "US$m", ""],
      ["FY2027", "0", "US$m", ""],
    ],
    [
      ["Term loan", "1", "Yes", "1,200", "2.4", "US$m", ""],
      ["Revolver", "2", "Yes", "0", "2.4x", "US$m", ""],
      ["Senior notes", "3", "No", "800", "4.0x", "US$m", ""],
    ],
  );
  expect(wall.querySelector('[data-gap="FY2027"]')).toBeNull();
  expect(wall.querySelector('[data-bar="FY2027"]')).not.toBeNull();
  expect(within(wall).getByText("0")).toBeInTheDocument();
  expect(within(wall).getByRole("img").getAttribute("aria-label")).toBe(
    "Debt maturing by period, $m: FY2026 500, FY2027 0.",
  );
  const tile = screen.getByRole("region", { name: "Capital structure by rank" });
  expect(tile.querySelector('[data-gap="Revolver"]')).toBeNull();
  expect(tile.querySelector('[data-segment="Revolver"]')).not.toBeNull();
  expect(within(tile).getByText("0")).toBeVisible();
  expect(within(tile).getByText("Not secured · 4.0x cumulative leverage")).toBeVisible();
  expect(tile).not.toHaveTextContent("xx");
});

it("sets a bucket with no single year after the axis break, its label as written", () => {
  const { wall } = wallOf([
    ["FY2026", "500", "US$m", ""],
    ["2029+", "400", "US$m", ""],
    ["≥2030", "300", "US$m", ""],
    [">2030", "200", "US$m", ""],
    ["&gt;2030", "150", "US$m", ""],
    ["2030 and after", "100", "US$m", ""],
  ]);
  for (const label of ["2029+", "≥2030", ">2030", "&gt;2030", "2030 and after"]) {
    // Matched by attribute value: a selector string cannot hold every label as written.
    const bars = [...wall.querySelectorAll("[data-bar]")];
    expect(bars.find((bar) => bar.getAttribute("data-bar") === label)).toHaveAttribute(
      "fill",
      "url(#wall-undated)",
    );
    expect(within(wall).getByText(label)).toBeInTheDocument();
  }
  expect(wall.querySelector('[data-bar="FY2026"]')).not.toHaveAttribute("fill");
  expect(wall.querySelector("[data-gap]")).toBeNull();
  expect(wall.querySelector("[data-axis-break]")).not.toBeNull();
});

it("draws both rows the schedule gives for one year, with unique keys", () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const { wall } = wallOf(
    [
      ["FY2026", "500", "US$m", ""],
      ["FY2026", "700", "US$m", ""],
      ["FY2027", "300", "US$m", ""],
    ],
    [
      ["Notes", "1", "Yes", "1,200", "", "US$m", ""],
      ["Notes", "2", "No", "800", "", "US$m", ""],
    ],
  );
  expect(wall.querySelectorAll('[data-bar="FY2026"]')).toHaveLength(2);
  expect(within(wall).getByText("700")).toBeInTheDocument();
  expect(within(wall).getByRole("img").getAttribute("aria-label")).toBe(
    "Debt maturing by period, $m: FY2026 500, FY2026 700, FY2027 300.",
  );
  const tile = screen.getByRole("region", { name: "Capital structure by rank" });
  expect(tile.querySelectorAll('[data-segment="Notes"]')).toHaveLength(2);
  expect(errors.mock.calls.flat().join(" ")).not.toMatch(/same key/);
  errors.mockRestore();
});

it("reads a year with no row as the label draws it, and a gap in the module's own word", () => {
  const { wall } = wallOf([
    ["FY2026", "500", "US$m", ""],
    ["FY2028", "Not calculated: the model did not run", "US$m", ""],
  ]);
  expect(within(wall).getByText("No row")).toBeInTheDocument();
  expect(within(wall).getByText("in the schedule")).toBeInTheDocument();
  expect(within(wall).getByText("Not calculated")).toBeInTheDocument();
  expect(within(wall).queryByText("Not supplied")).toBeNull();
  expect(within(wall).getByRole("img").getAttribute("aria-label")).toBe(
    "Debt maturing by period, $m: FY2026 500, FY2027 no row in the schedule, FY2028 not calculated.",
  );
});

// Round 2 review: N5, N6, N11.

it("draws a wall cell with no figure through the reader rule, on the mark and in the reading", () => {
  const { wall } = wallOf([
    ["FY2026", "500", "US$m", ""],
    ["FY2027", "see notes_2024.pdf page 88", "US$m", ""],
  ]);
  expect(wall).not.toHaveTextContent(/notes_2024|page 88/);
  expect(within(wall).getByRole("img").getAttribute("aria-label")).toBe(
    "Debt maturing by period, $m: FY2026 500, FY2027 no figure.",
  );
  expect(within(wall).getByText("No figure", { selector: "tspan" })).toBeInTheDocument();
  expect(within(wall).getByRole("link", { name: "Read the reason in Evidence" })).toBeVisible();
});

it("draws wall and stack labels, and basis notes, through the reader rule", () => {
  const { wall } = wallOf(
    [
      [
        "FY2026 (credit_agreement.pdf page 3)",
        "500",
        "US$m",
        "Unaudited; see notes_2024.pdf page 9",
      ],
      ["FY2027", "300", "US$m", ""],
    ],
    [
      ["Term loan (credit_agreement.pdf page 3)", "1", "Yes", "1,200", "2.4", "US$m", ""],
      ["Senior notes", "2", "No", "800", "4.0", "US$m", ""],
    ],
  );
  expect(wall).not.toHaveTextContent(/credit_agreement|notes_2024|page 3|page 9/);
  expect(within(wall).getByText("FY2026")).toBeInTheDocument();
  // A dated label stays on the year axis once its citation is set aside.
  expect(wall.querySelector("[data-axis-break]")).toBeNull();
  expect(within(wall).getByRole("link", { name: "Read the reason in Evidence" })).toBeVisible();
  const tile = screen.getByRole("region", { name: "Capital structure by rank" });
  expect(tile).not.toHaveTextContent(/credit_agreement|page 3/);
  expect(within(tile).getByText("Term loan")).toBeVisible();
});

it("draws a stated gap in the stack's cumulative leverage with its reason", () => {
  wallOf(
    [["FY2026", "500", "US$m", ""]],
    [
      ["Term loan", "1", "Yes", "1,200", "Not calculated: no EBITDA for the year", "US$m", ""],
      ["Senior notes", "2", "No", "800", "4.0", "US$m", ""],
    ],
  );
  const tile = screen.getByRole("region", { name: "Capital structure by rank" });
  expect(
    within(tile).getByText("Secured · Cumulative leverage not calculated: no EBITDA for the year"),
  ).toBeVisible();
});
