import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegacyVisuals } from ".";

function table(headers: string[], rows: string[][]) {
  return [
    { blocks: [{ type: "table", line: 20, headers, rows: rows.map((cells) => ({ cells })) }] },
  ];
}

function drawn(title: string, chart: Record<string, unknown>, sections: unknown) {
  render(
    <LegacyVisuals
      output={{ charts: [{ title, table: 20, unit: "x", ...chart }] }}
      sections={sections}
      evidenceHref={(line) => `#line-${String(line)}`}
    />,
  );
  return within(screen.getByRole("figure", { name: title }));
}

it("draws a value written with a decimal comma at that value, not at 375", () => {
  const figure = drawn(
    "Leverage",
    { columns: [1] },
    table(
      ["Period", "Total debt / EBITDA", "Reporting unit", "Basis and limitation"],
      [
        ["FY2023", "3,75", "x", "Gross debt includes finance leases."],
        ["FY2024", "2.80", "x", "Synthetic."],
      ],
    ),
  );
  const numbers = [...document.querySelectorAll("svg text")]
    .map((node) => node.textContent)
    .filter((text) => /^\d+(?:\.\d+)?$/.test(text))
    .map(Number);
  expect(numbers.length).toBeGreaterThan(2);
  expect(Math.max(...numbers)).toBeLessThan(10);
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  expect(figure.getAllByText("3,75").length).toBeGreaterThan(0);
});

function axisNumbers() {
  return [...document.querySelectorAll("svg text")]
    .map((node) => node.textContent)
    .filter((text) => /^\d+(?:\.\d+)?$/.test(text))
    .map(Number);
}

it("draws 2,800 beside 3,75 as 2.8, the column proving the decimal comma", () => {
  const figure = drawn(
    "Leverage",
    { columns: [1] },
    table(
      ["Period", "Total debt / EBITDA", "Reporting unit", "Basis and limitation"],
      [
        ["FY2023", "3,75", "x", "Gross debt includes finance leases."],
        ["FY2024", "2,800", "x", "Synthetic."],
      ],
    ),
  );
  const numbers = axisNumbers();
  expect(numbers.length).toBeGreaterThan(2);
  expect(Math.max(...numbers)).toBeLessThan(10);
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  expect(figure.getAllByText("3,75").length).toBeGreaterThan(0);
  expect(figure.getAllByText("2,800").length).toBeGreaterThan(0);
});

it("draws a column written only in three-decimal commas as thousands, the ambiguity it cannot settle", () => {
  const figure = drawn(
    "Leverage",
    { columns: [1] },
    table(
      ["Period", "Total debt / EBITDA", "Reporting unit", "Basis and limitation"],
      [
        ["FY2023", "3,750", "x", "Gross debt includes finance leases."],
        ["FY2024", "2,800", "x", "Synthetic."],
      ],
    ),
  );
  expect(figure.getAllByText(/^\d,000$/).length).toBeGreaterThan(0);
});

it("reads each series with its own cells: one series written with decimal commas does not flip another", () => {
  const figure = drawn(
    "Leverage",
    { columns: [1, 2] },
    table(
      [
        "Period",
        "Total debt / EBITDA",
        "Net debt / EBITDA",
        "Reporting unit",
        "Basis and limitation",
      ],
      [
        ["FY2023", "3,75", "3,000", "x", "Gross debt includes finance leases."],
        ["FY2024", "2,800", "2,250", "x", "Synthetic."],
      ],
    ),
  );
  // Net debt (3,000 and 2,250) is read as thousands, so the axis runs in thousands.
  expect(figure.getAllByText("1,000").length).toBeGreaterThan(0);
  expect(figure.getAllByText("3,000").length).toBeGreaterThan(0);
});

