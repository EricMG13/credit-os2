import { describe, expect, it } from "vitest";
import type { PriorInputs, Reading } from "../api";
import { intakeDocuments, storedForm } from "./intake";

const prior = (...names: string[]) => ({
  prior: { files: names.map((name) => ({ name, size: 1 })) } as unknown as PriorInputs,
});
const names = (rows: { name: string }[]) => rows.map((row) => row.name);

describe("storedForm", () => {
  it("mirrors filing.safe_name for each path part", () => {
    const file = (name: string) => new File(["x"], name);
    expect(storedForm(file("What next? Q3 2025.pdf"))).toBe("What next Q3 2025.pdf");
    expect(storedForm(file("Annual Report  2024.pdf"))).toBe("Annual Report 2024.pdf");
    expect(storedForm(file("a.pdf."))).toBe("a.pdf");
  });
});

describe("intakeDocuments earlier-run rows", () => {
  const reading = (over: Partial<Reading>) => ({ documents: [], ignored: [], ...over }) as Reading;
  it("keeps earlier files listed when a refused reading names only the refused file", () => {
    const { documentRows } = intakeDocuments(
      reading({ ignored: ["scan.pdf"] }),
      [],
      new Map(),
      prior("annual.pdf", "memo.docx"),
      [],
      true,
    );
    expect(names(documentRows).sort()).toEqual(["annual.pdf", "memo.docx", "scan.pdf"]);
  });
  it("lists a file the reading names once, even when the carry was not marked as run", () => {
    const { documentRows } = intakeDocuments(
      reading({ ignored: ["annual.pdf"] }),
      [],
      new Map(),
      prior("annual.pdf"),
      [],
      false,
    );
    expect(names(documentRows)).toEqual(["annual.pdf"]);
  });
});
