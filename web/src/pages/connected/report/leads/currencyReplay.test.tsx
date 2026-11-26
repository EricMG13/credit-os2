// Probe 8 (task B review): render the Modules page for each retained replay handoff (verbatim
// markdown fixtures, outdated TDG evidence, shape only) with records closed and open, and list
// every element whose own text is exactly a raw money unit, with the header of its column when it
// is a table cell. Run: copy to web/src/pages/connected/report/leads/zz_probe8.test.tsx, cd web &&
// npx vitest run src/pages/connected/report/leads/zz_probe8.test.tsx, then delete the copy.
// Exit 1 = some reader-page element draws a raw money unit.
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { Modules } from "../Modules";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);
const RAW = /^(?:USD|US\$|[A-Z]{3})(?: millions|m)$/;

function entryOf(file: string, module: string): OutputEntry {
  const markdown = readFileSync(path.resolve(import.meta.dirname, "fixtures", file), "utf8");
  return {
    output: {
      module,
      id: `run/${module}`,
      label: module,
      sha256: "h".repeat(64),
      href: `${module}.md`,
      charts: [],
    },
    sections: sectionsOf(markdown),
    selected: true,
  };
}

function hitsFor(entry: OutputEntry, module: string, records: boolean) {
  const view = {
    entries: [entry],
    modules: [{ id: module, name: module, state: "Delivered", outputs: [entry] }],
    catalogue: undefined,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = { folder: "run", issuer: "X", asOf: "2024-09-30", modules: {} } as PublishedRun;
  render(
    <Modules
      snapshot={{ chips: {} } as Snapshot}
      run={run}
      view={view}
      module={module}
      records={records}
    />,
  );
  const hits: string[] = [];
  for (const el of Array.from(document.querySelectorAll("*"))) {
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent ?? "")
      .join("")
      .trim();
    if (!RAW.test(own)) continue;
    const td = el.closest("td");
    let header = "";
    if (td) {
      const index = Array.from(td.parentElement?.children ?? []).indexOf(td);
      header = td.closest("table")?.querySelectorAll("thead th")[index]?.textContent ?? "";
    }
    hits.push(
      `${records ? "open" : "closed"} ${el.tagName}${header ? ` [col ${header}]` : ""}: ${own}`,
    );
  }
  const tables = document.querySelectorAll("table").length;
  cleanup();
  return { hits, tables };
}

it.each([
  ["cp2_tdg_replay.md", "CP-2"],
  ["cp2e_tdg_replay.md", "CP-2E"],
  ["cp2h_tdg_replay.md", "CP-2H"],
  ["cp3c_tdg_replay.md", "CP-3C"],
  ["cp3d_tdg_replay.md", "CP-3D"],
  ["cp4c_tdg_replay.md", "CP-4C"],
  ["cp5_tdg_replay.md", "CP-5"],
  ["cp6_tdg_replay.md", "CP-6"],
])("%s (%s): no raw money unit drawn", (file, module) => {
  const closed = hitsFor(entryOf(file, module), module, false);
  const open = hitsFor(entryOf(file, module), module, true);
  expect({
    module,
    tables: [closed.tables, open.tables],
    hits: [...closed.hits, ...open.hits],
  }).toEqual({
    module,
    tables: [closed.tables, open.tables],
    hits: [],
  });
});
