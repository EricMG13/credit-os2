import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { DownsideLead } from "./cp2a";
import { bottomLine, leadProps, tableSection } from "./lead.fixture";
import { fixtureEntry, retained } from "./markdown.fixture";

afterEach(cleanup);

// The synthetic proof handoff (proof/handoffs/CP-2A.md): written to the readers' exact shapes.
const proof = () => fixtureEntry("CP-2A", retained("..", "..", "proof", "handoffs", "CP-2A.md"));

it("draws the break-point ladder in authored order on the fall-in-EBITDA axis, with the basis choice", () => {
  render(<DownsideLead {...leadProps(proof())} />);
  const ladder = screen.getByRole("region", { name: "EBITDA break points" });
  expect(ladder.className).toMatch(/lg:col-span-8/);
  const figure = within(ladder).getByRole("img");
  expect(figure).toHaveAccessibleName(
    /FCF reaches zero 10%.*Cover reaches watch level 15%.*Net leverage watch level 32%/,
  );
  // Review 4, Q3(c): the axis runs to a nice maximum above the largest break (32% → 40%) and says so.
  expect(figure.querySelector('[data-decline="0.32"]')).toHaveStyle({ width: "80%" });
  expect(within(ladder).getByText("Fall in EBITDA")).toBeVisible();
  // Review 4, Q5: the scenarios sit in the column beside the ladder, not under a hole.
  const column = screen.getByRole("region", { name: "Downside scenarios" }).parentElement;
  expect(column).toHaveClass("lg:col-span-4", "flex-col");
  expect(within(figure).getByText("Analyst watch level, not a covenant")).toBeInTheDocument();
  fireEvent.click(within(ladder).getByRole("button", { name: "Cash-interest increase 5%" }));
  const shocked = within(ladder).getByRole("img");
  expect(shocked.querySelectorAll("[data-decline]")).toHaveLength(2);
  expect(within(shocked).getByText("Not calculated: net debt is missing")).toBeInTheDocument();
  expect(within(shocked.querySelector("ul") as HTMLElement).queryByText("0%")).toBeNull();
  expect(within(ladder).getByRole("link", { name: /^Source for / })).toHaveAttribute(
    "href",
    expect.stringContaining("#evidence/"),
  );
});

it("compares every case on each measure, lists the measure it cannot place, and keeps the table", () => {
  render(<DownsideLead {...leadProps(proof())} />);
  const tile = screen.getByRole("region", { name: "Downside scenarios" });
  expect(tile.className).toMatch(/lg:col-span-4/);
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(
    /All-in cover \(x\): Control \(unstressed\) \(control\) 3\.10, Cost shock 2\.00, Cost and rate shock 1\.40/,
  );
  expect(within(figure).getByText("-5.1250 (−USD 5.13 million)")).toBeInTheDocument();
  expect(within(figure).queryByText(/Net leverage/)).toBeNull();
  const note = within(tile).getByText("Net leverage (x) is not drawn.")
    .parentElement as HTMLElement;
  expect(note).toHaveTextContent(
    "Net leverage (x) is not drawn.Cost and rate shockNot calculatedNet debt is missing",
  );
  expect(within(note).getByText("Not calculated")).toHaveClass("border-dashed");
  expect(tile.textContent).not.toMatch(/: Not calculated:/);
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(
    within(tile).getByRole("cell", { name: "Not calculated: net debt is missing" }),
  ).toBeVisible();
  expect(within(tile).queryByRole("cell", { name: "Filing p.1" })).toBeNull();
});

it("draws the gaps truthfully on the retained real T2DS.1 tables, where the readers bind nothing", () => {
  // Outdated evidence: TransDigm as of 2024-09-30, runs sol-high-001-resume and sol-001-resume.
  for (const file of ["CP-2A-T2DS.1.md", "CP-2A-T2DS.1-sol-001.md"]) {
    const real = fixtureEntry("CP-2A", retained("tdg_sol_high_2026_11_13", file));
    render(<DownsideLead {...leadProps(real)} />);
    const ladder = screen.getByRole("region", { name: "EBITDA break points" });
    expect(within(ladder).getByText("This page could not read the break points.")).toBeVisible();
    expect(ladder.textContent).not.toMatch(/methodology|Needs/);
    const scenarios = screen.getByRole("region", { name: "Downside scenarios" });
    expect(
      within(scenarios).getByText("This page could not read the stressed metrics by scenario."),
    ).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByText("0%")).toBeNull();
    // Review 4, Q5: a first tile that is only a gap spans the row; the scenarios take the next.
    expect(ladder.className).toMatch(/lg:col-span-12/);
    expect(scenarios.className).toMatch(/lg:col-span-12/);
    cleanup();
  }
});

