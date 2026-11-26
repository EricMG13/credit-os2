import { expect, it } from "vitest";
import { readerText } from "./publishedReport";

it("names a bare CP-L10 by the run's pathway, and by default elsewhere", () => {
  expect(readerText("CP-L10 found no gap.", "credit_screening")).toBe(
    "Credit screening found no gap.",
  );
  expect(readerText("See CP-L10 and CP-1.", "credit_screening")).toBe(
    "See Credit screening and Financial foundation.",
  );
  expect(readerText("CP-L10 found no gap.")).toBe("Short credit snapshot found no gap.");
  expect(readerText("CP-L10 found no gap.", "lite_credit_assessment")).toBe(
    "Short credit snapshot found no gap.",
  );
});
