import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Modules } from "./Modules";

type View = ReturnType<typeof buildReportView>;
type Sections = OutputEntry["sections"];

const text = (heading: string, line: number): Sections[number] => ({
  heading,
  level: 3,
  line,
  blocks: [{ type: "text", line: line + 1, end: line + 1, text: `${heading} says so.` }],
});

const FINANCIALS: Sections[number] = {
  heading: "Financials and credit metrics",
  level: 3,
  line: 10,
  blocks: [
    {
      type: "table",
      headers: ["Metric", "FY2026", "Unit"],
      line: 11,
      rows: [{ line: 12, cells: ["Net debt", "100", "US$m"] }],
    },
  ],
};

function renderModules(sections: Sections) {
  const entry: OutputEntry = {
    selected: true,
    output: { id: "a", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
    sections: [{ heading: "Findings", level: 2, line: 1, blocks: [] }, ...sections],
  };
  const view: View = {
    entries: [entry],
    modules: [
      { id: "CP-2", name: "Credit analysis", state: "Delivered", outputs: [] },
      { id: "CP-1", name: "Financial foundation", state: "Delivered", outputs: [entry] },
    ],
    catalogue: undefined,
    lead: undefined,
    models: [],
  };
  return render(
    <Modules
      view={view}
      run={{ folder: "case", issuer: "Issuer", asOf: "2026-10-31" } as PublishedRun}
      snapshot={{ chips: {} } as Snapshot}
    />,
  );
}

const records = () => within(screen.getByRole("region", { name: "Statements and records" }));
const openRecords = () => {
  fireEvent.click(records().getByRole("button", { name: "Show records" }));
};

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

it("groups the modules by stage and marks the current one", () => {
  renderModules([text("Bottom line", 4), FINANCIALS]);
  const nav = within(screen.getByRole("navigation", { name: "Modules in this run" }));
  expect(nav.getAllByRole("heading", { level: 3 }).map((node) => node.textContent)).toEqual([
    "Financials",
    "Credit",
  ]);
  expect(nav.getByRole("link", { name: "Financial foundation, Delivered" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const other = nav.getByRole("link", { name: "Credit analysis, Delivered" });
  expect(other).not.toHaveAttribute("aria-current");
  expect(other).toHaveAttribute("href", "#modules/CP-2");
  // The current module lists its own sections under its link; no other module does.
  const sections = nav.getByRole("list", { name: "On this page" });
  expect(within(sections).getByRole("button", { name: "Bottom line" })).toBeInTheDocument();
  expect(other.parentElement?.querySelector("[aria-label='On this page']")).toBeNull();
});

it("names the first table section by its own title when the module wrote no Key findings", () => {
  renderModules([text("Bottom line", 4), FINANCIALS]);
  expect(screen.queryByRole("region", { name: "Key findings" })).toBeNull();
  openRecords();
  expect(
    records().getByRole("heading", { name: "Financials and credit metrics", level: 4 }),
  ).toBeInTheDocument();
});

it("keeps the Key findings region on a module that wrote them, with the table in the records", () => {
  renderModules([text("Bottom line", 4), text("Key findings", 6), FINANCIALS]);
  expect(screen.getByRole("region", { name: "Key findings" })).toHaveTextContent(
    "Key findings says so.",
  );
  openRecords();
  expect(
    records().getByRole("heading", { name: "Financials and credit metrics", level: 4 }),
  ).toBeInTheDocument();
});
