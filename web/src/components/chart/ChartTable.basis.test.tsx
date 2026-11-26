import { render, screen } from "@testing-library/react";
import { ChartTable } from "./ChartTable";

const HEAD = ["Period", "Total debt / EBITDA", "Reporting unit", "Basis and limitation"];
const LONG =
  "Gross debt includes finance leases (IFRS 16) and excludes the undrawn revolving credit facility.";

function drawn(head = HEAD) {
  render(
    <ChartTable
      caption="Leverage"
      head={head}
      rows={[
        { label: "FY2023", cells: ["3.75", "x", LONG] },
        { label: "FY2024", cells: ["2.80", "x", null] },
      ]}
    />,
  );
}

describe("ChartTable Basis and limitation column", () => {
  it("wraps and left-aligns the limitation cell, its heading and a missing cell", () => {
    drawn();
    const limitation = screen.getByRole("cell", { name: LONG });
    expect(limitation).toHaveClass("text-left", "whitespace-normal");
    expect(limitation).not.toHaveClass("text-right");
    expect(limitation).not.toHaveClass("whitespace-nowrap");
    expect(screen.getByRole("columnheader", { name: "Basis and limitation" })).toHaveClass(
      "text-left",
    );
    expect(screen.getAllByRole("cell").at(-1)).toHaveClass("text-left", "whitespace-normal");
  });

  it("leaves every other cell exactly as it was", () => {
    drawn();
    for (const name of ["3.75", "2.80"]) {
      expect(screen.getByRole("cell", { name })).toHaveClass(
        "px-3",
        "py-2",
        "text-right",
        "tabular-nums",
        "whitespace-nowrap",
      );
    }
    expect(screen.getAllByRole("cell", { name: "x" })[0]).toHaveClass(
      "text-right",
      "tabular-nums",
      "whitespace-nowrap",
    );
    for (const name of ["Total debt / EBITDA", "Reporting unit"]) {
      expect(screen.getByRole("columnheader", { name })).toHaveClass(
        "text-right",
        "whitespace-nowrap",
      );
    }
    expect(screen.getByRole("rowheader", { name: "FY2023" })).toHaveClass("sticky", "left-0");
  });

  it("reads any column a row writes a sentence in from the left, whatever its heading", () => {
    drawn(["Period", "Total debt / EBITDA", "Reporting unit", "Source"]);
    expect(screen.getByRole("cell", { name: LONG })).toHaveClass("text-left", "whitespace-normal");
    expect(screen.getByRole("columnheader", { name: "Source" })).toHaveClass("text-left");
    // The figure and unit columns beside it stay right-aligned.
    expect(screen.getByRole("cell", { name: "3.75" })).toHaveClass("text-right", "tabular-nums");
    expect(screen.getAllByRole("cell", { name: "x" })[0]).toHaveClass("text-right");
  });
});
