import { afterEach, expect, it, vi } from "vitest";
// Probe S21-1-4: a saved comparison group that names an issuer no longer in the publication still
// counts it: the Compare bar says "2 issuers ticked to compare" while one issuer is listed.
// Answer key: the library holds one issuer, "alpha"; the saved group is {alpha, ghost}; choosing the
// group shows "1 of 1 issuers shown", so the number ticked and compared is 1, not 2.
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Coverage } from "./Coverage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

const data = {
  columns: [{ code: "CP-1", title: "Canonical data foundation" }],
  issuers: [
    {
      key: "alpha",
      name: "Alpha plc",
      sector: "Aerospace",
      runs: [
        {
          key: "a1",
          folder: "alpha-run",
          asOf: "2026-03-31",
          pathway: "credit_snapshot",
          pathwayTitle: "Full credit assessment",
          cells: { "CP-1": { state: "assessed", gaps: 0 } },
          other: [],
        },
      ],
    },
  ],
  fields: [],
  facts: [],
};

it("counts only the issuers of the saved group that are in the library", async () => {
  window.localStorage.setItem(
    "credit-os-coverage-groups",
    JSON.stringify([{ name: "Watch", issuers: ["alpha", "ghost"] }]),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(data), { status: 200 }))),
  );
  render(createElement(Coverage));
  const group = await screen.findByRole("group", { name: "Saved group" });
  fireEvent.click(within(group).getByRole("button", { name: "Watch" }));
  expect(screen.getByText("1 of 1 issuers shown")).toBeTruthy();
  expect(screen.getByText("1 issuer ticked to compare")).toBeTruthy();
});
