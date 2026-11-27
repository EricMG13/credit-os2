import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Coverage, Fact, Issuer } from "../coverageData";
import { Headroom } from "./Headroom";

const currentId = "cp-4/covenant-headroom/current";
const limitId = "cp-4/covenant-headroom/threshold";
const triggerValueId = "cp-2h/rating-triggers/current";
const triggerLimitId = "cp-2h/rating-triggers/threshold";
const alphaRun = {
  key: "alpha-run",
  folder: "alpha-folder",
  asOf: "2025-12-31",
  pathway: "full",
  pathwayTitle: "Full",
  cells: {},
  other: [],
};
const betaRun = { ...alphaRun, key: "beta-run", folder: "beta-folder" };
const issuers: Issuer[] = [
  { key: "alpha", name: "Alpha", sector: "Energy", runs: [alphaRun] },
  { key: "beta", name: "Beta", sector: "Energy", runs: [betaRun] },
];

const fields = [
  {
    id: currentId,
    module: "CP-4",
    group: "Covenant headroom",
    label: "Current",
    kind: "number" as const,
    series: "row" as const,
  },
  {
    id: limitId,
    module: "CP-4",
    group: "Covenant headroom",
    label: "Threshold",
    kind: "number" as const,
    series: "row" as const,
  },
  {
    id: triggerValueId,
    module: "CP-2H",
    group: "Rating triggers",
    label: "Current",
    kind: "number" as const,
    series: "row" as const,
  },
  {
    id: triggerLimitId,
    module: "CP-2H",
    group: "Rating triggers",
    label: "Threshold",
    kind: "number" as const,
    series: "row" as const,
  },
];

function fact(
  issuer: string,
  run: string,
  field: string,
  row: string,
  line: number,
  text: string,
  unit = "x",
  direction = "Passes below",
  at: number | null = Number(text),
): Fact {
  return {
    issuer,
    run,
    field,
    row,
    period: null,
    text,
    at,
    unit,
    direction,
    line,
    output: `${run}/module.md`,
    sha256: "a".repeat(64),
    basis: "Written basis.",
  };
}

function fixture(): Coverage {
  const facts: Fact[] = [
    fact("alpha", "alpha-run", currentId, "Cushion", 10, "3"),
    fact("alpha", "alpha-run", limitId, "Cushion", 10, "5"),
    fact("alpha", "alpha-run", currentId, "Beyond", 11, "6"),
    fact("alpha", "alpha-run", limitId, "Beyond", 11, "5"),
    fact(
      "alpha",
      "alpha-run",
      currentId,
      "Missing level",
      12,
      "Not supplied: unavailable",
      "x",
      "Passes below",
      null,
    ),
    fact("alpha", "alpha-run", limitId, "Missing level", 12, "4"),
    fact("alpha", "alpha-run", currentId, "Missing limit", 121, "3"),
    fact(
      "alpha",
      "alpha-run",
      limitId,
      "Missing limit",
      121,
      "Not supplied: unavailable",
      "x",
      "Passes below",
      null,
    ),
    fact("alpha", "alpha-run", currentId, "Ambiguous", 13, "2"),
    fact("alpha", "alpha-run", currentId, "Ambiguous", 13, "3"),
    fact("alpha", "alpha-run", limitId, "Ambiguous", 13, "4"),
    fact("alpha", "alpha-run", currentId, "Equal", 14, "4"),
    fact("alpha", "alpha-run", limitId, "Equal", 14, "4"),
    fact("alpha", "alpha-run", currentId, "Wrong unit", 15, "2", "ratio"),
    fact("alpha", "alpha-run", limitId, "Wrong unit", 15, "4", "x"),
    fact("alpha", "alpha-run", currentId, "Other valid unit", 16, "10", "USD millions"),
    fact("alpha", "alpha-run", limitId, "Other valid unit", 16, "1", "USD millions"),
    fact("alpha", "alpha-run", currentId, "Unit not stated", 17, "3", ""),
    fact("alpha", "alpha-run", limitId, "Unit not stated", 17, "4", ""),
    fact("beta", "beta-run", currentId, "Beta covenant", 30, "1"),
    fact("beta", "beta-run", limitId, "Beta covenant", 30, "2"),
    fact("beta", "beta-run", triggerValueId, "Downgrade trigger", 20, "5"),
    fact("beta", "beta-run", triggerLimitId, "Downgrade trigger", 20, "4"),
    fact("beta", "beta-run", triggerValueId, "Ambiguous direction", 21, "3", "x", "upgrade"),
    fact("beta", "beta-run", triggerLimitId, "Ambiguous direction", 21, "4", "x", "upgrade"),
  ];
  return {
    columns: [
      { code: "CP-4", title: "Legal and covenants" },
      { code: "CP-2H", title: "Ratings and triggers" },
    ],
    issuers,
    fields,
    facts,
  };
}

