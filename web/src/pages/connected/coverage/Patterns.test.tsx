import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Coverage, Fact, Issuer } from "../coverageData";
import { Patterns } from "./Patterns";

const debt = "cp-1/leverage/total-debt-ebitda";
const cover = "cp-1/interest-cover/ebitda-cash-interest";
const fields = [
  {
    id: debt,
    label: "Total debt / EBITDA",
    module: "CP-1",
    group: "Leverage",
    kind: "number" as const,
    series: "period" as const,
  },
  {
    id: cover,
    label: "EBITDA / cash interest",
    module: "CP-1",
    group: "Cover",
    kind: "number" as const,
    series: "period" as const,
  },
];

function fixture(): { data: Coverage; issuers: Issuer[] } {
  const issuers = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].map((name, index): Issuer => ({
    key: `issuer-${String(index)}`,
    name,
    sector: ["Energy", "Industrials", "Transport", "Consumer", "Energy"][index] ?? null,
    runs: [
      {
        key: `run-${String(index)}`,
        folder: `folder-${String(index)}`,
        asOf: "2025-12-31",
        pathway: "full",
        pathwayTitle: "Full",
        cells: {},
        other: [],
      },
    ],
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
    facts.push(
      fact(
        issuer,
        cover,
        "FY2026",
        coverValues[index] ?? "0",
        index === 4 ? "USD millions" : "x",
        facts.length + 1,
      ),
    );
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
  return {
    issuer: issuer.key,
    run: issuer.runs[0]?.key ?? "",
    field,
    period,
    row: null,
    text,
    at: Number(text),
    unit,
    line,
    output: "summary.md",
    sha256: "source",
  };
}

describe("Patterns", () => {
  it("draws exact level/difference and the two-measure intersection", () => {
    const { data, issuers } = fixture();
    render(<Patterns data={data} issuers={issuers} selected="issuer-0" onSelect={vi.fn()} />);

    expect(screen.getByLabelText("Measure")).toHaveValue(debt);
    expect(screen.getByLabelText("Period")).toHaveValue("FY2026");
    const level = screen.getByRole("table", { name: "Level versus difference data" });
    expect(within(level).getByRole("row", { name: /Alpha.*FY2026/ })).toHaveTextContent("7x");
    expect(within(level).getByRole("row", { name: /Alpha.*FY2026/ })).toHaveTextContent("−1x");
    expect(within(level).getByRole("row", { name: /Median \(computed\)/ })).toHaveTextContent(
      "28x",
    );
    expect(within(level).getByRole("row", { name: /Median \(computed\)/ })).toHaveTextContent(
      "−2x",
    );
    expect(
      within(level)
        .getByRole("row", { name: /Median \(computed\)/ })
        .querySelectorAll("td"),
    ).toHaveLength(6);
    expect(
      screen.getByRole("region", { name: "Issuers not plotted in level versus difference" }),
    ).toHaveTextContent("Epsilon: Total debt / EBITDA: other period");

    const two = screen.getByRole("table", { name: "Two measures data" });
    expect(within(two).getAllByRole("row")).toHaveLength(5);
    expect(within(two).getByRole("row", { name: /Alpha/ })).toHaveTextContent("7x");
    expect(
      screen.getByRole("region", { name: "Issuers left out of two measures" }),
    ).toHaveTextContent("Epsilon: EBITDA / cash interest: other unit");

    const selectedRow = within(two).getByRole("row", { name: /Alpha/ });
    expect(selectedRow).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("img", { name: /fitted line/i })).toBeNull();
  });

  it("does not draw time series when the selected field periods cannot be ordered", () => {
    const { data, issuers } = fixture();
    const unordered = {
      ...data,
      facts: data.facts.map((item) =>
        item.field === debt
          ? { ...item, period: item.period === "FY2024" ? "Earlier filing" : "Later filing" }
          : item,
      ),
    };
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
    expect(
      screen.getByRole("region", { name: "Issuers without an adjacent prior period" }),
    ).toHaveTextContent("Alpha: no adjacent prior period");
  });

  it("keeps the period control selection when changing the measure", () => {
    const { data, issuers } = fixture();
    render(<Patterns data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "FY2025" } });
    fireEvent.change(screen.getByLabelText("Measure"), { target: { value: cover } });
    expect(screen.getByLabelText("Period")).toHaveValue("FY2025");
  });
});
