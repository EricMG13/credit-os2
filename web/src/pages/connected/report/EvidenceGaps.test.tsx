import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import { collectGaps, GapCounts, GapSummary, EvidenceGaps } from "./EvidenceGaps";

afterEach(cleanup);

const run = { folder: "case" } as unknown as PublishedRun;

function entry(module: string, rows: [string, string, string][], selected = true): OutputEntry {
  return {
    selected,
    output: {
      id: `${module}/h.md`,
      module,
      label: "Saved",
      href: "h.md",
      sha256: "a".repeat(64),
    },
    sections: [
      {
        heading: "Gaps",
        level: 2,
        line: 1,
        blocks: [
          {
            type: "table",
            line: 2,
            headers: ["Gap", "Severity", "Effect"],
            rows: rows.map((cells, index) => ({ line: 3 + index, cells })),
          },
        ],
      },
    ],
  };
}

const entries = [
  entry("CP-1", [
    ["Low gap", "Low", "x"],
    ["High gap", "High", "y"],
    ["Odd gap", "Critical", "z"],
  ]),
  entry("CP-2", [
    ["Another high", "High", "w"],
    ["Unstated gap", "", "v"],
  ]),
];

it("collects every gap row the handoffs wrote and filters by module", () => {
  expect(collectGaps(entries).length).toBe(5);
  expect(collectGaps(entries, "CP-2").map(({ gap }) => gap.title)).toEqual([
    "Another high",
    "Unstated gap",
  ]);
});

it("counts exactly by severity and adds Other or not stated only when something falls there", () => {
  const items = collectGaps(entries);
  render(<GapCounts items={items} />);
  const strip = within(screen.getByLabelText("Gaps by severity"));
  expect(strip.getByText("High").closest("div")).toHaveTextContent("2");
  expect(strip.getByText("Medium").closest("div")).toHaveTextContent("0");
  expect(strip.getByText("Low").closest("div")).toHaveTextContent("1");
  expect(strip.getByText("Critical").closest("div")).toHaveTextContent("1");
  expect(strip.getByText("No severity stated").closest("div")).toHaveTextContent("1");
});

it("draws only the words the gaps carry", () => {
  render(<GapCounts items={collectGaps([entry("CP-1", [["Only", "High", "x"]])])} />);
  expect(screen.queryByText("No severity stated")).toBeNull();
  expect(screen.queryByText("Critical")).toBeNull();
});

it("lists the Summary without the recorded detail, unranked words first", () => {
  render(<GapSummary run={run} entries={entries} />);
  const rows = [...document.querySelectorAll('th[scope="row"]')].map((cell) => cell.textContent);
  expect(rows).toEqual(["Odd gap", "High gap", "Another high", "Low gap", "Unstated gap"]);
  expect(screen.queryByText("Effect: y")).toBeNull();
  expect(screen.getAllByRole("link", { name: "Open handoff line" })).toHaveLength(5);
});

it("shows no counts, only the empty state, when no module wrote a gap", () => {
  render(<GapSummary run={run} entries={[]} />);
  expect(screen.queryByLabelText("Gaps by severity")).toBeNull();
  expect(screen.getByRole("heading", { name: "No gaps recorded" })).toBeVisible();
});

it("draws the recorded detail on the Gaps tab and labels an alternate handoff", () => {
  render(
    <EvidenceGaps run={run} entries={[entry("CP-1", [["G", "High", "Effect text"]], false)]} />,
  );
  expect(screen.getByText("Effect: Effect text")).toBeVisible();
  expect(screen.getByText("Financial foundation · Saved")).toBeVisible();
});

const FIXTURE = [
  "HIGH",
  "High (blocking)",
  " high ",
  "Medium-High",
  "High/Medium",
  "Critical",
  "critical",
  "Not recorded",
  "",
];

it("counts a word as High, Medium or Low only when the severity is that word", () => {
  const items = collectGaps([
    entry(
      "CP-1",
      FIXTURE.map((severity, i) => [`G${String(i)}`, severity, ""]),
    ),
  ]);
  render(<GapCounts items={items} />);
  const strip = within(screen.getByLabelText("Gaps by severity"));
  expect(strip.getByText("High").closest("div")).toHaveTextContent("3");
  expect(strip.getByText("Medium").closest("div")).toHaveTextContent("0");
  expect(strip.getByText("Low").closest("div")).toHaveTextContent("0");
  expect(strip.getByText("Medium-High").closest("div")).toHaveTextContent("1");
  expect(strip.getByText("High/Medium").closest("div")).toHaveTextContent("1");
  expect(strip.getByText("Critical").closest("div")).toHaveTextContent("2");
  expect(strip.getByText("Not recorded").closest("div")).toHaveTextContent("1");
  expect(strip.getByText("No severity stated").closest("div")).toHaveTextContent("1");
});

it("lists the words the page does not rank first, in the order written, then High, Medium, Low, then none stated", () => {
  render(
    <GapSummary
      run={run}
      entries={[
        entry(
          "CP-1",
          FIXTURE.map((severity, i) => [`G${String(i)}`, severity, ""]),
        ),
      ]}
    />,
  );
  const heads = [...document.querySelectorAll('th[scope="rowgroup"]')].map(
    (cell) => cell.textContent,
  );
  expect(heads).toEqual([
    "Medium-High1",
    "High/Medium1",
    "Critical2",
    "Not recorded1",
    "High3",
    "No severity stated1",
  ]);
});

it("keeps a written Not recorded and an empty severity as two groups with distinct keys", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <GapSummary
      run={run}
      entries={[
        entry("CP-1", [
          ["A", "Not recorded", ""],
          ["B", "", ""],
        ]),
      ]}
    />,
  );
  const heads = [...document.querySelectorAll('th[scope="rowgroup"]')].map(
    (cell) => cell.textContent,
  );
  expect(heads).toEqual(["Not recorded1", "No severity stated1"]);
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});

it("groups the qualified Highs together and shows the wording that differs", () => {
  render(
    <GapSummary
      run={run}
      entries={[
        entry("CP-1", [
          ["C", "High (blocking)", ""],
          ["A", "HIGH", ""],
        ]),
      ]}
    />,
  );
  expect(
    [...document.querySelectorAll('th[scope="rowgroup"]')].map((cell) => cell.textContent),
  ).toEqual(["High2"]);
  expect(screen.getByText("Severity as written: High (blocking)")).toBeVisible();
  expect(screen.getByText("Severity as written: HIGH")).toBeVisible();
});

it("draws no High, Medium or Low count as a fact when no gap states a rank", () => {
  render(
    <GapCounts
      items={collectGaps([
        entry("CP-1", [
          ["A", "", ""],
          ["B", "Critical", ""],
        ]),
      ])}
    />,
  );
  const strip = within(screen.getByLabelText("Gaps by severity"));
  expect(strip.queryByText("High")).toBeNull();
  expect(strip.getByText("Critical").closest("div")).toHaveTextContent("1");
});

it("names the order it draws", () => {
  render(<GapSummary run={run} entries={entries} />);
  expect(screen.getByRole("table")).toHaveAccessibleName(
    /then High, Medium, Low, then those with none stated/,
  );
});
