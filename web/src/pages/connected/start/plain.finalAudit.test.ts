import { expect, it, vi } from "vitest";
import { refusalLines } from "./plain";

it("C2-027 logs removal of a launcher prefix while preserving its visible explanation", () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    expect(refusalLines("--sources: empty.txt has no extractable text")).toEqual([
      "Empty.txt has no extractable text",
    ]);
    expect(warning).toHaveBeenCalledWith(
      "Launcher flag prefix removed; its explanation is shown to the analyst: --sources: empty.txt has no extractable text",
    );
  } finally {
    warning.mockRestore();
  }
});
