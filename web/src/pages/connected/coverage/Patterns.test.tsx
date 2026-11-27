import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { evidenceLink, type Coverage, type Fact, type Issuer } from "../coverageData";
import { Patterns, scaleWithReference } from "./Patterns";

const debt = "cp-1/leverage/total-debt-ebitda";
const cover = "cp-1/interest-cover/ebitda-cash-interest";
const field = (id: string, label: string, group: string) => ({
  id, label, group, module: "CP-1", kind: "number" as const, series: "period" as const,
});
const fields = [field(debt, "Total debt / EBITDA", "Leverage"), field(cover, "EBITDA / cash interest", "Cover")];

function fixture(): { data: Coverage; issuers: Issuer[] } {
  const issuers: Issuer[] = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].map((name, index) => ({
    key: `issuer-${String(index)}`, name, sector: ["Energy", "Industrials", "Transport", "Consumer", "Energy"][index] ?? null,
    runs: [{ key: `run-${String(index)}`, folder: `folder-${String(index)}`, asOf: "2025-12-31", pathway: "full", pathwayTitle: "Full", cells: {}, other: [] }],
  }));
  const debtValues = [
    ["10", "8", "7"],
    ["20", "19", "17"],
    ["30", "31", "28"],
    ["40", "38", "36"],
    ["50", null, "48"],
  ];
  const coverValues = ["2", "3", "4", "5", "6"];
  const facts: Fact[] = [];
  for (const [index, issuer] of issuers.entries()) {
    for (const [periodIndex, period] of ["FY2024", "FY2025", "FY2026"].entries()) {
      const text = debtValues[index]?.[periodIndex];
      if (text !== null && text !== undefined)
        facts.push(fact(issuer, debt, period, text, "x", facts.length + 1));
    }
    const coverText = coverValues[index];
    if (coverText === undefined) throw new Error("issuer fixture has no cash interest cover value");
    facts.push(fact(issuer, cover, "FY2026", coverText, index === 4 ? "USD millions" : "x", facts.length + 1));
  }
  return { data: { columns: [], issuers, fields, facts }, issuers };
}

function fact(
  issuer: Issuer,
  field: string,
  period: string,
  text: string,
  unit: string,
  line: number,
): Fact {
  const run = issuer.runs[0];
  if (!run) throw new Error("issuer fixture has no run");
  return {
    issuer: issuer.key,
    run: run.key,
    field,
    period,
    row: null,
    text,
    at: Number(text),
    unit,
    heading: field === debt ? "Reported debt / EBITDA" : "Reported cash interest cover",
    basis: `${period} issuer basis`,
    line,
    output: "summary.md",
    sha256: "source",
  };
}

function unorder(data: Coverage, issuer?: string): Coverage {
  return { ...data, facts: data.facts.map((item) => item.field === debt && (!issuer || item.issuer === issuer)
    ? { ...item, period: item.period === "FY2024" ? "Earlier filing" : "Later filing" } : item) };
}

