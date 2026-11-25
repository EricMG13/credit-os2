import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, Snapshot } from "../publishedReport";
import { citationsByFile, EvidenceSources, type SourceGroup } from "./EvidenceSources";

afterEach(cleanup);

const sha = "d".repeat(64);
const base = `/connected/sources/case/${sha}/Issuer.txt`;
const source = {
  name: "Issuer.txt",
  type: "txt",
  documentDate: "2025-03-31",
  readBy: ["CP-1"],
  sha256: sha,
};
const chip = (over: object) => ({
  label: "p. 2",
  quote: null,
  excerpt: null,
  file: "Issuer.txt",
  source: null,
  sha256: sha,
  reason: null,
  href: base,
  pageHref: `${base}?page=2&end=3`,
  ...over,
});
const snapshot = (chips: Snapshot["chips"]) => ({ chips }) as unknown as Snapshot;
const h1: OutputEntry = {
  selected: true,
  output: {
    id: "case/CP-1.md",
    module: "CP-1",
    label: "CP-1",
    href: "CP-1.md",
    sha256: "a".repeat(64),
  },
  sections: [],
};
const alt: OutputEntry = {
  ...h1,
  selected: false,
  output: { ...h1.output, id: "case/CP-1-alt.md", sha256: "b".repeat(64) },
};
const groups: SourceGroup[] = [
  { label: "Used by a module", rows: [source] },
  {
    label: "Supplied, not used",
    rows: [{ ...source, name: "Spare.txt", readBy: [], sha256: "e".repeat(64) }],
  },
  { label: "Not recorded as used", rows: [] },
];

it("collects what each file is cited as, from the chips that name it, with where each sits", () => {
  const cited = citationsByFile(
    snapshot({ "case/CP-1.md:5": [chip({})] }),
    [h1],
    new Set(["Issuer.txt"]),
  );
  expect(cited.byFile.get("Issuer.txt")).toEqual([
    { sha, label: "Cited pages 2–3", reason: null, entry: h1, line: 5 },
  ]);
});

it("draws the used and the supplied-not-used files as separate tables with exact hashes", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1", "CP-2"]}
      snapshot={snapshot({ "case/CP-1.md:5": [chip({})] })}
    />,
  );
  const used = within(screen.getByRole("table", { name: "Used by a module" }));
  const spare = within(screen.getByRole("table", { name: "Supplied, not used" }));
  expect(used.getByText("Issuer.txt")).toBeVisible();
  expect(used.getByText(sha)).toBeVisible();
  expect(used.getByText("Cited pages 2–3")).toBeVisible();
  expect(used.getByText("Read by Financial foundation")).toBeVisible();
  expect(spare.queryByText("Issuer.txt")).toBeNull();
  expect(spare.getByText("Not read by any module")).toBeVisible();
  expect(spare.getByText("Spare.txt")).toBeVisible();
  expect(spare.getByText("e".repeat(64))).toBeVisible();
  expect(spare.getByText("No citation names this file")).toBeVisible();
  expect(screen.queryByRole("table", { name: "Not recorded as used" })).toBeNull();
});

it("states a source's missing type, date and hash instead of leaving the cell blank", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={[
        {
          label: "Used by a module",
          rows: [{ name: "x.txt", type: null, documentDate: null, readBy: [], sha256: null }],
        },
      ]}
      modules={[]}
      snapshot={snapshot({})}
    />,
  );
  expect(screen.getByText("Document type n.a.")).toBeVisible();
  expect(screen.getByText("Document date n.a.")).toBeVisible();
  expect(screen.getByText("No hash recorded")).toBeVisible();
});

it("names a file read by every module once", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={[
        { label: "Used by a module", rows: [{ ...source, readBy: ["CP-1", "CP-2"] }] },
      ]}
      modules={["CP-1", "CP-2"]}
      snapshot={snapshot({})}
    />,
  );
  expect(screen.getByText("Read by all 2 modules")).toBeVisible();
});

it("filters to one module's files and says so when it has none", () => {
  const view = render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      module="CP-2"
      modules={["CP-1", "CP-2"]}
      snapshot={snapshot({})}
    />,
  );
  expect(screen.getByRole("heading", { name: "No source files recorded" })).toBeVisible();
  expect(screen.getByText("No issuer files are listed for Fundamental credit.")).toBeVisible();
  view.unmount();
});

it("ignores citations recorded in another run's or another module's handoffs", () => {
  const chips = {
    "other-run/CP-1.md:5": [chip({ pageHref: `${base}?page=9` })],
    "case/CP-2.md:5": [chip({ pageHref: `${base}?page=7` })],
    "case/CP-1.md:5": [chip({})],
  };
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot(chips)}
    />,
  );
  expect(screen.getByText("Cited pages 2–3")).toBeVisible();
  expect(screen.queryByText(/page 9|page 7/)).toBeNull();
});

it("shows a citation whose page the bridge does not attest as written, not as not cited", () => {
  const unattested = chip({ label: "annual.pdf p. 84", pageHref: null });
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:5": [unattested] })}
    />,
  );
  expect(screen.getByText("annual.pdf p. 84")).toBeVisible();
});

