import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { CatalogueRun, OutputEntry } from "../publishedReport";
import { ModuleStats } from "./ModuleStats";

afterEach(cleanup);

const entry: OutputEntry = {
  selected: true,
  output: { id: "r/CP-1.md", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
  sections: [
    {
      heading: "Chart data: leverage",
      level: 3,
      line: 40,
      blocks: [
        {
          type: "table",
          line: 41,
          headers: ["Period", "Total debt / EBITDA", "Net debt / EBITDA"],
          rows: [{ line: 43, cells: ["FY2024", "6.53", "4.88"] }],
        },
      ],
    },
  ],
};

const catalogue = {
  id: "r",
  metrics: {
    leverage: {
      value: "6.53",
      unit: "x",
      period: "FY2024",
      prior: { value: "6.27", period: "FY2023" },
      change: "0.26",
    },
    net_leverage: {
      value: "4.88",
      unit: "x",
      period: "FY2024",
      prior: { value: "5.38", period: "FY2023" },
      change: "-0.50",
    },
  },
} as unknown as CatalogueRun;

const point = (name: string) => {
  render(<ModuleStats entry={entry} catalogue={catalogue} folder="r" />);
  const strip = within(screen.getByLabelText("Headline figures"));
  return strip.getByRole("img", { name }).querySelector("circle:last-of-type");
};

it("draws the current point of a worse change in the worse mark", () => {
  expect(point("Gross leverage 6.27 in FY2023 and 6.53 in FY2024")).toHaveClass("fill-worse-mark");
});

it("draws the current point of a better change in the better mark", () => {
  expect(point("Net leverage 5.38 in FY2023 and 4.88 in FY2024")).toHaveClass("fill-better-mark");
});
