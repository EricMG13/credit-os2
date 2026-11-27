// Synthetic unblocked CP-3D handoff. The retained TDG fixture is blocked and has its own tests.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { MarketLead } from "./cp3d";
import { leadProps } from "./lead.fixture";

it.each(["Evaluated price (per SEC filing)", "Evaluated price per 10-K"])(
  "retains the evaluated price and no-trade qualification when the source class is %s",
  (sourceClass) => {
    const title = "Yield against maturity";
    const headers = [
      "Instrument",
      "Maturity date",
      "Yield",
      "Spread",
      "Quote date",
      "Source class",
      "Reporting unit",
      "Basis and limitation",
    ];
    const output = entry(
      "CP-3D",
      [{ title, table: 4, kind: "scatter", unit: "%" }],
      [
        section(
          "Chart data: yield against maturity",
          3,
          table(4, headers, [
            ["Notes 2027", "2027-05-01", "6.10", "181 bp", "2026-03-02", "Last trade", "%", ""],
            [
              "Notes 2029",
              "2029-07-01",
              "7.25",
              "212 bp",
              "2026-03-02",
              sourceClass + "; no trade corroboration from dealer_quotes.xlsx, page 4",
              "%",
              "Yield inferred from evaluated prices; no transaction confirmed (quote_tape.xlsx p. 2). Annual report.",
            ],
            ["Notes 2031", "2031-12-01", "8.00", "240 bp", "2026-03-02", "Last trade", "%", ""],
            [
              "Loan 2033",
              "2033-12-01",
              "Not supplied: no yield quote",
              "",
              "2026-03-02",
              "Indicative",
              "%",
              "No executable size is established; available positions start at 10K.",
            ],
          ]),
        ),
      ],
    );

    render(<MarketLead {...leadProps(output)} />);
    const tile = within(screen.getByRole("region", { name: title }));
    const figure = tile.getByRole("img");
    expect(figure.querySelectorAll("[data-point]")).toHaveLength(3);
    expect(figure).toHaveAccessibleName(
      /Notes 2029 matures 2029-07-01 at 7.25%.*Evaluated price.*no trade corroboration/i,
    );
    expect(figure).not.toHaveAccessibleName(
      /SEC filing|10-K|annual report|dealer_quotes|quote_tape/i,
    );
    expect(tile.queryByText("Observed yield")).toBeNull();
    const points = within(tile.getByRole("list", { name: "Instruments by maturity" }));
    const evaluated = points.getByText("Notes 2029").closest("li");
    expect(evaluated).toHaveTextContent("7.25%");
    expect(evaluated).toHaveTextContent(/Evaluated price; no trade corroboration/i);
    expect(evaluated).toHaveTextContent(
      /Yield inferred from evaluated prices; no transaction confirmed/i,
    );
    expect(tile.queryByText(/SEC filing|10-K|annual report|dealer_quotes|quote_tape/i)).toBeNull();
    const unplaced = within(tile.getByRole("list", { name: "Instruments not placed" }));
    expect(unplaced.getByText("Loan 2033").closest("li")).toHaveTextContent(
      "No executable size is established; available positions start at 10K.",
    );

    fireEvent.click(tile.getByRole("button", { name: "Table" }));
    expect(
      tile.getByRole("cell", { name: /Evaluated price; no trade corroboration/i }),
    ).toBeVisible();
    expect(
      tile.getByRole("cell", {
        name: /Yield inferred from evaluated prices; no transaction confirmed/i,
      }),
    ).toBeVisible();
    expect(tile.queryByText(/SEC filing|10-K|annual report|dealer_quotes|quote_tape/i)).toBeNull();
  },
);
