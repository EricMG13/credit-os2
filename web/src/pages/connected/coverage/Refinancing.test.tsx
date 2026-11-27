import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Coverage, Fact, Issuer } from "../coverageData";
import { Refinancing } from "./Refinancing";

const REFI = "cp-3c/refinancing-need/debt-maturing";
const FOUNDATION = "cp-1/debt-maturities/debt-maturing";
const RESOURCES = "cp-3c/refinancing-need/committed-resources";

function syntheticReply(): { data: Coverage; issuers: Issuer[] } {
  const issuers = ["Alpha", "Beta", "Gamma"].map((name, index): Issuer => ({
    key: `issuer-${String(index)}`,
    name,
    sector: index === 0 ? "Energy" : "Industrials",
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
      ...(index === 1
        ? [
            {
              key: "old-run-beta",
              folder: "old-folder-beta",
              asOf: "2024-12-31",
              pathway: "full",
              pathwayTitle: "Full",
              cells: {},
              other: [],
            },
          ]
        : []),
    ],
  }));
  const facts: Fact[] = [
    fact(issuerAt(issuers, 0), REFI, "FY2027", "9,007,199,254,740,993.01", "USD millions", 1),
    fact(issuerAt(issuers, 0), REFI, "FY2028", "0", "USD millions", 2),
    fact(issuerAt(issuers, 0), RESOURCES, "FY2027", "800", "USD millions", 3),
    fact(issuerAt(issuers, 0), RESOURCES, "FY2028", "0", "USD millions", 4),
    fact(issuerAt(issuers, 0), FOUNDATION, "FY2027", "999", "USD millions", 5),
    fact(issuerAt(issuers, 1), FOUNDATION, "FY2027", "0.09", "USD millions", 6),
    fact(issuerAt(issuers, 1), FOUNDATION, "FY2028", "25", "USD millions", 7),
    fact(issuerAt(issuers, 1), FOUNDATION, "FY2028", "10", "USD thousands", 8),
    fact(issuerAt(issuers, 2), REFI, "FY2027", "", "USD millions", 9, true),
    fact(issuerAt(issuers, 2), REFI, "FY2028", "-100", "USD millions", 10),
    fact(issuerAt(issuers, 1), REFI, "FY2027", "9999", "USD millions", 11, false, 1),
    fact(issuerAt(issuers, 2), FOUNDATION, "FY2027", "777", "USD millions", 12),
    fact(issuerAt(issuers, 0), REFI, "FY2029", "10", "USD millions", 13),
    fact(issuerAt(issuers, 0), REFI, "FY2029", "20", "USD millions", 14),
  ];
  return {
    issuers,
    data: {
      columns: [],
      issuers,
      fields: [
        {
          id: REFI,
          module: "Refinancing & LME",
          group: "Maturity",
          label: "Debt maturing",
          kind: "number",
          series: "period",
        },
        {
          id: FOUNDATION,
          module: "Financial foundation",
          group: "Maturity",
          label: "Debt maturing",
          kind: "number",
          series: "period",
        },
        {
          id: RESOURCES,
          module: "Refinancing & LME",
          group: "Resources",
          label: "Committed resources",
          kind: "number",
          series: "period",
        },
      ],
      facts,
    },
  };
}

function issuerAt(issuers: readonly Issuer[], index: number): Issuer {
  const issuer = issuers[index];
  if (!issuer) throw new Error(`synthetic fixture has no issuer at index ${String(index)}`);
  return issuer;
}

function fact(
  issuer: Issuer,
  field: string,
  period: string,
  text: string,
  unit: string,
  line: number,
  gap = false,
  runIndex = 0,
): Fact {
  const run = issuer.runs[runIndex];
  if (!run) throw new Error("synthetic fixture issuer has no run");
  return {
    issuer: issuer.key,
    run: run.key,
    field,
    period,
    row: null,
    text,
    at: gap ? null : Number(text.replaceAll(",", "")),
    ...(gap ? { gap: true } : {}),
    unit,
    basis: `Basis ${period}`,
    line,
    output: "module.md",
    sha256: "fixture",
  };
}