it("matches a citation to a source that records no hash by file name, and says so", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={[{ label: "Used by a module", rows: [{ ...source, sha256: null }] }]}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:5": [chip({})] })}
    />,
  );
  expect(screen.getByText("Cited pages 2–3")).toBeVisible();
  expect(screen.getByText("Matched by file name; the source has no hash")).toBeVisible();
  expect(screen.getByText("No hash recorded")).toBeVisible();
});

it("says use was not recorded for files in the unrecorded group, not that no module read them", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={[
        {
          label: "Not recorded as used",
          rows: [{ ...source, name: "Loose.txt", readBy: [] }],
        },
      ]}
      modules={["CP-1"]}
      snapshot={snapshot({})}
    />,
  );
  expect(screen.getByText("Use not recorded")).toBeVisible();
  expect(screen.queryByText("No module")).toBeNull();
});

it("states the module scope of the citations when one module is selected", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      module="CP-1"
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({})}
    />,
  );
  expect(screen.getByRole("columnheader", { name: "Cited in Financial foundation" })).toBeVisible();
  expect(screen.getByText("No citation in Financial foundation names this file")).toBeVisible();
});

it("shows a citation under a different hash, with the cited hash reachable", () => {
  const other = "9".repeat(64);
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:5": [chip({ sha256: other })] })}
    />,
  );
  expect(screen.getByText("Cited as p. 2 under a different hash")).toBeVisible();
  expect(screen.getByText(other)).toBeVisible();
  expect(screen.getByText(sha)).toBeVisible();
  const used = within(screen.getByRole("table", { name: "Used by a module" }));
  expect(used.queryByText("No citation names this file")).toBeNull();
});

it("counts only the designated handoffs' citations", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1, alt]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1-alt.md:5": [chip({ pageHref: `${base}?page=9` })] })}
    />,
  );
  expect(screen.queryByText(/9/)).toBeNull();
  expect(screen.getAllByText("No citation names this file").length).toBeGreaterThan(0);
});

const gapChip = (reason: string | null, label: string, file: string | null = null) =>
  chip({ file, source: null, sha256: null, pageHref: null, href: null, label, reason });

const REASONS = [
  "page cited without a source key",
  "the Basis file is not in the Source readiness inventory",
  "key not in inventory",
  "no inventory",
  "source name not a file name",
  "two inventory keys hold this file with different hashes",
  "the cited number is not a page",
  "Basis item not recognised",
  "the row cites no page or register",
  "the cell says Not supplied",
];

it("lists every entry not attached to a supplied file by its recorded reason, as written, with an exact count and the first line", () => {
  const chips: Record<string, ReturnType<typeof gapChip>[]> = {};
  REASONS.forEach((reason, index) => {
    // reason number k is recorded k + 1 times, on lines 10 * k + 1 …
    for (let n = 0; n <= index; n += 1) {
      const line = 10 * (index + 1) + n;
      chips[`case/CP-1.md:${String(line)}`] = [gapChip(reason, `label ${String(index)}`)];
    }
  });
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot(chips)}
    />,
  );
  const list = within(
    screen.getByRole("list", { name: "Entries on handoff lines not attached to a supplied file" }),
  );
  REASONS.forEach((reason, index) => {
    expect(list.getByText(`${String(index + 1)} · ${reason}`)).toBeVisible();
  });
  const hrefs = list.getAllByRole("link").map((link) => link.getAttribute("href"));
  expect(hrefs).toEqual(
    REASONS.map(
      (_, index) =>
        `/report/case#evidence/case%2FCP-1.md~${"a".repeat(64)}-${String(10 * (index + 1))}`,
    ),
  );
});

it("counts a citation with no recorded reason under its own words", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:7": [gapChip(null, "p.3")] })}
    />,
  );
  expect(screen.getByText("1 · No reason recorded")).toBeVisible();
});

it("lists a citation that names a file the run does not hold, apart from the source rows", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:7": [chip({ file: "Stranger.pdf", reason: null })] })}
    />,
  );
  expect(screen.getByText("1 · No reason recorded")).toBeVisible();
});

it("shows an ambiguous citation on the file it names, not as no citation, and not in the unmatched list", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({
        "case/CP-1.md:7": [
          gapChip(
            "two inventory keys hold this file with different hashes",
            "Issuer.txt p.2 · ambiguous",
          ),
        ],
      })}
    />,
  );
  const used = within(screen.getByRole("table", { name: "Used by a module" }));
  expect(
    used.getByText("Cited ambiguously: two inventory keys hold this file with different hashes"),
  ).toBeVisible();
  expect(used.queryByText("No citation names this file")).toBeNull();
  expect(
    screen.queryByRole("list", {
      name: "Entries on handoff lines not attached to a supplied file",
    }),
  ).toBeNull();
});

it("draws no such line when every citation names a file", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:5": [chip({})] })}
    />,
  );
  expect(
    screen.queryByRole("list", {
      name: "Entries on handoff lines not attached to a supplied file",
    }),
  ).toBeNull();
});

