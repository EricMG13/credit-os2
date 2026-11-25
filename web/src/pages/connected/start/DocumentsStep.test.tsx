import { createRef } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReadinessItem } from "../api";
import type { DocumentRow, IntakeView } from "./intake";
import type { LimitGroup } from "./limits";
import { DocumentFields } from "./DocumentsStep";

afterEach(cleanup);

const AGREEMENT = {
  source: "credit-agreement.txt",
  kind: "credit_agreement",
  period_end: "2025-12-31",
  executed: true,
  signal: "found 'Credit Agreement' on page 1",
};
const OTHER = {
  source: "notes.md",
  kind: "unrecognised",
  period_end: undefined,
  executed: undefined,
  signal: "",
};

function row(name: string, extra: Partial<DocumentRow> = {}): DocumentRow {
  return { name, stored: name, pendingCopy: false, copied: false, ...extra };
}

function makeView(over: Partial<IntakeView> = {}): IntakeView {
  const docs = over.shownDocs ?? [];
  return {
    step: "documents",
    canRead: true,
    priorNote: "",
    issuerNotice: "",
    changeNotice: "",
    repeatedContent: new Map(),
    identity: { issuer_name: "", issuer_id: "" },
    issuerId: "",
    submittedBy: "",
    run: { as_of: "2025-12-31" },
    documentRows: [],
    inspected: new Map(
      docs.map((d) => [
        d.source,
        [
          d.kind.replaceAll("_", " "),
          d.period_end && `period ends ${d.period_end}`,
          d.executed === true ? "executed" : d.executed === false ? "draft" : "",
          d.signal,
        ]
          .filter(Boolean)
          .join(" · "),
      ]),
    ),
    ignored: new Map(),
    shownDocs: [],
    read: docs.length > 0,
    inspections: 1,
    addFiles: vi.fn(),
    comparison: { name: "", holds: "", files: [], fileProblem: "" },
    standing: { problem: "", working: {}, notes: {} },
    discardDocument: vi.fn(),
    ...over,
  } as unknown as IntakeView;
}

function renderStep(view: IntakeView) {
  return render(<DocumentFields view={view} folderInput={createRef<HTMLInputElement>()} />);
}

function item(over: Partial<ReadinessItem>): ReadinessItem {
  return {
    id: "x",
    scope: "run",
    outcome: "gap",
    reason: "",
    fix: "",
    ...over,
  };
}

function group(over: Partial<LimitGroup>): LimitGroup {
  return {
    key: "x",
    outcome: "gap",
    kind: "limit",
    causes: [],
    consequences: [],
    ids: [],
    ...over,
  };
}

