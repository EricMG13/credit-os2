/**
 * The Documents step's optional comparison portfolio, drawn from a fixed view: its words, what it
 * shows of the service's reading, and that a problem is said on its own name box.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReferencePortfolio } from "../api";
import { ComparisonPortfolio } from "./ComparisonPortfolio";
import { FieldProblem } from "./fields";
import { comparisonFacts, comparisonLine } from "./plain";
import type { ComparisonView } from "./referencePortfolio";

afterEach(cleanup);

const HOLDINGS = new File(["holdings"], "SYNTHETIC holdings.csv", { type: "text/csv" });
const READ: ReferencePortfolio = {
  name: "Example comparison fund",
  as_of: "2026-10-31",
  positions: 7,
  unpriced: 1,
  limits: 3,
  found: ["Borrower", "Instrument", "FIGI", "Bid", "Ask"],
  not_found: ["CUSIP", "ISIN", "Coupon"],
  findings: ["No mandate file was supplied."],
};

function makeView(over: Partial<ComparisonView> = {}): ComparisonView {
  return {
    name: "",
    holds: "",
    files: [],
    fileProblem: "",
    changeName: vi.fn(),
    changeHolds: vi.fn(),
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    read: vi.fn(),
    remove: vi.fn(),
    ...over,
  };
}

describe("the comparison portfolio control", () => {
  it("is titled as optional and explains the three standing portfolios and this run only", () => {
    render(<ComparisonPortfolio view={makeView()} busy={false} />);
    const section = screen.getByRole("region", {
      name: "Compare against another portfolio (optional)",
    });
    expect(section).toHaveTextContent(
      "The report compares this issuer with three standing portfolios: a CLO portfolio, a loan index and a high yield index. To compare it with a different portfolio as well, add that portfolio's holdings file here and give it a name. Accepted: a holdings file with its limits and mandate files (CSV or Excel), or an index holdings workbook. It is used for this run only.",
    );
    expect(section).toHaveTextContent("CSV or Excel (.xlsx). Up to 4 files, 20 MB each.");
    expect(screen.getByLabelText("Portfolio name")).not.toBeRequired();
    expect(
      within(screen.getByLabelText("What it holds"))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Not stated", "Loans", "Bonds"]);
    const files = screen.getByLabelText<HTMLInputElement>("Comparison portfolio files");
    expect([files.type, files.multiple, files.accept]).toEqual(["file", true, ".csv,.xlsx"]);
    // Nothing chosen: nothing to read or remove, and no result.
    expect(screen.getByRole("button", { name: "Read portfolio" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Remove comparison portfolio" })).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    // No module id, internal key or hash in what a reader sees.
    expect(section.textContent).not.toMatch(/CP-|custom|sha|reference_portfolio/i);
  });

  it("passes the name, the choice and the chosen files to the form", () => {
    const view = makeView();
    render(<ComparisonPortfolio view={view} busy={false} />);
    fireEvent.change(screen.getByLabelText("Portfolio name"), { target: { value: "Fund" } });
    expect(view.changeName).toHaveBeenCalledWith("Fund");
    fireEvent.change(screen.getByLabelText("What it holds"), { target: { value: "bonds" } });
    expect(view.changeHolds).toHaveBeenCalledWith("bonds");
    fireEvent.change(screen.getByLabelText("Comparison portfolio files"), {
      target: { files: [HOLDINGS] },
    });
    expect(view.addFiles).toHaveBeenCalledTimes(1);
  });

  it("lists the chosen files, each with its own remove, and offers to read or remove them", () => {
    const view = makeView({ name: "Fund", files: [HOLDINGS] });
    render(<ComparisonPortfolio view={view} busy={false} />);
    const list = screen.getByRole("list", { name: "Comparison portfolio files chosen" });
    expect(within(list).getByRole("listitem")).toHaveTextContent("SYNTHETIC holdings.csv");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove SYNTHETIC holdings.csv from the comparison portfolio",
      }),
    );
    expect(view.removeFile).toHaveBeenCalledWith(HOLDINGS);
    fireEvent.click(screen.getByRole("button", { name: "Read portfolio" }));
    expect(view.read).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Remove comparison portfolio" }));
    expect(view.remove).toHaveBeenCalledTimes(1);
  });

  it("shows what the service read in plain words, with its notes", () => {
    render(
      <ComparisonPortfolio view={makeView({ files: [HOLDINGS], result: READ })} busy={false} />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Example comparison fund");
    expect(status).toHaveTextContent(
      "As of 2026-10-31. 7 positions. 1 position has no price. 3 limits read. Not found in the file: CUSIP, ISIN, Coupon.",
    );
    expect(
      within(screen.getByRole("list", { name: "Notes on the portfolio's files" })).getByRole(
        "listitem",
      ),
    ).toHaveTextContent("No mandate file was supplied.");
  });

  it("says when the file states no as-of date, once", () => {
    const undated = {
      ...READ,
      as_of: null,
      findings: ["The files state no as-of date that could be read."],
    };
    render(
      <ComparisonPortfolio view={makeView({ files: [HOLDINGS], result: undated })} busy={false} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("The file does not state an as-of date.");
    expect(screen.queryByRole("list", { name: "Notes on the portfolio's files" })).toBeNull();
  });

  it("says a refusal on the name box and a refused file beside the files", () => {
    const problem = new FieldProblem("reference_portfolio", "No holdings table was found.");
    render(
      <ComparisonPortfolio
        view={makeView({ files: [HOLDINGS], fileProblem: "notes.pdf is not a CSV or Excel file." })}
        problem={problem}
        busy={false}
      />,
    );
    const name = screen.getByLabelText("Portfolio name");
    expect(name).toBeInvalid();
    expect(name).toHaveAccessibleDescription("No holdings table was found.");
    const alerts = screen.getAllByRole("alert").map((alert) => alert.textContent);
    expect(alerts).toEqual([
      "No holdings table was found.",
      "notes.pdf is not a CSV or Excel file.",
    ]);
  });

  it("disables reading and removing while the form is busy", () => {
    render(<ComparisonPortfolio view={makeView({ name: "Fund", files: [HOLDINGS] })} busy />);
    for (const name of [
      "Read portfolio",
      "Remove comparison portfolio",
      "Remove SYNTHETIC holdings.csv from the comparison portfolio",
    ])
      expect(screen.getByRole("button", { name })).toBeDisabled();
  });
});

describe("the comparison portfolio in plain words", () => {
  it("counts one and many, and says what the prices are", () => {
    expect(
      comparisonFacts({ ...READ, positions: 1, unpriced: 0, limits: 1, not_found: [] }),
    ).toEqual(["As of 2026-10-31.", "1 position.", "Every position has a price.", "1 limit read."]);
    expect(
      comparisonFacts({ ...READ, unpriced: 2, limits: 0, found: ["Borrower", "Weight"] }),
    ).toEqual([
      "As of 2026-10-31.",
      "7 positions.",
      "2 positions have no price.",
      "No limits were read.",
      "Not found in the file: CUSIP, ISIN, Coupon.",
    ]);
    expect(comparisonFacts({ ...READ, unpriced: 0, found: ["Borrower", "Weight"] })[2]).toBe(
      "The file has no price or market value column.",
    );
  });

  it("is one line on the review: name, date and positions", () => {
    expect(comparisonLine(READ)).toBe("Example comparison fund · as of 2026-10-31 · 7 positions");
    expect(comparisonLine({ ...READ, as_of: null, positions: 1 })).toBe(
      "Example comparison fund · no as-of date stated · 1 position",
    );
  });
});
