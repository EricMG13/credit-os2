import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { leadProps } from "./fixtures/load";
import { ShortSnapshotLead } from "./shortSnapshot";
import { readKeyFigures } from "./shortSnapshotData";

afterEach(cleanup);

const HEAD = ["Measure", "Value", "Period", "Source"];
const SOURCE = "Canonical data foundation (CP-1)";
const snapshot = (first: [string, string], second: [string, string]) =>
  entry(
    "CP-L10",
    [],
    [
      section(
        "Key figures",
        10,
        table(
          11,
          HEAD,
          [first, second].map(([value, period]) => ["Revenue", value, period, SOURCE]),
        ),
      ),
    ],
  );

function show(input: ReturnType<typeof snapshot>) {
  render(<ShortSnapshotLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Key figures" });
  return within(tile).getByRole("list", { name: "Key figures" });
}

describe("Short Snapshot fidelity to the synthetic key-figure table", () => {
  it("keeps both stated dates and draws two figures across a 15-month interval", () => {
    const tile = show(
      snapshot(["USD 100m", "FY2024 / 2024-09-30"], ["USD 120m", "FY2025 / 2025-12-31"]),
    );
    expect(within(tile).getByText("Revenue, FY2024 / 2024-09-30")).toBeVisible();
    expect(within(tile).getByText("Revenue, FY2025 / 2025-12-31")).toBeVisible();
    expect(within(tile).getByText("USD 100m")).toBeVisible();
    expect(within(tile).getByText("USD 120m")).toBeVisible();
    expect(tile.querySelector("[data-part=change]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Table view: Key figures" }));
    const readerTable = screen.getByRole("table", { name: "Key figures" });
    const rows = within(readerTable).getAllByRole("row").slice(1);
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent)
          .slice(1),
      ),
    ).toEqual([
      ["FY2024 / 2024-09-30", "USD 100m", "Not stated", "Not stated", "Not stated"],
      ["FY2025 / 2025-12-31", "USD 120m", "Not stated", "Not stated", "Not stated"],
    ]);
  });

  it.each(["FY2025", "FY2025 / 2025-02-29"])(
    "withholds a comparison with one missing or invalid closing date in %s",
    (current) => {
      const read = readKeyFigures(
        snapshot(["USD 100m", "FY2024 / 2024-02-29"], ["USD 120m", current]),
      );
      if (read.state !== "ready") throw new Error(read.reason);
      expect(
        read.figures.map(({ current, change, marks }) => [current.period, change, marks]),
      ).toEqual([
        ["FY2024 / 2024-02-29", null, null],
        [current, null, null],
      ]);
    },
  );

  it.each([
    [" (Source 4)", " (Source 5)", ""],
    [" (per SEC filing)", " (per SEC filing)", ""],
    [" (issuer.pdf p. 2)", " (issuer.pdf p. 3)", ""],
    [' ("10K contracts")', ' ("10K contracts")', ' ("10K contracts")'],
    [" Annual p. 2", " Annual p. 3", ""],
    [" (restated per 10-K (p. 2))", " (restated per 10-K (p. 3))", " (restated)"],
    [" (Annual p. 2)", " (Annual p. 3)", ""],
    [".", ".", "."],
    [" ([E1])", " ([E2])", ""],
    [" (10K contracts)", " (10K contracts)", " (10K contracts)"],
    [" (restated; Annual p. 2)", " (restated per Annual p. 3)", " (restated)"],
  ])(
    "preserves the comparable dates and qualifications around %s and %s",
    (first, second, visible) => {
      const prior = `FY2024 / 2024-09-30${visible}`;
      const current = `FY2025 / 2025-09-30${visible}`;
      const tile = show(
        snapshot(
          ["USD 100m", `FY2024 / 2024-09-30${first}`],
          ["USD 120m", `FY2025 / 2025-09-30${second}`],
        ),
      );
      expect(within(tile).getByText(`Revenue, ${current}`)).toBeVisible();
      expect(within(tile).getByText(`from USD 100m in ${prior}`, { exact: false })).toBeVisible();
      expect(tile.querySelector("[data-part=change]")?.textContent).toBe("+USD 20m better");
      expect(tile.textContent).not.toContain("Annual p.");
      expect(tile.textContent).not.toContain("10-K");
      expect(screen.getByRole("link", { name: "Source for the key figures" })).toHaveAttribute(
        "href",
        "/report/run#evidence/run%2FCP-L10~hash-CP-L10-11",
      );
      fireEvent.click(screen.getByRole("button", { name: "Table view: Key figures" }));
      const readerTable = screen.getByRole("table", { name: "Key figures" });
      expect(
        within(readerTable)
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      ).toEqual(["Revenue", current, "USD 120m", prior, "USD 100m", "+USD 20m"]);
    },
  );

  it("keeps restated and reported figures separate when the restatement names a filing", () => {
    const tile = show(
      snapshot(
        ["USD 100m", "FY2024 / 2024-09-30 (reported)"],
        ["USD 120m", "FY2025 / 2025-09-30 (restated per 10-K (p. 3))"],
      ),
    );
    expect(within(tile).getByText("Revenue, FY2024 / 2024-09-30 (reported)")).toBeVisible();
    expect(within(tile).getByText("Revenue, FY2025 / 2025-09-30 (restated)")).toBeVisible();
    expect(tile.querySelector("[data-part=change]")).toBeNull();
  });

  it("keeps the closing date without computing a change when a source tail may contain a basis", () => {
    const tile = show(
      snapshot(
        ["USD 100m", "FY2024 / 2024-09-30"],
        ["USD 120m", "FY2025 / 2025-09-30 53 weeks Annual p. 3"],
      ),
    );
    expect(within(tile).getByText("Revenue, FY2025 / 2025-09-30")).toBeVisible();
    expect(within(tile).getByText("USD 120m")).toBeVisible();
    expect(tile.querySelector("[data-part=change]")).toBeNull();
    expect(tile.textContent).not.toContain("Annual p.");
  });

  it("compares two short fiscal years on the same stated restated basis", () => {
    const tile = show(
      snapshot(
        ["USD 100m", "FY24 / 2024-09-30 (restated)"],
        ["USD 120m", "FY25 / 2025-09-30 (restated per 10-K (p. 3))"],
      ),
    );
    expect(within(tile).getByText("Revenue, FY25 / 2025-09-30 (restated)")).toBeVisible();
    expect(tile.querySelector("[data-part=change]")?.textContent).toBe("+USD 20m better");
  });

  it("shows bare impossible calendar dates as written and withholds arithmetic", () => {
    const tile = show(snapshot(["USD 100m", "2024-02-30"], ["USD 120m", "2025-02-30"]));
    expect(tile.querySelector("[data-part=change]")).toBeNull();
    expect(within(tile).getByText("Revenue, 2024-02-30")).toBeVisible();
    expect(within(tile).getByText("Revenue, 2025-02-30")).toBeVisible();
  });

  it("keeps malformed grouping visible and withholds both the change and numeric marks", () => {
    const input = snapshot(["USD 100m", "FY2024"], ["USD 1,2m", "FY2025"]);
    const tile = show(input);
    expect(within(tile).getByText("USD 1,2m")).toBeVisible();
    const read = readKeyFigures(input);
    if (read.state !== "ready") throw new Error(read.reason);
    expect(read.figures[0]).toMatchObject({ change: null, marks: null });
    expect(within(tile).getByText("from USD 100m in FY2024")).toBeVisible();
    expect(tile.querySelector("[data-part=change]")).toBeNull();
  });

  it.each([
    ["FY2024", "FY2025"],
    ["FY2024 / 2024-09-30", "FY2025 / 2025-09-30"],
  ])("preserves valid grouping and compares comparable periods %s and %s", (prior, current) => {
    const tile = show(snapshot(["USD 1,000m", prior], ["USD 1,200m", current]));
    expect(within(tile).getByText(`Revenue, ${current}`)).toBeVisible();
    expect(within(tile).getByText("USD 1,200m")).toBeVisible();
    expect(tile.querySelector("[data-part=change]")?.textContent).toBe("+USD 200m better");
    expect(within(tile).getByText(`from USD 1,000m in ${prior}`, { exact: false })).toBeVisible();
  });
});
