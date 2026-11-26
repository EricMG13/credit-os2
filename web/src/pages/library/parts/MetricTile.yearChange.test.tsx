import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RunContext } from "./RunContext";
import { LibraryMetricTile as MetricTile } from "./MetricTile";

it("draws the year comparator, with the tone as a visible word and a shape on a tile that has one", () => {
  render(
    <RunContext.Provider value={{ traces: {}, open: () => undefined }}>
      <ul>
        <MetricTile
          metric={{
            label: "Leverage",
            value: { kind: "value", at: null, text: "4.4x" },
            note: "2024-12-31",
            trace: null,
            yearChange: { key: "leverage", change: "0.2", unit: "x", prior: "FY2023" },
          }}
        />
        <MetricTile
          metric={{
            label: "Principal",
            value: { kind: "value", at: null, text: "9m" },
            note: "n",
            trace: null,
            yearChange: { key: "principal", change: "5", unit: "USD millions", prior: "FY2023" },
          }}
        />
        <MetricTile
          metric={{
            label: "Other",
            value: { kind: "value", at: null, text: "1x" },
            note: "n",
            trace: null,
          }}
        />
      </ul>
    </RunContext.Provider>,
  );
  const change = screen.getByText(/\+0\.2x vs FY2023/);
  expect(change.textContent.split("worse").length).toBe(2);
  expect(change.querySelector(".sr-only")).toBeNull();
  expect(change.querySelector('[data-shape="diamond"]')).not.toBeNull();
  expect(change.className).toContain("text-error-text");
  const plain = screen.getByText(/\+\$5m vs FY2023/);
  expect(plain.textContent).not.toMatch(/better|worse|unchanged/);
  expect(plain.querySelector("[data-shape]")).toBeNull();
  expect(screen.getAllByText(/ vs /)).toHaveLength(2);
});
