import { expect, it } from "vitest";
import { publishedChart } from "./charts";

const headers = ["Step", "Amount", "Reporting unit", "Basis and limitation"];
const descriptor = { kind: "waterfall", amount: 1, unit: "US$m" };

function bridge(steps: [string, string][]) {
  const rows = steps.map(([label, amount]) => [label, amount, "US$m", "As published."]);
  return publishedChart({ line: 5, headers, rows }, descriptor, { title: "Bridge" });
}

it("draws a bridge whose decimal amounts sum exactly to a closing 0.00", () => {
  expect(
    bridge([
      ["Enterprise value", "1234.56"],
      ["Administrative claims", "-57.89"],
      ["First lien term loan", "-700.12"],
      ["Senior unsecured notes", "-476.55"],
      ["Value not distributed", "0.00"],
    ]),
  ).not.toBeNull();
});

it("draws a bridge whose closing is a small difference of large figures", () => {
  expect(
    bridge([
      ["Opening liquidity", "2033.67"],
      ["Debt service", "-999.31"],
      ["Capital expenditure", "-984.81"],
      ["Closing liquidity", "49.55"],
    ]),
  ).not.toBeNull();
});

it("still refuses a bridge that does not sum", () => {
  expect(
    bridge([
      ["Opening", "100.10"],
      ["Change", "-50.05"],
      ["Closing", "50.06"],
    ]),
  ).toBeNull();
});
