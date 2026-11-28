import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegacyVisuals } from ".";

it("draws recovery cells written with the row unit suffix", () => {
  const { container } = render(
    <LegacyVisuals
      output={{
        charts: [
          {
            title: "Recovery",
            table: 20,
            kind: "recovery",
            label: 0,
            scenario: 1,
            recovery: 3,
            unit: "%",
          },
        ],
      }}
      sections={[
        {
          blocks: [
            {
              type: "table",
              line: 20,
              headers: [
                "Class",
                "Scenario",
                "Note",
                "Recovery",
                "Reporting unit",
                "Basis and limitation",
              ],
              rows: [
                { cells: ["Senior", "Base", "-", "65%", "%", "Synthetic."] },
                { cells: ["Senior", "Stress", "-", "40%", "%", "Synthetic."] },
              ],
            },
          ],
        },
      ]}
      evidenceHref={(line) => `#line-${String(line)}`}
    />,
  );
  expect(container.textContent).not.toContain("not on one comparable scale");
  expect(container.querySelector("figure")?.textContent).toContain("65");
  expect(container.querySelector("figure")?.textContent).toContain("40");
});
