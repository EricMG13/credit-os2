import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { MetricCard } from "./MetricCard";
import { MetricTile as LibraryMetricTile } from "@/pages/library/parts/MetricTile";
import { MetricTile as ModelMetricTile } from "@/pages/model/parts/MetricTile";
import { ProgressSteps } from "@/components/steps/ProgressSteps";
import { Timeline } from "@/components/timeline/Timeline";
it("uses the same40px metric token,12px radius,24px padding and shadow across all three metric cards", () => {
  render(
    <>
      <MetricCard label="Kit figure" value="0" />
      <ul>
        <LibraryMetricTile
          traced={false}
          metric={{
            label: "Library figure",
            value: { kind: "value", at: null, text: "4.2x" },
            note: "Reported, FY2024.",
            trace: null,
          }}
        />
      </ul>
      <ModelMetricTile
        metric={{
          label: "Model figure",
          value: { text: "5.1x" },
          definition: "Net debt divided by EBITDA.",
          delta: "Lower by0.3x",
          note: null,
          trace: null,
        }}
      />
    </>,
  );
  for (const label of ["Kit figure", "Library figure", "Model figure"]) {
    const card = screen.getByText(label).closest("article,li");
    expect(card).toHaveClass("rounded-ds-sm", "p-6", "shadow-xs");
    expect(card?.querySelector(".text-metric")).not.toBeNull();
  }
  expect(screen.getByText("0")).toBeVisible();
  expect(screen.getByText("Reported, FY2024.")).toBeVisible();
  expect(screen.getByText("Lower by0.3x")).toBeVisible();
});
it("keeps source details, missing, withheld and supplied qualifications in the composed tiles", () => {
  const { rerender } = render(
    <ul>
      <LibraryMetricTile
        traced={false}
        metric={{
          label: "Cash",
          value: null,
          note: "The source does not provide cash.",
          trace: null,
        }}
      />
    </ul>,
  );
  expect(screen.getByText("n.a.")).toBeVisible();
  expect(screen.getByText("The source does not provide cash.")).toBeVisible();
  rerender(
    <ModelMetricTile
      metric={{
        label: "Cash",
        value: { withheld: true },
        definition: "Cash balance.",
        delta: null,
        note: "Confidential amount.",
        trace: null,
      }}
    />,
  );
  expect(screen.getByText("Withheld")).toBeVisible();
  expect(screen.getByText("Confidential amount.")).toBeVisible();
});
it("uses13px caption tokens for project-written from figures, timeline dates and step numerals", () => {
  render(
    <>
      <MetricCard label="Revenue" value="1204" from="1150" />
      <Timeline items={[{ date: "FY2024", title: "Results", state: "Past" }]} />
      <ProgressSteps steps={[{ title: "Review", state: "current" }]} />
    </>,
  );
  expect(screen.getByText("from 1150")).toHaveClass("text-caption");
  expect(screen.getByText("FY2024")).toHaveClass("text-caption");
  expect(screen.getByText("1")).toHaveClass("text-caption");
  expect(within(screen.getByRole("article")).getByText("1204")).toBeVisible();
});