it("heads the list in words a reader sees, and says it counts by the reason recorded", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={groups}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:7": [gapChip("key not in inventory", "x")] })}
    />,
  );
  expect(
    screen.getByRole("heading", {
      name: "Entries on handoff lines not attached to a supplied file",
    }),
  ).toBeVisible();
  expect(screen.getByText("Counted by the reason recorded, as written.")).toBeVisible();
});

const cp3: SourceGroup[] = [
  {
    label: "Used by a module",
    rows: [{ ...source, name: "only-cp3.pdf", readBy: ["CP-3"], sha256: null }],
  },
];

it("keeps a file's row, and the unmatched list, under a module filter: rows and list hold every designated entry in scope", () => {
  const chips = {
    "case/CP-1.md:5": [
      chip({ file: "only-cp3.pdf", sha256: null, pageHref: null, label: "only-cp3.pdf p.3" }),
      gapChip(
        "two inventory keys hold this file with different hashes",
        "only-cp3.pdf p.9 · ambiguous",
      ),
      gapChip("page cited without a source key", "p.1 · no key"),
    ],
  };
  for (const module of [undefined, "CP-1"]) {
    render(
      <EvidenceSources
        folder="case"
        entries={[h1]}
        module={module}
        sourceGroups={cp3}
        modules={["CP-1", "CP-3"]}
        snapshot={snapshot(chips)}
      />,
    );
    const rows = within(screen.getByRole("table", { name: "Used by a module" }));
    expect(rows.getByText("only-cp3.pdf p.3")).toBeVisible();
    expect(rows.getByText("only-cp3.pdf p.9 · ambiguous")).toBeVisible();
    expect(screen.getByText("1 · page cited without a source key")).toBeVisible();
    cleanup();
  }
});

it("draws the unmatched list even when no file is listed", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={[{ label: "Used by a module", rows: [] }]}
      modules={["CP-1"]}
      snapshot={snapshot({ "case/CP-1.md:7": [gapChip("no inventory", "p.2 · no key")] })}
    />,
  );
  expect(screen.getByRole("heading", { name: "No source files recorded" })).toBeVisible();
  expect(screen.getByText("1 · no inventory")).toBeVisible();
});

it("attaches a label to the longest file name it starts with, once", () => {
  const files: SourceGroup[] = [
    {
      label: "Used by a module",
      rows: [
        { ...source, name: "filing.txt", sha256: null },
        { ...source, name: "filing.txt restated", sha256: null },
      ],
    },
  ];
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={files}
      modules={["CP-1"]}
      snapshot={snapshot({
        "case/CP-1.md:5": [
          gapChip(
            "two inventory keys hold this file with different hashes",
            "filing.txt restated p.4 · ambiguous",
          ),
        ],
      })}
    />,
  );
  expect(screen.getAllByText("filing.txt restated p.4 · ambiguous")).toHaveLength(1);
  expect(screen.getAllByText("No citation names this file")).toHaveLength(1);
});

it("keeps an empty group and says it is empty, so supplied-not-used always has an answer", () => {
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={[
        { label: "Used by a module", rows: [source] },
        { label: "Supplied, not used", rows: [] },
        { label: "Not recorded as used", rows: [] },
      ]}
      modules={["CP-1"]}
      snapshot={snapshot({})}
    />,
  );
  expect(screen.getByRole("heading", { name: "Supplied, not used 0" })).toBeVisible();
  expect(screen.getByText("No supplied file is recorded as unused.")).toBeVisible();
  expect(screen.getByText("No supplied file lacks a record of its use.")).toBeVisible();
  expect(screen.getAllByRole("table")).toHaveLength(1);
});

it("drops the empty groups under a module filter, where only that module's files are in scope", () => {
  render(
    <EvidenceSources
      folder="case"
      module="CP-1"
      entries={[h1]}
      sourceGroups={[
        { label: "Used by a module", rows: [source] },
        { label: "Supplied, not used", rows: [] },
      ]}
      modules={["CP-1"]}
      snapshot={snapshot({})}
    />,
  );
  expect(screen.queryByText("No supplied file is recorded as unused.")).toBeNull();
});

it("lists a page many lines cite once, with how many citations name it, as a real filing is cited", () => {
  // TransDigm's June 10-Q is cited on dozens of handoff lines, most of them on the same few pages.
  render(
    <EvidenceSources
      folder="case"
      entries={[h1]}
      sourceGroups={[{ label: "Used by a module", rows: [source] }]}
      modules={["CP-1"]}
      snapshot={snapshot({
        "case/CP-1.md:5": [chip({})],
        "case/CP-1.md:9": [chip({})],
        "case/CP-1.md:12": [chip({}), chip({ pageHref: `${base}?page=40&end=41` })],
      })}
    />,
  );
  const used = within(screen.getByRole("table", { name: "Used by a module" }));
  expect(used.getAllByText("Cited pages 2–3")).toHaveLength(1);
  expect(used.getByText("3 citations")).toBeVisible();
  expect(used.getAllByText("Cited pages 40–41")).toHaveLength(1);
  expect(used.queryByText("1 citation")).toBeNull();
});
