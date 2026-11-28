// Synthetic CP-1B chart-table handoffs. All cells and expected values are written independently.
import { describe, expect, it } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { earningsDelta } from "./earningsDeltaData";

function revenue(priorPeriod: string, currentPeriod: string, unit: string) {
  const title = "Chart data: prior and current results";
  const headers = [
    "Measure",
    "Prior period",
    "Prior",
    "Current period",
    "Current",
    "Reporting unit",
  ];
  const output = entry(
    "CP-1B",
    [],
    [
      section(
        title,
        1,
        table(3, headers, [["Revenue", priorPeriod, "100", currentPeriod, "150", unit]]),
      ),
    ],
  );
  const { movers } = earningsDelta(output);
  if (movers.kind !== "ready") throw new Error("expected prior and current figures");
  return movers.groups[0]?.rows[0];
}

describe("earnings chart pair fidelity", () => {
  it("keeps bare annual labels where the header names the cells as periods", () => {
    expect(revenue("2023", "2024", "US$m")).toMatchObject({
      priorPeriod: "2023",
      currentPeriod: "2024",
      change: { text: "+50", basis: "computed" },
    });
  });

  it.each([
    "",
    "Not supplied: the table omits the unit",
    "—",
    "N/A",
    "Not stated",
    "n.a.",
    "0",
    "issuer.pdf page 9",
  ])(
    "keeps both figures without calculating or judging a change with an unknown reporting unit %s",
    (unit) => {
      expect(revenue("2023", "2024", unit)).toMatchObject({
        prior: { text: "100", value: 100 },
        current: { text: "150", value: 150 },
        change: null,
        tone: "none",
      });
    },
  );
});
