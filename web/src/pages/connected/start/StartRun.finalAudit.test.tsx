import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { StartRun } from "../StartRun";
import type { Context, PriorInputs, Summary } from "../api";
import { chooseControl, controlValue, controlChoices } from "./testControls";

Element.prototype.scrollIntoView = vi.fn();
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
});

const caps = {
  credit_snapshot: "25",
  lite_credit_assessment: "15",
  deep_credit_assessment: "40",
  earnings_update: "20",
  relative_value: "20",
  covenant_refinancing: "20",
  distressed_restructuring: "20",
  portfolio_decision: "20",
};
const context: Context = {
  run: { as_of: "", pathway: "credit_snapshot", case_kind: "synthetic" },
  identity: { issuer_name: "", issuer_id: "" },
};
const filing = new File(["filing"], "annual.txt");
const summary: Summary = {
  documents: [{ source: filing.name, kind: "annual_report" }],
  ignored: [],
  error: "",
  digest: "approved",
  cap: "25",
  modules: ["CP-0"],
  items: [],
  omitted: [],
  changes: "first run",
  model: "gpt",
  effort: "balanced",
};

function setup(overrides: Record<string, unknown> = {}, prior?: PriorInputs) {
  const replies: Record<string, unknown> = {
    "/connected/context": { ...context, submission_caps_usd: caps },
    "/api/submissions": { id: "draft" },
    "/api/submissions/draft/files?name=annual.txt": { name: "annual.txt" },
    "/api/submissions/draft/reading": { documents: summary.documents, ignored: [], error: "" },
    "/api/submissions/draft/summary": summary,
    ...(prior ? { "/api/runs/earlier/inputs": prior } : {}),
    ...overrides,
  };
  const fetchMock = vi.fn((...[path]: [string, RequestInit?]) => {
    if (path.startsWith("/api/issuers/"))
      return Promise.resolve(
        Response.json(replies[path] ?? { latest_run: "", runs: 0, latest_as_of: "" }),
      );
    if (!Object.hasOwn(replies, path)) throw new Error(`Unexpected request ${path}`);
    return Promise.resolve(Response.json(replies[path]));
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<StartRun mode="synthetic" navigate={vi.fn()} from={prior ? "earlier" : undefined} />);
  return fetchMock;
}

async function filledDocuments() {
  fireEvent.change(await screen.findByLabelText("Issuer name"), {
    target: { value: "Northbridge" },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [filing] } });
}

