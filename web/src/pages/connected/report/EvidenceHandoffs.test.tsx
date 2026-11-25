import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import { EvidenceHandoffs } from "./EvidenceHandoffs";

afterEach(cleanup);

const entry = (module: string, sha: string, selected = true): OutputEntry => ({
  selected,
  output: { id: `case/${module}.md`, module, label: module, href: `${module}.md`, sha256: sha },
  sections: [],
});
const run = {
  folder: "case",
  evidence: {
    zip: "downloads/case/handoffs.zip",
    handoffs: [{ module: "CP-1", name: "CP-1.md", href: "downloads/case/CP-1.md" }],
  },
} as unknown as PublishedRun;

it("lists each handoff with its exact hash, its Evidence link and its download", () => {
  render(<EvidenceHandoffs run={run} entries={[entry("CP-1", "a".repeat(64))]} />);
  const table = within(screen.getByRole("table", { name: "Handoffs" }));
  expect(table.getByText("a".repeat(64))).toBeVisible();
  expect(table.getByRole("link", { name: "Financial foundation" })).toHaveAttribute(
    "href",
    `/report/case#evidence/case%2FCP-1.md~${"a".repeat(64)}`,
  );
  expect(table.getByRole("link", { name: "Download Financial foundation" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Download all handoffs" })).toBeVisible();
});

it("labels a handoff that is not the designated one and filters by module", () => {
  render(
    <EvidenceHandoffs
      run={run}
      module="CP-1"
      entries={[entry("CP-1", "a".repeat(64), false), entry("CP-2", "b".repeat(64))]}
    />,
  );
  expect(screen.getByText("Financial foundation · Alternate handoff")).toBeVisible();
  expect(screen.queryByText("b".repeat(64))).toBeNull();
});
