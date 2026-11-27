import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Coverage, Fact, Issuer } from "../coverageData";
import { BETTER, NEUTRAL, POSITION, WORSE } from "../visuals/signal/scales";
import { Monitor } from "./Monitor";
import { endDirection, written } from "./monitorMath";

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
  it("formats exact x, percent, and currency units", () => {
    const { issuers } = fixture();
    const issuer = issuers[0] as Issuer;
    expect(written(fact(issuer, fields[0][0], "FY2025", "5.0", "x", 1))).toBe("5.0x");
    expect(written(fact(issuer, fields[0][0], "FY2025", "3.2", "%", 1))).toBe("3.2%");
    expect(written(fact(issuer, fields[0][0], "FY2025", "1,234.50", "USD millions", 1))).toBe(
      "$1,234.50m",
    );
    expect(written(fact(issuer, fields[0][0], "FY2025", "1,234.50", "EUR millions", 1))).toBe(
      "€1,234.50m",
    );
  });

  it("colors only adjacent directional ending observations", () => {
    expect(endDirection(fields[0][0], [null, "5"])).toBeNull();
    expect(endDirection(fields[0][0], ["6", "5"])).toBe("better");
    expect(endDirection(fields[3][0], ["5", "6"])).toBeNull();
  });

  it("shows the tightest issuer-local covenant pair and refuses cross-issuer ranking", () => {
    const { data, issuers } = fixture();
    const issuer = issuers[0] as Issuer;
    const current = fact(issuer, "cp-4/covenant-headroom/current", "FY2025", "3.0", "x", 900);
    const threshold = {
      ...fact(issuer, "cp-4/covenant-headroom/threshold", "FY2025", "4.0", "x", 900),
      direction: "Passes below",
    };
    render(
      <Monitor
        data={{ ...data, facts: [...data.facts, current, threshold] }}
        issuers={issuers}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /not ranked/ })).toBeDisabled();
    expect(
      screen.getByRole("cell", { name: /Alpha plc, tightest covenant test/ }),
    ).toHaveTextContent("Covenant: 3.0x / 4.0x; headroom 1x");
  });

  it("chooses covenant headroom within the most common unit and keeps source order on ties", () => {
    const { data, issuers } = fixture();
    const issuer = issuers[0] as Issuer;
    const pairs = [
      ["3", "4", "x", 900],
      ["5", "6", "x", 901],
      ["100", "100.1", "USD millions", 902],
    ] as const;
    const covenantFacts = pairs.flatMap(([currentValue, thresholdValue, unit, line]) => [
      fact(issuer, "cp-4/covenant-headroom/current", "FY2025", currentValue, unit, line),
      {
        ...fact(issuer, "cp-4/covenant-headroom/threshold", "FY2025", thresholdValue, unit, line),
        direction: "Passes below",
      },
    ]);
    render(
      <Monitor
        data={{ ...data, facts: [...data.facts, ...covenantFacts] }}
        issuers={issuers}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("cell", { name: /Alpha plc, tightest covenant test/ }),
    ).toHaveTextContent("3x / 4x; headroom 1x");
  });

  it("marks ambiguous duplicate covenant counterparts unavailable", () => {
    const { data, issuers } = fixture();
    const issuer = issuers[0] as Issuer;
    const current = fact(issuer, "cp-4/covenant-headroom/current", "FY2025", "3", "x", 900);
    const duplicate = { ...current, text: "2", at: 2 };
    const threshold = {
      ...fact(issuer, "cp-4/covenant-headroom/threshold", "FY2025", "4", "x", 900),
      direction: "Passes below",
    };
    render(
      <Monitor
        data={{ ...data, facts: [...data.facts, current, duplicate, threshold] }}
        issuers={issuers}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    const cell = screen.getByRole("cell", { name: /Alpha plc, tightest covenant test/ });
    expect(cell).toHaveTextContent("Unavailable");
    expect(within(cell).getByText("Unavailable")).toHaveAttribute(
      "title",
      "Ambiguous duplicate covenant row; unavailable",
    );
  });

  it("labels negative covenant headroom as beyond the limit", () => {
    const { data, issuers } = fixture();
    const issuer = issuers[0] as Issuer;
    const current = fact(issuer, "cp-4/covenant-headroom/current", "FY2025", "5", "x", 900);
    const threshold = {
      ...fact(issuer, "cp-4/covenant-headroom/threshold", "FY2025", "4", "x", 900),
      direction: "Passes below",
    };
    render(
      <Monitor
        data={{ ...data, facts: [...data.facts, current, threshold] }}
        issuers={issuers}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("cell", { name: /Alpha plc, tightest covenant test/ }),
    ).toHaveTextContent("beyond the limit −1x");
  });

  it("shows source-bound selected issuer values and the cohort count and median", () => {
    const { data, issuers } = fixture();
    render(<Monitor data={data} issuers={issuers} selected="issuer-0" onSelect={vi.fn()} />);
    expect(screen.getByRole("region", { name: "Monitor cohort summary" })).toHaveTextContent(
      "5 of 5 issuers qualify",
    );
    expect(screen.getByRole("region", { name: "Monitor cohort summary" })).toHaveTextContent(
      "Median (computed): 5x",
    );
    expect(screen.getByRole("region", { name: "Selected issuer details" })).toHaveTextContent(
      "Difference from FY2024: −1x",
    );
    expect(
      screen.getByRole("region", { name: "Selected issuer details" }).querySelectorAll("a"),
    ).toHaveLength(8);
  });

  it("preserves distinct field-qualified exclusion reasons for the same issuer", () => {
    const { data, issuers } = fixture();
    const issuer = issuers[0] as Issuer;
    const facts = data.facts
      .filter(
        (item) =>
          !(item.issuer === issuer.key && item.field === fields[7][0] && item.period === "FY2025"),
      )
      .map((item) =>
        item.issuer === issuer.key && item.field === fields[3][0]
          ? { ...item, unit: "USD millions" }
          : item,
      );
    render(
      <Monitor data={{ ...data, facts }} issuers={issuers} selected={null} onSelect={vi.fn()} />,
    );
    const leftOut = screen.getByRole("region", {
      name: "Issuers left out of one or more measures",
    });
    expect(leftOut).toHaveTextContent("Alpha plc: Cash: other unit");
    expect(leftOut).toHaveTextContent("Debt maturing: other period");
  });

  it("uses the reader label when retained field metadata is absent", () => {
    const { data, issuers } = fixture();
    const field = fields[7][0];
    render(
      <Monitor
        data={{ ...data, fields: data.fields.filter((item) => item.id !== field) }}
        issuers={issuers}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Debt maturing").length).toBeGreaterThan(0);
    expect(screen.queryByText(field)).toBeNull();
  });

  it("shows only a written value and sparkline in a qualified cell with exact trace", () => {
    const { data, issuers } = fixture();
    render(<Monitor data={data} issuers={issuers} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByLabelText("Period")).toHaveValue("FY2025");
    const cell = screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ });
    expect(cell).toHaveTextContent("5.0x");
    expect(within(cell).getByRole("img")).toHaveAccessibleName(/Alpha plc.*FY2024.*FY2025/);
    expect(within(cell).getByRole("img").querySelector("[data-end]")).toHaveStyle({
      fill: BETTER[1],
    });
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
    expect(screen.getByRole("region", { name: "Monitor cohort summary" })).toHaveTextContent(
      "2 of 2 issuers qualify",
    );
    expect(screen.getByRole("region", { name: "Monitor cohort summary" })).toHaveTextContent(
      "Median (computed): —",
    );
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
    expect(screen.getByLabelText("Period")).toHaveValue("Earlier filing");
    const cell = screen.getByRole("cell", { name: /Alpha plc, Total debt \/ EBITDA/ });
    expect(cell).toHaveTextContent("6.0x");
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
    const extended = { ...data, facts: [...data.facts, fact(first, fields[0][0], "FY2026", "100000005", "x", 1000)] };
    render(<Monitor data={extended} issuers={issuers} selected={null} onSelect={vi.fn()} />);
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
