// The retained TransDigm FY2024 CP-1 handoff (outdated evidence: shape and scope only) for the
// "Interest cover" and "Debt stack" charts; the add-back share table is synthetic, built from the
// review's L13 case ("Chart data: add-back share"); not a real handoff. Expected values are
// written out by hand from the fixture's tables.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { entry, section, table } from "../../overview/rows.fixture";
import { cp1Entry, leadProps } from "../fixtures/load";
import { chartTitles, UnreadFigures } from "./UnreadFigures";

const CP1_TITLES = [
  "Leverage",
  "Interest cover",
  "Liquidity",
  "Debt maturities",
  "Revenue and EBITDA",
  "Debt stack",
  "EBITDA bridge",
];

const drawnBut = (...unread: string[]) => CP1_TITLES.filter((title) => !unread.includes(title));

describe("chartTitles", () => {
  it("lists every Chart data section of the retained CP-1 handoff, as the store titles them", () => {
    expect(chartTitles(cp1Entry())).toEqual(CP1_TITLES);
  });
});

describe("UnreadFigures", () => {
  it("draws nothing when the lead draws every chart, whatever the case of the titles", () => {
    const { container } = render(
      <UnreadFigures
        lead={leadProps(cp1Entry())}
        drawn={CP1_TITLES.map((title) => title.toUpperCase())}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("lists the interest cover figures as stated, the unit as the kicker, no basis text", () => {
    render(<UnreadFigures lead={leadProps(cp1Entry())} drawn={drawnBut("Interest cover")} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Interest cover");
    expect(tile.textContent).toContain("x, each figure as stated");
    const rows = [...tile.querySelectorAll("li[data-row]")];
    expect(rows.map((row) => row.getAttribute("data-row"))).toEqual([
      "FY2023 / 2023-09-30",
      "FY2024 / 2024-09-30",
    ]);
    expect(
      rows.map((row) => row.querySelector('[data-cell="EBITDA / cash interest"]')?.textContent),
    ).toEqual(["2.71", "3.29"]);
    expect(tile.textContent).not.toContain("p71");
    expect(tile.textContent).not.toContain("Reported EBITDA / net cash interest paid");
    expect(tile.querySelector("svg[role=img]")).toBeNull();
    expect(within(tile).getByRole("link", { name: /Source for interest cover/ })).toBeTruthy();
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const cells = [...within(tile).getAllByRole("cell")].map((cell) => cell.textContent);
    expect(cells).toEqual(["FY2023 / 2023-09-30", "2.71", "FY2024 / 2024-09-30", "3.29"]);
  });

  it("lists all six facilities of the debt stack in the handoff's order, each cell as written", () => {
    render(<UnreadFigures lead={leadProps(cp1Entry())} drawn={drawnBut("Debt stack")} />);
    const tile = screen.getByRole("region", { name: "Debt stack" });
    const rows = [...tile.querySelectorAll("li[data-row]")];
    expect(rows.map((row) => row.getAttribute("data-row"))).toEqual([
      "2028 secured notes",
      "2029 secured notes",
      "2030 secured notes",
      "2031 secured notes",
      "2032 secured notes",
      "2033 secured notes",
    ]);
    const column = (name: string) =>
      rows.map((row) => row.querySelector(`[data-cell="${name}"]`)?.textContent);
    expect(column("Amount")).toEqual(["2100", "2750", "1450", "1000", "2200", "1500"]);
    expect(column("Cumulative leverage")).toEqual(["0.55", "1.27", "1.65", "1.91", "2.49", "2.88"]);
    expect(column("Ranking")).toEqual(["1", "1", "1", "1", "1", "1"]);
    expect(column("Secured")).toEqual(["Yes", "Yes", "Yes", "Yes", "Yes", "Yes"]);
    expect(tile.textContent).not.toContain("guaranteed");
    expect(tile.textContent).toContain("$m");
  });

  it("draws a stated gap as the hatched chip with its reason, a zero as a value, no sum", () => {
    const shares = entry(
      "CP-1D",
      [],
      [
        section(
          "Chart data: add-back share",
          10,
          table(
            12,
            ["Add-back", "Share of EBITDA", "Reporting unit", "Basis and limitation"],
            [
              ["Stock compensation", "5.7", "%", "Annual p71."],
              ["Other, net", "0", "%", "Annual p71."],
              ["Acquisition costs", "Not supplied: source dash", "%", "Annual p71."],
              ["Refinancing", "Not supplied: no split [E3]", "%", "Annual p71."],
            ],
          ),
        ),
      ],
    );
    render(<UnreadFigures lead={leadProps(shares)} drawn={["EBITDA bridge"]} />);
    const tile = screen.getByRole("region", { name: "Add-back share" });
    const cell = (row: string) =>
      tile.querySelector(`li[data-row="${row}"] [data-cell="Share of EBITDA"]`);
    expect(cell("Stock compensation")?.textContent).toBe("5.7");
    expect(cell("Other, net")?.textContent).toBe("0");
    expect(cell("Acquisition costs")?.querySelector(".gap-hatch")?.textContent).toBe("—");
    expect(cell("Refinancing")?.querySelector(".gap-hatch")?.textContent).toBe("no split");
    expect(tile.textContent).not.toContain("5.7%0");
    expect(tile.textContent).not.toMatch(/\b5\.7\b.*\btotal\b/i);
    expect(tile.textContent).not.toContain("[E3]");
  });

  it("states a gap tile for a chart section with no table, or two", () => {
    const empty = entry(
      "CP-1D",
      [],
      [{ heading: "Chart data: add-back share", level: 3, line: 10, blocks: [] }],
    );
    render(<UnreadFigures lead={leadProps(empty)} drawn={[]} />);
    expect(screen.getByRole("region", { name: "Add-back share" }).textContent).toContain(
      "This page could not read add-back share.",
    );
  });

  it("leaves a chart section written as prose to the frame, which draws the module's words", () => {
    const prose = entry(
      "CP-1D",
      [],
      [
        {
          heading: "Chart data: add-back share",
          level: 3,
          line: 10,
          blocks: [
            { type: "text", line: 11, end: 11, text: "The issuer did not split add-backs." },
          ],
        },
      ],
    );
    const { container } = render(<UnreadFigures lead={leadProps(prose)} drawn={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
