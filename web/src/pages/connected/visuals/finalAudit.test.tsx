import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { containsReference } from "../publishedReport";
import { LegacyVisuals } from ".";
import { amount, cellAmount } from "./visualData";
function draw(title: string, chart: Record<string, unknown>, headers: string[], rows: string[][]) {
  const result = render(
    <LegacyVisuals
      output={{ charts: [{ title, table: 20, ...chart }] }}
      sections={[
        {
          blocks: [
            {
              type: "table",
              line: 20,
              headers: [...headers, "Reporting unit", "Basis and limitation"],
              rows: rows.map((cells) => ({ cells })),
            },
          ],
        },
      ]}
      evidenceHref={(line) => `#evidence/${String(line)}`}
    />,
  );
  return { ...result, figure: () => screen.getByRole("figure", { name: title }) };
}
it("draws a nonnegative period series as a path and keeps each original figure in its table", () => {
  const { container, figure } = draw(
    "Revenue history",
    { columns: [1], unit: "US$m" },
    ["Period", "Revenue"],
    [
      ["FY2022", "2,100", "US$m", "As reported."],
      ["FY2023", "2,250", "US$m", "As reported."],
      ["FY2024", "2,400", "US$m", "As reported."],
    ],
  );
  expect(container.querySelector(".recharts-line")).not.toBeNull();
  expect(container.querySelector(".recharts-bar")).toBeNull();
  fireEvent.click(within(figure()).getByRole("radio", { name: "Table" }));
  for (const text of ["FY2022", "2,100", "FY2023", "2,250", "FY2024", "2,400"])
    expect(within(figure()).getByText(text)).toBeVisible();
});
it("keeps every covenant row when one threshold is missing and one current value is net cash", () => {
  const { container, figure } = draw(
    "Covenant headroom",
    { kind: "bullet", label: [0], current: 2, threshold: 1, direction: 3 },
    ["Test", "Threshold", "Current", "Direction"],
    [
      ["Leverage", "4.00", "-0.50", "Maximum", "x", "Net cash."],
      [
        "Interest cover",
        "Not supplied: no covenant threshold",
        "2.80",
        "Minimum",
        "x",
        "Threshold unavailable.",
      ],
      ["Fixed charge cover", "1.20", "1.60", "Minimum", "x", "As defined."],
    ],
  );
  expect(figure()).toBeVisible();
  expect(container.querySelectorAll("[data-bar]")).toHaveLength(2);
  expect(container.querySelector("[data-negative]")).not.toBeNull();
  expect(Number(container.querySelector("[data-zero]")?.getAttribute("data-left"))).toBeCloseTo(
    11.111,
    3,
  );
  expect(within(figure()).getByText("Threshold not supplied")).toBeVisible();
  fireEvent.click(within(figure()).getByRole("radio", { name: "Table" }));
  for (const text of ["-0.50", "2.80", "1.60", "Not supplied: no covenant threshold"])
    expect(within(figure()).getByText(text)).toBeVisible();
});
describe("ordinary source number typography", () => {
  it.each([
    ["−10", -10],
    ["(10)", -10],
    ["2 100", 2100],
    ["2\u00a0100", 2100],
    ["2\u202f100", 2100],
    ["(1,250.50)", -1250.5],
  ])("places %s at its exact value %d", (text, expected) => {
    expect(amount(text)).toBe(expected);
  });
  it("reads a suffix only when the stated unit confirms its family and scale", () => {
    expect(amount("2,100m", "US$m")).toBe(2100);
    expect(amount("3,75%", "%")).toBe(3.75);
    expect(amount("2,100m", "USD billions")).toBeNull();
    expect(amount("2,100m")).toBeNull();
    expect(cellAmount("2,800", ["−3,75", "2,800"])).toBe(2.8);
    expect(amount("2 10")).toBeNull();
    expect(amount("(-10)")).toBeNull();
  });
  it("retains the original typographic strings on the chart and in its source table", () => {
    const { figure } = draw(
      "EBITDA bridge",
      { kind: "waterfall", amount: 1, unit: "US$m" },
      ["Step", "Amount"],
      [
        ["Opening", "400", "US$m", "As reported."],
        ["Disposal", "−10", "US$m", "As reported."],
        ["Closing", "390", "US$m", "As reported."],
      ],
    );
    expect(figure()).toBeVisible();
    fireEvent.click(within(figure()).getByRole("radio", { name: "Table" }));
    expect(within(figure()).getByText("−10")).toBeVisible();
  });
});
it("holds parenthesized gap IDs and page citations in the shared reference predicate, not module names", () => {
  expect(containsReference("Threshold missing (G12)")).toBe(true);
  expect(containsReference("No chart: see p. 12.")).toBe(true);
  expect(containsReference("No chart: see page 12.")).toBe(true);
  expect(containsReference("cp-2d supplies the figure.")).toBe(false);
  expect(containsReference("Revenue increased by 12%.")).toBe(false);
});
it("keeps a page-bearing gap reason in its trace and draws the missing status beside See Evidence", () => {
  render(
    <LegacyVisuals
      output={{ charts: [{ title: "Leverage", gap: "Not supplied: see p. 12.", table: 20 }] }}
      evidenceHref={(line) => `#evidence/${String(line)}`}
    />,
  );
  expect(screen.queryByText(/p\. 12/)).toBeNull();
  expect(screen.getByText("Not supplied. See Evidence.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Source table" })).toHaveAttribute(
    "href",
    "#evidence/20",
  );
});
