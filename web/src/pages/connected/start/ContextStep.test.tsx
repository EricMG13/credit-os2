import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "../ConnectedApp";
import { setUpConnectedPage } from "./connectedTesting";
import { chooseControl } from "./testControls";

setUpConnectedPage();

const caps = {
  credit_snapshot: "30",
  lite_credit_assessment: "20",
  deep_credit_assessment: "50",
  earnings_update: "20",
  relative_value: "20",
  covenant_refinancing: "20",
  distressed_restructuring: "20",
  portfolio_decision: "20",
  credit_screening: "10",
  short_snapshot: "20",
};
const file = new File(["sample input"], "Credit & facts.html", { type: "text/html" });

function stubFetch() {
  const entries: Record<string, unknown> = {
    "/connected/context": {
      run: {
        as_of: "",
        pathway: "credit_snapshot",
        case_kind: "synthetic",
        reporting_currency: "USD",
      },
      identity: { issuer_name: "", issuer_id: "" },
      submission_caps_usd: caps,
    },
    "/api/submissions": { id: "sub-1" },
    "/api/submissions/sub-1/files?name=Credit%20%26%20facts.html": { name: file.name },
    "/api/submissions/sub-1/reading": {
      documents: [{ source: file.name, kind: "annual_report", period_end: "2026-06-30" }],
      ignored: [],
      error: "",
    },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      if (!Object.hasOwn(entries, path)) throw new Error(`Unexpected request ${path}`);
      return Promise.resolve(Response.json(entries[path]));
    }),
  );
}

