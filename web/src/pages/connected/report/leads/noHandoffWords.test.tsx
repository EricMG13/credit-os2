// Every registered lead, drawn from an empty entry and from each retained or synthetic entry in
// fixtures/load.ts, says nothing in pipeline words: not "handoff", not "the module", not "derived",
// and no doubled full stop, in its text or in any aria-label or title. A blocked entry draws nothing.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { entry } from "../overview/rows.fixture";
import {
  cp0Entry,
  cp1Entry,
  cp1bEntry,
  cp5Entry,
  cp6Entry,
  distressedCp1Entry,
  earningsUpdateCp1Draft1Entry,
  leadProps,
  relativeValueCp1Entry,
} from "./fixtures/load";
import { leadFor } from "./index";

afterEach(cleanup);

// The modules registered in leads/index.ts (registry.test.ts lists the same codes).
const MODULES = ["CP-0", "CP-1", "CP-1B", "CP-1C", "CP-1D", "CP-MODEL", "CP-L10", "CP-5", "CP-6"];

const POPULATED: Record<string, [string, () => OutputEntry][]> = {
  "CP-0": [["retained synthetic", cp0Entry]],
  "CP-1": [
    ["TransDigm FY2024", cp1Entry],
    ["relative value, single period", relativeValueCp1Entry],
    ["distressed", distressedCp1Entry],
    ["earnings update draft 1", earningsUpdateCp1Draft1Entry],
  ],
  "CP-1B": [["TransDigm FY2024 earnings table", cp1bEntry]],
  "CP-5": [["synthetic", cp5Entry]],
  "CP-6": [["synthetic", cp6Entry]],
};

const FORBIDDEN: [string, RegExp][] = [
  ["handoff", /handoff/i],
  ["the module", /\bthe module\b/i],
  ["derived", /derived/i],
  ["a doubled full stop", /\.\./],
];

/** The text of the render and every aria-label and title attribute in it. */
function spoken(container: HTMLElement) {
  const attributes = [...container.querySelectorAll("[aria-label], [title]")].flatMap((node) => [
    node.getAttribute("aria-label") ?? "",
    node.getAttribute("title") ?? "",
  ]);
  return [container.textContent, ...attributes];
}

function check(module: string, source: OutputEntry) {
  const Lead = leadFor(module);
  if (!Lead) throw new Error(`no lead is registered for ${module}`);
  const { container } = render(<Lead {...leadProps(source)} />);
  for (const text of spoken(container))
    for (const [name, pattern] of FORBIDDEN) {
      const found = pattern.exec(text);
      expect(
        found,
        `${module}: ${name} in "${found ? text.slice(Math.max(0, found.index - 50), found.index + 60) : ""}"`,
      ).toBeNull();
    }
}

describe.each(MODULES)("%s lead", (module) => {
  it("uses no pipeline words with an empty entry", () => {
    check(module, entry(module, [], []));
  });
  for (const [label, build] of POPULATED[module] ?? [])
    it(`uses no pipeline words with the ${label} entry`, () => {
      check(module, build());
    });
  it("draws nothing for a blocked entry", () => {
    const blocked = entry(module, [], [
      { heading: "Findings", level: 2, line: 0, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 1,
        blocks: [
          { type: "text", line: 2, end: 2, text: "Not assessable: the sources were not supplied." },
        ],
      },
    ] as OutputEntry["sections"]);
    const Lead = leadFor(module);
    if (!Lead) throw new Error(`no lead is registered for ${module}`);
    const { container } = render(<Lead {...leadProps(blocked)} />);
    expect(container).toBeEmptyDOMElement();
  });
});
