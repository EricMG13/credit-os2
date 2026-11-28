import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { entry, table } from "../overview/rows.fixture";
import { BusinessLead } from "./cp1a";
import { CreditLead } from "./cp2";
import { DownsideLead } from "./cp2a";
import { LiquidityLead } from "./cp2d";
import { MacroLead } from "./cp2e";
import { ForwardLead } from "./cp2g";
import { RatingsLead } from "./cp2h";
import { SecurityLead } from "./cp3";
import { RefinancingLead } from "./cp3c";
import { MarketLead } from "./cp3d";
import { LegalLead } from "./cp4";
import { RestructuringLead } from "./cp4c";
import { ResearchLead } from "./cpdr";
import { CREDIT_LEADS } from "./credit";
import type { Lead, LeadKind } from "./types";
import { EVENT_HEADERS, leadProps, tableSection } from "./lead.fixture";
import { proofHandoff } from "./proof.fixture";
import { STRUCTURE_LEADS } from "./structure";

afterEach(cleanup);

const DRAWS: [string, Lead, LeadKind[]][] = [
  ["CP-1A", BusinessLead, ["maps", "events"]],
  ["CP-DR", ResearchLead, ["events"]],
  ["CP-2", CreditLead, ["maps"]],
  ["CP-2A", DownsideLead, ["figures"]],
  ["CP-2D", LiquidityLead, ["figures", "events"]],
  ["CP-2E", MacroLead, ["figures", "events"]],
  ["CP-2G", ForwardLead, []],
  ["CP-2H", RatingsLead, ["figures"]],
  ["CP-3", SecurityLead, ["figures"]],
  ["CP-3C", RefinancingLead, ["figures", "events"]],
  ["CP-3D", MarketLead, ["figures"]],
  ["CP-4", LegalLead, ["figures", "maps"]],
  ["CP-4C", RestructuringLead, ["figures"]],
];

it.each(DRAWS)("%s declares the kinds it draws", (module, Lead, kinds) => {
  expect(Lead.draws).toEqual(kinds);
  expect(Object.isFrozen(Lead.draws)).toBe(true);
  // The stage's map holds this very lead, so the frame reads `draws` from what it renders.
  expect({ ...CREDIT_LEADS, ...STRUCTURE_LEADS }[module]).toBe(Lead);
});

it("declares draws on every lead of the two stages", () => {
  expect(Object.keys({ ...CREDIT_LEADS, ...STRUCTURE_LEADS }).sort()).toEqual(
    DRAWS.map(([module]) => module).sort(),
  );
});

const MAP = ["From", "Relationship", "Edge type", "To", "Evidence"];
const KEPT = "Frame-kept";

/** A part the frame keeps drawing, added to a module's handoff with the descriptor the store emits. */
function withPart(made: OutputEntry, kind: "map" | "lane" | "chart", name: string) {
  const line = 900 + made.sections.length * 10;
  if (kind === "map") {
    made.sections.push(
      tableSection(
        `Map: ${name}`,
        table(line, MAP, [[`${KEPT} node`, `${KEPT} link`, "Assumption", "B", "Filing"]]),
      ),
    );
    made.output.maps = [...(made.output.maps ?? []), { name, table: line, gap: null }];
  } else if (kind === "lane") {
    made.sections.push(
      tableSection(
        `Events: ${name}`,
        table(line, EVENT_HEADERS, [
          ["2026", "year", "2024-11-07", `${KEPT} event`, "Scheduled — maturity", "Filing", "Wall"],
        ]),
      ),
    );
    made.output.events = [...(made.output.events ?? []), { lane: name, table: line, gap: null }];
  } else {
    made.sections.push(
      tableSection(
        `Chart data: ${name}`,
        table(
          line,
          ["Period", "Value", "Reporting unit", "Basis and limitation"],
          [["FY2025", "123456", "US$m", `${KEPT} basis`]],
        ),
      ),
    );
    made.output.charts = [
      ...(made.output.charts ?? []),
      { title: name, table: line, unit: "US$m", columns: [1] },
    ];
  }
  return made;
}

it("CP-2A does not draw its stress scenario map", () => {
  // proof/handoffs/CP-2A.md: the store publishes `Map: stress scenario`.
  const { container } = render(<DownsideLead {...leadProps(proofHandoff("CP-2A"))} />);
  expect(container.textContent).not.toMatch(/Synthetic A|Synthetic link/);
});

it("CP-2H does not draw lane Ratings", () => {
  const made = withPart(entry("CP-2H", [], []), "lane", "Ratings");
  const { container } = render(<RatingsLead {...leadProps(made)} />);
  expect(container.textContent).not.toContain(KEPT);
});

it("CP-3 does not draw lane Instruments", () => {
  // proof/handoffs/CP-3.md: the store publishes `Events: Instruments`.
  const { container } = render(<SecurityLead {...leadProps(proofHandoff("CP-3"))} />);
  expect(container.textContent).not.toMatch(/Synthetic call|Synthetic review/);
});

it("CP-4 does not draw lane Legal", () => {
  // proof/handoffs/CP-4.md: the store publishes `Events: Legal`; the maps are its own.
  const { container } = render(<LegalLead {...leadProps(proofHandoff("CP-4"))} />);
  expect(container.textContent).not.toMatch(/Synthetic call|Synthetic review/);
  expect(container.textContent).toContain("Synthetic link");
});

it("CP-2G draws no map, lane or chart of its own module", () => {
  const made = proofHandoff("CP-2G");
  withPart(made, "map", "stress scenario");
  withPart(made, "lane", "Forward");
  withPart(made, "chart", "Net leverage");
  const { container } = render(<ForwardLead {...leadProps(made)} />);
  expect(container.textContent).not.toContain(KEPT);
  expect(container.textContent).not.toContain("123456");
});

it("CP-2 draws no event lane", () => {
  const made = withPart(proofHandoff("CP-2"), "lane", "Credit");
  const { container } = render(<CreditLead {...leadProps(made)} />);
  expect(container.textContent).not.toContain(KEPT);
  // Its own map is drawn: proof/handoffs/CP-2.md `Map: credit-risk transmission`.
  expect(container.textContent).toContain("Synthetic link");
});

it("CP-DR draws no map", () => {
  const made = withPart(proofHandoff("CP-DR"), "map", "support and contradiction");
  const { container } = render(<ResearchLead {...leadProps(made)} />);
  expect(container.textContent).not.toContain(KEPT);
  expect(container.textContent).toContain("Synthetic call");
});

it.each([
  ["CP-1A", BusinessLead, "figures"],
  ["CP-2", CreditLead, "figures"],
  ["CP-2A", DownsideLead, "events"],
  ["CP-3", SecurityLead, "maps"],
  ["CP-3D", MarketLead, "events"],
  ["CP-4C", RestructuringLead, "maps"],
] as const)("%s draws none of its %s, which the frame keeps", (module, Lead, kind) => {
  const made = entry(module, [], []);
  if (kind === "figures") withPart(made, "chart", "Frame chart");
  if (kind === "events") withPart(made, "lane", "Frame lane");
  if (kind === "maps") withPart(made, "map", "stress scenario");
  const { container } = render(<Lead {...leadProps(made)} />);
  expect(container.textContent).not.toContain(KEPT);
  expect(container.textContent).not.toContain("123456");
});