describe("Refinancing synthetic reply", () => {
  it("prefers source presence in the newest run, falls back only when absent, and sums only drawn amounts", () => {
    const { data, issuers } = syntheticReply();
    render(<Refinancing data={data} issuers={issuers} selected="issuer-0" onSelect={vi.fn()} />);

    const totals = screen.getByRole("table", { name: "Maturity wall totals" });
    const fy27 = within(totals).getByRole("row", { name: /FY2027/ });
    expect(within(fy27).getAllByRole("cell")[0]).toHaveTextContent(
      "$9007199254740993.1m",
    );
    expect(within(fy27).getAllByRole("cell")[1]).toHaveTextContent("2");
    const sourceLinks = within(fy27).getAllByRole("link", { hidden: true });
    expect(sourceLinks).toHaveLength(2);
    expect(sourceLinks[0]).toHaveAttribute("href", expect.stringContaining("folder-0"));
    const fy28 = within(totals).getByRole("row", { name: /FY2028/ });
    expect(within(fy28).getAllByRole("cell")[0]).toHaveTextContent("-$75m");
    expect(
      within(
        screen.getByRole("table", { name: "Debt maturing and committed resources by issuer" }),
      ).getByRole("row", { name: /Alpha/ }),
    ).toHaveTextContent("Refinancing & LME");
    expect(
      within(
        screen.getByRole("table", { name: "Debt maturing and committed resources by issuer" }),
      ).getByRole("row", { name: /Alpha/ }),
    ).toHaveTextContent("Debt: $9,007,199,254,740,993.01m; Resources: $800m");
    expect(
      within(
        screen.getByRole("table", { name: "Debt maturing and committed resources by issuer" }),
      ).getByRole("row", { name: /Beta/ }),
    ).toHaveTextContent("Financial foundation");
    expect(screen.getByText(/USD thousands.*other unit/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Circle: debt maturing. Triangle: committed resources. Both marks use the written amounts and a neutral scale; no share is calculated.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Calendar-year axis")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Debt maturity heat grid" })).toHaveTextContent(
      "Open run",
    );
    expect(screen.getByRole("region", { name: "Refinancing" })).toHaveClass("min-w-0");
    expect(
      screen.getByRole("table", { name: "Debt maturity heat grid" }).parentElement,
    ).toHaveClass("overflow-x-auto");
    fireEvent.change(screen.getByLabelText("Currency or written unit"), {
      target: { value: "USD thousands" },
    });
    const thousandsRow = within(
      screen.getByRole("table", { name: "Maturity wall totals" }),
    ).getByRole("row", { name: /FY2028/ });
    expect(within(thousandsRow).getAllByRole("cell")[0]).toHaveTextContent("10 USD thousands");
    expect(
      screen.getByText(/Debt maturing \$25m in FY2028 \(other unit\)/),
    ).toBeInTheDocument();
  });

  it("keeps a stated gap separate from zero and uses period order for non-calendar labels", () => {
    const { data, issuers } = syntheticReply();
    const malformed = {
      ...data,
      facts: data.facts.map((fact) =>
        fact.field === REFI
          ? {
              ...fact,
              period:
                fact.period === "FY2027"
                  ? "First period"
                  : fact.period === "FY2028"
                    ? "Second period"
                    : fact.period,
            }
          : fact,
      ),
    };
    render(<Refinancing data={malformed} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Columns are in period order")).toBeInTheDocument();
    const heat = screen.getByRole("table", { name: "Debt maturity heat grid" });
    const gamma = within(heat).getByRole("row", { name: /Gamma/ });
    expect(
      within(gamma).getByLabelText("Gamma, First period: no amount stated"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "Second period" } });
    const total = within(screen.getByRole("table", { name: "Maturity wall totals" })).getByRole(
      "row",
      { name: /Second period/ },
    );
    expect(within(total).getAllByRole("cell")[0]).toHaveTextContent("-$100m");
    const issuerRows = screen.getByRole("table", {
      name: "Debt maturing and committed resources by issuer",
    });
    expect(within(issuerRows).getByRole("row", { name: /Alpha/ })).toHaveTextContent(
      "Debt: $0m",
    );
  });

  it("shows duplicate amounts and evidence but leaves them out of marks and totals", () => {
    const { data, issuers } = syntheticReply();
    render(<Refinancing data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "FY2029" } });
    const total = within(screen.getByRole("table", { name: "Maturity wall totals" })).getByRole(
      "row",
      { name: /FY2029/ },
    );
    expect(within(total).getAllByRole("cell")[0]).toHaveTextContent("Multiple amounts left out");
    expect(within(total).getAllByRole("cell")[1]).toHaveTextContent("0");
    const issuerTable = screen.getByRole("table", {
      name: "Debt maturing and committed resources by issuer",
    });
    const alpha = within(issuerTable).getByRole("row", { name: /Alpha/ });
    expect(alpha).toHaveTextContent("$10m; $20m");
    expect(within(alpha).getByText("Open source runs (2)")).toBeInTheDocument();
    const heat = screen.getByRole("table", { name: "Debt maturity heat grid" });
    const alphaHeat = within(heat).getByRole("row", { name: /Alpha/ });
    expect(alphaHeat).toHaveTextContent(
      "Multiple amounts left out: $10m; $20m",
    );
    expect(within(alphaHeat).getByText("Open source runs (4)")).toBeInTheDocument();
  });

  it("keeps equal maturity and resource values as separate neutral marks", () => {
    const { data, issuers } = syntheticReply();
    render(<Refinancing data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "FY2028" } });
    const marks = screen.getByRole("img", {
      name: "Alpha, FY2028: debt maturing and committed resources",
    });
    const debt = marks.querySelector('[data-mark="debt maturing"]');
    const resources = marks.querySelector('[data-mark="committed resources"]');
    expect(debt).toBeInTheDocument();
    expect(resources).toBeInTheDocument();
    expect(debt?.getAttribute("cx")).toBe(resources?.getAttribute("d")?.match(/^M([^ ]+)/)?.[1]);
    expect(debt?.getAttribute("cy")).not.toBe("12");
    expect(screen.queryByText(/%|ratio|share of/)).not.toBeInTheDocument();
  });

  it("draws both signed amounts in the maturity wall without netting them into one issuer", () => {
    const { data, issuers } = syntheticReply();
    render(<Refinancing data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    const wall = screen.getByRole("img", { name: "Maturity wall, stacked by issuer" });
    expect(wall.querySelectorAll(".recharts-bar-rectangle path").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("table", { name: "Maturity wall totals" })).toHaveTextContent(
      "-$75m",
    );
  });

  it("does not use issuer keys as Recharts data paths", () => {
    const { data, issuers } = syntheticReply();
    const keyed = issuers.map((issuer, index) => ({
      ...issuer,
      key: index === 0 ? "period" : index === 1 ? "debt.maturity" : issuer.key,
    }));
    render(
      <Refinancing
        data={{ ...data, issuers: keyed }}
        issuers={keyed}
        selected="period"
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Maturity wall, stacked by issuer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Maturity wall totals" })).toHaveTextContent(
      "$9007199254740993.1m",
    );
  });

  it("shows duplicate committed resources but leaves their marks out", () => {
    const { data, issuers } = syntheticReply();
    const extra = fact(issuerAt(issuers, 0), RESOURCES, "FY2027", "900", "USD millions", 15);
    render(
      <Refinancing
        data={{ ...data, facts: [...data.facts, extra] }}
        issuers={issuers}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "FY2027" } });
    const row = within(
      screen.getByRole("table", { name: "Debt maturing and committed resources by issuer" }),
    ).getByRole("row", { name: /Alpha/ });
    expect(row).toHaveTextContent(
      "Resources: multiple amounts left out ($800m; $900m)",
    );
    expect(row.querySelector('[data-mark="debt maturing"]')).toBeInTheDocument();
    expect(row.querySelector('[data-mark="committed resources"]')).not.toBeInTheDocument();
    expect(within(row).getByText("Open source runs (3)")).toBeInTheDocument();
  });
});

it("orders dated maturities before unplaced labels in their written order", () => {
  const { data, issuers } = syntheticReply();
  const issuer = issuerAt(issuers, 0);
  const facts = ["Thereafter", "FY2031", "At call", "FY2027"].map((period, index) =>
    fact(issuer, REFI, period, "20", "USD millions", index + 1),
  );
  render(<Refinancing data={{ ...data, facts }} issuers={[issuer]} selected={null} onSelect={vi.fn()} />);
  const periods = within(screen.getByRole("combobox", { name: "Period" })).getAllByRole("option");
  expect(periods.map((option) => option.textContent)).toEqual(["FY2027", "FY2031", "Thereafter", "At call"]);
  expect(screen.getByText("Periods that could not be placed are shown last in written order.")).toBeVisible();
});
