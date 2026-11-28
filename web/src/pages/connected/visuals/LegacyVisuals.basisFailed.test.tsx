import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PortfolioBasisProvider } from "../report/PortfolioBasis";
import { LegacyVisuals } from ".";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const output = {
  charts: [
    {
      title: "Portfolio limits",
      table: 20,
      kind: "limits",
      label: 0,
      current: 1,
      proposed: 2,
      limit: 3,
      unit: "% NAV",
    },
  ],
};
const sections = [
  {
    blocks: [
      {
        type: "table",
        line: 20,
        headers: [
          "Limit",
          "Current exposure",
          "Proposed exposure",
          "Limit value",
          "Reporting unit",
          "Basis and limitation",
        ],
        rows: [{ cells: ["Sector", "12.50", "13.25", "15.0", "% NAV", "Synthetic."] }],
      },
    ],
  },
];

it("says the portfolio basis could not be loaded, not that it is not established, when its request fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", () => Promise.resolve(new Response("boom", { status: 500 })));
  render(
    <PortfolioBasisProvider folder="run" enabled>
      <LegacyVisuals
        output={output}
        sections={sections}
        evidenceHref={(l) => `#line-${String(l)}`}
      />
    </PortfolioBasisProvider>,
  );
  expect(await screen.findByText("The portfolio basis could not be loaded.")).toBeVisible();
  expect(screen.queryByText("Not established for this run")).toBeNull();
});
