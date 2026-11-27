import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot } from "../publishedReport";
import type { ReportView } from "../reportView";
import { Modules } from "./Modules";

afterEach(cleanup);

const text = (line: number, value: string) => ({
  type: "text" as const,
  line,
  end: line,
  text: value,
});
const sections: Section[] = [
  { heading: "Findings", level: 2, line: 1, blocks: [] },
  {
    heading: "Bottom line",
    level: 3,
    line: 2,
    blocks: [text(3, "The credit is thin."), text(4, "CP-L10 sets the screen.")],
  },
  { heading: "Key findings", level: 3, line: 5, blocks: [text(6, "CP-L10 flags cover.")] },
];

function draw(pathway: string) {
  const entry: OutputEntry = {
    selected: true,
    output: { id: "r/CP-2.md", module: "CP-2", label: "a", href: "", sha256: "a".repeat(64) },
    sections,
  };
  const view = {
    entries: [entry],
    modules: [{ id: "CP-2", name: "Fundamental credit", state: "Delivered", outputs: [entry] }],
    catalogue: undefined,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = { folder: "r", issuer: "Issuer", asOf: "2026-10-31", pathway } as PublishedRun;
  render(<Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module="CP-2" />);
}

it("names CP-L10 by the credit screening pathway's own name in the module's findings", () => {
  draw("credit_screening");
  const findings = screen.getByRole("region", { name: "Key findings" });
  expect(within(findings).getByText("Credit screening flags cover.")).toBeVisible();
  expect(screen.getByText("Credit screening sets the screen.")).toBeVisible();
  expect(screen.queryByText(/Short credit snapshot/)).toBeNull();
});

it("keeps the default name on another pathway", () => {
  draw("lite");
  expect(screen.getByText("Short credit snapshot flags cover.")).toBeVisible();
});
