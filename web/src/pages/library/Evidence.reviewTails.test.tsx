import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { routes } from "./routes";
import type { Metric } from "./slice";

const fixture = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../fixtures/library.json"), "utf8"),
) as {
  issuers: LibraryData["issuers"];
  slice: {
    issuers: {
      id: string;
      runs: { id: string; evidence: { summary: { counts: Metric[] } } }[];
    }[];
  };
};

function open(issuer: string, run: string, tab: string, library: unknown = fixture.slice) {
  const route = routes.find((r) => r.path === `/library/:issuer/:run/evidence/${tab}`);
  if (route === undefined) throw new Error("missing Evidence route");
  const data: LibraryData = { schema: "credit-os-data/1", issuers: fixture.issuers, library };
  return render(
    <SourceContext.Provider value={data}>{route.render({ issuer, run })}</SourceContext.Provider>,
  );
}

function pick(name: string) {
  const select = screen
    .getByRole("button", { name: /^Module:/ })
    .closest("div")
    ?.querySelector("select");
  if (!select) throw new Error("missing module filter");
  fireEvent.change(select, { target: { value: `option:${name}` } });
}

afterEach(cleanup);

it("distinguishes the filtered timing rows from the unchanged full timing-record note", () => {
  open("halden-aerostructures", "2026-09-30", "record");
  pick("Capital structure");
  const timings = within(screen.getByRole("region", { name: "Module timings" }));
  expect(
    timings.getByText("1 of 6 recorded module timings shown for Capital structure."),
  ).toBeVisible();
  expect(
    timings.getByText(
      "Unfiltered timing record: From start to accepted, 13 Nov 2026. Six of thirteen shown.",
    ),
  ).toBeVisible();
  expect(timings.getAllByRole("row")).toHaveLength(2);
});

it("names the call-row scope separately from Brevane's timing sample and preserves the run total", () => {
  open("brevane-marine", "r-0412", "record");
  const calls = within(screen.getByRole("region", { name: "Model calls" }));
  expect(
    calls.getByText(
      "Call rows cover 1 of 2 modules in the run. The Total row is the delivered total for the run.",
    ),
  ).toBeVisible();
  expect(calls.getByRole("rowheader", { name: "Total" }).closest("tr")).toHaveTextContent("31");
  expect(screen.getByText("From start to accepted, 31 Dec 2026. One of one shown.")).toBeVisible();
});

it("retains the Calculations qualification when an untraced run delivers count tiles in another order", () => {
  const slice = structuredClone(fixture.slice);
  const run = slice.issuers
    .find((i) => i.id === "halden-aerostructures")
    ?.runs.find((r) => r.id === "2026-03-31");
  if (run === undefined) throw new Error("missing test run");
  run.evidence.summary.counts.reverse();
  // Move Calculations out of the middle without changing any delivered metric.
  const calculation = run.evidence.summary.counts.splice(1, 1)[0];
  if (calculation === undefined) throw new Error("missing Calculations");
  run.evidence.summary.counts.push(calculation);
  open("halden-aerostructures", "2026-03-31", "summary", slice);
  pick("Capital structure");
  const counts = within(screen.getByRole("region", { name: "Counts" })).getAllByRole("listitem");
  expect(counts.map((tile) => tile.textContent)).toEqual([
    "Source files read2By Capital structure",
    "Calculations0No calculation derivations are recorded in this saved example.",
    "Gaps1In Capital structure",
  ]);
});