it("draws nothing for a blocked module", () => {
  const stopped = entry(
    "CP-2A",
    [],
    bottomLine("Not assessable: no financial base was supplied. Rest of the line."),
  );
  const { container } = render(<DownsideLead {...leadProps(stopped)} />);
  expect(container).toBeEmptyDOMElement();
});

it("says it could not read the tables the real headings carry, and traces each one", () => {
  // The real titles (sol medium run, outdated) with a header these readers do not bind.
  const made = entry(
    "CP-2A",
    [],
    [
      tableSection(
        "T2DS.6 — Breakpoints with unchanged cash interest",
        table(30, ["Break", "EBITDA decline at break", "Source"], [["FCF zero", "45.05%", "C1"]]),
      ),
      tableSection(
        "T2DS.4 — Stressed metrics",
        table(40, ["Scenario", "Net leverage", "Source"], [["s01", "7.07x", "C2"]]),
      ),
    ],
  );
  render(<DownsideLead {...leadProps(made)} />);
  const ladder = screen.getByRole("region", { name: "EBITDA break points" });
  // Review 4, Q8: the reader's words, never "table".
  expect(within(ladder).getByText("This page could not read the break points.")).toBeVisible();
  expect(
    within(ladder).getByRole("link", { name: "Source for EBITDA break points" }),
  ).toHaveAttribute("href", expect.stringMatching(/#evidence\/.*30/));
  const scenarios = screen.getByRole("region", { name: "Downside scenarios" });
  expect(
    within(scenarios).getByText("This page could not read the stressed metrics by scenario."),
  ).toBeVisible();
  expect(document.body.textContent).not.toMatch(/prose|one column per scenario|table\./);
});

it("draws the ladder from the real T2DS.6 heading when its header is the reader's", () => {
  const made = proof();
  const section = made.sections.find((item) => item.heading === "T2DS.6 Break points");
  if (!section) throw new Error("proof break points missing");
  section.heading = "T2DS.6 — Breakpoints with unchanged cash interest";
  render(<DownsideLead {...leadProps(made)} />);
  const ladder = screen.getByRole("region", { name: "EBITDA break points" });
  expect(within(ladder).getByRole("img")).toHaveAccessibleName(/FCF reaches zero 10%/);
});

// Review 3, P3: the frame states an unreadable handoff once; the lead draws nothing.
it("draws nothing for a handoff the store could not read, and words a wrong module's handoff", () => {
  const broken = proof();
  broken.output.parseError = "the handoff ended inside a table";
  const { container } = render(<DownsideLead {...leadProps(broken)} />);
  expect(container).toBeEmptyDOMElement();
  cleanup();
  const other = entry("CP-2D", [], []);
  render(<DownsideLead {...leadProps(other)} />);
  expect(screen.getByText("This page could not read the break points.")).toBeVisible();
});

it("puts each tile's own choice and its Figure / Table switch in one control row", () => {
  render(<DownsideLead {...leadProps(proof())} />);
  const scenarios = screen.getByRole("region", { name: "Downside scenarios" });
  const cases = within(scenarios).getByRole("group", {
    name: "Stress case to compare with the unstressed control",
  });
  const views = within(scenarios).getByRole("group", {
    name: "Downside scenarios: figure or table",
  });
  expect(cases.parentElement).toBe(views.parentElement);
  expect(within(scenarios).getByRole("heading", { level: 3 })).toHaveTextContent(
    /^Downside scenarios$/,
  );
  const ladder = screen.getByRole("region", { name: "EBITDA break points" });
  const basis = within(ladder).getByRole("group", { name: "Cash-interest basis" });
  const switch_ = within(ladder).getByRole("group", {
    name: "EBITDA break points: figure or table",
  });
  expect(basis.parentElement).toBe(switch_.parentElement);
  expect(within(ladder).getAllByRole("group")).toHaveLength(2);
});
