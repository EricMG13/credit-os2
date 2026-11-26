import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { headroomTests } from "../overview/stressData";
import { bulletTable, Bullets, leadTests } from "./bullet";

afterEach(cleanup);

const HEAD = [
  "Test",
  "Threshold",
  "Current",
  "Headroom",
  "Direction",
  "Reporting unit",
  "Basis and limitation",
];
const source = (line: number, headers: string[], rows: string[][]) => ({
  line,
  headers,
  rows,
  rowLines: rows.map((_, at) => line + 2 + at),
});
const ROLES = { kind: "bullet", label: [0], threshold: 1, current: 2, headroom: 3, direction: 4 };

// The synthetic proof handoff's covenant table (proof/handoffs/CP-4.md); no real CP-4 drew one.
const TESTS = leadTests(
  source(40, HEAD, [
    ["Net leverage", "5.0", "4.2", "0.8x", "Passes at or below", "x", "Synthetic."],
    ["Interest cover", "2.0", "2.6", "0.6x", "Passes at or above", "x", "Synthetic."],
    [
      "Minimum liquidity",
      "100",
      "Not supplied: not stated",
      "Not supplied: no current",
      "Passes at or above",
      "US$m",
      "Synthetic.",
    ],
  ]),
  ROLES,
);
if (!TESTS) throw new Error("fixture tests");

it("draws each test on its own scale from zero, current against threshold, as written", () => {
  render(
    <Bullets label="Covenant tests" tests={TESTS} href={(at) => `#evidence/run/${String(at)}`} />,
  );
  const list = screen.getByRole("list", { name: "Covenant tests" });
  const [leverage, cover, liquidity] = within(list).getAllByRole("listitem");
  if (!leverage || !cover || !liquidity) throw new Error("three rows");
  expect(within(leverage).getByRole("img")).toHaveAccessibleName(
    "Net leverage: 4.2x against a threshold of 5.0x, headroom 0.8x. Passes at or below.",
  );
  expect(within(leverage).getByText("4.2x")).toBeVisible();
  expect(within(leverage).getByText("5.0x")).toBeVisible();
  expect(within(leverage).getByText("0.8x")).toBeVisible();
  for (const term of ["Current", "Threshold", "Headroom"])
    expect(within(leverage).getByText(term)).toBeVisible();
  expect(within(leverage).getByText("Passes at or below")).toBeVisible();
  expect(within(cover).getByRole("img")).toHaveAccessibleName(/2\.6x against a threshold of 2\.0x/);
  // Each row's scale is its own: the top tick of 4.2 against 5 is 5, of 2.6 against 2 is 3.
  expect(within(leverage).getByText("5x")).toBeInTheDocument();
  expect(within(cover).getByText("3x")).toBeInTheDocument();
  expect(within(leverage).getByRole("link", { name: /Source for Net leverage/ })).toHaveAttribute(
    "href",
    "#evidence/run/0",
  );
});

it("draws a gap row's stated threshold, and only its missing cells as gaps with their reasons", () => {
  render(
    <Bullets label="Covenant tests" tests={TESTS} href={(at) => `#evidence/run/${String(at)}`} />,
  );
  const liquidity = screen.getAllByRole("listitem")[2];
  if (!liquidity) throw new Error("gap row");
  // proof/handoffs/CP-4.md: threshold 100 stated; current and headroom not supplied.
  expect(within(liquidity).getByText("$100m")).toBeVisible();
  expect(within(liquidity).getAllByText("Not supplied")).toHaveLength(2);
  expect(within(liquidity).getByText("Not stated")).toBeVisible();
  expect(within(liquidity).getByText("No current")).toBeVisible();
  expect(within(liquidity).getByText("Passes at or above")).toBeVisible();
  expect(liquidity.textContent).not.toMatch(/Not supplied:/);
  expect(within(liquidity).queryByRole("img")).toBeNull();
  expect(within(liquidity).queryByText(/^0/)).toBeNull();
});

it("draws a stated current that is not one number as written, with its stated headroom", () => {
  const [test] =
    headroomTests(
      source(40, HEAD, [
        ["Net leverage", "5.0", "4.0–4.2", "0.8x", "Passes at or below", "x", "Synthetic."],
      ]),
      ROLES,
    ) ?? [];
  if (!test) throw new Error("one test");
  render(<Bullets label="Covenant tests" tests={[test]} />);
  const item = screen.getByRole("listitem");
  expect(within(item).getByText("4.0–4.2")).toBeVisible();
  expect(within(item).getByText("5.0x")).toBeVisible();
  expect(within(item).getByText("0.8x")).toBeVisible();
  expect(within(item).queryByText("Not supplied")).toBeNull();
  expect(within(item).queryByRole("img")).toBeNull();
});