async function toContext(pathway: string, level?: string) {
  stubFetch();
  render(<ConnectedApp path="/start" mode="synthetic" />);
  fireEvent.change(await screen.findByLabelText("Issuer name", {}, { timeout: 5000 }), {
    target: { value: "Synthetic Générale" },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
  fireEvent.click(screen.getByRole("radio", { name: pathway }));
  if (level) chooseControl("Run form level", level);
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
}

/** A section by its title: the disclosure whose summary holds that h3. */
function section(title: string) {
  const holder = screen.getByRole("heading", { level: 3, name: title }).closest("details");
  if (!holder) throw new Error(`No section titled ${title}`);
  return holder;
}

function header(title: string) {
  const summary = section(title).querySelector(":scope > summary");
  if (!(summary instanceof HTMLElement)) throw new Error(`No summary for ${title}`);
  return summary;
}

/** The one line a closed section shows under its title. */
const said = (title: string) => header(title).textContent.replace(title, "");

const openTitles = () =>
  [...document.querySelectorAll("details[name='context-section'][open] > summary h3")].map(
    (node) => node.textContent,
  );

const BASIC_TITLES = [
  "For the research",
  "Dates and periods",
  "Legal documents",
  "Files with a role",
  "Ratings, quotes and facilities",
  "Issuer details",
];

describe("the More context step sections", () => {
  it("draws the sections in order, each closed, its title an h3 in its summary", async () => {
    await toContext("Deep credit assessment");
    const titles = [...document.querySelectorAll("details[name='context-section'] > summary h3")];
    expect(titles.map((node) => node.textContent)).toEqual(BASIC_TITLES);
    expect(openTitles()).toEqual([]);
    for (const title of BASIC_TITLES) expect(header(title).tagName).toBe("SUMMARY");
    expect(screen.getByRole("heading", { level: 2, name: "More context" })).toBeInTheDocument();
    expect(document.querySelector("legend")).toBeNull();
  });

  it("puts each control in its section", async () => {
    await toContext("Deep credit assessment");
    const research = within(section("For the research"));
    expect(research.getByLabelText("Anything the analysis should know")).toHaveAttribute(
      "aria-describedby",
      "run-analyst-questions",
    );
    expect(research.getByRole("region", { name: "Research questions" })).toBeInTheDocument();
    const dates = within(section("Dates and periods"));
    for (const name of [
      "Date of your newest file",
      "Research cutoff",
      /^Current period/,
      /^Prior period/,
    ])
      expect(dates.getByLabelText(name)).toBeInTheDocument();
    expect(within(section("Legal documents")).getByLabelText("Legal documents")).toHaveAttribute(
      "data-field",
      "legal_documents",
    );
    const deal = within(section("Ratings, quotes and facilities"));
    for (const name of ["Ratings", "Observed quotes", "Facilities and deal terms"])
      expect(deal.getByRole("region", { name })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Ratings" })).toBeInTheDocument();
    const issuer = within(section("Issuer details"));
    for (const name of ["Borrower (legal entity)", "Guarantors", "Listed equity"])
      expect(issuer.getByLabelText(name)).toBeInTheDocument();
    expect(issuer.queryByLabelText("Ticker")).toBeNull();
  });

  it("opens a section from its summary and closes it again; all share one accordion name", async () => {
    await toContext("Deep credit assessment");
    const holders = [...document.querySelectorAll("details")].filter(
      (node) => node.querySelector(":scope > summary h3") !== null,
    );
    expect(holders).toHaveLength(BASIC_TITLES.length);
    // The shared name is what makes the browser keep one open at a time (jsdom does not).
    for (const node of holders) expect(node).toHaveAttribute("name", "context-section");
    expect(screen.getByLabelText("Anything the analysis should know")).not.toBeVisible();
    fireEvent.click(header("For the research"));
    expect(openTitles()).toEqual(["For the research"]);
    expect(screen.getByLabelText("Anything the analysis should know")).toBeVisible();
    fireEvent.click(header("For the research"));
    expect(openTitles()).toEqual([]);
  });

  it("says what each section holds, from the form alone", async () => {
    await toContext("Deep credit assessment");
    expect(said("For the research")).toBe("Not given");
    expect(said("Dates and periods")).toBe(
      "Cutoff 2026-10-31 · periods not given · newest file 2026-06-30",
    );
    expect(said("Legal documents")).toBe("No agreement");
    expect(said("Files with a role")).toBe("None chosen");
    expect(said("Ratings, quotes and facilities")).toBe("Not given");
    expect(said("Issuer details")).toBe("Not given");

    fireEvent.change(screen.getByLabelText("Anything the analysis should know"), {
      target: { value: "Check the 2028 maturities." },
    });
    const questions = within(screen.getByRole("region", { name: "Research questions" }));
    fireEvent.click(questions.getByRole("button", { name: "Add research question" }));
    expect(said("For the research")).toBe("Note given · 1 question row, not filled");
    fireEvent.change(questions.getByLabelText(/^Question/), {
      target: { value: "How much of EBITDA is cost savings?" },
    });
    expect(said("For the research")).toBe("Note given · 1 question");

    fireEvent.change(screen.getByLabelText(/^Current period/), { target: { value: "q3-2026" } });
    expect(said("Dates and periods")).toBe(
      "Cutoff 2026-10-31 · current q3-2026, prior not given · newest file 2026-06-30",
    );

    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "executed" } });
    expect(said("Legal documents")).toBe("Executed agreement · agreement file not chosen");
    fireEvent.change(screen.getByLabelText("The agreement"), { target: { value: file.name } });
    expect(said("Legal documents")).toBe(`Executed agreement · ${file.name}`);

    fireEvent.change(screen.getByLabelText("Portfolio workbook"), { target: { value: file.name } });
    expect(said("Files with a role")).toBe(`Portfolio workbook: ${file.name}`);

    const ratings = within(screen.getByRole("region", { name: "Ratings" }));
    fireEvent.click(ratings.getByRole("button", { name: "Add rating" }));
    fireEvent.change(ratings.getByLabelText(/^Agency/), { target: { value: "Moody's" } });
    expect(said("Ratings, quotes and facilities")).toBe("1 rating · no quotes · no facilities");

    fireEvent.change(screen.getByLabelText("Sector"), { target: { value: "Industrials" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Listed equity" }));
    fireEvent.change(screen.getByLabelText("Ticker"), { target: { value: "SYN" } });
    expect(said("Issuer details")).toBe("Sector given · listed equity, ticker SYN");
  });

  it("draws the agreement only when legal documents are named", async () => {
    await toContext("Deep credit assessment");
    const legal = within(section("Legal documents"));
    expect(legal.queryByLabelText("The agreement")).toBeNull();
    fireEvent.change(legal.getByLabelText("Legal documents"), {
      target: { value: "executed" },
    });
    expect(legal.getByLabelText("The agreement")).toHaveAttribute("data-field", "agreement");
  });

  it("opens the closed section of a field with a problem, so its message shows", async () => {
    await toContext("Deep credit assessment");
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "executed" } });
    expect(openTitles()).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose the uploaded file that is the agreement.",
    );
    await waitFor(() => {
      expect(openTitles()).toEqual(["Legal documents"]);
    });
    const agreement = screen.getByLabelText("The agreement");
    expect(agreement).toBeVisible();
    expect(screen.getByRole("alert")).toBeVisible();
    await waitFor(() => {
      expect(agreement).toHaveFocus();
    });
  });

  it("draws the workbook for Deep and no bridge or prior record on a standard form", async () => {
    await toContext("Deep credit assessment");
    const files = within(section("Files with a role"));
    expect(files.getByLabelText("Portfolio workbook")).toBeInTheDocument();
    expect(files.queryByLabelText("Management EBITDA bridge")).toBeNull();
    expect(files.queryByLabelText("Prior decision record")).toBeNull();
    expect(screen.queryByText("Valuation and peers")).toBeNull();
    expect(screen.queryByText("Model and modules")).toBeNull();
    expect(screen.queryByLabelText("Turns per module")).toBeNull();
  });

  it("requires the periods, says so closed, and opens Dates and periods for an Earnings Update", async () => {
    await toContext("Earnings Update");
    expect(openTitles()).toEqual(["Dates and periods"]);
    const dates = within(section("Dates and periods"));
    expect(dates.getByLabelText(/^Current period/)).toHaveAttribute("aria-required", "true");
    expect(dates.getByLabelText(/^Current period/)).toBeVisible();
    expect(said("Dates and periods")).toBe(
      "Periods required, not given · cutoff 2026-10-31 · newest file 2026-06-30",
    );
    fireEvent.change(dates.getByLabelText(/^Prior period/), { target: { value: "q2-2026" } });
    expect(said("Dates and periods")).toBe(
      "Periods required: current not given, prior q2-2026 · cutoff 2026-10-31 · newest file 2026-06-30",
    );
    const files = within(section("Files with a role"));
    expect(files.getByLabelText("Management EBITDA bridge")).toBeInTheDocument();
    expect(files.queryByLabelText("Portfolio workbook")).toBeNull();
  });

  it("omits the files section when no file control applies", async () => {
    await toContext("Relative Value");
    expect(screen.queryByRole("heading", { level: 3, name: "Files with a role" })).toBeNull();
    expect(screen.queryByLabelText("Portfolio workbook")).toBeNull();
  });

  it("draws every file control and the Advanced sections on an Advanced form", async () => {
    await toContext("Deep credit assessment", "advanced");
    const files = within(section("Files with a role"));
    for (const name of ["Management EBITDA bridge", "Portfolio workbook", "Prior decision record"])
      expect(files.getByLabelText(name)).toBeInTheDocument();
    const titles = [...document.querySelectorAll("details[name='context-section'] > summary h3")];
    expect(titles.map((node) => node.textContent)).toEqual([
      ...BASIC_TITLES,
      "Valuation and peers",
      "Module options",
      "Scenario assumptions",
      "Model and modules",
    ]);
    expect(openTitles()).toEqual([]);
    expect(within(section("Valuation and peers")).getByLabelText(/^Peer source/)).toHaveAttribute(
      "data-field",
      "valuation",
    );
    expect(said("Valuation and peers")).toBe(
      "Peer source: Research finds public peers (default) · valuation basis: Automatic",
    );
    expect(said("Module options")).toBe(
      "Relative value mode: Let the module decide (default) · Deep Debate off",
    );
    expect(said("Scenario assumptions")).toBe("None pinned");
    const model = within(section("Model and modules"));
    for (const name of ["Model", "Reasoning effort", "Turns per module"])
      expect(model.getByLabelText(name)).toBeInTheDocument();
    expect(model.getByLabelText("Turns per module")).toHaveAttribute("data-field", "turns");
    const requested = model.getByRole("group", { name: "Requested modules" });
    const boxes = within(requested).getAllByRole("checkbox");
    expect(said("Model and modules")).toBe(
      `GPT Sol · Balanced · 32 turns per module · all ${String(boxes.length)} modules`,
    );
    fireEvent.click(within(requested).getByRole("checkbox", { name: "Peer benchmark" }));
    expect(said("Model and modules")).toBe(
      `GPT Sol · Balanced · 32 turns per module · ${String(boxes.length - 1)} of ${String(boxes.length)} modules`,
    );
  });
});
