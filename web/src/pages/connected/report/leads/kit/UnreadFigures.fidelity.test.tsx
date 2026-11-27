import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { entry, section, table } from "../../overview/rows.fixture";
import { leadProps } from "../fixtures/load";
import { UnreadFigures } from "./UnreadFigures";

function show(headers: string[], rows: string[][]) {
  const chart = entry("CP-1D", [], [section("Chart data: balances", 10, table(11, headers, rows))]);
  render(<UnreadFigures lead={leadProps(chart)} drawn={[]} />);
  return screen.getByRole("region", { name: "Balances" });
}

function showTable(tile: HTMLElement) {
  fireEvent.click(within(tile).getByRole("button", { name: "Table view: Balances" }));
  return within(tile).getByRole("table", { name: "Balances" });
}

describe("Unread figure fidelity to synthetic chart tables", () => {
  it.each(["Unit", "Reporting unit"])("retains the EUR scale for 50 under %s", (header) => {
    const tile = show(["Measure", "Amount", header], [["Cash", "50", "EUR millions"]]);
    expect(tile.querySelector('[data-cell="Amount"]')?.textContent).toBe("50");
    expect(within(tile).getByText("€m, each figure as stated")).toBeVisible();
    const readerTable = showTable(tile);
    expect(within(readerTable).getByRole("cell", { name: "50" })).toBeVisible();
    expect(within(tile).getByText("€m, each figure as stated")).toBeVisible();
  });

  it.each(["Unit", "Reporting unit"])(
    "keeps the shared EUR unit and hides all locators under %s",
    (header) => {
      const tile = show(
        ["Measure", "Amount", header],
        [
          ["Cash", "50", "EUR millions per issuer.pdf page 3"],
          ["Other cash", "10", "EUR millions [E1]"],
        ],
      );
      expect(within(tile).getByText("€m, each figure as stated")).toBeVisible();
      expect(tile.querySelector('[data-cell="Amount"]')?.textContent).toBe("50");
      expect(tile.textContent).not.toMatch(/issuer\.pdf|page 3|\[E1\]/);
      expect(
        within(showTable(tile))
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      ).toEqual(["Cash", "50", "Other cash", "10"]);
      expect(within(tile).getByText("€m, each figure as stated")).toBeVisible();
    },
  );

  it("keeps recognized mixed units and suppresses unrecognized source-bearing unit text", () => {
    const tile = show(
      ["Measure", "Amount", "Unit"],
      [
        ["Cash", "50", "EUR millions per issuer.pdf page 3"],
        ["Rate", "4", "% [E1]"],
        ["Count", "8", "widgets"],
        ["Other", "9", "unclear unit per issuer.pdf page 3"],
      ],
    );
    expect(tile.querySelector('li[data-row="Cash"]')?.textContent).toBe("Cash · €mAmount50");
    expect(tile.querySelector('li[data-row="Rate"]')?.textContent).toBe("Rate · %Amount4");
    expect(tile.querySelector('li[data-row="Count"]')?.textContent).toBe("Count · widgetsAmount8");
    expect(tile.querySelector('li[data-row="Other"]')?.textContent).toBe("OtherAmount9");
    expect(tile.textContent).not.toMatch(/issuer\.pdf|page 3|\[E1\]|unclear unit/);
    expect(
      within(showTable(tile))
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Cash", "50", "€m", "Rate", "4", "%", "Count", "8", "widgets", "Other", "9", ""]);
  });

  it("preserves the written scale and withholds an unrecognized currency label before a source", () => {
    const tile = show(
      ["Measure", "Amount", "Reporting unit"],
      [
        ["Contracts", "8", "10K contracts"],
        ["Volume", "9", "ABC metadata per issuer.pdf page 3"],
      ],
    );
    expect(tile.querySelector('li[data-row="Contracts"]')?.textContent).toBe(
      "Contracts · 10K contractsAmount8",
    );
    expect(tile.querySelector('li[data-row="Volume"]')?.textContent).toBe("VolumeAmount9");
    expect(
      within(showTable(tile))
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Contracts", "8", "10K contracts", "Volume", "9", ""]);
  });

  it.each([
    ["USD/share per issuer.pdf page 3", "USD/share"],
    ["EUR millions; Source: internal register", "€m"],
    ["EUR trillions per issuer.pdf page 3", "EUR trillions"],
    ["EUR 000s per issuer.pdf page 3", "EUR 000s"],
    ["EUR per share per issuer.pdf page 3", "EUR per share"],
    ["EUR per share", "EUR per share"],
    ["USD per 10K", "USD per 10K"],
    ["EUR millions per 10-K (p. 3)", "€m"],
    ["EUR millions per issuer.pdf, p. 3", "€m"],
    ["EUR millions (Annual p. 3)", "€m"],
    ["EUR millions per [E1]", "€m"],
    ["EUR millions per issuer.pdf on an adjusted basis", ""],
    ["USD cents per issuer.pdf page 3", "USD cents"],
    ['"10K contracts"', '"10K contracts"'],
    ["EUR millions per SEC filing", "€m"],
    ["EUR millions per Source 4", "€m"],
    ["EUR metadata per SEC filing", ""],
  ])("draws the complete unit and amount in both views for %s", (written, visible) => {
    const tile = show(
      ["Measure", "Amount", "Unit"],
      [
        ["Cash", "50", written],
        ["Rate", "4", "%"],
      ],
    );
    expect(tile.querySelector('li[data-row="Cash"]')?.textContent).toBe(
      visible ? `Cash · ${visible}Amount50` : "CashAmount50",
    );
    expect(tile.textContent).not.toMatch(
      /issuer\.pdf|page 3|p\. 3|10-K|SEC filing|Source 4|metadata|\[E1\]/,
    );
    expect(tile.textContent).not.toContain("Source: internal register");
    expect(within(tile).getByRole("link", { name: "Source for balances" })).toHaveAttribute(
      "href",
      "/report/run#evidence/run%2FCP-1D~hash-CP-1D-11",
    );
    expect(
      within(showTable(tile))
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Cash", "50", visible, "Rate", "4", "%"]);
  });

  it("keeps each mixed currency scale attached to its figure in both views", () => {
    const tile = show(
      ["Measure", "Amount", "Unit"],
      [
        ["Cash", "50", "EUR millions"],
        ["Debt", "120", "USD millions"],
      ],
    );
    expect(tile.querySelector('li[data-row="Cash"]')?.textContent).toBe("Cash · €mAmount50");
    expect(tile.querySelector('li[data-row="Debt"]')?.textContent).toBe("Debt · $mAmount120");
    expect(
      within(showTable(tile))
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Cash", "50", "€m", "Debt", "120", "$m"]);
  });

  it.each([
    ["Downstream use", "Measure", "Amount", "Reporting unit"],
    ["Measure", "Amount", "Reporting unit", "Downstream use"],
  ])("projects reader columns when the source headers are %j", (...headers) => {
    const values = new Map([
      ["Downstream use", "Send these figures onward"],
      ["Measure", "Cash"],
      ["Amount", "50"],
      ["Reporting unit", "EUR millions"],
    ]);
    const tile = show(headers, [headers.map((header) => values.get(header) ?? "")]);
    expect(tile.textContent).not.toContain("Downstream use");
    expect(tile.textContent).not.toContain("Send these figures onward");
    expect(tile.querySelector('li[data-row="Cash"] [data-cell="Amount"]')?.textContent).toBe("50");
    const readerTable = showTable(tile);
    expect(
      within(readerTable)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Measure", "Amount"]);
    expect(
      within(readerTable)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Cash", "50"]);
  });
});
