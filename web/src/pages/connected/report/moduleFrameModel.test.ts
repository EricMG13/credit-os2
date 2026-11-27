import { describe, expect, it } from "vitest";
import type { OutputEntry, Section } from "../publishedReport";
import { moduleFrame } from "./moduleFrameModel";

const text = (line: number, value: string) => ({
  type: "text" as const,
  line,
  end: line,
  text: value,
});

const section = (heading: string, level: number, line: number, blocks: Section["blocks"] = []) => ({
  heading,
  level,
  line,
  blocks,
});

function entry(module: string): OutputEntry {
  return {
    selected: true,
    output: { id: module, module, label: module, href: "", sha256: "a".repeat(64) },
    sections: [
      section("Findings", 2, 1),
      section("Bottom line", 3, 2, [text(3, "The source supports a retrospective view.")]),
      section("Key findings", 3, 4, [text(5, "The evidence is incomplete.")]),
      section("Contrary evidence and what would change the view", 3, 6, [
        text(7, "A current filing would change the view."),
      ]),
      section("Limitations", 3, 8, [text(9, "The year-end filing was published later.")]),
      section("Preparation summary", 3, 10, [text(11, "The sources were reviewed.")]),
    ],
  };
}

describe("table-centred module frames", () => {
  it.each(["CP-0", "CP-PARSE", "CP-1C"])(
    "%s keeps its bottom line and limitations while hiding surplus reader prose",
    (module) => {
      const frame = moduleFrame(entry(module));
      expect(frame.bottomLine?.kind).toBe("passage");
      expect(frame.keyFindings).toBeUndefined();
      expect(frame.contrary).toBeUndefined();
      const limitation = frame.limitations?.blocks[0];
      expect(limitation?.type).toBe("text");
      if (limitation?.type === "text") expect(limitation.text).toContain("published later");
      expect(frame.prose).toEqual([]);
      expect(frame.missing).toEqual([]);
    },
  );

  it("keeps full prose treatment for a module outside the data-module set", () => {
    const frame = moduleFrame(entry("CP-2"));
    expect(frame.keyFindings?.heading).toBe("Key findings");
    expect(frame.contrary?.heading).toBe("Contrary evidence and what would change the view");
    expect(frame.prose.map(({ title }) => title)).toEqual(["Preparation summary"]);
  });
});
