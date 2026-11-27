import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import { EvidenceGaps } from "./EvidenceGaps";

afterEach(cleanup);

const entry: OutputEntry = {
  selected: true,
  output: { id: "CP-1/h.md", module: "CP-1", label: "Saved", href: "h.md", sha256: "a".repeat(64) },
  sections: [
    {
      heading: "Gaps",
      level: 2,
      line: 1,
      blocks: [
        {
          type: "table",
          line: 2,
          headers: ["Gap", "Severity", "Effect"],
          rows: [{ line: 3, cells: ["A high gap", "High", "y"] }],
        },
      ],
    },
  ],
};

it("draws a High gap as the diamond shape and the word in ink, with no badge colour", () => {
  const { container } = render(
    <EvidenceGaps run={{ folder: "case" } as unknown as PublishedRun} entries={[entry]} />,
  );
  const shape = container.querySelector("th [data-shape='diamond']");
  expect(shape).not.toBeNull();
  const label = shape?.parentElement;
  expect(label).toHaveTextContent(/^High$/);
  expect(label).toHaveClass("text-text-primary");
  expect(label?.outerHTML).not.toMatch(/bg-(error|warning|success|brand)|text-(error|warning)/);
  expect(screen.getByText("A high gap")).toBeVisible();
});
