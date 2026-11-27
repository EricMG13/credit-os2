import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Coverage, Fact, Issuer } from "../coverageData";
import { Market } from "./Market";

const YIELD = "cp-3d/yield-against-maturity/yield";
const alphaRun = {
  key: "alpha-new",
  folder: "alpha-new-folder",
  asOf: "2025-03-21",
  pathway: "full",
  pathwayTitle: "Full",
  cells: {},
  other: [],
};
const alphaOldRun = {
  ...alphaRun,
  key: "alpha-old",
  folder: "alpha-old-folder",
  asOf: "2024-03-21",
};
const betaRun = { ...alphaRun, key: "beta-new", folder: "beta-new-folder" };
const issuers: Issuer[] = [
  { key: "alpha", name: "Alpha", sector: "Energy", runs: [alphaRun, alphaOldRun] },
  { key: "beta", name: "Beta", sector: "Energy", runs: [betaRun] },
];

function fact(
  issuer: string,
  run: string,
  row: string,
  text: string,
  line: number,
  basis: string,
  unit = "%",
  quoteDate?: string,
): Fact {
  return {
    issuer,
    run,
    field: YIELD,
    row,
    period: null,
    text,
    at: /^[-+]?\d+(?:\.\d+)?$/.test(text) ? Number(text) : null,
    unit,
    ...(quoteDate ? { quoteDate } : {}),
    basis,
    line,
    output: `${run}/market.md`,
    sha256: "d".repeat(64),
  };
}

function fixture(facts: Fact[] = []): Coverage {
  return {
    columns: [{ code: "CP-3D", title: "Market-implied risk" }],
    issuers,
    fields: [
      {
        id: YIELD,
        module: "CP-3D",
        group: "Yield against maturity",
        label: "Yield",
        kind: "number",
        series: "row",
      },
    ],
    facts,
  };
}

describe("Market", () => {
  it("shows the maturity and yield gap for each issuer when no typed yields exist", () => {
    render(<Market data={fixture()} issuers={issuers} selected={null} onSelect={() => {}} />);

    expect(
      screen.getByText("This page could not read yields and maturities for 2 issuers."),
    ).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Market observations" });
    expect(within(table).getByRole("row", { name: /Alpha/ })).toHaveTextContent("No typed yield");
    expect(within(table).getByRole("row", { name: /Beta/ })).toHaveTextContent("No typed yield");
    expect(within(table).getByRole("row", { name: /Alpha/ }).querySelectorAll("a")).toHaveLength(1);
    expect(within(table).getByRole("row", { name: /Beta/ }).querySelectorAll("a")).toHaveLength(1);
    expect(
      screen.getByText(/Maturity is not a typed figure and cannot be placed\./),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /scatter|yield against maturity/i })).toBeNull();
  });

  it("shows newest-run typed yields as written with dates, units, basis and one trace per row", () => {
    const current = [
      fact(
        "alpha",
        alphaRun.key,
        "Senior note 2028",
        "6.40",
        31,
        "Dealer midpoint, indicative.",
        "%",
        "2025-02-14",
      ),
      fact(
        "alpha",
        alphaRun.key,
        "Senior note 2030",
        "Not supplied: quote unavailable",
        32,
        "No executable quote.",
        "%",
        "Not supplied: quote date unavailable",
      ),
    ];
    const old = fact("alpha", alphaOldRun.key, "Older note 2027", "5.90", 9, "Old quote.");
    render(
      <Market
        data={fixture([...current, old])}
        issuers={issuers}
        selected={null}
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByText("This page could not read yields and maturities for 2 issuers."),
    ).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Market observations" });
    const currentRow = within(table).getByRole("row", { name: /Alpha Senior note 2028/ });
    expect(currentRow).toHaveTextContent("6.40 %");
    expect(within(currentRow).getByText("2025-03-21", { selector: "time" })).toHaveAttribute(
      "dateTime",
      "2025-03-21",
    );
    expect(currentRow).toHaveTextContent("2025-02-14");
    expect(currentRow).toHaveTextContent("Dealer midpoint, indicative.");
    expect(within(currentRow).getByRole("link", { name: "Open run" })).toHaveAttribute(
      "href",
      expect.stringContaining("alpha-new-folder"),
    );
    expect(within(currentRow).getAllByRole("link")).toHaveLength(1);

    const gapRow = within(table).getByRole("row", { name: /Alpha Senior note 2030/ });
    expect(gapRow).toHaveTextContent("Not supplied: quote unavailable");
    expect(gapRow).toHaveTextContent("No executable quote.");
    expect(gapRow).toHaveTextContent("Not supplied: quote date unavailable");
    expect(within(gapRow).getAllByRole("link")).toHaveLength(1);
    expect(within(table).queryByRole("row", { name: /Older note 2027/ })).toBeNull();
    expect(within(table).getByRole("row", { name: /Beta/ })).toHaveTextContent("No typed yield");
    expect(
      screen.getByText(/Maturity is not a typed figure and cannot be placed\./),
    ).toBeInTheDocument();
  });

  it("keeps the issuer selection shared with the other tabs", () => {
    let selected = "alpha";
    const renderMarket = () =>
      render(
        <Market
          data={fixture([fact("alpha", alphaRun.key, "Note 2028", "6.40", 31, "Written basis.")])}
          issuers={issuers}
          selected={selected}
          onSelect={(issuer) => {
            selected = issuer;
          }}
        />,
      );
    renderMarket();
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    expect(selected).toBe("beta");
  });
});
