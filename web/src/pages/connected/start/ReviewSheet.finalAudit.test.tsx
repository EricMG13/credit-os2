import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Answers, Summary } from "../api";
import { ReviewSheet } from "./ReviewSheet";

const answers: Answers = {
  context: {
    run: { as_of: "2026-10-31", pathway: "credit_snapshot", case_kind: "synthetic" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  submitted_by: "Ana L",
  modules: [],
  level: "basic",
  model: "gpt",
  effort: "balanced",
  max_turns: 32,
};
const summary: Summary = {
  error: "",
  documents: [],
  ignored: [],
  digest: "approved",
  cap: "25",
  modules: ["CP-0"],
  items: [],
  omitted: [],
  changes: "first run",
  model: "gpt",
  effort: "balanced",
};

function show(next: Partial<Summary> = {}, synthetic = false) {
  const onEdit = vi.fn();
  render(
    <ReviewSheet
      review={{ answers, summary: { ...summary, ...next } }}
      accepted={new Set()}
      disabled={false}
      onAccept={vi.fn()}
      onModules={vi.fn()}
      onEdit={onEdit}
      synthetic={synthetic}
    />,
  );
  return onEdit;
}
/** Opens the one disclosure that holds every input Submit sends. */
const everything = () => {
  fireEvent.click(screen.getByText("Everything Submit sends"));
};
/** Opens a limit's "How to lift it" disclosure. */
const howToLift = () => {
  fireEvent.click(screen.getByText("How to lift it"));
};
afterEach(cleanup);

describe("final audit: review wording", () => {
  it("C2-023 gives the omitted Changes section the same reader name in passive checks", () => {
    show({
      items: [
        {
          id: "run:section-omitted-what-changed",
          scope: "run",
          outcome: "information",
          reason:
            "This pathway does not produce the What changed since the last Report report section.",
        },
      ],
    });
    fireEvent.click(screen.getByText("No action needed (1)"));
    expect(
      screen.getByText('This pathway does not produce the "Changes since the last run" section.'),
    ).toBeVisible();
  });
  it("J1-006 identifies unrecognised sample files as synthetic documents without claiming a real document kind", () => {
    show({ documents: [{ source: "northbridge-portfolio.xlsx", kind: "unrecognised" }] }, true);
    everything();
    expect(
      screen.getByText(
        "These are synthetic test documents; an unrecognised document type can still be a supplied sample file.",
      ),
    ).toBeVisible();
    expect(screen.getByText("northbridge-portfolio.xlsx · unrecognised")).toBeVisible();
  });
  it("shows Luna as GPT-6 Luna with extra-high effort and displays CP-DR search status", () => {
    show({
      modules: ["CP-DR"],
      model: "luna",
      effort: "xhigh",
      copilot_search: "Copilot web search is unavailable for this run.",
    });
    everything();
    expect(screen.getByText("GPT-6 Luna · Extra high")).toBeVisible();
    expect(screen.getByText("Copilot web search is unavailable for this run.")).toBeVisible();
  });
  it("C2-018 distinguishes one limit from its consequences", () => {
    show({
      items: [
        {
          id: "cause",
          scope: "CP-4",
          outcome: "will_refuse",
          reason: "No agreement",
          fix: "Choose the agreement.",
          inherited_from: [],
        },
        {
          id: "next",
          scope: "CP-2A",
          outcome: "limited",
          reason: "Needs legal",
          inherited_from: ["CP-4"],
        },
        {
          id: "last",
          scope: "CP-5",
          outcome: "limited",
          reason: "Needs downside",
          inherited_from: ["CP-2A"],
        },
      ],
    });
    expect(
      screen.getByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    ).toBeVisible();
  });

  it("J1-007 gives portfolio checks an action to the control's actual step", () => {
    const edit = show({
      items: [
        {
          id: "portfolio",
          scope: "CP-6",
          outcome: "check",
          reason: "Choose a workbook",
          fix: "Choose it as the Portfolio workbook, or remove it.",
        },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose the Portfolio workbook" }));
    expect(edit).toHaveBeenCalledWith("context");
  });

  it("J1-017 states where model settings can be changed", () => {
    show();
    everything();
    expect(screen.getByText("Model and effort are set at the Advanced form level.")).toBeVisible();
  });

  it("J1-016 gives the market-view purpose one unambiguous label", () => {
    show();
    everything();
    expect(screen.getByText("Market view", { exact: true })).toBeVisible();
    expect(screen.queryByText("Purpose", { exact: true })).toBeNull();
  });

  it("C2-023 and J1-017 explain an omitted comparison as first-run status", () => {
    show({ omitted: ["what-changed"], omitted_titles: ["What changed since the last Report"] });
    everything();
    expect(screen.getByText("Changes: not compared (first run of this pathway).")).toBeVisible();
    expect(screen.queryByText(/Report sections omitted/)).toBeNull();
  });

  it("C2-010 makes the need to review again visible beside a module change", () => {
    show({
      items: [
        {
          id: "cause",
          scope: "CP-4",
          outcome: "will_refuse",
          reason: "No agreement",
          fix: "Choose the agreement.",
        },
      ],
    });
    howToLift();
    const leave = screen.getByRole("button", { name: /Leave out Legal/ });
    expect(
      within(leave.parentElement as HTMLElement).getByText(
        /You will return to More context and review again/,
      ),
    ).toBeVisible();
  });
});
