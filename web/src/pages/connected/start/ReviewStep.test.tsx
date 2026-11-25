import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Answers, Summary } from "../api";
import type { Review } from "./intake";
import { ReviewConfirmation } from "./ReviewStep";

afterEach(cleanup);

const answers: Answers = {
  context: {
    run: { as_of: "2025-03-31", pathway: "credit_snapshot", case_kind: "private" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  modules: [],
  max_turns: 32,
  level: "basic",
  model: "gpt",
  effort: "balanced",
  submitted_by: "Ana L",
};

const summary: Summary = {
  error: "",
  digest: "approved",
  cap: "25",
  documents: [{ source: "filing.txt", kind: "annual_report" }],
  ignored: [],
  modules: ["CP-0", "CP-DR", "CP-4"],
  items: [
    {
      id: "CP-4:agreement",
      scope: "CP-4",
      outcome: "will_refuse",
      reason: "No executed agreement is among the files.",
    },
  ],
  omitted: [],
  changes: "first run",
  web_search: true,
  model: "gpt",
  effort: "balanced",
};

const review: Review = { id: "sub-1", answers, summary, cap: "25", attachmentNames: {} };

function show({
  synthetic = false,
  accepted = new Set<string>(),
  approved = false,
  summary: changed = {},
}: {
  synthetic?: boolean;
  accepted?: Set<string>;
  approved?: boolean;
  summary?: Partial<Summary>;
} = {}) {
  const onApprove = vi.fn();
  render(
    <ReviewConfirmation
      modelVerified
      idNote=""
      review={{ ...review, summary: { ...summary, ...changed } }}
      accepted={accepted}
      approved={approved}
      checksComplete={accepted.size > 0}
      error=""
      submitUncertain={false}
      capText="USD 25.00"
      capAvailable
      synthetic={synthetic}
      ready="2 of 4 ready · Cap USD 25.00"
      onAccept={vi.fn()}
      onApprove={onApprove}
      onEdit={vi.fn()}
      onModules={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
  return onApprove;
}

const before = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("Review and start", () => {
  it("draws the decision as one tile: the run, its cost, the limits, what leaves, then Submit", () => {
    show();
    const decision = screen.getByRole("region", { name: "Review and start" });
    const [cost, limits, leaves, stages] = [
      within(decision).getByRole("region", { name: "What it will cost" }),
      within(decision).getByRole("region", { name: "Limits to decide" }),
      within(decision).getByRole("region", { name: "What leaves the building" }),
      within(decision).getByRole("region", { name: "Modules by stage" }),
    ];
    expect(within(decision).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Review and start",
    );
    // What will run, as terms and values rather than one run-on line.
    const run = within(decision).getByText("Issuer", { selector: "dt" }).closest("dl");
    expect(run).toHaveTextContent(
      /^IssuerNorthbridge.*As of2025-03-31PathwayFull credit assessment/,
    );
    expect(run).toHaveTextContent(/Documents read1Modules3$/);
    expect(within(decision).getByText("Paid run")).toBeInTheDocument();
    // Where the rail sits under the form, the stages follow the limits and Submit ends the tile.
    expect(before(cost, limits)).toBe(true);
    expect(before(limits, stages)).toBe(true);
    expect(before(stages, leaves)).toBe(true);
    expect(
      before(
        stages,
        within(decision).getByRole("button", { name: "Submit, spend up to USD 25.00" }),
      ),
    ).toBe(true);
    expect(within(limits).getByRole("checkbox", { name: "I accept this limit" })).toBeEnabled();
    expect(within(stages).getByRole("list", { name: "Stages in this run" })).toBeInTheDocument();
    const inputs = screen.getByRole("region", { name: "What will run" });
    expect(before(decision, inputs)).toBe(true);
    expect(inputs.closest("details")).not.toHaveAttribute("open");
  });

  it("states the cap as the largest figure, in mono, and what leaves the building before the consent and Submit", () => {
    show();
    const decision = screen.getByRole("region", { name: "Review and start" });
    const cost = within(decision).getByRole("region", { name: "What it will cost" });
    const figure = within(cost).getByText("USD 25.00", { selector: "span" });
    expect(figure).toHaveClass("font-mono", "tabular-nums", "text-metric");
    expect(cost).toHaveTextContent("Spending capUSD 25.00Cap · Full credit assessment");
    const leaves = within(decision).getByRole("heading", { name: "What leaves the building" });
    const search = within(decision).getByText(/The research module will search the web\./);
    const consent = within(decision).getByRole("checkbox", {
      name: "Approve: I have read this summary and want this run started",
    });
    const submit = within(decision).getByRole("button", { name: "Submit, spend up to USD 25.00" });
    expect(before(figure, leaves)).toBe(true);
    expect(before(leaves, search)).toBe(true);
    expect(before(search, consent)).toBe(true);
    expect(before(consent, submit)).toBe(true);
    expect(submit).toHaveAttribute("aria-describedby", "run-submit-cost");
    expect(document.getElementById("run-submit-cost")).toHaveTextContent(
      "Once confirmed, this run can spend up to USD 25.00.",
    );
  });

  it("at the Basic level keeps model, effort and turns out of the decision, in the disclosure only", () => {
    show();
    const decision = screen.getByRole("region", { name: "Review and start" });
    expect(decision).not.toHaveTextContent(/Turns per module|Model and effort|GPT/);
    const inputs = screen.getByRole("region", { name: "What will run" });
    expect(within(inputs).getByRole("group", { name: "Advanced choices" })).toHaveTextContent(
      "Turns per module32",
    );
  });

  it("draws what leaves as a gap when the service says nothing about it, never as nothing", () => {
    show({ summary: { web_search: false } });
    const leaves = screen.getByRole("region", { name: "What leaves the building" });
    expect(leaves).toHaveTextContent("The service does not say what leaves.");
    expect(leaves).not.toHaveTextContent(/nothing|no data/i);
  });

  it("keeps the gating: consent waits for every decision, Submit for the consent", () => {
    show();
    const consent = screen.getByRole("checkbox", { name: /^Approve:/ });
    expect(consent).toBeDisabled();
    expect(screen.getByText("1 decision left before you can approve.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit, spend up to USD 25.00" })).toBeDisabled();
    cleanup();
    const onApprove = show({ accepted: new Set(["CP-4:agreement"]) });
    fireEvent.click(screen.getByRole("checkbox", { name: /^Approve:/ }));
    expect(onApprove).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Submit, spend up to USD 25.00" })).toBeDisabled();
    cleanup();
    show({ accepted: new Set(["CP-4:agreement"]), approved: true });
    expect(screen.getByRole("button", { name: "Submit, spend up to USD 25.00" })).toBeEnabled();
  });

  it("says a synthetic test costs nothing and keeps its own Submit label", () => {
    show({ synthetic: true, accepted: new Set(["CP-4:agreement"]), approved: true });
    const decision = screen.getByRole("region", { name: "Review and start" });
    const cost = within(decision).getByRole("region", { name: "What it will cost" });
    expect(within(cost).getByText("USD 0.00", { selector: "span" })).toHaveClass("font-mono");
    expect(cost).toHaveTextContent("USD 0.00A paid run is capped at USD 25.00");
    expect(within(decision).getByText("No-cost test", { selector: "span" })).toBeInTheDocument();
    expect(within(decision).getByRole("button", { name: "Submit run" })).toBeEnabled();
  });

  it("restates the issuer, pathway and cap in the confirmation, with Cancel focused", async () => {
    show({ accepted: new Set(["CP-4:agreement"]), approved: true });
    fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 25.00" }));
    const dialog = await screen.findByRole("dialog", { name: "Start a paid run?" });
    expect(dialog).toHaveTextContent("IssuerNorthbridge");
    expect(dialog).toHaveTextContent("PathwayFull credit assessment");
    expect(dialog).toHaveTextContent("CapUSD 25.00");
    // The rest of what the review shows is restated too: nothing the summary does not hold.
    expect(dialog).toHaveTextContent("As of2025-03-31");
    expect(dialog).toHaveTextContent("Documents read1");
    expect(dialog).toHaveTextContent("Modules3");
    expect(dialog).toHaveTextContent("Limits accepted1");
    expect(dialog).toHaveTextContent("Will refuseLegal & covenants");
    expect(dialog).toHaveTextContent(`Submitted by${answers.submitted_by}`);
    expect(dialog).not.toHaveTextContent(/CP-/);
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    });
  });
});
