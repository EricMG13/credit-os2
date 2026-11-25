import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ReasonNotes } from "./notes";

afterEach(cleanup);

// Real TransDigm CP-1 "Chart data: debt maturities" basis cells: every row cites the filing's page.
const CITED = [
  "Same reported long-term debt schedule and exclusions; annual filing page 153.",
  "Same reported schedule; maturity-bucket allocation unresolved; annual filing page 153.",
  "Same reported schedule; annual filing page 153; thereafter not disaggregated.",
];

it("draws several notes that cite a source as one counted link, not the same link repeated", () => {
  render(
    <ReasonNotes
      notes={[
        ...CITED.map((text, at) => ({ text, line: 275 + at })),
        { text: "The ladder adds correctly." },
      ]}
      href={(line) => `/report/run#evidence/x-${String(line)}`}
    />,
  );
  expect(screen.getByText("The ladder adds correctly.")).toBeVisible();
  expect(screen.queryByRole("link", { name: "Read the reason in Evidence" })).toBeNull();
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveTextContent("3 notes on this figure cite a source: read them in Evidence");
  expect(links[0]).toHaveAttribute("href", "/report/run#evidence/x-275");
  // Wraps inside a narrow tile (the rank stack at 1024 px), never one unbroken line.
  expect(links[0]).toHaveClass("whitespace-normal", "max-w-full");
  expect(links[0]).not.toHaveClass("whitespace-nowrap");
  expect(document.body).not.toHaveTextContent(/page 153/);
});

it("keeps a single cited note, and one with its own lead, as its own link", () => {
  render(
    <ReasonNotes
      notes={[
        { text: CITED[0] ?? "", line: 275 },
        { lead: "FY2027: ", text: CITED[1] ?? "", line: 276 },
      ]}
      href={(line) => `/report/run#evidence/x-${String(line)}`}
    />,
  );
  const links = screen.getAllByRole("link", { name: "Read the reason in Evidence" });
  expect(links).toHaveLength(2);
  // The link wraps inside a narrow tile rather than widening the page.
  for (const link of links) expect(link).toHaveClass("whitespace-normal", "max-w-full");
});
