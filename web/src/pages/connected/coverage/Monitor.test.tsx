import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Coverage, Fact, Issuer } from "../coverageData";
import { BETTER, NEUTRAL, POSITION, WORSE } from "../visuals/signal/scales";
import { Monitor } from "./Monitor";

const fields = [
  ["cp-1/leverage/total-debt-ebitda", "Total debt / EBITDA"],
  ["cp-1/leverage/net-debt-ebitda", "Net debt / EBITDA"],
  ["cp-1/interest-cover/ebitda-cash-interest", "EBITDA / cash interest"],
  ["cp-1/liquidity/cash", "Cash"],
  ["cp-1/liquidity/undrawn-committed-facilities", "Undrawn committed facilities"],
  ["cp-1/revenue-and-ebitda/revenue", "Revenue"],
  ["cp-1/revenue-and-ebitda/adjusted-ebitda", "Adjusted EBITDA"],
  ["cp-3c/refinancing-need/debt-maturing", "Debt maturing"],
] as const;

function fixture(): { data: Coverage; issuers: Issuer[] } {
  const issuers: Issuer[] = Array.from({ length: 5 }, (_, index) => ({
    key: `issuer-${String(index)}`,
    name: ["Alpha plc", "Beta SA", "Gamma AG", "Delta Ltd", "Epsilon Inc"][index] as string,
    sector: ["Energy", "Industrials", "Transport", "Energy", "Consumer"][index] as string,
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
  const facts: Fact[] = [];
  const periodValues: Record<string, readonly [readonly string[], readonly string[]]> = {
    [fields[0][0]]: [
      ["6.0", "5.0", "7.0", "4.0", "8.0"],
      ["5.0", "4.0", "6.0", "3.0", "7.0"],
    ],
    [fields[1][0]]: [
      ["5.0", "4.0", "6.0", "3.0", "7.0"],
      ["4.0", "3.0", "5.0", "2.0", "6.0"],
    ],
    [fields[2][0]]: [
      ["5.0", "4.0", "6.0", "3.0", "7.0"],
      ["6.0", "5.0", "7.0", "4.0", "8.0"],
    ],
    [fields[3][0]]: [
      ["5.0", "4.0", "6.0", "3.0", "7.0"],
      ["6.0", "5.0", "7.0", "4.0", "8.0"],
    ],
    [fields[4][0]]: [
      ["3.0", "2.0", "4.0", "1.0", "5.0"],
      ["4.0", "3.0", "5.0", "2.0", "6.0"],
    ],
    [fields[5][0]]: [
      ["9", "19", "29", "39", "49"],
      ["10", "20", "30", "40", "50"],
    ],
    [fields[6][0]]: [
      ["0.9", "1.9", "2.9", "3.9", "4.9"],
      ["1.0", "2.0", "3.0", "4.0", "5.0"],
    ],
    [fields[7][0]]: [
      ["80", "90", "100", "110", "120"],
      ["100", "110", "120", "130", "140"],
    ],
  };
  for (let index = 0; index < issuers.length; index += 1) {
    const issuer = issuers[index] as Issuer;
    for (const [field] of fields.slice(0, 8)) {
      for (const [offset, period] of ["FY2024", "FY2025"].entries()) {
        const value = periodValues[field]?.[offset]?.[index] as string;
        facts.push(fact(issuer, field, period, value, "x", facts.length + 1));
      }
    }
  }
  return {
    issuers,
    data: {
      issuers,
      facts,
      columns: [],
      fields: fields.map(([id, label]) => ({
        id,
        label,
        module: "CP-1",
        group: "Test",
        kind: "number",
        series: "period",
      })),
    },
  };
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
    run: issuer.runs[0]?.key as string,
    field,
    period,
    row: period.startsWith("Test") ? period : null,
    text,
    at: Number(text),
    unit,
    line,
    output: "summary.md",
    sha256: "abc123",
  };
}

describe("Monitor", () => {
  it("shows only a written value and sparkline in a qualified cell with exact trace", () => {
    const { data, issuers } = fixture();
    render(<Monitor data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByLabelText("Period")).toHaveValue("FY2025");
    const cell = screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ });
    expect(cell).toHaveTextContent("5.0x");
    expect(within(cell).getByRole("img")).toHaveAccessibleName(/Alpha plc.*FY2024.*FY2025/);
    expect(
      within(screen.getByRole("row", { name: /Alpha plc/ })).getByRole("link", {
        name: "Open run",
      }),
    ).toHaveAttribute("href", "/report/folder-0#evidence/summary.md~abc123-2");
    expect(cell).toHaveAttribute("title", expect.stringContaining("difference from FY2024 −1"));
  });

  it("uses the ruled tints and gives cash a neutral direction", () => {
    const { data, issuers } = fixture();
    render(<Monitor data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    const leverage = screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ });
    expect(leverage).toHaveStyle({ backgroundColor: BETTER[2] });
    const cash = screen.getByRole("cell", { name: /Alpha plc, Cash/ });
    expect(cash).toHaveStyle({ backgroundColor: NEUTRAL[2] });
    fireEvent.click(screen.getByRole("radio", { name: "Position" }));
    expect(leverage).toHaveStyle({ backgroundColor: POSITION[1] });
  });

  it("uses the worse tint for an adverse change on a ruled lower-is-better field", () => {
    const { data, issuers } = fixture();
    const field = fields[0][0];
    const transformed: Coverage = {
      ...data,
      facts: data.facts.map((item) =>
        item.field === field && item.issuer === "issuer-1" && item.period === "FY2025"
          ? { ...item, text: "6.0", at: 6 }
          : item,
      ),
    };
    render(<Monitor data={transformed} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    const cell = screen.getByRole("cell", { name: /Beta SA, Total debt \/ EBITDA/ });
    expect(cell).toHaveStyle({ backgroundColor: WORSE[2] });
    expect(cell).toHaveAttribute("title", expect.stringContaining("worse"));
  });

  it("selects a row, shows its measures, and sorts stable by the written value", () => {
    const { data, issuers } = fixture();
    const onSelect = vi.fn();
    function Dashboard() {
      const [selected, setSelected] = useState<string | null>("issuer-0");
      return (
        <Monitor
          data={data}
          issuers={issuers}
          selected={selected}
          onSelect={(key) => {
            onSelect(key);
            setSelected(key);
          }}
        />
      );
    }
    render(<Dashboard />);
    const table = screen.getByRole("table", { name: "Monitor" });
    fireEvent.click(within(table).getByRole("row", { name: /Beta SA/ }));
    expect(onSelect).toHaveBeenCalledWith("issuer-1");
    fireEvent.click(screen.getByRole("button", { name: "Sort by Total debt / EBITDA" }));
    const rows = within(table).getAllByRole("row");
    expect(rows[2]).toHaveTextContent("Delta Ltd");
    fireEvent.click(screen.getByRole("button", { name: "Sort by Total debt / EBITDA" }));
    expect(within(table).getAllByRole("row")[2]).toHaveTextContent("Epsilon Inc");
    fireEvent.keyDown(within(table).getByRole("row", { name: /Beta SA/ }), { key: "ArrowDown" });
    expect(onSelect).toHaveBeenLastCalledWith("issuer-3");
  });

  it("leaves a two-issuer cohort untinted and without a quartile band", () => {
    const { data, issuers } = fixture();
    render(
      <Monitor data={data} issuers={issuers.slice(0, 2)} selected={null} onSelect={vi.fn()} />,
    );
    const cell = screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ });
    expect(cell).not.toHaveStyle({ backgroundColor: BETTER[2] });
    expect(cell).not.toHaveStyle({ backgroundColor: POSITION[1] });
    expect(cell).toHaveAttribute("title", expect.stringContaining("no cohort band"));
  });

  it("does not draw a difference or sparkline across unorderable periods", () => {
    const { data, issuers } = fixture();
    const field = fields[0][0];
    const transformed: Coverage = {
      ...data,
      facts: data.facts.map((item) =>
        item.field === field
          ? { ...item, period: item.period === "FY2024" ? "Earlier filing" : "Later filing" }
          : item,
      ),
    };
    render(<Monitor data={transformed} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    const cell = screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ });
    expect(cell).toHaveTextContent("5.0x");
    expect(cell).not.toHaveAttribute("title", expect.stringContaining("difference from"));
    expect(within(cell).queryByRole("img")).toBeNull();
  });

  it("hatches a gap without displaying it as a figure or zero", () => {
    const { data, issuers } = fixture();
    const field = fields[0][0];
    const transformed: Coverage = {
      ...data,
      facts: data.facts.map((item) =>
        item.field === field && item.issuer === "issuer-4" && item.period === "FY2025"
          ? { ...item, text: "", at: null, gap: true }
          : item,
      ),
    };
    render(<Monitor data={transformed} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    const row = screen.getByRole("row", { name: /Epsilon Inc/ });
    const cell = within(row).getAllByRole("cell")[0];
    expect(cell).toHaveClass("gap-hatch");
    expect(cell).toBeEmptyDOMElement();
    expect(cell).toHaveAttribute("title", "no figure");
  });

  it("uses neutral tint for a negative leverage multiple", () => {
    const { data, issuers } = fixture();
    const field = fields[0][0];
    const transformed: Coverage = {
      ...data,
      facts: data.facts.map((item) =>
        item.field === field && item.issuer === "issuer-0"
          ? {
              ...item,
              text: item.period === "FY2024" ? "-1.0" : "-2.0",
              at: item.period === "FY2024" ? -1 : -2,
            }
          : item,
      ),
    };
    render(<Monitor data={transformed} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    const cell = screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ });
    expect(cell).toHaveStyle({ backgroundColor: NEUTRAL[2] });
    expect(cell).not.toHaveAttribute("title", expect.stringContaining("better"));
    expect(cell).not.toHaveAttribute("title", expect.stringContaining("worse"));
  });

  it("draws a series whose middle point lies less than a millionth of the range from the minimum", () => {
    const { data, issuers } = fixture();
    const first = issuers[0] as Issuer;
    data.facts.push(fact(first, fields[0][0], "FY2026", "100000005", "x", 1000));
    render(<Monitor data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ })).toHaveTextContent("100000005");
  });

  it("keeps extreme finite written decimals inside the chart pixel bounds", () => {
    const { data, issuers } = fixture();
    const field = fields[0][0];
    const transformed: Coverage = {
      ...data,
      facts: data.facts.map((item) =>
        item.field === field
          ? { ...item, text: item.period === "FY2024" ? "9".repeat(400) : "8".repeat(400) }
          : item,
      ),
    };
    const { container } = render(
      <Monitor data={transformed} issuers={issuers} selected={null} onSelect={vi.fn()} />,
    );
    const points = [...container.querySelectorAll("polygon, polyline")].flatMap((shape) => [
      shape.getAttribute("points") ?? "",
      shape.getAttribute("d") ?? "",
    ]);
    expect(points.join(" ")).not.toMatch(/NaN|Infinity/);
  });
});
