import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { BusinessLead } from "./cp1a";
import { LiquidityLead } from "./cp2d";
import { MacroLead } from "./cp2e";
import { RefinancingLead } from "./cp3c";
import { ResearchLead } from "./cpdr";
import { bottomLine, EVENT_HEADERS, leadProps, tableSection } from "./lead.fixture";
import type { Leads } from "./types";

afterEach(cleanup);

// Each lead with a dated lane: the lane's name in the handoff and the tile it is drawn in.
const LANES: [string, Leads[string], string, string][] = [
  ["CP-1A", BusinessLead, "Issuer history", "Issuer history"],
  ["CP-DR", ResearchLead, "Research catalysts", "Research catalysts"],
  ["CP-2D", LiquidityLead, "Financing", "Funding dates"],
  ["CP-2E", MacroLead, "Hedges", "Hedge dates"],
  ["CP-3C", RefinancingLead, "Refinancing", "Refinancing dates"],
];

// Review 3, P5: a row the page cannot place by date is listed as written, never dropped.
it.each(LANES)(
  "%s lists a lane row it cannot place by date as written, with its trace",
  (module, Lead, lane, tile) => {
    // No descriptor: the store withholds a lane with one bad row; the handoff's table stands.
    const made = entry(
      module,
      [],
      [
        ...bottomLine("Leverage is high."),
        tableSection(
          `Events: ${lane}`,
          table(80, EVENT_HEADERS, [
            ["2026-03-31", "day", "—", "Notes mature", "Scheduled — maturity", "Filing", "Wall"],
            ["TBD", "unknown", "—", "Unplaced row event", "Scheduled — x", "Filing", "Wall"],
          ]),
        ),
      ],
    );
    render(<Lead {...leadProps(made)} />);
    const region = screen.getByRole("region", { name: tile });
    expect(within(region).getByText("Notes mature")).toBeVisible();
    expect(
      within(region).getByText("This page could not place 1 of the 2 dated rows:"),
    ).toBeVisible();
    const unplaced = within(region).getByRole("list", { name: `${tile}, rows not placed by date` });
    const [row] = within(unplaced).getAllByRole("listitem");
    if (!row) throw new Error("unplaced row missing");
    expect(within(row).getByText("TBD")).toBeVisible();
    expect(within(row).getByText("Unplaced row event")).toBeVisible();
    // Row 2 of the table at line 80 is on line 83.
    expect(
      within(row).getByRole("link", { name: "Source for Unplaced row event" }),
    ).toHaveAttribute("href", expect.stringMatching(/#evidence\/.*83/));
  },
);