describe("Patterns", () => {
  it("draws exact level/difference and the two-measure intersection", () => {
    const { data, issuers } = fixture();
    render(<Patterns data={data} issuers={issuers} selected="issuer-0" onSelect={vi.fn()} />);
    const scale = scaleWithReference(["7", "17", "28", "36"], "28");
    expect(scale.points[2]).toBe(scale.reference);
    expect(scale.reference).toBe(72.4137931);
    expect(scaleWithReference(["7", "17", "28", "36"], "48")).toMatchObject({
      bounds: ["7", "48"], reference: 100,
    });

    expect(screen.getByLabelText("Measure")).toHaveValue(debt);
    expect(screen.getByLabelText("Period")).toHaveValue("FY2026");
    const plot = screen.getByRole("img", { name: "Level against difference scatter chart" });
    expect(plot.querySelector("p")?.textContent).toBe("Difference from prior (x)");
    const level = screen.getByRole("table", { name: "Level versus difference data" });
    const medianRow = within(level).getByRole("row", { name: /Median \(computed\)/ });
    expect(
      within(level).getByRole("columnheader", { name: "Reported debt / EBITDA (x)" }),
    ).toBeInTheDocument();
    const alphaRow = within(level)
      .getAllByRole("row", { name: /Alpha.*FY2026/ })
      .find((row) => row.querySelector("button")?.textContent === "Alpha");
    if (!alphaRow) throw new Error("Alpha issuer row is missing");
    expect(alphaRow).toHaveTextContent(/7x.*−1x/);
    expect(medianRow).toHaveTextContent(/28x.*−2x.*Current cohort: 5; paired: 4/);
    expect(
      within(level)
        .getByRole("row", { name: /Median \(computed\)/ })
        .querySelectorAll("td"),
    ).toHaveLength(6);
    const evidence = within(medianRow).getByText("Open run evidence");
    expect(evidence.closest("details")).not.toHaveAttribute("open");
    fireEvent.click(evidence);
    const epsilon = issuers.find((issuer) => issuer.key === "issuer-4");
    const epsilonFact = data.facts.find((fact) => fact.issuer === "issuer-4" && fact.field === debt && fact.period === "FY2026");
    const epsilonRun = epsilon?.runs[0];
    if (!epsilon || !epsilonFact || !epsilonRun) throw new Error("Epsilon current median fixture is incomplete");
    expect(within(medianRow).getByText(/Current median input FY2026: 48x; basis FY2026 issuer basis/)).toBeInTheDocument();
    expect(within(medianRow).getByRole("link", { name: "Open run for Epsilon" })).toHaveAttribute("href", evidenceLink(epsilonRun, epsilonFact));
    expect(
      screen.getByRole("region", { name: "Issuers not plotted in level versus difference" }),
    ).toHaveTextContent("Epsilon: Total debt / EBITDA: other period");

    const two = screen.getByRole("table", { name: "Two measures data" });
    expect(within(two).getAllByRole("row")).toHaveLength(5);
    expect(within(two).getByRole("row", { name: /Alpha/ })).toHaveTextContent("7x");
    expect(within(two).getByRole("columnheader", { name: "Reported debt / EBITDA (x)" })).toBeInTheDocument();
    expect(within(two).getByRole("columnheader", { name: "Reported cash interest cover (x)" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Issuers left out of two measures" }),
    ).toHaveTextContent("Epsilon: EBITDA / cash interest: other unit");

    const selectedRow = within(two).getByRole("row", { name: /Alpha/ });
    expect(selectedRow).toHaveAttribute("aria-selected", "true");
    expect(within(two).getAllByRole("link", { name: /Open run/ })).toHaveLength(4);
    expect(within(selectedRow).getByRole("link", { name: /Open run/ })).toHaveAccessibleName(
      /X FY2026: 7x; basis FY2026 issuer basis; Y FY2026: 2x; basis FY2026 issuer basis/i,
    );
    expect(within(alphaRow).getByRole("link", { name: /Open run/ })).toHaveAccessibleName(
      /current FY2026: 7x; basis FY2026 issuer basis; prior FY2025: 8x; basis FY2025 issuer basis/i,
    );
    expect(
      within(level).getAllByRole("link", { name: /Open run/ }).filter((link) => !medianRow.contains(link)),
    ).toHaveLength(4);
    expect(within(medianRow).getAllByRole("link", { name: /Open run/ })).toHaveLength(5);
    expect(screen.queryByRole("img", { name: /fitted line/i })).toBeNull();
  });

  it("does not draw time series when the selected field periods cannot be ordered", () => {
    const { data, issuers } = fixture();
    const unordered = unorder(data);
    const { rerender } = render(
      <Patterns data={unordered} issuers={issuers} selected={null} onSelect={vi.fn()} />,
    );
    expect(screen.getAllByText(/periods cannot be put in time order/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("table", { name: "Two measures data" })).toBeInTheDocument();
    const onePeriod = {
      ...data,
      facts: data.facts.filter((item) => item.period === "FY2026"),
    };
    rerender(<Patterns data={onePeriod} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    const onePeriodTable = screen.getByRole("table", { name: "Level versus difference data" });
    const alpha = within(onePeriodTable).getByRole("row", { name: /Alpha.*FY2026/ });
    expect(alpha).toHaveTextContent("7x");
    expect(alpha).toHaveTextContent("No adjacent prior period");
    expect(within(alpha).getByRole("link", { name: /Open run/ })).toHaveAccessibleName(/FY2026: 7x.*basis FY2026 issuer basis/i);
  });

  it("keeps sparse table facts and states a gap without empty plots or zero medians", () => {
    const { data, issuers } = fixture();
    const sparse = issuers.slice(0, 2);
    const { rerender } = render(
      <Patterns data={data} issuers={sparse} selected={null} onSelect={vi.fn()} />,
    );
    expect(screen.queryByRole("img", { name: "Level against difference scatter chart" })).toBeNull();
    expect(screen.queryByRole("img", { name: "Two measures scatter chart" })).toBeNull();
    expect(screen.getByRole("table", { name: "Level versus difference data" })).toHaveTextContent(
      "Alpha",
    );
    expect(screen.getByRole("table", { name: "Two measures data" })).toHaveTextContent("7x");
    expect(within(screen.getByRole("table", { name: "Level versus difference data" })).queryByRole("row", { name: /Median/ })).toBeNull();
    expect(screen.getAllByText(/fewer than three qualifying issuers/i)).toHaveLength(2);
    expect(screen.queryByText(/paired 0|Current 0/i)).toBeNull();

    rerender(<Patterns data={data} issuers={issuers.slice(0, 3)} selected={null} onSelect={vi.fn()} />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(within(screen.getByRole("table", { name: "Level versus difference data" })).getByRole("row", { name: /Median/ })).toHaveTextContent("Current cohort: 3; paired: 3");

    rerender(<Patterns data={data} issuers={[]} selected={null} onSelect={vi.fn()} />);
    expect(screen.queryByRole("img", { name: "Level against difference scatter chart" })).toBeNull();
    expect(screen.queryByRole("img", { name: "Two measures scatter chart" })).toBeNull();
    expect(screen.queryByText(/0(?:x|; paired)/i)).toBeNull();
    expect(screen.getAllByText(/no qualifying figures|no issuers qualify on both measures/i)).toHaveLength(2);
  });
});
