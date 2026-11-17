// S4-008 and S4-009 (OQ-10): Record's Model calls table carries no module code and says how many of
// the run's modules it lists; a module chosen in the held filter narrows the two module tables.
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { routes } from "./routes";

type Json = Record<string, unknown>;

const fixture = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "..", "..", "..", "fixtures", "library.json"),
    "utf8",
  ),
) as { issuers: LibraryData["issuers"]; slice: Json };

const RECORD = "/library/:issuer/:run/evidence/record";

function renderRecord(run: string, library: unknown = fixture.slice) {
  const data: LibraryData = { schema: "credit-os-data/1", issuers: fixture.issuers, library };
  const found = routes.find((r) => r.path === RECORD);
  if (found === undefined) throw new Error("no record route");
  return render(
    <SourceContext.Provider value={data}>
      {found.render({ issuer: "halden-aerostructures", run })}
    </SourceContext.Provider>,
  );
}

afterEach(cleanup);

const table = (name: string) => screen.getByRole("table", { name });
const drawn = (cell: Element) => {
  const copy = cell.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll(".sr-only")) hidden.remove();
  return copy.textContent;
};
const textOf = (name: string) =>
  within(table(name))
    .getAllByRole("row")
    .slice(1)
    .map((row) => [...row.querySelectorAll("th,td")].map(drawn));
const calls = () => screen.getByRole("region", { name: "Model calls" });

function pick(name: string) {
  const select = screen
    .getByRole("button", { name: /^Module:/ })
    .closest("div")
    ?.querySelector("select");
  if (!select) throw new Error("no module select");
  fireEvent.change(select, { target: { value: name === "All" ? "all" : `option:${name}` } });
}

describe("Record, Model calls without module codes", () => {
  it("has no Code column and no module code anywhere on the page", () => {
    const { container } = renderRecord("2026-09-30");
    expect(
      within(table("Model calls"))
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Module", "Calls", "Retries", "Tokens in", "Tokens out", "Cost, USD"]);
    expect(textOf("Model calls")).toEqual([
      ["Business profile", "3", "0", "182,400", "9,150", "0.92"],
      ["Capital structure", "5", "1", "264,900", "14,720", "1.38"],
      ["Recovery", "2", "1", "58,300", "1,040", "0.27"],
      ["Peer comparison", "4", "0", "n.a.", "n.a.", "0.81"],
      ["Total", "41", "6", "n.a.", "n.a.", "11.40"],
    ]);
    expect(container.textContent).not.toMatch(/\bCP-\d/);
  });

  it("keeps the figures right-aligned and bolds only the Total row", () => {
    renderRecord("2026-09-30");
    const rows = within(table("Model calls")).getAllByRole("row");
    const first = within(rows[1] as HTMLElement).getAllByRole("cell");
    expect(first[0]).toHaveClass("text-right", "tabular-nums");
    expect(first[0]?.className).not.toMatch(/font-mono/);
    expect(calls().querySelector("[class*='last-child']")?.className).toContain("font-semibold");
  });
});

describe("Record, how many modules the lists hold", () => {
  const sentence = (n: string) =>
    `Call rows cover ${n} of 13 modules in the run. The Total row is the delivered total for the run.`;

  it("says under Model calls how many of the run's modules it lists", () => {
    renderRecord("2026-09-30");
    expect(within(calls()).getByText(sentence("4"))).toBeVisible();
  });

  it("counts what the run lists: one of thirteen on a run whose table holds one module", () => {
    renderRecord("2026-03-31");
    expect(within(calls()).getByText(sentence("1"))).toBeVisible();
  });

  it("says nothing of a partial list when the table lists every module of the run", () => {
    const slice = structuredClone(fixture.slice) as {
      issuers: {
        runs: {
          modules: { name: string }[];
          evidence: { record: { calls: { rows: { label: string; cells: unknown[] }[] } } };
        }[];
      }[];
    };
    const run = slice.issuers[0]?.runs[0] as (typeof slice.issuers)[0]["runs"][0];
    const cells = ["1", "0", null, null, "0.10"];
    run.evidence.record.calls.rows = run.modules.map((m) => ({
      label: m.name,
      cells: ["CP-X", ...cells],
    }));
    renderRecord("2026-09-30", slice);
    expect(screen.queryByText(/modules shown/)).toBeNull();
    expect(within(table("Model calls")).getAllByRole("row")).toHaveLength(1 + 13 + 1);
  });

  it("leaves the delivered timings note as it was, with its own count", () => {
    renderRecord("2026-09-30");
    expect(
      screen.getByText("From start to accepted, 13 Nov 2026. Six of thirteen shown."),
    ).toBeVisible();
  });
});

describe("Record, with a module chosen in the filter", () => {
  it("draws the module's own row in each table and no run total or count", () => {
    renderRecord("2026-09-30");
    pick("Capital structure");
    expect(textOf("Module timings")).toEqual([
      ["Capital structure", "5.6", "16.0", "10.4", "Delivered with gaps"],
    ]);
    expect(textOf("Model calls")).toEqual([
      ["Capital structure", "5", "1", "264,900", "14,720", "1.38"],
    ]);
    expect(screen.getByRole("heading", { level: 3, name: "Model calls" })).toBeVisible();
    expect(screen.queryByText(/modules shown\. The Total row/)).toBeNull();
    pick("All");
    expect(textOf("Model calls")).toHaveLength(5);
  });

  it("says what a table lists nothing of, and the way back clears the filter", () => {
    renderRecord("2026-09-30");
    pick("Forward credit view");
    expect(textOf("Module timings")).toEqual([
      ["Forward credit view", "26.4", "37.6", "11.2", "Delivered"],
    ]);
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "No model calls are listed for Forward credit view",
      }),
    ).toBeVisible();
    expect(screen.queryByRole("table", { name: "Model calls" })).toBeNull();
    pick("Industry and competition");
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "No time is listed for Industry and competition",
      }),
    ).toBeVisible();
    const clear = screen.getAllByRole("button", { name: "Show all modules" })[0] as HTMLElement;
    clear.focus();
    fireEvent.click(clear);
    expect(screen.getByRole("button", { name: /^Module:/ })).toHaveTextContent("Module: All");
    expect(screen.getByRole("button", { name: /^Module:/ })).toHaveFocus();
    expect(textOf("Model calls")).toHaveLength(5);
  });

  it("leaves the run's hashes, spend and registers as they are", () => {
    renderRecord("2026-09-30");
    pick("Capital structure");
    expect(screen.getByRole("progressbar", { name: "USD 11.40 of USD 25.00" })).toBeVisible();
    expect(textOf("Registers as written")).toHaveLength(5);
  });
});
