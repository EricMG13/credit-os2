import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegacyForecast } from "./LegacyForecast";
it("uses the same canonical money unit on the model header and every forecast chart", () => {
  const cells = (values: string[]) =>
    values.map((display) => ({ status: "value", exact: display, display }));
  render(
    <LegacyForecast
      model={{
        cashflow: {
          units: "USD millions",
          columns: [
            { group: "Base case", label: "FY2027E" },
            { group: "Base case", label: "FY2028E" },
          ],
          rows: [
            { label: "Revenue", band: "Operating", cells: cells(["100.00", "110.00"]) },
            {
              label: "Cash proxy (not issuer free cash flow)",
              band: "Cash",
              cells: cells(["10.00", "12.00"]),
            },
          ],
          notes: [],
          limits: [],
        },
      }}
    />,
  );
  expect(screen.getAllByText("US$m").length).toBeGreaterThan(0);
  expect(document.body.textContent).not.toContain("USD millions");
});
