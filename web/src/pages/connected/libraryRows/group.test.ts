import { expect, it } from "vitest";
import type { CatalogueRun, LibraryIndex } from "../publishedReport";
import { groupIssuers, sectorSlots } from "./group";

const run = (id: string, date: string): CatalogueRun => ({
  id,
  name: "Gamma GmbH",
  issuer: "Gamma GmbH",
  title: "Full credit assessment",
  date,
  sector: "",
  period: "FY2025",
  metrics: {},
});

it("groups an unpublished newest run alone, with no report to open, apart from the issuer's published runs", () => {
  const index: LibraryIndex = {
    catalogue: { real: [run("g-2026", "2026-03-31"), run("g-2025", "2025-03-31")] },
    workspace: { runs: { g25: { folder: "g-2025", issuerKey: "gamma", pathway: null } } },
  };
  const groups = groupIssuers(index);
  expect(groups.map((group) => [group.newest.id, group.state, group.linked?.id])).toEqual([
    ["g-2026", "No report published", undefined],
    ["g-2025", "Delivered", "g-2025"],
  ]);
});

it("always opens the report of the run it draws: a row's linked run is its newest or none", () => {
  const index: LibraryIndex = {
    catalogue: {
      real: [run("g-2026", "2026-03-31"), run("g-2025", "2025-03-31"), run("g-2024", "2024-03-31")],
    },
    workspace: {
      runs: {
        a: { folder: "g-2026", issuerKey: "gamma", pathway: null },
        b: { folder: "g-2025", issuerKey: "gamma", pathway: null },
      },
    },
  };
  for (const group of groupIssuers(index))
    expect(group.linked === undefined || group.linked === group.newest).toBe(true);
});

it("gives the first five sectors slots 3, 4, 5, 6, 8 in order of first appearance, then slot 8", () => {
  const sectored = (id: string, issuer: string, sector: string): CatalogueRun => ({
    ...run(id, "2026-03-31"),
    name: issuer,
    issuer,
    sector,
  });
  const index: LibraryIndex = {
    catalogue: {
      real: [
        sectored("a", "A", "Telecom"),
        sectored("b", "B", ""),
        sectored("c", "C", "Retail"),
        sectored("d", "D", "Telecom"),
        sectored("e", "E", "Energy"),
        sectored("f", "F", "Media"),
        sectored("g", "G", "Autos"),
        sectored("h", "H", "Chemicals"),
        sectored("i", "I", "Software"),
      ],
    },
    workspace: { runs: {} },
  };
  expect([...sectorSlots(index)]).toEqual([
    ["Telecom", 3],
    ["Retail", 4],
    ["Energy", 5],
    ["Media", 6],
    ["Autos", 8],
    ["Chemicals", 8],
    ["Software", 8],
  ]);
});
