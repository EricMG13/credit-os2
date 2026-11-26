// The whole replayed TDG CP-3D handoff, verbatim (fixtures/cp3d_tdg_replay.md): the module is not
// assessable, so the yield chart is not drawn; the page says so in the module's words.
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { MarketLead } from "./cp3d";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

function real(): OutputEntry {
  const markdown = readFileSync(
    path.resolve(import.meta.dirname, "fixtures", "cp3d_tdg_replay.md"),
    "utf8",
  );
  return {
    output: {
      module: "CP-3D",
      id: "run/CP-3D",
      label: "CP-3D",
      sha256: "h",
      href: "CP-3D.md",
      charts: [],
    },
    sections: sectionsOf(markdown),
    selected: true,
  };
}

it("says the yield chart is not drawn and why, in the module's words, for a module that is not assessable", () => {
  render(<MarketLead {...leadProps(real())} />);
  const tile = screen.getByRole("region", { name: "Yield against maturity" });
  expect(within(tile).getByText(/not drawn/i)).toBeVisible();
  expect(tile.textContent).toContain(
    "Not assessable: verified contemporaneous market observations are absent; the only quote sheet assigns its date for testing, so creditors cannot establish what TransDigm debt actually priced at the cutoff or whether a market dislocation existed.",
  );
  expect(tile.textContent.match(/not assessable/gi)).toHaveLength(1);
});

it("draws no yield notice for a module that wrote no yield chart", () => {
  const entry = real();
  entry.sections = entry.sections.filter(({ heading }) => !/^Chart data/.test(heading));
  const { container } = render(<MarketLead {...leadProps(entry)} />);
  expect(container).toBeEmptyDOMElement();
});
