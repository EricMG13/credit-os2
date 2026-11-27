import { render, screen } from "@testing-library/react";
import { LeftOut } from "./LeftOut";
import type { Cohort } from "./cohort";

const out: Cohort["out"] = [
  {
    issuer: { key: "one", name: "Alpha plc", sector: null, runs: [] },
    reason: "more than one figure",
  },
  {
    issuer: { key: "two", name: "Beta SA", sector: null, runs: [] },
    reason: "other unit",
  },
];

test("LeftOut names issuers and the reason each was excluded", () => {
  render(<LeftOut out={out} title="Not included" />);
  const region = screen.getByRole("region", { name: "Not included" });
  expect(region).toHaveTextContent("Alpha plc: more than one figure");
  expect(region).toHaveTextContent("Beta SA: other unit");
});

test("LeftOut renders nothing when no issuer is excluded", () => {
  const { container } = render(<LeftOut out={[]} title="Not included" />);
  expect(container).toBeEmptyDOMElement();
});
