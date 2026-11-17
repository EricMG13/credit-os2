import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { TrendChart } from "./TrendChart";
it("removes the chart library's body measurement element after its last chart leaves the page", () => {
  const { unmount } = render(
    <TrendChart
      title="History"
      periods={["FY21", "FY22"]}
      series={[{ name: "Revenue", values: [1, 2] }]}
      table={[{ name: "Revenue", cells: ["1", "2"] }]}
    />,
  );
  expect(document.getElementById("recharts_measurement_span")).not.toBeNull();
  unmount();
  expect(document.getElementById("recharts_measurement_span")).toBeNull();
});