it("gives the table view every cell as written, a gap as written, and one trace per row", () => {
  const view = bulletTable(TESTS, (at) => `#evidence/run/${String(at)}`);
  expect(view.head).toEqual(["Test", "Current", "Threshold", "Headroom", "Direction"]);
  expect(view.rows.map((row) => [row.label, ...row.cells])).toEqual([
    ["Net leverage", "4.2", "5.0", "0.8x", "Passes at or below"],
    ["Interest cover", "2.6", "2.0", "0.6x", "Passes at or above"],
    ["Minimum liquidity", "Not supplied: not stated", "100", null, "Passes at or above"],
  ]);
  expect(view.endHeading).toBe("Source");
});

it("draws a stated negative current from zero to its value, with every stated figure as written", () => {
  const [test] =
    headroomTests(
      source(40, HEAD, [
        ["Net worth", "100", "-20", "Not supplied: negative", "Passes above", "US$m", "Synthetic."],
      ]),
      ROLES,
    ) ?? [];
  if (!test) throw new Error("one test");
  const [read] =
    leadTests(
      source(40, HEAD, [
        ["Net worth", "100", "-20", "Not supplied: negative", "Passes above", "US$m", "Synthetic."],
      ]),
      ROLES,
    ) ?? [];
  render(<Bullets label="Covenant tests" tests={[read ?? test]} />);
  const item = screen.getByRole("listitem");
  expect(within(item).getAllByText("-$20m")[0]).toBeVisible();
  expect(within(item).getAllByText("$100m")[0]).toBeVisible();
  const bar = within(item).getByRole("img");
  expect(bar).toHaveAccessibleName(/-\$20m against a threshold of \$100m/);
  // Only the headroom is not supplied; the stated current and threshold are never marked so.
  expect(within(item).getAllByText("Not supplied")).toHaveLength(1);
  expect(within(item).getByText("Negative")).toBeVisible();
});

it("reads every drawn text of a test as a working page shows it, keeping the numbers", () => {
  const read = leadTests(
    source(40, HEAD, [
      [
        "Net leverage per credit_agreement.pdf p. 4",
        "Not supplied: see indenture.pdf p. 9",
        "4.2",
        "**0.8x**",
        "Passes at or below, as CP-4 reads it",
        "x",
        "Synthetic.",
      ],
    ]),
    ROLES,
  );
  const [test] = read ?? [];
  expect(test).toMatchObject({
    label: "A test named in Evidence",
    // The stated gap keeps its word; its reason cites a source and is in Evidence.
    threshold: { text: "Not supplied: In Evidence", value: null, reason: "In Evidence" },
    current: { text: "4.2", value: 4.2 },
    headroom: "0.8x",
  });
  expect(test?.direction).not.toContain("CP-4");
  render(<Bullets label="Covenant tests" tests={read ?? []} />);
  const list = screen.getByRole("list", { name: "Covenant tests" });
  expect(list.textContent).not.toMatch(/\.pdf|CP-4/);
});

// Review 3, P10: a reading ends with one full stop, never "n.m..".
it("ends a bullet's reading with one full stop when the headroom is n.m.", () => {
  const read = leadTests(
    source(40, HEAD, [["Net leverage", "5.0", "4.2", "n.m.", "", "x", "Synthetic."]]),
    ROLES,
  );
  render(<Bullets label="Covenant tests" tests={read ?? []} />);
  expect(screen.getByRole("img")).toHaveAccessibleName(
    "Net leverage: 4.2x against a threshold of 5.0x, headroom n.m.",
  );
});

// Review 4, Q8: a threshold at the scale's maximum sits inside the track, never past its end.
it("insets a threshold tick at either end of the scale so it never overhangs the track", () => {
  render(<Bullets label="Covenant tests" tests={TESTS} />);
  const [leverage, cover] = within(screen.getByRole("list", { name: "Covenant tests" }))
    .getAllByRole("listitem")
    .map((row) => row.querySelector<HTMLElement>("[data-threshold]"));
  // 5.0 is the top of 0 to 5: the tick's right edge is the track's end.
  expect(leverage?.style.left).toBe("100%");
  expect(leverage).toHaveClass("-translate-x-full");
  expect(leverage).not.toHaveClass("-translate-x-1/2");
  // 2.0 inside 0 to 3: centred on its value.
  expect(cover).toHaveClass("-translate-x-1/2");
});
