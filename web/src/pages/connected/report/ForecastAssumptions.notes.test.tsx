import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AssumptionsByCase } from "./ForecastAssumptions";

const document = {
  currency: "USD",
  scale: 1,
  years: [{ year: 2025 }],
  base_drivers: { revenue_growth: { values: ["0.05"] } },
  downside_shock: { ebitda_decline: 0.15 },
};
const POINTER = "The model's note on the downside case is in Evidence.";

it.each([
  "Downside case is a shock on base drivers [E3].",
  "Downside case is a shock on base drivers, see TL3.2.",
  "Downside case is a shock on base drivers (calculation C05).",
  "Downside case is a shock on base drivers, see Note 4.",
])("C1b-2 draws only the Evidence pointer for a citing note: %s", (note) => {
  const { container, unmount } = render(
    <AssumptionsByCase document={document} downsideNote={note} />,
  );
  expect(screen.getByText(POINTER)).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/E3|TL3\.2|C05|Note 4/u);
  unmount();
});

it("C1b-2 draws an uncited note as written", () => {
  const note = "Downside case is a shock on base drivers.";
  render(<AssumptionsByCase document={document} downsideNote={note} />);
  expect(screen.getByText(note)).toBeInTheDocument();
});
