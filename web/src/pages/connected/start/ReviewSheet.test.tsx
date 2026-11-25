import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Answers, Summary } from "../api";
import { ReviewSheet } from "./ReviewSheet";

afterEach(cleanup);

const LONG_FILE = "Northbridge_Group_Annual_Report_and_Accounts_2025_Final_Audited_Version.txt";
const LONG_ISSUER = "Northbridge_Group_Holdings_Limited_Senior_Secured_Notes_Issuer_Entity_Name";

const answers: Answers = {
  context: {
    run: { as_of: "2025-12-31", pathway: "credit_snapshot", case_kind: "synthetic" },
    identity: { issuer_name: LONG_ISSUER, issuer_id: "northbridge" },
  },
  modules: [],
  max_turns: 10,
  level: "basic",
  model: "gpt",
  effort: "balanced",
  submitted_by: "Analyst",
};

const summary: Summary = {
  error: "",
  digest: "server-approved",
  cap: "30",
  documents: [{ source: LONG_FILE, kind: "annual_report" }],
  ignored: [],
  modules: ["CP-0"],
  items: [
    {
      id: "run:no-agreement",
      scope: "run",
      outcome: "gap",
      reason: "No agreement is chosen among the documents.",
      fix: "Add the executed agreement.",
    },
  ],
  omitted: [],
  changes: "first run",
  model: "gpt",
  effort: "balanced",
};

function renderSheet(review: { answers: Answers; summary: Summary } = { answers, summary }) {
  return render(
    <ReviewSheet
      review={review}
      accepted={new Set()}
      onAccept={vi.fn()}
      onEdit={vi.fn()}
      onModules={vi.fn()}
      disabled={false}
    />,
  );
}

// The Deep pathway with no agreement chosen: Legal & covenants will refuse, and so will the
// Recovery & fulcrum module that reads it, so the sheet offers to leave both out.
const deepNoAgreement = {
  answers: {
    ...answers,
    context: {
      ...answers.context,
      run: { ...answers.context.run, pathway: "deep_credit_assessment" },
    },
  },
  summary: {
    ...summary,
    items: [
      {
        id: "CP-4:declared-none",
        scope: "CP-4",
        outcome: "will_refuse",
        reason: "Legal documents declared none.",
        fix: "Add the executed agreement.",
        inherited_from: [],
      },
      {
        id: "CP-4C:from:CP-4",
        scope: "CP-4C",
        outcome: "will_refuse",
        reason: "Expected to refuse because it reads CP-4.",
        fix: "",
        inherited_from: ["CP-4"],
      },
    ],
  },
};

const followsInDocument = (first: HTMLElement, second: HTMLElement) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("ReviewSheet", () => {
  it("C2-007 draws the decision first, and every echoed input after it behind one closed disclosure", () => {
    renderSheet();
    const decision = screen.getByRole("region", { name: "Review and start" });
    const limits = within(decision).getByRole("region", { name: "Limits to decide" });
    expect(within(decision).getByRole("region", { name: "What it will cost" })).toBeInTheDocument();
    expect(
      within(decision).getByRole("region", { name: "What leaves the building" }),
    ).toBeInTheDocument();
    const inputs = screen.getByRole("region", { name: "What will run" });
    expect(followsInDocument(limits, inputs)).toBe(true);
    expect(decision).not.toContainElement(inputs);
    // One disclosure, closed until opened, holds every input; nothing is left out of it.
    const disclosure = inputs.closest("details");
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute("open");
    expect(disclosure?.querySelector("summary")).toHaveTextContent("Everything Submit sends");
    for (const title of ["Issuer and documents", "Purpose and modules", "Context"])
      expect(within(decision).queryByRole("group", { name: title })).toBeNull();
  });

  it("C2-007 still draws every block and its rows, including those that are not given", () => {
    renderSheet();
    const inputs = screen.getByRole("region", { name: "What will run" });
    for (const title of [
      "Issuer and documents",
      "Purpose and modules",
      "Context",
      "Advanced choices",
    ]) {
      expect(within(inputs).getByRole("group", { name: title })).toBeInTheDocument();
    }
    const context = within(inputs).getByRole("group", { name: "Context" });
    expect(within(context).getAllByText("Not given").length).toBeGreaterThan(0);
    expect(within(inputs).getByText("Documents read")).toBeInTheDocument();
    expect(within(inputs).getAllByRole("button", { name: /^Edit / })).toHaveLength(5);
    expect(
      within(screen.getByRole("region", { name: "Limits to decide" })).getByRole("checkbox", {
        name: "I accept this limit",
      }),
    ).toBeInTheDocument();
  });

  // jsdom has no layout, so the wrapping is held by the classes the Documents step already uses
  // (StartRun.tsx, "wrap-anywhere" with "min-w-0"); the C2-001 probe measures it in a browser.
  it("C2-001 lets an unbroken file name and issuer name wrap inside the sheet", () => {
    renderSheet();
    const inputs = screen.getByRole("region", { name: "What will run" });
    expect(inputs).toHaveClass("min-w-0", "wrap-anywhere");
    for (const name of ["Issuer and documents", "Purpose and modules", "Context"]) {
      expect(within(inputs).getByRole("group", { name })).toHaveClass("min-w-0");
    }
    const issuer = within(inputs).getByText(LONG_ISSUER);
    const file = within(inputs).getByText(new RegExp(LONG_FILE));
    expect(issuer.closest(".wrap-anywhere")).not.toBeNull();
    expect(file.closest(".wrap-anywhere")).not.toBeNull();
    const limits = screen.getByRole("region", { name: "Limits to decide" });
    expect(limits).toHaveClass("min-w-0", "wrap-anywhere");
  });

  // overflow-wrap: anywhere lowers a flex item's minimum width, so a title that shares a row with
  // the nowrap Edit button is squeezed and split inside a word at 390 px. A wrapping row drops
  // the button below the title instead, and the title then breaks only if one word cannot fit.
  it("C2-001 lets a block's Edit button drop below its title instead of squeezing the title", () => {
    renderSheet();
    const inputs = screen.getByRole("region", { name: "What will run" });
    for (const name of ["Issuer and documents", "Purpose and modules", "Context"]) {
      const group = within(inputs).getByRole("group", { name });
      const title = within(group).getByRole("heading", { level: 4, name });
      expect(title.parentElement).toHaveClass("flex", "flex-wrap");
      const edit = within(group).getByRole("button", { name: `Edit ${name.toLowerCase()}` });
      expect(edit.parentElement).toBe(title.parentElement);
    }
  });

  // The Button is whitespace-nowrap, so the long Leave out label set the card's minimum width and
  // the card overflowed the 316 px column on the Deep pathway; the label wraps like StartRun's
  // problem button.
  it("C2-001 lets the Leave out label wrap inside the limit card", () => {
    renderSheet(deepNoAgreement);
    const limits = screen.getByRole("region", { name: "Limits to decide" });
    const leave = within(limits).getByRole("button", {
      name: "Leave out Legal & covenants and Recovery & fulcrum",
    });
    expect(leave).toHaveClass("max-w-full", "text-left", "whitespace-normal");
    expect(leave).not.toHaveClass("whitespace-nowrap");
    expect(
      within(limits).getByText(/^The report sections of the modules left out are not filled/),
    ).toBeInTheDocument();
  });
});
