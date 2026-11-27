import { describe, expect, it } from "vitest";
import { drawnCellText } from "./forecastData";

const UNCITED =
  "4.88x on the covenant definition; pro forma 6.02x after including the add-backs agreed with the lenders in the amended terms of the facility agreement signed in the second quarter";

describe("drawnCellText over the judged length", () => {
  it("draws long text that cites nothing exactly as written", () => {
    expect(UNCITED.length).toBeGreaterThan(160);
    expect(drawnCellText(UNCITED)).toBe(UNCITED);
  });

  it("still hides a note citation in long text", () => {
    const cited = `${UNCITED}; see Note 4`;
    expect(drawnCellText(cited)).not.toContain("Note 4");
  });
});
