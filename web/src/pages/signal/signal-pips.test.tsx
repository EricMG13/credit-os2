// The colour-signal-build ruling C4 (PR 7): strength is three pips filled with amount steps 1, 3 and 5.
// Expected classes are written by hand, never read from the code.
import { render, screen } from "@testing-library/react";
import { Rating } from "./parts/Rating";

describe("the strength pips", () => {
  it.each([
    [1, "fill-scale-amount-1", "Light"],
    [2, "fill-scale-amount-3", "Moderate"],
    [3, "fill-scale-amount-5", "Strong"],
  ] as const)("marks %i fill that many pips with %s", (marks, fill, word) => {
    render(<Rating marks={marks} word={word} />);
    const image = screen.getByRole("img", { name: `${word} signal` });
    const pips = Array.from(image.querySelectorAll("svg"));
    expect(pips).toHaveLength(3);
    const filled = pips.filter((p) => p.classList.contains(fill));
    expect(filled).toHaveLength(marks);
    for (const pip of filled) expect(pip.classList.contains("stroke-scale-amount-edge")).toBe(true);
    for (const pip of pips.filter((p) => !filled.includes(p))) {
      expect(pip.getAttribute("class")).not.toMatch(/fill-scale-amount/);
      expect(pip.classList.contains("fill-none")).toBe(true);
    }
    expect(image.textContent).toContain(word);
  });
});
