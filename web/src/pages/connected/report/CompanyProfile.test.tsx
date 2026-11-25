import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { type Block, type OutputEntry, type Section } from "../publishedReport";
import { CompanyProfile } from "./CompanyProfile";
import { PublishedTraceProvider } from "./PublishedTrace";

// The business description's rules, carried over from the report header's tests when S1 moved the
// description to Business & governance (coordinator, 2026-11-25): each case below was a header case.

afterEach(cleanup);

const GAP = "Business description not in this run";
const IN_EVIDENCE = "Business description in Evidence";
const FILE = "TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl";

const table = (line: number, headers: string[], rows: string[][]): Block => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, index) => ({ line: line + 2 + index, cells })),
});
const section = (heading: string, line: number, blocks: Block[]): Section => ({
  heading,
  level: 3,
  line,
  blocks,
});
const profile = (rows: string[][]) =>
  section("Company profile", 10, [table(12, ["Field", "Detail"], rows)]);
const register = (cells: string[]) =>
  section("company_description - Register", 20, [
    table(22, ["Issuer", "Business description", "Country", "Sector"], [cells]),
  ]);

function draw(sections: Section[], { selected = true }: { selected?: boolean } = {}) {
  const entry: OutputEntry = {
    selected,
    output: {
      id: "acme/CP-1A.md",
      module: "CP-1A",
      label: "a",
      href: "",
      sha256: "a".repeat(64),
    },
    sections,
  };
  // The provider resolves the control's Evidence address to a handoff block; the trace itself is
  // read only when the control is pressed.
  return render(
    <PublishedTraceProvider snapshot={{} as never} folder="acme" entries={[entry]} route="m">
      <CompanyProfile entry={entry} folder="acme" />
    </PublishedTraceProvider>,
  ).container;
}

it("draws the description and sector exactly, with its Show sources control", () => {
  draw([
    profile([
      ["Business", "Designs and makes proprietary aircraft components."],
      ["Sector and segments", "Aerospace and defence components"],
    ]),
  ]);
  expect(screen.getByText("Designs and makes proprietary aircraft components.")).toBeVisible();
  expect(screen.getByText("Aerospace and defence components")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Show sources for Business description" }),
  ).toBeInTheDocument();
});

it("prefers the company_description register over a Company profile table", () => {
  draw([
    profile([["Business", "From the profile."]]),
    register(["Acme", "From the register.", "UK", "Industrial sector"]),
  ]);
  expect(screen.getByText("From the register.")).toBeVisible();
  expect(screen.queryByText("From the profile.")).toBeNull();
  expect(screen.getByText("Industrial sector")).toBeVisible();
});

it("draws the gap when the run holds no description", () => {
  draw([]);
  expect(screen.getByText(GAP)).toBeVisible();
  expect(screen.queryByRole("button", { name: /Show sources/ })).toBeNull();
});

it("draws the gap rather than guess between two Business rows", () => {
  draw([
    profile([
      ["Business", "First."],
      ["Business", "Second."],
    ]),
  ]);
  expect(screen.getByText(GAP)).toBeVisible();
  expect(screen.queryByText("First.")).toBeNull();
  expect(screen.queryByText("Second.")).toBeNull();
});

it("draws the description and sector through readerText", () => {
  const raw = "Makes components; see CP-2A for the downside case.";
  const sector = "Aerospace, see CP-2A";
  draw([
    profile([
      ["Business", raw],
      ["Sector and segments", sector],
    ]),
  ]);
  // Written by hand: the module's code becomes its name, every other word as stated.
  const shown = "Makes components; see Downside for the downside case.";
  expect(screen.getByText(shown).textContent).toBe(shown);
  expect(screen.getByText("Aerospace, see Downside")).toBeVisible();
});

it("C4: drops a register code the description cites, with the words that cite it", () => {
  draw([profile([["Business", "Designs components; segment detail in T4.18."]])]);
  expect(screen.getByText("Designs components; segment detail.")).toBeVisible();
  expect(document.body.textContent).not.toContain("T4.18");
});

it("C4: names Evidence where cutting the code leaves no clean sentence", () => {
  draw([profile([["Business", "Designs components described in (T4.18)."]])]);
  expect(screen.getByText(IN_EVIDENCE)).toBeVisible();
  expect(document.body.textContent).not.toContain("T4.18");
});

it("C3: on an output that is not the selected one, says where the description is shown", () => {
  draw([profile([["Business", "Makes aircraft parts."]])], { selected: false });
  expect(
    screen.getByText("The business description is shown for the selected output."),
  ).toBeVisible();
  expect(screen.queryByText(GAP)).toBeNull();
  expect(screen.queryByText("Makes aircraft parts.")).toBeNull();
});

it("draws no description text or title when the description holds a file name", () => {
  const container = draw([
    profile([["Business", `Designs aircraft components (${FILE}, page 4).`]]),
  ]);
  expect(container.innerHTML).not.toContain(FILE);
  expect(container.querySelector("[title]")).toBeNull();
  expect(screen.getByText(IN_EVIDENCE)).toBeVisible();
});

it("draws no description text when the register's description holds a register id", () => {
  const container = draw([register(["A", "Makes components; see CP-1A-FACT-004.", "US", "Aero"])]);
  expect(container.innerHTML).not.toContain("CP-1A-FACT-004");
  expect(screen.getByText(IN_EVIDENCE)).toBeVisible();
});

it("omits a sector that holds a reference", () => {
  const container = draw([profile([["Sector and segments", `Aerospace per ${FILE}`]])]);
  expect(container.innerHTML).not.toContain(FILE);
});

it("C3: draws nothing on a blocked output: the frame states the blocked module", () => {
  // As a handoff writes it: the passages under a level-2 Findings heading.
  draw([
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    section("Bottom line", 2, [
      { type: "text", line: 3, end: 3, text: "Not assessable: no filings were supplied." },
    ]),
    profile([["Business", "Makes aircraft parts."]]),
  ]);
  expect(screen.queryByText(/business description/i)).toBeNull();
  expect(screen.queryByText("Makes aircraft parts.")).toBeNull();
});

it.each([
  ["Not supplied: T4.18 shows 6.5x; T4.19 shows 5.9x.", null],
  ["Leverage excluding T4.18 items is 5.0x.", null],
  ["Debt in T4.18 is gross; debt in T4.19 is net.", null],
  ["Not in T4.18", null],
  ["Per T4.18 the covenant is not met.", null],
  ["P2.5 billion of notes mature in 2027.", "P2.5 billion of notes mature in 2027."],
])("D3: draws the description %j as %j, else its place in Evidence", (written, shown) => {
  draw([profile([["Business", written]])]);
  expect(screen.getByText(shown ?? IN_EVIDENCE)).toBeVisible();
  expect(document.body.textContent).not.toMatch(/T4\.1[89]/);
});
