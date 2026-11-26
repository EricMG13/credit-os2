// Pre-merge review probe: Coverage keeps raw units as its comparison keys (coverageData.ts:217,297)
// but now draws them through unitLabel, so two raw spellings of one USD unit ("US$m" and
// "USD millions", both admitted by moneyUnits.ts) are drawn identically while the page still
// treats them as different units. Same fixture shape as Coverage.test.tsx `unitsData`.
// Exit 1 = the page tells the reader a list in "$m" was not compared with a bound in "$m".
// Run from web/: npx vitest run --config ../.superpowers/sdd/module-currency-symbols/probes/arch.vitest.config.mts
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Coverage } from "@/pages/connected/Coverage";

const SHA = "b".repeat(64);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/coverage");
  window.localStorage.clear();
});

function unitsData(units: Record<string, string>, values: Record<string, number>) {
  const keys = Object.keys(units);
  return {
    columns: [{ code: "CP-1", title: "Canonical data foundation" }],
    issuers: keys.map((key) => ({
      key,
      name: key.toUpperCase(),
      sector: null,
      runs: [
        { key: `${key}1`, folder: `${key}-run`, asOf: "2026-03-31", pathway: null, pathwayTitle: null, cells: {}, other: [] },
      ],
    })),
    fields: [
      { id: "cash", module: "CP-1", group: "Liquidity", label: "Cash", kind: "number", series: "period" },
    ],
    facts: keys.map((key) => ({
      field: "cash", issuer: key, run: `${key}1`, period: "FY2025", row: null,
      text: String(values[key]), at: values[key] ?? null, unit: units[key],
      basis: "Reported.", line: 1, output: `${key}-run/CP-1.md`, sha256: SHA,
    })),
  };
}

test("one USD unit in two spellings is drawn the same and called a different unit", async () => {
  const units: Record<string, string> = { a: "US$m", b: "US$m", c: "US$m", d: "USD millions" };
  const values: Record<string, number> = { a: 10, b: 20, c: 30, d: 40 };
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify(unitsData(units, values)), { status: 200 }))));
  render(<Coverage />);
  fireEvent.change(await screen.findByRole("textbox", { name: /At least/ }), { target: { value: "15" } });
  const notCompared = screen.queryByText(/Not compared, stated in another unit/)?.textContent ?? "";
  console.log("not-compared note:", JSON.stringify(notCompared));
  fireEvent.click(screen.getByRole("button", { name: "Rank" }));
  const boundNote = screen.queryByText(/Bound not applied/)?.textContent ?? "";
  const lists = screen.queryAllByRole("list").map((list) => list.getAttribute("aria-label"));
  console.log("bound note:", JSON.stringify(boundNote), "lists:", JSON.stringify(lists));
  expect(boundNote).not.toMatch(/this list is in \$m, and the bound compares \$m/);
  expect(notCompared).not.toMatch(/\(\$m\)/);
});
