import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, Section } from "../../publishedReport";
import { FigureNotes } from "./figureParts";
import { DeltaBar, MiniSlope, Slope, type Mark } from "./marks";
import { bottomLine, gapReason, lastTwo, passageParagraphs, periodSeries } from "./read";

afterEach(cleanup);

/** Exports other sessions call with their earlier arguments keep working. */
const section = (heading: string, headers: string[], ...rows: string[][]): Section => ({
  heading,
  level: 3,
  line: 1,
  blocks: [
    {
      type: "table",
      line: 2,
      headers,
      rows: rows.map((cells, at) => ({ line: 4 + at, cells })),
    },
  ],
});

const entry = (sections: Section[]): OutputEntry => ({
  output: { id: "CP-1-1", module: "CP-1", label: "CP-1", href: "CP-1.md", sha256: "a" },
  sections,
  selected: true,
});

const LEVERAGE = section(
  "Chart data: leverage",
  ["Period", "Total debt / EBITDA", "Reporting unit"],
  ["FY2024", "4.00", "x"],
  ["FY2023", "5.00", "x"],
);
const PERIODS = section(
  "Period table",
  ["Period", "Start", "End"],
  ["FY2023", "2023-01-01", "2023-12-31"],
  ["FY2024", "2024-01-01", "2024-12-31"],
);

it("reads a period series with the earlier three arguments, and nothing without an entry", () => {
  expect(periodSeries(undefined, "leverage", /^Total debt/)).toBeNull();
  const series = periodSeries(entry([LEVERAGE]), "leverage", /^Total debt/);
  expect(series?.name).toBe("Total debt / EBITDA");
  expect(series?.unit).toBe("x");
  expect(
    series?.points.map(({ period, cell, value, line }) => [period, cell, value, line]),
  ).toEqual([
    ["FY2024", "4.00", 4, 4],
    ["FY2023", "5.00", 5, 5],
  ]);
  expect(periodSeries(entry([]), "leverage", /^Total debt/)).toBeNull();
});

it("gives the last two rows without an entry, as before, and the stricter rule with one", () => {
  const series = periodSeries(entry([LEVERAGE]), "leverage", /^Total debt/);
  if (!series) throw new Error("fixture");
  expect(lastTwo(series).latest?.period).toBe("FY2023");
  expect(lastTwo(series).prior?.period).toBe("FY2024");
  const strict = lastTwo(series, entry([PERIODS, LEVERAGE]));
  expect(strict.latest?.period).toBe("FY2024");
  expect(strict.prior?.period).toBe("FY2023");
  expect(lastTwo(series, entry([LEVERAGE])).prior).toBeUndefined();
});

it("chooses no latest period where a fiscal year stands beside a dated period", () => {
  const mixed = section(
    "Chart data: leverage",
    ["Period", "Total debt / EBITDA", "Reporting unit"],
    ["FY2025", "4.00", "x"],
    ["2025-06-30", "5.00", "x"],
  );
  const series = periodSeries(entry([mixed]), "leverage", /^Total debt/);
  if (!series) throw new Error("fixture");
  expect(lastTwo(series, entry([mixed]))).toEqual({ latest: undefined, prior: undefined });
});

it("reads a passage's paragraphs with the earlier arguments", () => {
  const written = entry([
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    {
      heading: "Key findings",
      level: 3,
      line: 2,
      blocks: [{ type: "text", line: 3, end: 3, text: "Distributions exceed free cash flow." }],
    },
  ]);
  expect(passageParagraphs(written, "Key findings")).toEqual([
    { line: 3, text: "Distributions exceed free cash flow." },
  ]);
});

it("draws figure notes and the earlier marks with their earlier props", () => {
  render(<FigureNotes notes={["Per CP-1C.", "As in notes_2024.pdf page 88."]} />);
  expect(screen.getByText("Per Peer benchmark.")).toBeVisible();
  expect(document.body).not.toHaveTextContent(/notes_2024/);
  cleanup();
  const marks: Mark[] = [
    { label: "FY2023", value: 5, text: "5.00x" },
    { label: "FY2024", value: 4, text: "4.00x" },
  ];
  render(<MiniSlope marks={marks} tone="better" label="Mini" />);
  render(<DeltaBar from={marks[0] as Mark} to={marks[1] as Mark} tone="better" label="Delta" />);
  expect(screen.getByRole("img", { name: "Mini" })).toBeVisible();
  expect(screen.getByRole("img", { name: "Delta" })).toBeVisible();
});

it("draws the series marks from the earlier Mark[] with the same points and labels", () => {
  const marks: Mark[] = [
    { label: "FY2023", value: 5, text: "5.00x" },
    { label: "FY2024", value: 4, text: "4.00x" },
  ];
  const texts = (name: string) =>
    [...screen.getByRole("img", { name }).querySelectorAll("text:not([data-tick])")].map(
      (text) => text.textContent,
    );
  const dots = (name: string) => screen.getByRole("img", { name }).querySelectorAll("circle");
  render(<Slope marks={marks} tone="better" suffix="x" label="Slope" />);
  expect(dots("Slope")).toHaveLength(2);
  expect(texts("Slope").sort()).toEqual(["4.00x", "5.00x", "FY2023", "FY2024"]);
  expect(
    screen.getByRole("img", { name: "Slope" }).querySelectorAll("[data-segment]"),
  ).toHaveLength(1);
  render(<MiniSlope marks={marks} tone="better" label="Mini slope" />);
  expect(dots("Mini slope")).toHaveLength(2);
  expect(screen.getByRole("img", { name: "Mini slope" }).querySelectorAll("polyline")).toHaveLength(
    1,
  );
});

it("reads a bottom line and a gap's reason with the earlier arguments", () => {
  const written = entry([
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    {
      heading: "Bottom line",
      level: 3,
      line: 2,
      blocks: [{ type: "text", line: 3, end: 3, text: "Credit is stable." }],
    },
  ]);
  expect(bottomLine(written)).toEqual([{ line: 3, text: "Credit is stable." }]);
  expect(gapReason("Not supplied: restated")).toBe("restated");
  expect(gapReason("4.00")).toBeNull();
});
