// The whole replayed TDG CP-2H handoff, verbatim (fixtures/cp2h_tdg_replay.md), with the chart metadata
// the store publishes for it: the trigger chart table states a gap (reasons typed from the handoff).
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { chartGaps, ModuleLimitations } from "../ModuleFrame";
import { RunContext } from "../../../library/parts/RunContext";
import { RatingsLead } from "./cp2h";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

function real(): OutputEntry {
  const markdown = readFileSync(
    path.resolve(import.meta.dirname, "fixtures", "cp2h_tdg_replay.md"),
    "utf8",
  );
  return {
    output: {
      module: "CP-2H",
      id: "run/CP-2H",
      label: "CP-2H",
      sha256: "h",
      href: "CP-2H.md",
      charts: [],
      chartGaps: [
        {
          title: "Rating triggers",
          table: 71,
          gap: "no agency trigger established; no agency threshold established; no agency-adjusted current metric established; no agency direction established",
        },
      ],
    },
    sections: sectionsOf(markdown),
    selected: true,
  };
}

it("draws the note the module wrote under its rating register", () => {
  const { container } = render(<RatingsLead {...leadProps(real())} />);
  expect(container.textContent).toContain(
    "Recovery ratings and publication dates of the underlying agency actions are not supplied.",
  );
  expect(container.textContent).toContain(
    "is issuer risk language, not a rating action or an agency trigger.",
  );
});

it("states the module's reason for the undrawn rating triggers once on the page, lead and limitations together", () => {
  const entry = real();
  // Any trace key the frame asks for is held: the test reads words, not traces.
  const traces = new Proxy(
    {},
    { getOwnPropertyDescriptor: () => ({ value: {}, enumerable: true, configurable: true }) },
  );
  const { container } = render(
    <RunContext.Provider value={{ traces, open: () => undefined }}>
      <RatingsLead {...leadProps(entry)} />
      <ModuleLimitations
        owed={false}
        gaps={chartGaps(entry)}
        entry={entry}
        folder="run"
        span={12}
      />
    </RunContext.Provider>,
  );
  const said = container.textContent.split("no agency threshold established").length;
  expect(said - 1).toBe(1);
  expect(screen.getAllByText(/Rating triggers/).length).toBeGreaterThan(0);
});
