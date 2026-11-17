// S1-001 (with J6-005): every "Start a run" and "New run" button of the library opens the run
// start page, never Run activity's saved running example. Rendered through App on the real route
// table with both fixtures, and followed by a click, as a reader meets it.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "@/App";
import type { LibraryData } from "@/data";

type Json = Record<string, unknown>;

const fixtures = path.resolve(import.meta.dirname, "..", "..", "..", "fixtures");
const read = (name: string) => JSON.parse(readFileSync(path.join(fixtures, name), "utf8")) as Json;
const library = read("library.json") as { issuers: LibraryData["issuers"]; slice: Json };
const run = read("run.json") as { slice: Json };

function visit(hash: string, slice: unknown = library.slice) {
  window.location.hash = hash;
  const data: LibraryData = {
    schema: "credit-os-data/1",
    issuers: library.issuers,
    library: slice,
    run: run.slice,
  };
  return render(<App result={{ kind: "ok", data }} />);
}

async function expectRunStart(name: string) {
  fireEvent.click(screen.getAllByRole("link", { name })[0] as HTMLElement);
  await waitFor(() => {
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Start a run");
  });
  expect(screen.getByRole("list", { name: "Steps in this run" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Stop run" })).toBeNull();
  expect(screen.queryByText("Running")).toBeNull();
}

afterEach(() => {
  window.location.hash = "";
});

describe("the library's start buttons open the run start page", () => {
  it.each([
    ["the library home", "#/library/home", "Start a run"],
    ["an issuer's report history", "#/library/halden-aerostructures/history", "New run"],
    ["an issuer's report", "#/library/halden-aerostructures/2026-09-30/overview", "New run"],
  ])("%s", async (_page, hash, name) => {
    visit(hash);
    await expectRunStart(name);
  });

  it("the empty library's Start a run", async () => {
    const empty = structuredClone(library.slice) as { home: { cards: unknown[] } };
    empty.home.cards = [];
    visit("#/library/home", empty);
    await expectRunStart("Start a run");
  });

  it("an issuer with no report yet: Start a run", async () => {
    const absent = structuredClone(library.slice) as {
      issuers: {
        id: string;
        runs: unknown[];
        history: {
          latest: string | null;
          empty: string | null;
          entries: { report: string | null; changes: unknown }[];
        };
      }[];
    };
    const issuer = absent.issuers.find((item) => item.id === "corvane-packaging");
    if (!issuer) throw new Error("missing test issuer");
    issuer.runs = [];
    issuer.history.latest = null;
    issuer.history.empty = "No report has been published for this issuer yet.";
    for (const entry of issuer.history.entries) {
      entry.report = null;
      entry.changes = null;
    }
    visit("#/library/corvane-packaging/history", absent);
    expect(screen.getByRole("heading", { name: "No report yet" })).toBeVisible();
    await expectRunStart("Start a run");
  });
});

// S2-020 persists choices in a browser history entry; every independent test starts a fresh entry.
beforeEach(() => {
  window.history.replaceState({}, "");
});