describe("Headroom", () => {
  it("keeps issuer order, moves only the tightest valid row first, and reports gaps without guessing", () => {
    render(
      <Headroom data={fixture()} issuers={issuers} selected={null} onSelect={() => undefined} />,
    );
    const covenant = screen.getByRole("table", { name: "Covenant headroom" });
    const rows = within(covenant).getAllByRole("row");
    expect(rows.map((row) => row.textContent)).toHaveLength(11);
    expect(rows[1]).toHaveTextContent("Beyond");
    expect(rows[1]).toHaveTextContent("−1x");
    expect(rows[1]).toHaveTextContent("beyond the limit");
    expect(rows[2]).toHaveTextContent("Cushion");
    expect(rows[2]).toHaveTextContent("+2x");
    expect(rows[3]).toHaveTextContent("Missing level");
    expect(rows[3]).toHaveTextContent("not computed");
    expect(rows[4]).toHaveTextContent("Missing limit");
    expect(rows[4]).toHaveTextContent("not computed");
    expect(rows[5]).toHaveTextContent("Ambiguous");
    expect(rows[5]).toHaveTextContent("ambiguous");
    expect(rows[6]).toHaveTextContent("Equal");
    expect(within(rows[6] as HTMLElement).getByLabelText("Level mark at 50%")).toBeInTheDocument();
    expect(within(rows[6] as HTMLElement).getByLabelText("Limit mark at 50%")).toBeInTheDocument();
    expect(rows[7]).toHaveTextContent("Wrong unit");
    expect(rows[7]).toHaveTextContent("not computed");
    expect(rows[8]).toHaveTextContent("Other valid unit");
    expect(rows[9]).toHaveTextContent("Unit not stated");
    expect(rows[9]).toHaveTextContent("not computed");
    expect(rows[10]).toHaveTextContent("Beta covenant");
    expect(within(covenant).getAllByRole("link", { name: /Open run/ })).toHaveLength(10);
    expect(
      screen.getByText("This page could not read base and downside cases."),
    ).toBeInTheDocument();
  });

  it("renders typed rating trigger rows with explicit direction and their own trace", () => {
    render(
      <Headroom data={fixture()} issuers={issuers} selected={null} onSelect={() => undefined} />,
    );
    const triggers = screen.getByRole("table", { name: "Rating triggers" });
    const row = within(triggers).getByRole("row", { name: /Downgrade trigger/ });
    expect(row).toHaveTextContent("5x");
    expect(row).toHaveTextContent("4x");
    expect(row).toHaveTextContent("−1x");
    expect(within(row).getByRole("link", { name: "Open run" })).toHaveAttribute(
      "href",
      expect.stringContaining("beta-folder"),
    );
    expect(within(triggers).getByRole("row", { name: /Ambiguous direction/ })).toHaveTextContent(
      "not computed",
    );
  });

  it("keeps a threshold-only trigger gap when no current field or fact exists", () => {
    const source = fixture();
    const data = {
      ...source,
      fields: source.fields.filter((field) => field.id !== triggerValueId),
      facts: source.facts.filter((item) => item.field !== triggerValueId),
    };
    render(<Headroom data={data} issuers={issuers} selected={null} onSelect={() => undefined} />);
    const triggers = screen.getByRole("table", { name: "Rating triggers" });
    const gap = within(triggers).getByRole("row", { name: /Downgrade trigger/ });
    expect(gap).toHaveTextContent("Not supplied");
    expect(gap).toHaveTextContent("not computed");
    expect(gap).toHaveTextContent("Written basis.");
    expect(within(gap).getByRole("link", { name: "Open run" })).toHaveAttribute(
      "href",
      expect.stringContaining("beta-folder"),
    );
  });
});