it("does not read a column that is not drawn as decimal commas because another column is", () => {
  const figure = drawn(
    "Gross debt",
    { columns: [2] },
    table(
      ["Period", "Total debt / EBITDA", "Gross debt", "Reporting unit", "Basis and limitation"],
      [
        ["FY2023", "3,75", "1,250", "x", "Gross debt includes finance leases."],
        ["FY2024", "2,800", "2,800", "x", "Synthetic."],
      ],
    ),
  );
  expect(figure.getAllByText(/^\d,000$/).length).toBeGreaterThan(0);
});

it("draws an Indian lakh grouping at its value", () => {
  const figure = drawn(
    "Debt",
    { columns: [1] },
    table(
      ["Period", "Gross debt", "Reporting unit", "Basis and limitation"],
      [
        ["FY2023", "21,00,000", "x", "Synthetic."],
        ["FY2024", "1,23,456", "x", "Synthetic."],
      ],
    ),
  );
  // The axis runs to 2,500,000 for a bar at 2,100,000 and one at 123,456.
  expect(figure.getByText("2,500,000")).toBeInTheDocument();
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  expect(figure.getAllByText("21,00,000").length).toBeGreaterThan(0);
});

it("shows each period's unit and Basis and limitation in the Table form of a period chart", () => {
  const figure = drawn(
    "Leverage",
    { columns: [1] },
    table(
      ["Period", "Total debt / EBITDA", "Reporting unit", "Basis and limitation"],
      [
        ["FY2023", "3.75", "x", "Gross debt includes finance leases."],
        ["FY2024", "2.80", "x", "Synthetic."],
      ],
    ),
  );
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  const grid = figure.getByRole("table", { name: "Leverage" });
  expect(within(grid).getByRole("columnheader", { name: "Basis and limitation" })).toBeVisible();
  expect(within(grid).getByRole("columnheader", { name: "Reporting unit" })).toBeVisible();
  expect(
    within(grid).getByRole("cell", { name: "Gross debt includes finance leases." }),
  ).toBeVisible();
  expect(within(grid).getByRole("cell", { name: "Synthetic." })).toBeVisible();
});

it("shows each row's Basis and limitation in the Table form beside its figures", () => {
  const figure = drawn(
    "EBITDA bridge",
    { kind: "waterfall", amount: 1, unit: "US$m" },
    table(
      ["Step", "Amount", "Reporting unit", "Basis and limitation"],
      [
        ["Opening EBITDA", "400", "US$m", "Reported, before leases."],
        ["Disposal", "-10", "US$m", "Synthetic."],
        ["Closing EBITDA", "390", "US$m", "Reported, before leases."],
      ],
    ),
  );
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  const grid = figure.getByRole("table", { name: "EBITDA bridge" });
  expect(within(grid).getByRole("columnheader", { name: "Basis and limitation" })).toBeVisible();
  expect(within(grid).getAllByRole("cell", { name: "Reported, before leases." })).toHaveLength(2);
  expect(within(grid).getByRole("cell", { name: "Synthetic." })).toBeVisible();
});

it("shows each period's unit and Basis and limitation in the Table form of a period chart with a negative value", () => {
  const figure = drawn(
    "Leverage",
    { columns: [1, 2] },
    table(
      [
        "Period",
        "Net debt / EBITDA",
        "Total debt / EBITDA",
        "Reporting unit",
        "Basis and limitation",
      ],
      [
        ["FY2023", "-0.50", "3.75", "x", "Net cash; gross debt includes finance leases."],
        ["FY2024", "1.20", "2.80", "x", "Synthetic."],
      ],
    ),
  );
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  const grid = figure.getByRole("table", { name: "Leverage" });
  expect(within(grid).getByRole("columnheader", { name: "Basis and limitation" })).toBeVisible();
  expect(within(grid).getByRole("columnheader", { name: "Reporting unit" })).toBeVisible();
  expect(
    within(grid).getByRole("cell", { name: "Net cash; gross debt includes finance leases." }),
  ).toBeVisible();
  expect(within(grid).getByRole("cell", { name: "-0.50" })).toBeVisible();
});