describe("Documents step: the upload list", () => {
  it("shows the service's kind as a quiet label, in sentence case, and the facts without repeating it", () => {
    renderStep(
      makeView({
        documentRows: [row("credit-agreement.txt")],
        shownDocs: [AGREEMENT],
      }),
    );
    const li = screen.getByRole("listitem");
    expect(within(li).getByText("Credit agreement")).toBeVisible();
    expect(li).toHaveTextContent("Inspected");
    expect(li).toHaveTextContent("period ends 2025-12-31 · executed · found 'Credit Agreement'");
    expect(li.textContent).not.toMatch(/credit agreement · period/i);
  });

  it("draws an unrecognised kind as the label and no empty facts line", () => {
    renderStep(makeView({ documentRows: [row("notes.md")], shownDocs: [OTHER] }));
    const li = screen.getByRole("listitem");
    expect(within(li).getByText("Unrecognised")).toBeVisible();
    expect(li.querySelectorAll("p")).toHaveLength(1);
  });

  it("draws no chip before the service has read the file", () => {
    renderStep(makeView({ documentRows: [row("new.pdf", { stored: undefined })] }));
    const li = screen.getByRole("listitem");
    expect(li).toHaveTextContent("Selected");
    expect(li).not.toHaveTextContent(/unrecognised/i);
    expect(li.querySelectorAll("span.rounded-ds-xs")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Remove new.pdf" })).toBeVisible();
  });

  it("gives an ignored file its reason and no chip", () => {
    renderStep(
      makeView({
        documentRows: [row("program.exe")],
        ignored: new Map([["program.exe", "Not a supported type."]]),
      }),
    );
    const li = screen.getByRole("listitem");
    expect(li).toHaveTextContent("Ignored");
    expect(li).toHaveTextContent("Not a supported type.");
  });

  it("says so when there are no documents, and draws no gap note", () => {
    renderStep(makeView());
    expect(screen.getByText("No documents yet.")).toBeVisible();
    expect(screen.queryByText(/not reported before review/)).toBeNull();
  });

  // The rail says, on every step, that the modules are checked when the run is reviewed; the
  // step says only what is not reported yet, so the fact is said once on the page.
  it("says only what is not reported before review, once, while files are listed", () => {
    const { container } = renderStep(makeView({ documentRows: [row("a.pdf")] }));
    expect(screen.getAllByText(/not reported before review/)).toHaveLength(1);
    expect(container).not.toHaveTextContent(/when you review the run|Checked when you review/);
  });

  it("draws no gap note after a review answered it", () => {
    renderStep(makeView({ documentRows: [row("a.pdf")], missing: [] }));
    expect(screen.queryByText(/not reported before review/)).toBeNull();
  });

  it("shows Uploading while a selected file has no stored name yet", () => {
    const file = new File(["x"], "new.pdf");
    renderStep(
      makeView({
        busy: "documents",
        documentRows: [row("new.pdf", { stored: undefined, file })],
      }),
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Uploading");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("Selected");
  });

  it("has no second primary button: the zone offers a link-style upload", () => {
    renderStep(makeView());
    expect(screen.queryByRole("button", { name: "Choose files" })).toBeNull();
    expect(screen.getByRole("button", { name: "Click to upload" })).toBeVisible();
    expect(screen.getByLabelText("Documents")).toBeInTheDocument();
  });

  it("draws the wrong-type notice as an alert at the drop zone", () => {
    renderStep(makeView({ selectionProblem: "notes.exe is not a supported type." }));
    expect(screen.getByRole("alert")).toHaveTextContent("notes.exe is not a supported type.");
  });

  it("moves focus to the next file's Remove, else the previous, else the drop zone", () => {
    const rows = [row("a.pdf"), row("b.pdf"), row("c.pdf")];
    let view = makeView({ documentRows: rows });
    const folder = createRef<HTMLInputElement>();
    const { rerender } = render(<DocumentFields view={view} folderInput={folder} />);
    const press = (name: string) => {
      screen.getByRole("button", { name }).focus();
      fireEvent.click(screen.getByRole("button", { name }));
    };
    const show = (names: string[]) => {
      view = makeView({ documentRows: names.map((n) => row(n)) });
      rerender(<DocumentFields view={view} folderInput={folder} />);
    };
    press("Remove b.pdf");
    show(["a.pdf", "c.pdf"]);
    expect(screen.getByRole("button", { name: "Remove c.pdf" })).toHaveFocus();
    press("Remove c.pdf");
    show(["a.pdf"]);
    expect(screen.getByRole("button", { name: "Remove a.pdf" })).toHaveFocus();
    press("Remove a.pdf");
    show([]);
    expect(screen.getByRole("button", { name: "Click to upload" })).toHaveFocus();
  });
});

describe("Documents step: the labelled fields", () => {
  it("says Required in words and keeps the exact label names", () => {
    renderStep(makeView());
    for (const name of ["Issuer name", "Issuer ID", "As-of date", "Your name"]) {
      expect(screen.getByLabelText(name)).toBeRequired();
    }
    expect(screen.getAllByText("Required")).toHaveLength(4);
    expect(screen.queryByText("*")).toBeNull();
  });
});

describe("Documents step: missing for the modules", () => {
  it("draws nothing when no review has been made", () => {
    renderStep(makeView({ missing: undefined }));
    expect(screen.queryByRole("heading", { name: "Missing for the modules" })).toBeNull();
  });

  it("heads checks as things to check, never as missing", () => {
    renderStep(
      makeView({
        missing: [
          group({ key: "a", outcome: "gap", causes: [item({ id: "a", reason: "No filing." })] }),
          group({
            key: "b",
            outcome: "check",
            kind: "check",
            causes: [item({ id: "b", outcome: "check", reason: "Confirm the date." })],
          }),
        ],
      }),
    );
    const missing = screen.getByRole("list", { name: "Missing for the modules" });
    expect(missing).toHaveTextContent("No filing.");
    expect(missing).not.toHaveTextContent("Confirm the date.");
    expect(screen.getByRole("heading", { name: "To check" })).toBeVisible();
    expect(screen.getByRole("list", { name: "To check" })).toHaveTextContent("Confirm the date.");
  });

  it("says nothing was missing after a clean review", () => {
    renderStep(makeView({ missing: [] }));
    expect(screen.getByText("Nothing was missing at your last review.")).toBeVisible();
  });

  it("draws each group with module names, reason, fix and consequences", () => {
    const cause = item({
      id: "CP-4:no-agreement",
      scope: "CP-4",
      outcome: "will_refuse",
      reason: "No executed agreement is among the files.",
      fix: "Add the executed agreement.",
    });
    const other = item({
      id: "CP-2A:no-agreement",
      scope: "CP-2A",
      outcome: "will_refuse",
      reason: "CP-4 will refuse.",
      fix: "Add the executed agreement.",
    });
    const downstream = item({ id: "CP-6:blocked", scope: "CP-6", outcome: "limited" });
    renderStep(
      makeView({
        missing: [
          group({
            outcome: "will_refuse",
            causes: [cause, other],
            consequences: [downstream],
          }),
        ],
      }),
    );
    expect(
      screen.getByText("At your last review. Review the run again after adding files."),
    ).toBeVisible();
    const list = screen.getByRole("list", { name: "Missing for the modules" });
    const li = within(list).getByRole("listitem");
    expect(li).toHaveTextContent("Will refuse");
    expect(li).toHaveTextContent("No executed agreement is among the files.");
    expect(within(li).getAllByText("Add the executed agreement.")).toHaveLength(1);
    expect(li).toHaveTextContent("Also affects:");
    expect(li.textContent).not.toMatch(/CP-\d/);
    expect(li.querySelector("input")).toBeNull();
  });

  it("draws the whole run when the cause is run-wide", () => {
    renderStep(
      makeView({
        missing: [
          group({ causes: [item({ scope: "run", reason: "No filing.", fix: "Add the filing." })] }),
        ],
      }),
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Whole run");
  });
});