async function purpose() {
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("final audit: connected intake", () => {
  it("T10 explains an unavailable draft and retries with the selected files and answers", async () => {
    const fetchMock = setup();
    await filledDocuments();
    const serve = fetchMock.getMockImplementation();
    if (!serve) throw new Error("The test needs its request handler");
    let unavailable = true;
    fetchMock.mockImplementation((path, init) => {
      if (path === "/api/submissions/draft/reading" && unavailable) {
        unavailable = false;
        return Promise.resolve(Response.json({ error: "unknown submission" }, { status: 404 }));
      }
      return serve(path, init);
    });
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This draft is unavailable and may have expired. Your answers and selected documents are still here. Continue the form or review the run again to create a new draft and re-upload the documents.",
    );
    expect(screen.getByLabelText("Issuer name")).toHaveValue("Northbridge");
    expect(screen.getByLabelText("As-of date")).toHaveValue("2026-10-31");
    expect(screen.getByLabelText("Your name")).toHaveValue("Ana L");
    expect(screen.getByText("annual.txt")).toBeVisible();
    await purpose();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/submissions")).toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([path]) => path.includes("/files?"))).toHaveLength(2);
  });

  it("T10 preserves a different 404 explanation instead of claiming that the draft expired", async () => {
    const fetchMock = setup();
    await filledDocuments();
    const serve = fetchMock.getMockImplementation();
    if (!serve) throw new Error("The test needs its request handler");
    fetchMock.mockImplementation((path, init) =>
      path === "/api/submissions/draft/reading"
        ? Promise.resolve(Response.json({ error: "unknown run" }, { status: 404 }))
        : serve(path, init),
    );
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("unknown run");
    expect(screen.queryByText(/may have expired/)).toBeNull();
  });

  it("J2-005 bounds content reads across overlapping selections and keeps compact digests", async () => {
    const choices = [
      new File(["one"], "first.txt"),
      new File(["two"], "second.txt"),
      new File(["end"], "third.txt"),
    ];
    for (const file of choices) Object.defineProperty(file, "size", { value: 50 * 1024 * 1024 });
    const replies: Record<string, unknown> = {};
    for (const file of choices)
      replies[`/api/submissions/draft/files?name=${file.name}`] = { name: file.name };
    replies["/api/submissions/draft/reading"] = {
      documents: choices.map((file) => ({ source: file.name, kind: "annual_report" })),
      ignored: [],
      error: "",
    };
    setup(replies);
    const input = await screen.findByLabelText("Documents");
    let activeReads = 0;
    let mostReads = 0;
    const OriginalFileReader = FileReader;
    class MeasuredFileReader extends OriginalFileReader {
      override readAsArrayBuffer(file: Blob) {
        activeReads += 1;
        mostReads = Math.max(mostReads, activeReads);
        this.addEventListener(
          "loadend",
          () => {
            activeReads -= 1;
          },
          { once: true },
        );
        super.readAsArrayBuffer(file);
      }
    }
    vi.stubGlobal("FileReader", MeasuredFileReader);
    const base64 = vi.spyOn(MeasuredFileReader.prototype, "readAsDataURL");
    const digest = vi.spyOn(webcrypto.subtle, "digest");
    fireEvent.change(input, { target: { files: choices.slice(0, 2) } });
    fireEvent.change(input, { target: { files: choices.slice(2) } });
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    expect(await screen.findByText("3 documents inspected, 0 ignored.")).toBeVisible();
    expect(mostReads).toBe(1);
    expect(base64).not.toHaveBeenCalled();
    expect(digest.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(digest.mock.calls.every(([, bytes]) => bytes.byteLength === 3)).toBe(true);
  });
  it("C1-014 gives a browser tab the start page's visible title", async () => {
    setup();
    await screen.findByLabelText("Issuer name");
    expect(document.title).toBe("Start a run — Credit OS");
  });

  it("J2-005 marks identical document bytes under another name before any upload", async () => {
    const fetchMock = setup();
    const input = await screen.findByLabelText("Documents");
    fireEvent.change(input, {
      target: { files: [filing, new File(["filing"], "copy.txt", { type: "text/plain" })] },
    });
    expect(
      await screen.findByText("Same content as annual.txt. Remove one copy before inspection."),
    ).toBeVisible();
    expect(fetchMock.mock.calls.some(([path]) => path.includes("/files?"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Remove annual.txt" }));
    await waitFor(() => {
      expect(screen.queryByText(/Same content as/)).toBeNull();
    });
    expect(screen.getByText("copy.txt")).toBeVisible();
  });

  it("J2-005 keeps different content with equal byte lengths", async () => {
    setup();
    const input = await screen.findByLabelText("Documents");
    fireEvent.change(input, { target: { files: [filing, new File(["report"], "different.txt")] } });
    await waitFor(() => expect(screen.getByText("different.txt")).toBeVisible());
    expect(screen.queryByText(/Same content as/)).toBeNull();
    expect(
      within(screen.getByRole("list", { name: "Documents added" })).getAllByRole("listitem"),
    ).toHaveLength(2);
  });
  it("C2-012 names an oversized selected file and never adds it to the upload list", async () => {
    const fetchMock = setup();
    const input = await screen.findByLabelText("Documents");
    const oversized = new File(["large"], "large52.txt");
    Object.defineProperty(oversized, "size", { value: 52 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByRole("alert")).toHaveTextContent("large52.txt exceeds the 50 MB limit.");
    expect(screen.queryByRole("list", { name: "Documents added" })).toBeNull();
    expect(fetchMock.mock.calls.some(([path]) => path.includes("/files?"))).toBe(false);
  });

  it("C2-013 names a duplicate selection immediately and keeps only the first row", async () => {
    setup();
    const input = await screen.findByLabelText("Documents");
    fireEvent.change(input, { target: { files: [filing, filing] } });
    expect(screen.getByRole("alert")).toHaveTextContent("annual.txt is already selected.");
    expect(
      within(screen.getByRole("list", { name: "Documents added" })).getAllByRole("listitem"),
    ).toHaveLength(1);
  });

  it("J2-006 lists the actual supported types and explains an ignored selection", async () => {
    setup();
    const input = await screen.findByLabelText("Documents");
    fireEvent.change(input, { target: { files: [new File(["data"], "program.exe")] } });
    expect(
      screen.getByText(/PDF, HTML, DOCX, TXT, Markdown, XLSX, CSV, JSON and JSONL/),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "program.exe is not a document type the run reads.",
    );
    expect(screen.getByRole("button", { name: "Continue to purpose" })).toBeDisabled();
  });

  it("C2-015 checks the required analyst name before reading or leaving Documents", async () => {
    const fetchMock = setup();
    await filledDocuments();
    const name = screen.getByLabelText("Your name");
    expect(name).toBeRequired();
    fireEvent.change(name, { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
    expect(
      await screen.findByText(
        "Enter your name as your first name and initial, for example Eric G, or two initials, for example Eric MG.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Documents" })).toBeVisible();
    expect(fetchMock.mock.calls.some(([path]) => path === "/api/submissions")).toBe(false);
  });

  it("C2-015 also checks an edited analyst name when browser Forward leaves Documents", async () => {
    setup();
    await filledDocuments();
    await purpose();
    fireEvent.click(screen.getByRole("button", { name: "Go back to Documents" }));
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "bad" } });
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    fireEvent.popState(window, { state: { startRun: "purpose" } });
    expect(screen.getByRole("heading", { name: "Documents" })).toBeVisible();
    expect(
      await screen.findByText(
        "Enter your name as your first name and initial, for example Eric G, or two initials, for example Eric MG.",
      ),
    ).toBeVisible();
    expect(back).toHaveBeenCalledOnce();
  });

  it.each(["As-of date", "Issuer ID", "Issue classification"])(
    "T07 follow-up protects %s entered on its own",
    async (label) => {
      setup();
      await screen.findByLabelText("Issuer name");
      fireEvent.change(screen.getByLabelText(label), {
        target: {
          value:
            label === "As-of date" ? "2026-10-31" : label === "Issuer ID" ? "custom" : "high_yield",
        },
      });
      const unload = new Event("beforeunload", { cancelable: true });
      fireEvent(window, unload);
      expect(unload.defaultPrevented).toBe(true);
    },
  );

  it("C2-009 offers Basic and Advanced, with no equivalent Standard choice", async () => {
    setup();
    await filledDocuments();
    await purpose();
    expect(controlChoices("Run form level")).toEqual(["Basic", "Advanced"]);
  });

  it.each([{ efforts: [] }, { efforts: ["high"] }, { efforts: ["xhigh"] }])(
    "offers Luna only when the seat advertises xhigh ($efforts)",
    async ({ efforts }) => {
      setup({
        "/connected/context": {
          ...context,
          copilot_models: { gpt: ["balanced"], luna: efforts },
          submission_caps_usd: caps,
        },
      });
      await filledDocuments();
      await purpose();
      chooseControl("Run form level", "advanced");
      fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
      const picker = await screen.findByLabelText("Model");
      // The model picker is in the closed "Model and modules" section of More context.
      fireEvent.click(screen.getByRole("heading", { level: 3, name: "Model and modules" }));
      const luna = within(picker).queryByRole("option", { name: "GPT-6 Luna" });
      if (!efforts.includes("xhigh")) {
        expect(luna).toBeNull();
        return;
      }
      expect(luna).toBeVisible();
      fireEvent.change(picker, { target: { value: "luna" } });
      expect(screen.getByLabelText("Reasoning effort")).toHaveValue("xhigh");
      expect(screen.getByRole("option", { name: "Extra high" })).toBeVisible();
    },
  );

  it("C2-009 carries a historical Standard run as the Basic level actually offered on screen", async () => {
    const fetchMock = setup({
      "/connected/context": {
        ...context,
        copilot_models: { gpt: ["balanced"] },
        submission_caps_usd: caps,
      },
      "/api/issuers/northbridge": {
        latest_run: "earlier",
        runs: 1,
        latest_as_of: "2026-09-30",
        issuer_name: "Northbridge",
      },
      "/api/runs/earlier/inputs": {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        context: { ...context, copilot_models: { claude: ["high"] } },
        level: "standard",
        modules: [],
        max_turns: 32,
        files: [{ name: "annual.txt", size: 6 }],
      },
      "/api/submissions/draft/carry": { carried: ["annual.txt"], kept: [] },
    });
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByText(/Using an earlier run as a starting point/);
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
    await purpose();
    expect(controlValue("Run form level")).toBe("basic");
    fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const body = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
    expect(typeof body).toBe("string");
    const posted = JSON.parse(body as string) as {
      level: string;
      context: Record<string, unknown>;
    };
    expect(posted.level).toBe("basic");
    expect(posted.context).not.toHaveProperty("copilot_models");
  });

  it("C2-022 explains a reset requested-module choice when the pathway changes", async () => {
    setup();
    await filledDocuments();
    await purpose();
    chooseControl("Run form level", "advanced");
    fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
    const requested = screen.getByText("Requested modules", { exact: true }).closest("fieldset");
    if (!requested) throw new Error("Missing requested modules");
    fireEvent.click(within(requested).getByRole("checkbox", { name: /Source readiness/ }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("radio", { name: "Lite credit assessment" }));
    expect(
      screen.getByText(
        "Module choice reset for the new pathway. Review the run again and decide its limits.",
      ),
    ).toBeVisible();
  });

  it("C2-010 says why changing the market view clears prior approval and decisions", async () => {
    setup();
    await filledDocuments();
    await purpose();
    fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: /Approve: I have read/ }));
    fireEvent.click(screen.getByRole("button", { name: "Edit purpose and modules" }));
    chooseControl("Market view", "secondary");
    expect(
      screen.getByText(
        "You changed the market view, so the approval and your decisions were cleared. Decide again.",
      ),
    ).toBeVisible();
  });

  it("J1-006 names the chosen portfolio workbook without changing its sent boolean", async () => {
    const fetchMock = setup({
      "/connected/context": {
        ...context,
        submission_caps_usd: caps,
        attachments: {
          legal_documents: "none",
          portfolio_workbook: false,
          management_bridge: false,
          prior_case: false,
        },
      },
    });
    await filledDocuments();
    await purpose();
    fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
    fireEvent.change(screen.getByLabelText("Portfolio workbook"), {
      target: { value: "annual.txt" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const row = screen.getByText("Portfolio workbook", { selector: "dt" }).parentElement;
    expect(row).toHaveTextContent("annual.txt");
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/summary"))).toBe(true);
    const body = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
    const posted = JSON.parse(body as string) as {
      context: { attachments: { portfolio_workbook: boolean } } & Record<string, unknown>;
    };
    expect(posted.context.attachments.portfolio_workbook).toBe(true);
    expect(posted.context).not.toHaveProperty("copilot_models");
  });

  it("J1-018 shows each service-provided pathway cap on its card", async () => {
    setup();
    await filledDocuments();
    await purpose();
    for (const [title, cap] of [
      ["Lite credit assessment", "15.00"],
      ["Full credit assessment", "25.00"],
      ["Deep credit assessment", "40.00"],
    ] as const) {
      const choice = screen.getByRole("radio", { name: title });
      expect(
        choice.closest("[data-rac]")?.textContent ?? choice.parentElement?.textContent,
      ).toContain(`Cap USD ${cap}`);
    }
  });

  it("J1-003 states the synthetic proof's pathway, prior and exact file limits before review", async () => {
    setup();
    await filledDocuments();
    await purpose();
    expect(
      screen.getByText(/synthetic test can complete only a first Full credit assessment/),
    ).toBeVisible();
    expect(screen.getByText(/northbridge-filing.txt/)).toHaveTextContent(
      "northbridge-credit-agreement.txt",
    );
  });

  it("J2-012 reports the existing issuer runs automatically without carrying answers", async () => {
    const fetchMock = setup({
      "/api/issuers/northbridge": {
        latest_run: "earlier",
        runs: 3,
        latest_as_of: "2026-09-30",
        issuer_name: "Northbridge",
      },
    });
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    expect(
      await screen.findByText("This issuer has 3 runs; the latest is as of 2026-09-30."),
    ).toBeVisible();
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([path]) => path === "/api/issuers/northbridge")).toBe(true);
    });
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/inputs"))).toBe(false);
  });

  it("J2-012 shows the filed issuer name when the typed name differs", async () => {
    setup({
      "/api/issuers/northbridge": {
        latest_run: "earlier",
        runs: 1,
        latest_as_of: "2026-09-30",
        issuer_name: "Northbridge PLC",
      },
    });
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    expect(await screen.findByText(/Filed name: Northbridge PLC\./)).toBeVisible();
  });

  it("C2-020 lists documents waiting to be copied from an earlier run", async () => {
    setup(
      {},
      {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        context,
        files: [{ name: "earlier-report.pdf", size: 321 }],
        level: "basic",
        modules: [],
        max_turns: 32,
      },
    );
    expect(await screen.findByText("earlier-report.pdf")).toBeVisible();
    expect(screen.getByText("Will be copied")).toBeVisible();
    expect(screen.queryByText("No documents yet.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove earlier-report.pdf" }));
    await waitFor(() => {
      expect(screen.queryByText("earlier-report.pdf")).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Continue to purpose" })).toBeDisabled();
  });

  it("C2-020 does not relabel documents already copied when another file is added", async () => {
    setup(
      {
        "/api/submissions/draft/carry": { carried: ["earlier-report.pdf"], kept: [] },
        "/api/submissions/draft/reading": {
          documents: [{ source: "earlier-report.pdf", kind: "annual_report" }],
          ignored: [],
          error: "",
        },
      },
      {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        context,
        files: [{ name: "earlier-report.pdf", size: 321 }],
        level: "basic",
        modules: [],
        max_turns: 32,
      },
    );
    await screen.findByText("earlier-report.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await screen.findByText("1 document inspected, 0 ignored.");
    fireEvent.change(screen.getByLabelText("Documents"), {
      target: { files: [new File(["extra"], "extra.txt")] },
    });
    const row = screen.getByText("earlier-report.pdf").closest("li");
    expect(row).toHaveTextContent("Copied");
    expect(row).not.toHaveTextContent("Will be copied");
  });
});
