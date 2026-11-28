// Synthetic CP-1 segment schedules. Values and labels mirror the input cells.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, section, table } from "../../overview/rows.fixture";
import { leadProps } from "../fixtures/load";
import { segmentView } from "./foundationData";
import { SegmentsTile } from "./Segments";

afterEach(cleanup);

const schedule = (rows: string[][]) =>
  entry(
    "CP-1",
    [],
    [section("Segment schedule", 10, table(11, ["Segment", "FY2024", "FY2025", "Unit"], rows))],
  );

it("keeps each segment's EBITDA definition and amount without a shared chart", () => {
  const input = schedule([
    ["Division A, Reported EBITDA", "90", "100", "USD millions"],
    ["Division B, Adjusted EBITDA", "110", "120", "USD millions"],
    ["Division B, EBITDA (Reported)", "65", "75", "USD millions"],
  ]);
  render(<SegmentsTile lead={leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Segments" });
  expect(tile).toHaveTextContent(/Division A.*Reported EBITDA.*FY2025 100/);
  expect(tile).toHaveTextContent(/Division B.*Adjusted EBITDA.*FY2025 120/);
  expect(tile).toHaveTextContent(/Division B.*EBITDA \(Reported\).*FY2025 75/);
  expect(within(tile).queryByRole("img")).toBeNull();
  expect(segmentView(input)?.comparison).toBeNull();

  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  const data = within(tile).getByRole("table");
  expect(
    within(data).getByRole("row", { name: "Division A Reported EBITDA 90 100" }),
  ).toBeVisible();
  expect(
    within(data).getByRole("row", { name: "Division B Adjusted EBITDA 110 120" }),
  ).toBeVisible();
  expect(
    within(data).getByRole("row", { name: "Division B EBITDA (Reported) 65 75" }),
  ).toBeVisible();
});

it("shows prior amounts and latest explicit gaps in the figure and table", () => {
  const input = schedule([
    ["Division A net sales", "100", "Not supplied: no segment sales", "USD millions"],
    ["Division A EBITDA As Defined", "20", "Not supplied: no segment EBITDA", "USD millions"],
  ]);
  render(<SegmentsTile lead={leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Segments" });
  expect(tile).toHaveTextContent(/Net sales.*FY2024 100.*FY2025 Not supplied: no segment sales/);
  expect(tile).toHaveTextContent(
    /EBITDA As Defined.*FY2024 20.*FY2025 Not supplied: no segment EBITDA/,
  );

  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  const data = within(tile).getByRole("table");
  for (const name of [
    "100",
    "20",
    "Not supplied: no segment sales",
    "Not supplied: no segment EBITDA",
  ])
    expect(within(data).getByRole("cell", { name })).toBeVisible();
});
