import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry } from "../overview/rows.fixture";
import { CREDIT_LEADS } from "./credit";
import { bottomLine, leadProps } from "./lead.fixture";
import { STRUCTURE_LEADS } from "./structure";

afterEach(cleanup);

const LEADS = Object.entries({ ...CREDIT_LEADS, ...STRUCTURE_LEADS });

it("covers all thirteen leads", () => {
  expect(LEADS).toHaveLength(13);
});

// Ruling v: the frame draws a blocked module's state; the lead draws nothing.
it.each(LEADS)("%s draws nothing for a blocked handoff", (module, Lead) => {
  for (const reason of [
    "Not assessable: no filings were supplied",
    "Not assessable: annual_report_2024.pdf was not supplied.",
    "Not assessable: covenant-lite, no maintenance test.",
  ]) {
    const { container } = render(
      <Lead {...leadProps(entry(module, [], [...bottomLine(reason)]))} />,
    );
    expect(container).toBeEmptyDOMElement();
    cleanup();
  }
});

it.each(LEADS)(
  "%s still draws a handoff marked not established whose bottom line is not Not assessable",
  (module, Lead) => {
    const made = entry(module, [], [...bottomLine("Leverage is high.")]);
    made.output.state = { established: false, declared: null };
    const { container } = render(<Lead {...leadProps(made)} />);
    expect(container).not.toBeEmptyDOMElement();
    expect(container.textContent).not.toMatch(/Not assessable/);
  },
);

// P3: a handoff the store could not read draws nothing here; the frame states it once.
it.each(LEADS)("%s draws nothing for a handoff the store could not read", (module, Lead) => {
  const made = entry(module, [], [...bottomLine("Leverage is high.")]);
  made.output.parseError = "Malformed table at line 113";
  const { container } = render(<Lead {...leadProps(made)} />);
  expect(container).toBeEmptyDOMElement();
});
