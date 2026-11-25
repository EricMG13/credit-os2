import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { moduleReadiness } from "./moduleReadiness";
import { ReadinessRail, type ReadinessSource } from "./ReadinessRail";

afterEach(cleanup);

const ROWS = [
  { label: "Documents inspected", met: true },
  { label: "Purpose chosen", met: true },
  { label: "Decisions made", met: false, detail: "0 of 2" },
  { label: "Summary approved", met: false },
];

function rail(
  modules = moduleReadiness(["CP-0", "CP-1", "CP-MODEL", "CP-4", "CP-6"]),
  source: ReadinessSource = "unchecked",
  cap: string | null = "USD 30.00",
) {
  render(
    <ReadinessRail
      rows={ROWS}
      cap={cap}
      capTitle="Spending cap for this run"
      pathway="Full credit assessment"
      modules={modules}
      source={source}
    />,
  );
  return screen.getByRole("complementary", { name: "Readiness" });
}

describe("the readiness rail", () => {
  it("states the cap as its largest figure, in mono, with no meter before anything is spent", () => {
    const aside = rail();
    const figure = within(aside).getByText("USD 30.00", { exact: true });
    expect(figure).toHaveClass("font-mono", "tabular-nums", "text-metric");
    expect(aside).toHaveTextContent("Cap · Full credit assessment");
    expect(within(aside).queryByRole("progressbar")).toBeNull();
    expect(within(aside).getByText("Spending cap for this run")).toBeInTheDocument();
  });

  it("says the cap is unavailable when the service sent none", () => {
    const aside = rail(undefined, "unchecked", null);
    expect(within(aside).getByText("Unavailable")).toBeInTheDocument();
  });

  it("lists what Submit still needs as four status rows", () => {
    const aside = rail();
    const needs = within(aside).getByRole("list", { name: "Before Submit" });
    expect(
      within(needs)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "MetDocuments inspected",
      "MetPurpose chosen",
      "Not metDecisions made0 of 2",
      "Not metSummary approved",
    ]);
  });

  it("before a review draws each stage with its count and a quiet mark per module, and says when they are checked", () => {
    const aside = rail();
    const stages = within(aside).getByRole("list", { name: "Stages" });
    expect(
      within(stages)
        .getAllByRole("list")
        .map((list) => list.getAttribute("aria-label")),
    ).toEqual([
      "Sources modules",
      "Financials modules",
      "Structure and market modules",
      "Validation and decision modules",
    ]);
    expect(stages).toHaveTextContent("01Sources1");
    expect(
      within(stages).getByRole("img", { name: "Legal & covenants: not checked yet" }),
    ).toBeInTheDocument();
    expect(aside).toHaveTextContent("4 modules · Full credit assessment");
    expect(aside).toHaveTextContent(
      "Each module is checked against your documents when you review the run.",
    );
    expect(aside).not.toHaveTextContent(/CP-|Cash flow model/);
    expect(within(aside).queryByRole("list", { name: "Carrying a limit" })).toBeNull();
  });

  it("after a review marks modules in the Run limits words and names those carrying a limit, without their reasons", () => {
    const reason = "No executed agreement is among the files.";
    const aside = rail(
      moduleReadiness([], {
        modules: ["CP-0", "CP-1", "CP-4", "CP-6"],
        items: [
          { id: "run:claims", scope: "run", outcome: "check", reason: "Financials are claims." },
          { id: "CP-1:report", scope: "CP-1", outcome: "gap", reason: "No financial report." },
          { id: "CP-4:agreement", scope: "CP-4", outcome: "will_refuse", reason },
        ],
      }),
      "review",
    );
    expect(
      within(aside).getByRole("img", { name: "Legal & covenants: Will refuse" }),
    ).toBeInTheDocument();
    expect(
      within(aside).getByRole("img", { name: "Financial foundation: Gap" }),
    ).toBeInTheDocument();
    expect(
      within(aside).getByRole("img", { name: "Committee decision: no limit in this review" }),
    ).toBeInTheDocument();
    const limited = within(aside).getByRole("list", { name: "Carrying a limit" });
    expect(
      within(limited)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Whole runCheck", "Financial foundationGap", "Legal & covenantsWill refuse"]);
    // The reason is the limits block's to give, not repeated here.
    expect(aside).not.toHaveTextContent(reason);
    expect(aside).not.toHaveTextContent(/Ready|Conditional|Not assessable|No limit stated/);
    expect(aside).toHaveTextContent("As the service checked them for this review.");
  });

  it("marks states kept from the last review as such", () => {
    const aside = rail(moduleReadiness([], { modules: ["CP-0"], items: [] }), "last");
    expect(aside).toHaveTextContent(
      "From your last review. Review the run again to check changes.",
    );
    expect(aside).toHaveTextContent("The review names no limit.");
    expect(aside).toHaveTextContent("1 module · Full credit assessment");
  });

  it("on the review, leaves the stages to the review tile below xl, so they are drawn once", () => {
    render(
      <ReadinessRail
        rows={ROWS}
        cap="USD 30.00"
        capTitle="Spending cap for this run"
        pathway="Full credit assessment"
        modules={moduleReadiness([], { modules: ["CP-0"], items: [] })}
        source="review"
        stagesInReview
      />,
    );
    expect(screen.getByRole("region", { name: "Modules by stage" })).toHaveClass("max-xl:hidden");
  });
});
