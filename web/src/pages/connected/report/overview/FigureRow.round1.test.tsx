import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { FigureRow } from "./FigureRow";

afterEach(cleanup);

let line = 100;
const chart = (name: string, headers: string[], ...rows: string[][]): Section => ({
  heading: `Chart data: ${name}`,
  level: 3,
  line: (line += 1),
  blocks: [
    {
      type: "table" as const,
      line: (line += 1),
      headers,
      rows: rows.map((cells) => ({ line: (line += 1), cells })),
    },
  ],
});

const entry = (liquidity: string[][], ebitda: string[][]): OutputEntry => ({
  output: {
    id: "CP-1-1",
    module: "CP-1",
    label: "CP-1",
    href: "CP-1.md",
    sha256: "a".repeat(64),
  },
  sections: [
    {
      heading: "Period table",
      level: 3,
      line: 10,
      blocks: [
        {
          type: "table" as const,
          line: 11,
          headers: ["Period", "Start", "End"],
          rows: ["2023", "2024"].map((year, at) => ({
            line: 12 + at,
            cells: [`FY${year}`, `${year}-01-01`, `${year}-12-31`],
          })),
        },
      ],
    },
    chart(
      "liquidity",
      ["Period", "Cash", "Undrawn committed facilities", "Reporting unit", "Basis"],
      ...liquidity,
    ),
    chart(
      "revenue and EBITDA",
      ["Period", "Revenue", "Adjusted EBITDA", "Reporting unit", "Basis"],
      ...ebitda,
    ),
  ],
  selected: true,
});

const OK = [["FY2024", "2,250", "450", "US$m", "Stated."]];
const draw = (liquidity: string[][], ebitda: string[][] = OK) =>
  render(
    <FigureRow
      snapshot={{} as Snapshot}
      run={{ folder: "run-1" } as unknown as PublishedRun}
      view={{ entries: [entry(liquidity, ebitda)], models: [] } as unknown as ReportView}
    />,
  );
const cash = () => screen.getByRole("region", { name: "Cash" });

it("C5-1 states the undrawn gap beside a stated cash figure", () => {
  draw([["FY2024", "275", "Not supplied: facilities not disclosed", "US$m", "Stated."]]);
  expect(cash()).toHaveTextContent("$275m");
  expect(within(cash()).getByText("FY2024: facilities not disclosed")).toBeVisible();
  expect(cash()).toHaveTextContent("Undrawn committed facilities");
  expect(within(cash()).queryByRole("list", { name: "Parts of the bar" })).toBeNull();
});

it("C5-1 states a stated undrawn figure when cash is a gap", () => {
  draw([["FY2024", "Not supplied: cash not split out", "400", "US$m", "Stated."]]);
  expect(cash()).toHaveTextContent("Undrawn committed facilities $400m in FY2024");
});

it("C5-3 says a stated zero cash is not drawn and keeps the undrawn figure", () => {
  draw([["FY2024", "0", "400", "US$m", "Stated."]]);
  expect(cash()).toHaveTextContent("Stated, not drawn: Cash $0m in FY2024");
  expect(cash()).toHaveTextContent("Undrawn committed facilities $400m in FY2024");
  expect(within(cash()).queryByRole("list", { name: "Parts of the bar" })).toBeNull();
  expect(cash().querySelector('svg[role="img"]')).toBeNull();
});

it("C5-3 says a negative adjusted EBITDA is stated and not drawn", () => {
  draw(
    [["FY2024", "275", "400", "US$m", "Stated."]],
    [
      ["FY2023", "2,100", "410", "US$m", "Stated."],
      ["FY2024", "2,250", "-50", "US$m", "Stated."],
    ],
  );
  const tile = screen.getByRole("region", { name: "Adjusted EBITDA" });
  expect(tile).toHaveTextContent("Stated, not drawn: -$50m in FY2024");
  expect(tile.querySelector('svg[role="img"]')).toBeNull();
});

it("C5-R1 draws one gap box when the liquidity table is missing", () => {
  const full = entry([], OK);
  const noLiquidity = {
    ...full,
    sections: full.sections.filter((s) => !s.heading.includes("liquidity")),
  };
  render(
    <FigureRow
      snapshot={{} as Snapshot}
      run={{ folder: "run-1" } as unknown as PublishedRun}
      view={{ entries: [noLiquidity], models: [] } as unknown as ReportView}
    />,
  );
  expect(cash().querySelectorAll(".gap-hatch")).toHaveLength(1);
});

it("C5-R2 labels the unordered undrawn list and says the sentence once", () => {
  draw([
    ["FY2024", "275", "450", "US$m", "Stated."],
    ["FY2024", "250", "400", "US$m", "Stated."],
  ]);
  const text = cash().textContent;
  expect(text).toContain("Undrawn committed facilities");
  expect(text.split("These periods give no single latest reported period").length - 1).toBe(1);
});
