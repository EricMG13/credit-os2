// The whole replayed TDG CP-3C handoff, verbatim (fixtures/cp3c_tdg_replay.md).
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RefinancingLead } from "./cp3c";
import { leadProps } from "./lead.fixture";
import { fixtureEntry } from "./markdown.fixture";

afterEach(cleanup);

it("labels a path's second field with the handoff's own column name, Likelihood Direction", () => {
  const entry = fixtureEntry(
    "CP-3C",
    path.resolve(import.meta.dirname, "fixtures", "cp3c_tdg_replay.md"),
  );
  render(<RefinancingLead {...leadProps(entry)} />);
  const paths = within(screen.getByRole("region", { name: "Liability-management paths" }));
  expect(paths.getAllByText("Likelihood Direction").length).toBeGreaterThan(0);
  expect(paths.queryByText("Likelihood")).toBeNull();
});
