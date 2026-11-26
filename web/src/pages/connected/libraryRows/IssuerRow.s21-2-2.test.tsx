import { afterEach, expect, it } from "vitest";
// Probe S21-2-2: in an opened Library row the "More figures" Gross leverage figure is drawn under its
// stated heading ("Total debt / adjusted EBITDA, FY2025") but its source control and the status
// sentence it raises name it by the plain "Gross leverage". The row's headline cells pass the drawn
// name (IssuerRow.figure: trace.button(key, shown, ...)); moreStats passes the plain `name`.
// Answer key: the headline cell's own behaviour, worked by hand from the same catalogue shape:
// "Show sources for Net debt / adjusted EBITDA, Acme"; so this control must read
// "Show sources for Total debt / adjusted EBITDA, Acme".
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CatalogueRun, LibraryIndex } from "../publishedReport";
import { groupIssuers } from "./group";
import { IssuerRow } from "./IssuerRow";

afterEach(cleanup);

const metrics = {
  net_leverage: {
    value: "2.80",
    unit: "x",
    period: "FY2025",
    basis: "Issuer-adjusted EBITDA.",
    label: "Net debt / adjusted EBITDA",
  },
  leverage: {
    value: "3.50",
    unit: "x",
    period: "FY2025",
    basis: "Issuer-adjusted EBITDA.",
    label: "Total debt / adjusted EBITDA",
  },
} as unknown as CatalogueRun["metrics"];
const entry: CatalogueRun = {
  id: "acme-2026",
  name: "Acme",
  issuer: "Acme",
  title: "Full credit assessment",
  date: "2026-03-31",
  sector: "Industrial",
  period: "FY2025",
  metrics,
};
const index: LibraryIndex = {
  catalogue: { real: [entry] },
  workspace: {
    runs: { "acme-2026": { folder: "acme-2026", issuerKey: "acme", pathway: "credit_snapshot" } },
  },
};

it("the Gross leverage source control names the figure by the heading it is drawn under", () => {
  const [group] = groupIssuers(index);
  if (!group) throw new Error("no group");
  const { container } = render(createElement("ul", null, createElement(IssuerRow, { group })));
  fireEvent.click(screen.getByRole("button", { name: "Show runs and detail for Acme" }));
  expect(container.textContent).toContain("Total debt / adjusted EBITDA, FY2025");
  const labels = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
  expect(labels).toContain("Show sources for Net debt / adjusted EBITDA, Acme");
  expect(labels).toContain("Show sources for Total debt / adjusted EBITDA, Acme");
});
