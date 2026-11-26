import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { RestructuringLead } from "./cp4c";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

function handoff(markdown: string, output: Record<string, unknown> = {}): OutputEntry {
  return {
    output: {
      module: "CP-4C",
      id: "run/CP-4C",
      label: "CP-4C",
      sha256: "h",
      href: "CP-4C.md",
      ...output,
    },
    sections: sectionsOf(markdown),
    selected: true,
  };
}

function lineOf(markdown: string, heading: string) {
  const section = sectionsOf(markdown).find((item) => item.heading === heading);
  const block = section?.blocks.find((item) => item.type === "table");
  if (!block) throw new Error(`no table under ${heading}`);
  return block.line;
}

const STEPS =
  "| Step | Amount | Reporting unit | Basis and limitation |\n| --- | --- | --- | --- |";
const step = (label: string, amount: string) => `| ${label} | ${amount} | US$m | Synthetic. |`;

// No CP-4C handoff exists, real or synthetic: built from the launcher's owner tables
// (src/deploy_workflow/owners/cpos_launch_tables.py, CP-4C) and the method's T4E.4 header
// (docs/reuse/selected-methods/skills/CP-4C). Synthetic values.
const RESTRUCTURING = `## Findings

### Bottom line

Synthetic: the unsecured notes are impaired in both scenarios.

### Chart data: value allocation — scenario 1

${STEPS}
${step("Enterprise value", "1,000")}
${step("Administrative claims", "-50")}
${step("First lien term loan", "-700")}
${step("Senior unsecured notes", "-250")}
${step("Value not distributed", "0")}

### Chart data: value allocation — scenario 2

${STEPS}
${step("Enterprise value", "800")}
${step("Administrative claims", "-50")}
${step("First lien term loan", "-700")}
${step("Senior unsecured notes", "-50")}
${step("Value not distributed", "0")}

### Chart data: recovery by class

| Class | Scenario | Claim | Recovery | Recovery % | Reporting unit | Basis and limitation |
| --- | --- | --- | --- | --- | --- | --- |
| First lien term loan | Scenario 1 | 700 | 700 | 100 | US$m | Single enterprise value slice. |
| Senior unsecured notes | Scenario 1 | 600 | 250 | 41.7 | US$m | Single enterprise value slice. |
| First lien term loan | Scenario 2 | 700 | 700 | 100 | US$m | Single enterprise value slice. |
| Senior unsecured notes | Scenario 2 | 600 | Not supplied: distribution not settled | Not supplied: recovery not settled | US$m | Single enterprise value slice. |

### T4E.4 — Restructuring paths

| path | process/jurisdiction | consent/vote | new money | currency and scale | class treatment | milestones | blockers | probability class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Prepackaged plan | Chapter 11, Delaware | Two-thirds of unsecured notes | USD 100 million | USD millions | Term loan reinstated; notes exchanged for equity | Filing in 60 days | None | Plausible |
`;

const allocation = (n: number) => ({
  title: `Value allocation — scenario ${String(n)}`,
  table: lineOf(RESTRUCTURING, `Chart data: value allocation — scenario ${String(n)}`),
  unit: "US$m",
  columns: [1],
  kind: "waterfall",
  amount: 1,
});

function restructuring(markdown = RESTRUCTURING, charts = [allocation(1), allocation(2)]) {
  return handoff(markdown, {
    charts: [
      ...charts,
      {
        title: "Recovery by class",
        table: lineOf(markdown, "Chart data: recovery by class"),
        kind: "recovery",
        label: 0,
        scenario: 1,
        claim: 2,
        recovery: 3,
        percent: 4,
        unit: "US$m",
        columns: [2, 3, 4],
      },
    ],
  });
}

it("draws the value allocation of the first scenario as a waterfall, steps as written", () => {
  render(<RestructuringLead {...leadProps(restructuring())} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(
    "Value allocation — scenario 1 in US$m: Enterprise value 1,000, Administrative claims -50, First lien term loan -700, Senior unsecured notes -250, Value not distributed 0.",
  );
  for (const text of ["1,000", "-50", "-700", "-250"])
    expect(within(figure).getAllByText(text).length).toBeGreaterThan(0);
  // Ruling (a): the title is the subject; the scenario is its kicker.
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(/^Value allocation$/);
  // F1, G7: the fulcrum gap says only what the page checked, in the figure's place, not a note.
  // Review 4, Q6: the kicker names the scenario only, never the title again.
  const kicker = within(tile).getByRole("heading", { level: 3 }).previousElementSibling;
  expect(kicker).toHaveTextContent(/^Scenario 1$/);
  const fulcrum = within(tile).getByText("This page could not read the fulcrum class.");
  expect(fulcrum).toBeVisible();
  expect(fulcrum.closest("li")).toBeNull();
  expect(tile.textContent).not.toMatch(/does not state the fulcrum|methodology|Needs/);
  expect(within(tile).queryByText(/fulcrum is|fulcrum:/i)).toBeNull();
});

it("switches scenarios with a pressed button group, the table following", () => {
  render(<RestructuringLead {...leadProps(restructuring())} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  const second = within(tile).getByRole("button", { name: "Scenario 2" });
  expect(within(tile).getByRole("button", { name: "Scenario 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // G12: the scenario switch and the Figure / Table switch share the tile's one control row.
  expect(within(tile).getByRole("group", { name: "Scenario" }).parentElement).toBe(
    within(tile).getByRole("group", { name: "Value allocation: figure or table" }).parentElement,
  );
  fireEvent.click(second);
  expect(second).toHaveAttribute("aria-pressed", "true");
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/Enterprise value 800/);
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "800" })).toBeVisible();
  // F15: the per-row unit and basis stay with their rows.
  expect(within(tile).getAllByRole("cell", { name: "US$m" })).toHaveLength(5);
  expect(within(tile).getAllByRole("cell", { name: "Synthetic." })).toHaveLength(5);
  expect(
    within(tile)
      .getAllByRole("link", { name: /Source for/ })
      .at(-1),
  ).toHaveAttribute("href", expect.stringContaining("#evidence/"));
});

it("reads a value allocation the store withheld from the handoff, and says it does not reconcile", () => {
  // The store publishes no descriptor for a bridge that does not reconcile; scenario 2 keeps its own.
  const broken = RESTRUCTURING.replace(
    step("Senior unsecured notes", "-250"),
    step("Senior unsecured notes", "-200"),
  );
  render(
    <RestructuringLead
      {...leadProps(
        restructuring(broken, [
          { ...allocation(2), table: lineOf(broken, "Chart data: value allocation — scenario 2") },
        ]),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Value allocation" });
  expect(within(tile).getByRole("button", { name: "Scenario 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(tile).queryByRole("img")).toBeNull();
  expect(within(tile).getByText(/does not reconcile/)).toBeVisible();
  // It says it is shown as a table, so the steps are drawn as written in the figure's place.
  const steps = within(tile).getByRole("region", { name: "Value allocation table" });
  expect(within(steps).getByRole("cell", { name: "-200" })).toBeVisible();
  expect(
    within(tile).getByRole("link", { name: "Source for Value allocation — scenario 1" }),
  ).toHaveAttribute("href", expect.stringContaining("#evidence/"));
  fireEvent.click(within(tile).getByRole("button", { name: "Scenario 2" }));
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/Enterprise value 800/);
});

it("draws claim against recovery per class and scenario, the stated recovery % and gaps", () => {
  render(<RestructuringLead {...leadProps(restructuring())} />);
  const tile = screen.getByRole("region", { name: "Recovery by class" });
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(
    "Recovery by class in US$m. First lien term loan, Scenario 1: claim 700, recovery 700, recovery 100%. First lien term loan, Scenario 2: claim 700, recovery 700, recovery 100%. Senior unsecured notes, Scenario 1: claim 600, recovery 250, recovery 41.7%. Senior unsecured notes, Scenario 2: claim 600, recovery not supplied (distribution not settled), recovery % not supplied (recovery not settled).",
  );
  expect(within(figure).getByText("41.7%")).toBeInTheDocument();
  // G7: the shared gap cell, the word and the reason, never "Recovery: Not supplied: reason".
  expect(within(figure).getAllByText("Not supplied")).toHaveLength(2);
  expect(within(figure).getByText("Distribution not settled")).toBeInTheDocument();
  expect(within(figure).getByText("Recovery not settled")).toBeInTheDocument();
  expect(figure.textContent).not.toMatch(/Not supplied: /);
  expect(within(figure).queryByText("0")).toBeNull();
  const bars = [...figure.querySelectorAll<HTMLElement>("[data-bar]")].map(
    (bar) => bar.style.width,
  );
  // One scale from zero, its top 800: 700 is 87.5%, 600 is 75%, 250 is 31.25%.
  expect(bars.slice(3)).toEqual(["87.5%", "75%", "31.25%", "75%"]);
});

it("draws the plan treatment as written, and the gaps when the module wrote none", () => {
  render(<RestructuringLead {...leadProps(restructuring())} />);
  const plan = screen.getByRole("region", { name: "Plan treatment" });
  expect(within(plan).getByText("Prepackaged plan")).toBeVisible();
  expect(within(plan).getByText("Term loan reinstated; notes exchanged for equity")).toBeVisible();
  cleanup();
  render(
    <RestructuringLead {...leadProps(handoff("## Findings\n\n### Bottom line\n\nThin.\n"))} />,
  );
  for (const [name, text] of [
    ["Value allocation", "This page could not read the value allocation."],
    ["Recovery by class", "This page could not read the recovery by class."],
    ["Plan treatment", "This page could not read the plan treatment."],
  ] as const)
    expect(within(screen.getByRole("region", { name })).getByText(text)).toBeVisible();
  // Ruling vii: no build note on the reader's page.
  expect(screen.queryByText(/Built from the module's contract/)).toBeNull();
});

it("draws nothing for a blocked module", () => {
  const { container } = render(
    <RestructuringLead
      {...leadProps(
        handoff(
          "## Findings\n\n### Bottom line\n\nNot assessable: the distress gate is not met.\n",
        ),
      )}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("puts claims in more than one unit in the table view with the reason, not on one scale", () => {
  const mixed = RESTRUCTURING.replace(
    "| Senior unsecured notes | Scenario 1 | 600 | 250 | 41.7 | US$m |",
    "| Senior unsecured notes | Scenario 1 | 600 | 250 | 41.7 | EUR m |",
  );
  render(<RestructuringLead {...leadProps(restructuring(mixed))} />);
  const tile = screen.getByRole("region", { name: "Recovery by class" });
  expect(tile.querySelectorAll("[data-bar]")).toHaveLength(0);
  expect(
    within(tile).getByText("The claims and recoveries are stated in more than one unit."),
  ).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "41.7" })).toBeVisible();
});

it("names a plan path without a name by its place", () => {
  render(
    <RestructuringLead
      {...leadProps(restructuring(RESTRUCTURING.replace("| Prepackaged plan |", "|  |")))}
    />,
  );
  const tile = screen.getByRole("region", { name: "Plan treatment" });
  expect(within(tile).getByRole("link", { name: "Source for Row 1" })).toBeVisible();
});

it("puts the scenario switch in the control row beside Figure / Table", () => {
  render(<RestructuringLead {...leadProps(restructuring())} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  expect(within(tile).getByRole("group", { name: "Scenario" }).parentElement).toBe(
    within(tile).getByRole("group", { name: "Value allocation: figure or table" }).parentElement,
  );
  fireEvent.click(within(tile).getByRole("button", { name: "Scenario 2" }));
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/Enterprise value 800/);
});

// Review 4, Q3(a) and Q5.
it("names the waterfall's tones in words and stacks recovery and plan beside it", () => {
  render(<RestructuringLead {...leadProps(restructuring())} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  // Review 6, V5: allocations to claimants, no rise in either scenario.
  for (const word of ["Opening and closing", "Allocated"])
    expect(within(tile).getByText(word)).toBeVisible();
  expect(within(tile).queryByText("Adds")).toBeNull();
  expect(within(tile).queryByText("Uses")).toBeNull();
  expect(within(tile).getByRole("img").querySelectorAll("[data-connector]").length).toBeGreaterThan(
    0,
  );
  expect(tile).toHaveClass("lg:col-span-8");
  const column = screen.getByRole("region", { name: "Recovery by class" }).parentElement;
  expect(column).toHaveClass("lg:col-span-4", "self-start");
  expect(screen.getByRole("region", { name: "Plan treatment" }).parentElement).toBe(column);
});

it("makes a value allocation that is only a gap one full row, recovery and plan beneath", () => {
  render(
    <RestructuringLead
      {...leadProps(
        handoff(
          RESTRUCTURING.replace(
            /### Chart data: value allocation[\s\S]*?(?=### Chart data: recovery)/,
            "",
          ),
        ),
      )}
    />,
  );
  expect(screen.getByRole("region", { name: "Value allocation" })).toHaveClass("lg:col-span-12");
  expect(screen.getByRole("region", { name: "Plan treatment" })).toHaveClass("lg:col-span-6");
});

// A verbatim excerpt of the replayed TDG handoff: no restructuring is activated, so every amount is
// a stated gap, scenarios 2 and 3 say they do not exist, and the fulcrum register states its gap.
const REAL = `## Findings

### Chart data: recovery by class

| Class | Scenario | Claim | Recovery | Recovery % | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Not supplied: distress gate not met | Not supplied: distress gate not met | Not supplied: distress gate not met | Not supplied: distress gate not met | Not supplied: distress gate not met | US$m; recovery percentage in % | The analysis states no recovery scenario. |

### Chart data: value allocation — scenario 1

| Step | Amount | Reporting unit | Basis and limitation |
|---|---|---|---|
| Opening enterprise value | Not supplied: distress gate not met | US$m | No source valuation row or scenario identity exists. |
| Closing undistributed value | Not supplied: distress gate not met | US$m | Costs, priority deductions and class distributions are not stated. |

### Chart data: value allocation — scenario 2

| Step | Amount | Reporting unit | Basis and limitation |
|---|---|---|---|
| Opening enterprise value | Not supplied: no second scenario | US$m | Distress gate not met; no second valuation case is supplied. |
| Closing undistributed value | Not supplied: no second scenario | US$m | No costs or class distributions are assigned. |

### Chart data: value allocation — scenario 3

| Step | Amount | Reporting unit | Basis and limitation |
|---|---|---|---|
| Opening enterprise value | Not supplied: no third scenario | US$m | Distress gate not met; no third valuation case is supplied. |
| Closing undistributed value | Not supplied: no third scenario | US$m | No costs or class distributions are assigned. |

#### T4E.6 Fulcrum range

| scenario/EV range | last covered class | first impaired class | fulcrum class/range | uncertainty | Source |
|---|---|---|---|---|---|
| Not activated: no restructuring EV range | Not supplied: no waterfall | Not supplied: no waterfall | Not supplied: no marginal value allocation | Directional subordinated exposure cannot identify the fulcrum | Refinancing & LME (CP-3C); T4E.1 |
`;

it("states the module's own gap for the fulcrum and draws one allocation when no scenario exists", () => {
  const charts = [1, 2, 3].map((n) => ({
    title: `Value allocation — scenario ${String(n)}`,
    table: lineOf(REAL, `Chart data: value allocation — scenario ${String(n)}`),
    unit: "US$m",
    columns: [1],
    kind: "waterfall",
    amount: 1,
  }));
  render(<RestructuringLead {...leadProps(handoff(REAL, { charts }))} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  expect(within(tile).getByText("No marginal value allocation")).toBeVisible();
  expect(within(tile).getAllByText("Not supplied").length).toBeGreaterThan(0);
  expect(within(tile).getAllByText("Distress gate not met")).toHaveLength(2);
  expect(tile.textContent).not.toMatch(/could not read the fulcrum/);
  // The handoff says scenarios 2 and 3 do not exist: no switch, no notice for them.
  expect(within(tile).queryByRole("group", { name: "Scenario" })).toBeNull();
  expect(screen.queryByText(/second scenario|third scenario/i)).toBeNull();
});

const FULCRUM_STEPS =
  "| Step | Amount | Reporting unit | Basis and limitation |\n| --- | --- | --- | --- |";
const fulcrumStep = (label: string, amount: string) =>
  `| ${label} | ${amount} | US$m | Synthetic. |`;

const FULCRUM_MARKDOWN = `## Findings

### Bottom line

Synthetic.

### Chart data: value allocation — scenario 1

${FULCRUM_STEPS}
${fulcrumStep("Enterprise value", "1,000")}
${fulcrumStep("First lien term loan", "-700")}
${fulcrumStep("Senior unsecured notes", "-300")}
${fulcrumStep("Value not distributed", "0")}

### Chart data: value allocation — scenario 2

${FULCRUM_STEPS}
${fulcrumStep("Enterprise value", "500")}
${fulcrumStep("First lien term loan", "-500")}
${fulcrumStep("Senior unsecured notes", "0")}
${fulcrumStep("Value not distributed", "0")}

#### T4E.6 Fulcrum range

| scenario/EV range | last covered class | first impaired class | fulcrum class/range | uncertainty | Source |
| --- | --- | --- | --- | --- | --- |
| Scenario 1, EV USD 1,000 million | First lien term loan | None | Equity holders | Wide | Synthetic |
| Scenario 2, EV USD 500 million | First lien term loan | Senior unsecured notes | Junior secured class | Wide | Synthetic |
`;

function fulcrumLineOf(heading: string) {
  const block = sectionsOf(FULCRUM_MARKDOWN)
    .find((item) => item.heading === heading)
    ?.blocks.find((item) => item.type === "table");
  if (!block) throw new Error(`no table under ${heading}`);
  return block.line;
}

const fulcrumAllocation = (n: number) => ({
  title: `Value allocation — scenario ${String(n)}`,
  table: fulcrumLineOf(`Chart data: value allocation — scenario ${String(n)}`),
  unit: "US$m",
  columns: [1],
  kind: "waterfall",
  amount: 1,
});

it("S16-1-2: labels each stated fulcrum with the scenario or value range its register row names", () => {
  const entry: OutputEntry = {
    output: {
      module: "CP-4C",
      id: "run/CP-4C",
      label: "CP-4C",
      sha256: "h",
      href: "CP-4C.md",
      charts: [fulcrumAllocation(1), fulcrumAllocation(2)],
    },
    sections: sectionsOf(FULCRUM_MARKDOWN),
    selected: true,
  };
  render(<RestructuringLead {...leadProps(entry)} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  // The chosen scenario is the first one (Scenario 1: EV 1,000; its register row states "Equity holders").
  expect(within(tile).getByText(/Equity holders/)).toBeVisible();
  // Answer key (worked from the register above): the register states two fulcrums, each for its own
  // range ("Equity holders" for scenario 1, "Junior secured class" for scenario 2). Printing the second
  // one under scenario 1's allocation is only true if it is named with its own range; the register's
  // own first cell names that range.
  const text = tile.textContent;
  const otherShown = text.includes("Junior secured class");
  const rangeNamed = text.includes("Scenario 2, EV USD 500 million");
  expect(
    otherShown && !rangeNamed,
    "scenario 2's fulcrum is shown under scenario 1, unlabelled",
  ).toBe(false);
});
