import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { ConnectedApp } from "./ConnectedApp";
import { SelectField, carriedModules, stepOfField } from "./StartRun";
import { moduleName, pathwayModules, type Summary } from "./api";
import { chooseControl, controlValue } from "./start/testControls";

const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
});

const context = {
  run: { as_of: "", pathway: "credit_snapshot", case_kind: "synthetic", reporting_currency: "USD" },
  identity: { issuer_name: "", issuer_id: "" },
};
const submissionCaps = {
  credit_snapshot: "30",
  lite_credit_assessment: "20",
  deep_credit_assessment: "50",
  earnings_update: "20",
  relative_value: "20",
  covenant_refinancing: "20",
  distressed_restructuring: "20",
  portfolio_decision: "20",
  short_snapshot: "20",
};
const file = new File(["sample input"], "Credit & facts.html", { type: "text/html" });
const plan = {
  digest: "server-approved",
  cap: "30",
  error: "",
  documents: [{ source: file.name, kind: "annual_report" }],
  modules: ["CP-0"],
  items: [] as { id: string; scope: string; outcome: string; reason: string }[],
  ignored: [],
  omitted: [] as string[],
  changes: "first run",
  model: "gpt",
  effort: "balanced",
};

function testingFetch(
  summary: typeof plan & {
    lookup?: string[];
    web_search?: boolean;
    web_lookup?: boolean;
    omitted_titles?: string[];
    prior?: Summary["prior"];
  } = plan,
  submitResponse?: Response | (() => Response),
  overrides: Record<string, unknown> = {},
) {
  const entries: Record<string, unknown> = {
    "/connected/context": { ...context, submission_caps_usd: submissionCaps },
    "/api/submissions": { id: "sub-1" },
    "/api/submissions/sub-1/files?name=Credit%20%26%20facts.html": { name: file.name },
    "/api/submissions/sub-1/reading": { documents: plan.documents, ignored: [], error: "" },
    "/api/submissions/sub-1/summary": summary,
    "/api/submissions/sub-1/submit": { run: "test-run", status: "queued" },
    ...overrides,
  };
  const fetchMock = vi.fn((...[path]: [string, RequestInit?]) => {
    if (path.endsWith("/submit") && submitResponse)
      return Promise.resolve(
        typeof submitResponse === "function" ? submitResponse() : submitResponse,
      );
    if (!Object.hasOwn(entries, path)) throw new Error(`Unexpected request ${path}`);
    const entry = entries[path];
    if (entry instanceof Response) return Promise.resolve(entry);
    if (typeof entry === "function") return (entry as () => Promise<Response>)();
    return Promise.resolve(Response.json(entry));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillInputs() {
  const name = await screen.findByLabelText("Issuer name");
  fireEvent.change(name, { target: { value: "Synthetic Générale" } });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
  typeName();
}

/** A run carried from an earlier one comes back with its dates blank; the analyst enters the case date. */
function typeDate() {
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
}

function typeName() {
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
}

async function review() {
  await fillInputs();
  await advanceToPurpose();
  advanceToContext();
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
}

async function advanceToPurpose() {
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
}

function advanceToContext() {
  const button = screen.getByRole("button", { name: "Continue to context" });
  button.focus();
  fireEvent.click(button);
}

function approve() {
  fireEvent.click(screen.getByRole("checkbox", { name: /Approve: I have read this summary/ }));
}

async function confirmSynthetic(submit: HTMLElement) {
  fireEvent.click(submit);
  fireEvent.click(await screen.findByRole("button", { name: "Start no-cost test" }));
}

async function reviewSheet(summary: Parameters<typeof testingFetch>[0]) {
  testingFetch(summary);
  render(<ConnectedApp path="/start" mode="synthetic" />);
  await review();
  await screen.findByRole("button", { name: "Submit run" });
  return screen.getByRole("region", { name: "What will run" });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  scrollIntoView.mockClear();
});

function sentSummary(fetchMock: ReturnType<typeof testingFetch>) {
  const body = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
  return JSON.parse(typeof body === "string" ? body : "null") as {
    context: Record<string, unknown>;
  };
}

describe("connected run start", () => {
  it("has four steps and no approval before the review", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    const steps = within(screen.getByRole("list", { name: "Steps in this run" }));
    expect(steps.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Step 1 of 4 · Documents")).toBeInTheDocument();
    await advanceToPurpose();
    expect(screen.queryByRole("button", { name: "Approve summary" })).toBeNull();
    advanceToContext();
    expect(screen.getByRole("heading", { name: "More context" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Approve summary" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Go back to More context" })).toBeNull();
    const back = screen.getByRole("button", { name: "Go back to Documents" });
    back.focus();
    fireEvent.click(back);
    expect(screen.getByRole("heading", { name: "Documents" })).toHaveFocus();
  });

  it("opens the folder input and adds its files to the intake", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    const folder = await screen.findByLabelText<HTMLInputElement>("Document folder");
    const click = vi.spyOn(folder, "click");
    fireEvent.click(screen.getByRole("button", { name: "Choose a folder" }));
    expect(click).toHaveBeenCalledOnce();
    fireEvent.change(folder, { target: { files: [file] } });
    expect(screen.getByText(file.name)).toBeInTheDocument();
    expect(folder.value).toBe("");
  });

  it("accepts a drop, displays actual reading progress, and keeps confirmation local", async () => {
    const fetchMock = testingFetch();
    const { container } = render(<ConnectedApp path="/start" mode="synthetic" />);
    const issuer = await screen.findByLabelText("Issuer name");
    fireEvent.change(issuer, { target: { value: "Synthetic Générale" } });
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    typeName();
    const action = screen.getByRole("button", { name: "Continue to purpose" });
    expect(action).toBeDisabled();
    expect(
      within(screen.getByRole("complementary", { name: "Readiness" })).getByText("USD 30.00", {
        exact: true,
      }),
    ).toBeVisible();
    const dropZone = container.querySelector("[data-dropzone]");
    if (!dropZone) throw new Error("Missing intake drop zone");
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    expect(screen.getByText("Selected", { exact: true })).toBeInTheDocument();
    await advanceToPurpose();
    expect(screen.getByText("Documents inspected", { exact: true })).toBeInTheDocument();
    advanceToContext();
    expect(screen.getByRole("heading", { name: "More context" })).toHaveFocus();
    expect(fetchMock.mock.calls.some(([path]) => /\/(summary|submit)$/.test(path))).toBe(false);
  });

  it("sends the selected portfolio workbook with a full credit assessment", async () => {
    const fetchMock = testingFetch(plan, undefined, {
      "/connected/context": {
        ...context,
        submission_caps_usd: submissionCaps,
        attachments: { portfolio_workbook: false },
      },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Anything the analysis should know"), {
      target: { value: "Check the 2028 maturities.\nInclude refinancing risk." },
    });
    fireEvent.change(await screen.findByLabelText("Portfolio workbook"), {
      target: { value: file.name },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const body = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
    expect(typeof body === "string" ? JSON.parse(body) : body).toMatchObject({
      context: {
        attachments: { portfolio_workbook: true },
        research_questions: [
          { text: "Check the 2028 maturities. Include refinancing risk.", focus_module: "" },
        ],
      },
    });
  });

  it("offers Deep in Lite/Full/Deep order and binds its 20 analytical modules to USD 50", async () => {
    const fetchMock = testingFetch({ ...plan, cap: "50" });
    render(<ConnectedApp path="/start" mode="live" />);
    await fillInputs();
    await advanceToPurpose();
    const pathways = screen.getByRole("radiogroup", { name: "Pathway" });
    expect(
      within(pathways)
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("value")),
    ).toEqual([
      "lite_credit_assessment",
      "credit_snapshot",
      "deep_credit_assessment",
      "earnings_update",
      "relative_value",
      "covenant_refinancing",
      "distressed_restructuring",
      "portfolio_decision",
    ]);
    fireEvent.click(within(pathways).getByRole("radio", { name: "Deep credit assessment" }));
    expect(
      within(screen.getByRole("complementary", { name: "Readiness" })).getByText("USD 50.00", {
        exact: true,
      }),
    ).toBeVisible();
    expect(screen.getByText("20 base modules", { exact: true })).toBeVisible();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    expect(screen.queryByRole("checkbox", { name: "Cash flow model" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Source readiness" }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit, spend up to USD 50.00" });
    const summaryRequest = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"));
    expect(summaryRequest?.[1]?.headers).toMatchObject({ "X-Shown-Cap": "50" });
    const rawAnswers = summaryRequest?.[1]?.body;
    const reviewedAnswers = JSON.parse(typeof rawAnswers === "string" ? rawAnswers : "null") as {
      context: { run: { pathway: string } };
      modules: string[];
    };
    expect(reviewedAnswers.context.run.pathway).toBe("deep_credit_assessment");
    // The picker never offers the forecast; the list the page sends holds it once.
    expect(reviewedAnswers.modules.filter((code) => code === "CP-MODEL")).toHaveLength(1);
    expect(reviewedAnswers.modules).not.toContain("CP-0");
  });

  it("rejects a summary with a missing or different cap before enabling submission", async () => {
    for (const cap of ["50", undefined]) {
      const mismatched = { ...plan, cap };
      const fetchMock = testingFetch(mismatched as typeof plan);
      render(<ConnectedApp path="/start" mode="live" />);
      await fillInputs();
      await advanceToPurpose();
      advanceToContext();
      fireEvent.click(screen.getByRole("button", { name: "Review run" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("cap changed while preparing");
      expect(screen.queryByRole("button", { name: "Submit, spend up to USD 30.00" })).toBeNull();
      expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
      cleanup();
    }
  });

  it("locks pathway answers while summary cap approval is pending", async () => {
    let resolveSummary!: (response: Response) => void;
    const delayed = new Promise<Response>((resolve) => {
      resolveSummary = resolve;
    });
    const fetchMock = testingFetch(plan, undefined, {
      "/api/submissions/sub-1/summary": () => delayed,
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("button", { name: "Preparing review…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByLabelText("Anything the analysis should know")).toBeDisabled();
    resolveSummary(Response.json(plan));
    await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" });
    const summaryRequest = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"));
    expect(summaryRequest?.[1]?.headers).toMatchObject({ "X-Shown-Cap": "30" });
  });

  it("uploads raw bytes, reads the files, and submits only the reviewed answers and digest", async () => {
    const fetchMock = testingFetch();
    const navigate = vi.fn();
    render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
    await review();
    const submit = await screen.findByRole("button", { name: "Submit run" });
    expect(screen.getByText("Step 4 of 4 · Review and start")).toBeInTheDocument();
    expect(screen.queryByText(/of 5/)).toBeNull();
    // The issuer notice is a second read, independent of the review's ownership check.
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([path]) => path === "/api/issuers/synthetic-generale"),
      ).toHaveLength(2);
    });
    const paths = fetchMock.mock.calls
      .map(([path]) => path)
      .filter((path) => !path.startsWith("/api/issuers/"));
    expect(paths).toEqual([
      "/connected/context",
      "/api/submissions",
      "/api/submissions/sub-1/files?name=Credit%20%26%20facts.html",
      "/api/submissions/sub-1/reading",
      "/api/submissions/sub-1/reading",
      "/api/submissions/sub-1/summary",
    ]);
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: "POST", body: file });
    const summaryRequest = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"));
    expect(summaryRequest?.[1]?.headers).toMatchObject({ "X-Shown-Cap": "30" });
    const rawAnswers = summaryRequest?.[1]?.body;
    expect(typeof rawAnswers).toBe("string");
    const body = JSON.parse(rawAnswers as string) as unknown;
    expect(body).toEqual({
      context: {
        // No reporting_currency: the template's USD is not sent (ruling 2026-11-16).
        run: {
          pathway: context.run.pathway,
          case_kind: context.run.case_kind,
          as_of: "2026-10-31",
          cutoff: "2026-10-31",
        },
        identity: { issuer_name: "Synthetic Générale", issuer_id: "synthetic-generale" },
      },
      modules: [],
      max_turns: 32,
      level: "basic",
      model: "gpt",
      effort: "balanced",
      submitted_by: "Ana L",
    });
    expect(submit).toBeDisabled();
    approve();
    await confirmSynthetic(submit);
    const rawSubmit = fetchMock.mock.calls.find(([path]) => path.endsWith("/submit"))?.[1]?.body;
    expect(typeof rawSubmit).toBe("string");
    expect(JSON.parse(rawSubmit as string)).toEqual({
      answers: body,
      digest: plan.digest,
    });
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/test-run");
    });
  });

  it("clears a hidden ticker from the submitted issuer context when listed equity is unchecked", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    const listed = screen.getByRole("checkbox", { name: "Listed equity" });
    fireEvent.click(listed);
    fireEvent.change(screen.getByLabelText("Ticker"), { target: { value: "ABC" } });
    fireEvent.click(listed);

    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });

    const summaryCall = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"));
    expect(summaryCall).toBeDefined();
    const answers = JSON.parse(summaryCall?.[1]?.body as string) as {
      context: { identity: Record<string, unknown> };
    };
    expect(answers.context.identity).toMatchObject({ listed_equity: false, ticker: "" });
  });

  it.each([400, 404])(
    "requires fresh review when the service rejects approval with %s",
    async (status) => {
      const response = Response.json({ error: "Approval no longer current" }, { status });
      const fetchMock = testingFetch(plan, response);
      const navigate = vi.fn();
      render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
      await review();
      const submit = await screen.findByRole("button", { name: "Submit run" });
      approve();
      await confirmSynthetic(submit);
      expect(await screen.findByRole("alert")).toHaveTextContent("Review the run again");
      expect(screen.queryByRole("button", { name: "Submit run" })).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Review run" }));
      expect(await screen.findByRole("button", { name: "Submit run" })).toBeDisabled();
      expect(fetchMock.mock.calls.filter(([path]) => path === "/api/submissions")).toHaveLength(
        status === 404 ? 2 : 1,
      );
    },
  );

  const refusedId = (id: string, holder: string) =>
    `Issuer ID "${id}" is filed under the name "${holder}", not "Synthetic Générale". If that is this issuer under another name, type that name; otherwise use another Issuer ID.`;

  it.each([
    // The refused ID is the name's usual one: the suffixed ID is offered.
    ["synthetic-generale", /^Use synthetic-generale-[0-9a-f]{8}$/],
    // A typed ID that is not the usual one, the usual one being free: the usual ID is offered.
    ["legacy-id", /^Use synthetic-generale$/],
  ])(
    "a refusal of Issuer ID %s at Submit clears the review and shows it on the field with its offer",
    async (id, offerName) => {
      const response = Response.json({ error: refusedId(id, "Other Co") }, { status: 400 });
      testingFetch(plan, response);
      const navigate = vi.fn();
      render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
      await review();
      const submit = await screen.findByRole("button", { name: "Submit run" });
      approve();
      await confirmSynthetic(submit);
      expect(
        await screen.findByText(
          new RegExp(
            `^Issuer ID ${id} is filed under the name "Other Co"\\. If that is this issuer`,
          ),
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Submit run" })).toBeNull();
      expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
      expect(screen.getByLabelText("Issuer ID", { exact: true })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByRole("button", { name: offerName })).toBeInTheDocument();
      expect(screen.queryByText(/different issuer/)).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it("tells the reader on the review sheet why a suffixed Issuer ID was used, saying only what is known", async () => {
    testingFetch(plan, undefined, {
      "/api/issuers/synthetic-generale": {
        latest_run: "r1",
        runs: 1,
        latest_as_of: "2026-01-01",
        issuer_name: "Other Co",
      },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    await screen.findByRole("button", { name: "Submit run" });
    expect(
      screen.getByText(
        /^Issuer ID synthetic-generale-[0-9a-f]{8} was used for this run because synthetic-generale is filed under the name "Other Co"\. If that is this issuer under another name, type that name\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/different issuer\./)).toBeNull();
  });

  it("retries an uncertain submission with the same stored answers and digest", async () => {
    let attempts = 0;
    const fetchMock = testingFetch(plan, () => {
      attempts += 1;
      return attempts === 1
        ? Response.json({ error: "Connection lost" }, { status: 500 })
        : Response.json({ run: "test-run", status: "queued" });
    });
    const navigate = vi.fn();
    render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
    await review();
    const submit = await screen.findByRole("button", { name: "Submit run" });
    approve();
    await confirmSynthetic(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent("Submitting again is safe");
    expect(screen.getByRole("button", { name: "Edit issuer and documents" })).toBeDisabled();
    await confirmSynthetic(submit);
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/test-run");
    });
    const requests = fetchMock.mock.calls.filter(([path]) => path.endsWith("/submit"));
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual(requests[1]);
    expect(requests[0]?.[1]?.headers).toMatchObject({ "X-Shown-Cap": "30" });
    expect(fetchMock.mock.calls.filter(([path]) => path.endsWith("/summary"))).toHaveLength(1);
  });

  it("discards a draft when two names store as one before accepting its summary", async () => {
    const renamed = new File(["another input"], "Credit & facts (revised).html");
    const fetchMock = testingFetch(plan, undefined, {
      "/api/submissions/sub-1/files?name=Credit%20%26%20facts%20(revised).html": {
        name: file.name,
      },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [renamed] } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("same stored name");
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/summary"))).toBe(false);
    const remove = screen.getByRole("button", { name: "Remove Credit & facts (revised).html" });
    fireEvent.click(remove);
    const continueButton = screen.getByRole("button", { name: "Continue to purpose" });
    await vi.waitFor(() => {
      expect(continueButton).toBeEnabled();
    });
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("button", { name: "Submit run" })).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/submissions")).toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.body === file)).toHaveLength(2);
  });

  // What leaves the building is stated in its own block in the decision tile, directly above the
  // consent and Submit (screen map, Start run, Review and start P2); the sentences were in the
  // "What will run" block before.
  const costBlock = () => screen.getByRole("region", { name: "What leaves the building" });

  describe("web search statement", () => {
    const SENTENCE =
      "The research module will search the web. The issuer's name and the questions it researches go to OpenAI's search.";

    it("states once, on the review, that the research module searches the web", async () => {
      const sheet = await reviewSheet({ ...plan, web_search: true });
      expect(within(costBlock()).getAllByText(SENTENCE)).toHaveLength(1);
      expect(screen.getAllByText(SENTENCE)).toHaveLength(1);
      expect(sheet).not.toHaveTextContent(/search the web/);
    });

    it("says nothing about web search when the summary says it is off", async () => {
      const sheet = await reviewSheet({ ...plan, web_search: false });
      expect(sheet).not.toHaveTextContent(/search the web/);
      expect(costBlock()).not.toHaveTextContent(/search the web/);
    });

    it("says nothing about web search when the summary does not say", async () => {
      const sheet = await reviewSheet(plan);
      expect(sheet).not.toHaveTextContent(/search the web/);
      expect(costBlock()).not.toHaveTextContent(/search the web/);
    });
  });

  describe("Yahoo Finance statement", () => {
    const SENTENCE =
      "The research module may read Yahoo Finance pages. Their addresses name what it looks up, such as the issuer's ticker, so Yahoo sees which issuer is researched; no document is sent.";
    const research = { ...plan, modules: ["CP-0", "CP-DR"] };

    it("names Yahoo and the ticker once when the research module will use its lookup", async () => {
      const sheet = await reviewSheet({ ...research, web_lookup: true, model: "claude" });
      expect(within(costBlock()).getAllByText(SENTENCE)).toHaveLength(1);
      expect(screen.getAllByText(SENTENCE)).toHaveLength(1);
      expect(sheet).not.toHaveTextContent(/Yahoo/);
    });

    it("draws the Yahoo sentence once, directly after the OpenAI sentence", async () => {
      const openai =
        "The research module will search the web. The issuer's name and the questions it researches go to OpenAI's search.";
      await reviewSheet({
        ...research,
        web_search: true,
        web_lookup: true,
        model: "claude",
      });
      const first = within(costBlock()).getByText(openai);
      const second = within(costBlock()).getByText(SENTENCE);
      expect(screen.getAllByText(SENTENCE)).toHaveLength(1);
      expect(first.nextElementSibling).toBe(second);
    });

    it("says nothing about Yahoo when the lookup is off", async () => {
      const sheet = await reviewSheet({ ...research, web_lookup: false, web_search: true });
      expect(sheet).not.toHaveTextContent(/Yahoo|ticker/);
      expect(costBlock()).not.toHaveTextContent(/Yahoo|ticker/);
    });

    it("says nothing about Yahoo when the research module is left out", async () => {
      const sheet = await reviewSheet({ ...plan, web_lookup: false });
      expect(sheet).not.toHaveTextContent(/Yahoo|ticker/);
      expect(costBlock()).not.toHaveTextContent(/Yahoo|ticker/);
    });

    it("says nothing about Yahoo when the summary does not say", async () => {
      const sheet = await reviewSheet(research);
      expect(sheet).not.toHaveTextContent(/Yahoo|ticker/);
      expect(costBlock()).not.toHaveTextContent(/Yahoo|ticker/);
    });
  });

  it("reviews what will run in plain language with an edit link per block", async () => {
    const sheet = await reviewSheet({
      ...plan,
      modules: ["CP-0", "CP-4"],
      lookup: ["Lookup:   off: synthetic case (default); --web-lookup on forces it"],
      prior: { id: "20261116-083145-01", as_of: "2025-03-31", pathway: "credit_snapshot" },
      changes: "CP-8 compares with the credit_snapshot run (20261116-083145-01)",
    });
    expect(sheet).toHaveTextContent("Legal & covenants");
    expect(sheet).toHaveTextContent(
      "Compared with the Full credit assessment run as of 2025-03-31",
    );
    expect(sheet).toHaveTextContent("Off, because this is a synthetic case.");
    expect(sheet).not.toHaveTextContent(/CP-\d|--web-lookup|20261116-083145-01/);
    expect(screen.queryByText("Reviewed inputs")).toBeNull();
    // Below Advanced the fixed model, effort and turns are sent too, so the sheet shows them.
    expect(screen.getByText("Turns per module")).toBeInTheDocument();
    expect(screen.getByText("Model and effort")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit inputs" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit purpose and modules" }));
    expect(screen.getByRole("heading", { name: "Purpose" })).toHaveFocus();
  });

  it("D12 shows the case kind, model and effort by their option labels", async () => {
    testingFetch({ ...plan, model: "gpt", effort: "balanced" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const sheet = screen.getByRole("region", { name: "What will run" });
    expect(sheet).toHaveTextContent("Synthetic test case");
    expect(sheet).toHaveTextContent("GPT Sol · Balanced");
    expect(within(sheet).queryByText("synthetic")).toBeNull();
    expect(within(sheet).queryByText("gpt · balanced")).toBeNull();
  });

  it("L5 shows nothing for Model and effort when one of the two has no label", async () => {
    testingFetch({ ...plan, model: "gpt", effort: "turbo" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const sheet = screen.getByRole("region", { name: "What will run" });
    expect(within(sheet).getByText("Form level")).toBeInTheDocument();
    expect(within(sheet).queryByText("Model and effort")).toBeNull();
    expect(sheet).not.toHaveTextContent(/GPT Sol|turbo/);
  });

  it("D13 names the omitted report sections by title, never by id", async () => {
    const sheet = await reviewSheet({
      ...plan,
      omitted: ["liquidity-runway", "what-changed"],
      omitted_titles: ["Liquidity runway", "What changed"],
    });
    expect(sheet).toHaveTextContent("Report sections omitted · Liquidity runway, What changed");
    expect(sheet).not.toHaveTextContent(/liquidity-runway|what-changed/);
  });

  it("D14 counts the omitted report sections when the service sends no titles", async () => {
    const sheet = await reviewSheet({ ...plan, omitted: ["liquidity-runway", "what-changed"] });
    expect(sheet).toHaveTextContent("2 report sections are not produced");
    expect(sheet).not.toHaveTextContent(/liquidity-runway|what-changed/);
  });

  it("tells the analyst the earlier run used earlier methods, without its id", async () => {
    const sheet = await reviewSheet({
      ...plan,
      prior: { id: "20261116-083145-01", as_of: "2025-03-31", pathway: "credit_snapshot" },
      changes:
        "CP-8 compares with the credit_snapshot run as of 2025-03-31 (20261116-083145-01; earlier format, earlier methods)",
    });
    expect(sheet).toHaveTextContent("earlier format, earlier methods");
    expect(sheet).not.toHaveTextContent("20261116-083145-01");
  });

  it("keeps the id of an unusable earlier run out of the review", async () => {
    const sheet = await reviewSheet({
      ...plan,
      changes: "first run (not used: 20261116-083145-01: different pathway)",
    });
    expect(sheet).toHaveTextContent("An earlier run exists but could not be used for comparison.");
    expect(sheet).not.toHaveTextContent(/20261116-083145-01|not used/);
  });

  it.each(["", "Eric Garcia", "eric g"])(
    "asks for a first name and initial, not %j",
    async (name) => {
      const fetchMock = testingFetch();
      render(<ConnectedApp path="/start" mode="synthetic" />);
      await fillInputs();
      fireEvent.change(screen.getByLabelText("Your name"), { target: { value: name } });
      fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
      const field = await screen.findByLabelText("Your name");
      if (name === "") expect(field).toBeInvalid();
      else {
        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Enter your name as your first name and initial, for example Eric G, or two initials, for example Eric MG.",
        );
        expect(field).toHaveAttribute("aria-invalid", "true");
        await waitFor(() => expect(field).toHaveFocus());
      }
      expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
      fireEvent.change(field, { target: { value: "Eric G" } });
      expect(field).not.toHaveAttribute("aria-invalid");
      expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/summary"))).toBe(false);
    },
  );

  it("shows a problem on its field, focuses it and clears it when fixed", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "executed" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const options = await screen.findByLabelText("The agreement");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Choose the uploaded file that is the agreement.");
    expect(options).toHaveAttribute("aria-invalid", "true");
    expect(options).toHaveAccessibleDescription(/Choose the uploaded file/);
    await waitFor(() => expect(options).toHaveFocus());
    expect(scrollIntoView).toHaveBeenCalled();
    expect(
      screen.getByText("1 problem to fix: Choose the uploaded file that is the agreement."),
    ).toBeInTheDocument();
    fireEvent.change(options, { target: { value: file.name } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(options).not.toHaveAttribute("aria-invalid");
  });

  it("marks the agreement choice when none is chosen", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "executed" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose the uploaded file that is the agreement.",
    );
    await waitFor(() => expect(screen.getByLabelText("The agreement")).toHaveFocus());
  });

  it("returns focus to the field from the footer problem button", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "executed" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const options = await screen.findByLabelText("The agreement");
    await waitFor(() => expect(options).toHaveFocus());
    const calls = scrollIntoView.mock.calls.length;
    screen.getByLabelText("Anything the analysis should know").focus();
    fireEvent.click(
      screen.getByRole("button", {
        name: "1 problem to fix: Choose the uploaded file that is the agreement.",
      }),
    );
    await waitFor(() => expect(options).toHaveFocus());
    expect(scrollIntoView.mock.calls.length).toBeGreaterThan(calls);
  });

  it("marks an invalid control in its own state", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "executed" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const options = await screen.findByLabelText("The agreement");
    await waitFor(() => expect(options).toHaveAttribute("aria-invalid", "true"));
    expect(options).toHaveClass("aria-invalid:border-error-mark");
  });

  it("clears the agreement and facility errors when their inputs change", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Market view", "primary");
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Add at least one facility");
    fireEvent.click(screen.getByRole("button", { name: "Add facility" }));
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.change(screen.getByLabelText("Facility ID"), { target: { value: "TL-B" } });
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "executed" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose the uploaded file");
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sends an issuer name of only spaces back to Documents with the problem on its field", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    fireEvent.change(screen.getByLabelText("Issuer ID"), {
      target: { value: "syntheticgenerale" },
    });
    fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "   " } });
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter an issuer name and an issuer ID using letters a–z, digits or hyphens.",
    );
    const name = await screen.findByLabelText("Issuer name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(name).toHaveFocus());
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/summary"))).toBe(false);
  });

  it("enforces primary facility input and forwards the reviewed Advanced choices", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Dana R" } });
    await advanceToPurpose();
    chooseControl("Market view", "primary");
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Model"), { target: { value: "claude" } });
    fireEvent.change(screen.getByLabelText("Reasoning effort"), { target: { value: "high" } });
    fireEvent.change(screen.getByLabelText("Turns per module"), { target: { value: "64" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Committee decision" }));
    const reviewRun = screen.getByRole("button", { name: "Review run" });
    fireEvent.click(reviewRun);
    expect(await screen.findByRole("alert")).toHaveTextContent("Add at least one facility");
    await waitFor(() => expect(screen.getByRole("button", { name: "Add facility" })).toHaveFocus());
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/summary"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Add facility" }));
    fireEvent.change(screen.getByLabelText("Facility ID"), { target: { value: "TL-B" } });
    fireEvent.click(reviewRun);
    await screen.findByRole("button", { name: "Submit run" });
    expect(screen.getByText("Model and effort")).toBeInTheDocument();
    const body = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
    expect(JSON.parse(typeof body === "string" ? body : "null")).toMatchObject({
      context: { run: { run_type: "primary" }, deal_terms: [{ facility_id: "TL-B" }] },
      level: "advanced",
      model: "claude",
      effort: "high",
      max_turns: 64,
      submitted_by: "Dana R",
    });
    expect(body).not.toContain("CP-6");
  });

  it("leaves new-issue-only facility fields out of a run that is not a new issue", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Market view", "primary");
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Add facility" }));
    fireEvent.change(screen.getByLabelText("Facility ID"), { target: { value: "TL-B" } });
    fireEvent.change(screen.getByLabelText("Tenor (years)"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Purpose" });
    chooseControl("Market view", "secondary");
    advanceToContext();
    expect(screen.queryByLabelText("Tenor (years)")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const sent = sentSummary(fetchMock);
    const keys =
      "instrument currency size_m tenor_years talk_spread_bps_low talk_spread_bps_high talk_oid_low talk_oid_high floor_pct coupon_pct margin_bps maturity call_protection use_of_proceeds as_of provider";
    const blanks = Object.fromEntries(keys.split(" ").map((key) => [key, ""]));
    expect(sent.context.deal_terms).toEqual([{ ...blanks, facility_id: "TL-B" }]);
  });

  it("reviews an earnings update with periods and the chosen management bridge", async () => {
    const fetchMock = testingFetch({ ...plan, cap: "20" }, undefined, {
      "/connected/context": {
        ...context,
        submission_caps_usd: submissionCaps,
        attachments: {
          management_bridge: false,
          portfolio_workbook: false,
          prior_case: false,
          legal_documents: "none",
        },
      },
      "/api/submissions/sub-1/reading": {
        documents: [{ source: file.name, kind: "management_bridge" }],
        ignored: [],
        error: "",
      },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: "Relative Value" }));
    expect(controlValue("Market view")).toBe("secondary");
    fireEvent.click(screen.getByRole("radio", { name: "Earnings Update" }));
    expect(controlValue("Market view")).toBe("earnings");
    advanceToContext();
    expect(screen.getByLabelText(/^Current period/)).toBeRequired();
    expect(screen.getByLabelText(/^Prior period/)).toBeRequired();
    fireEvent.change(screen.getByLabelText(/^Current period/), { target: { value: "q3-2026" } });
    fireEvent.change(screen.getByLabelText(/^Prior period/), { target: { value: "q2-2026" } });
    fireEvent.change(screen.getByLabelText("Management EBITDA bridge"), {
      target: { value: file.name },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("button", { name: "Submit run" })).toBeDisabled();
    const sent = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
    expect(JSON.parse(typeof sent === "string" ? sent : "null")).toMatchObject({
      context: {
        run: {
          pathway: "earnings_update",
          run_type: "earnings",
          current_period: "q3-2026",
          prior_period: "q2-2026",
        },
        attachments: {
          management_bridge: true,
          portfolio_workbook: false,
          prior_case: false,
          legal_documents: "none",
        },
      },
    });
    expect(fetchMock.mock.calls.filter(([, options]) => options?.body === file)).toHaveLength(1);
  });

  it("copies the latest issuer inputs through inspection and into the reviewed payload", async () => {
    const fetchMock = testingFetch(plan, undefined, {
      "/api/issuers/northbridge": {
        latest_run: "latest-case",
        runs: 2,
        latest_as_of: "2026-09-30",
      },
      "/api/runs/latest-case/inputs": {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        level: "advanced",
        max_turns: 24,
        modules: ["CP-0"],
        context: { ...context, identity: { ...context.identity, sector: "Gaming" } },
        files: [{ name: file.name, size: file.size }],
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByText(/Using an earlier run as a starting point/);
    expect(screen.getByRole("link", { name: /Open source run/ })).toHaveAttribute(
      "href",
      "/run/latest-case",
    );
    expect(screen.getByLabelText("Issuer ID")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Issuer name")).toHaveValue("Northbridge");
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    typeName();
    await advanceToPurpose();
    expect(controlValue("Run form level")).toBe("advanced");
    advanceToContext();
    expect(screen.getByLabelText("Turns per module")).toHaveValue(24);
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const body = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
    expect(JSON.parse(typeof body === "string" ? body : "null")).toMatchObject({
      context: {
        identity: { issuer_id: "northbridge", sector: "Gaming" },
        run: { as_of: "2026-10-31" },
      },
      max_turns: 24,
    });
    expect(fetchMock.mock.calls.filter(([path]) => path.endsWith("/carry"))).toHaveLength(1);
    expect(fetchMock.mock.calls.find(([path]) => path.endsWith("/carry"))?.[1]?.body).toBe(
      '{"run":"latest-case"}',
    );
    expect(fetchMock.mock.calls.some(([path]) => path.includes("/files?"))).toBe(false);
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
  });

  it("keeps an editable new issuer when latest-run lookup finds no earlier run", async () => {
    const fetchMock = testingFetch(plan, undefined, {
      "/api/issuers/northbridge": { latest_run: "", runs: 0, latest_as_of: "" },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    expect(await screen.findByText("No earlier run was found for this issuer.")).toBeVisible();
    expect(screen.getByLabelText("Issuer ID")).not.toHaveAttribute("readonly");
    expect(screen.getByLabelText("Issuer name")).toHaveValue("Northbridge");
    expect(
      fetchMock.mock.calls.some(([path]) => /\/(inputs|carry|summary|submit)$/.test(path)),
    ).toBe(false);
  });

  it("carries a prior run's documents and answers, with a buffer for new dates", async () => {
    const prior = {
      issuer_id: "northbridge",
      issuer_name: "Northbridge",
      level: "advanced",
      max_turns: 24,
      modules: ["CP-0"],
      context: {
        ...context,
        run: { ...context.run, as_of: "" },
        identity: { ...context.identity, sector: "Gaming" },
      },
      files: [{ name: file.name, size: file.size }],
    };
    let summaries = 0;
    const fetchMock = testingFetch(plan, undefined, {
      "/api/runs/earlier/inputs": prior,
      "/api/issuers/northbridge": {
        latest_run: "newer-case",
        runs: 2,
        latest_as_of: "2026-10-31",
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
      "/api/submissions/sub-1/summary": () =>
        Promise.resolve(
          Response.json({
            ...plan,
            items:
              ++summaries === 1
                ? [
                    {
                      id: "form:newest-document-date",
                      scope: "run",
                      outcome: "limited",
                      reason:
                        "The as-of date (2026-09-29) is before your newest document (2026-09-30).",
                    },
                  ]
                : [],
          }),
        ),
      "/api/submissions/sub-1/reading": {
        documents: [{ source: file.name, kind: "annual_report", period_end: "2026-09-30" }],
        ignored: [],
        error: "",
      },
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    expect(await screen.findByLabelText("Issuer name")).toHaveValue("Northbridge");
    expect(screen.getByLabelText("Issuer ID")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Your name")).toHaveValue("");
    expect(screen.getByLabelText("As-of date")).toHaveValue("");
    expect(await screen.findByText(/the latest is as of 2026-10-31/)).toBeVisible();
    const sourceRun = screen.getByRole("link", { name: /Open source run/ });
    expect(sourceRun).toHaveAttribute("href", "/run/earlier");
    expect(sourceRun).toHaveAttribute("target", "_blank");
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-09-29" } });
    typeName();
    await advanceToPurpose();
    advanceToContext();
    expect(screen.getByLabelText("Turns per module")).toHaveValue(24);
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const limit = await screen.findByRole("checkbox", { name: "I accept this limit" });
    // The limit and its reason are decided on the review; the readiness rail names it, not why.
    expect(
      within(screen.getByRole("region", { name: "Limits to decide" })).getByText(
        /before your newest document/,
      ),
    ).toBeInTheDocument();
    const rail = screen.getByRole("complementary", { name: "Readiness" });
    expect(
      within(within(rail).getByRole("list", { name: "Carrying a limit" })).getByRole("listitem"),
    ).toHaveTextContent("Whole runLimited");
    expect(rail).not.toHaveTextContent(/before your newest document/);
    expect(screen.getByRole("checkbox", { name: /Approve:/ })).toBeDisabled();
    fireEvent.click(limit);
    expect(screen.getByRole("checkbox", { name: /Approve:/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Edit issuer and documents" }));
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-09-30" } });
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("button", { name: "Submit run" })).toBeDisabled();
    const copy = fetchMock.mock.calls.filter(([path]) => path.endsWith("/carry"));
    expect(copy).toHaveLength(1);
    expect(copy[0]?.[1]?.body).toBe('{"run":"earlier"}');
    const body = fetchMock.mock.calls
      .filter(([path]) => path.endsWith("/summary"))
      .at(-1)?.[1]?.body;
    expect(JSON.parse(typeof body === "string" ? body : "null")).toMatchObject({
      context: {
        run: { as_of: "2026-09-30" },
        identity: { issuer_id: "northbridge", sector: "Gaming" },
      },
      level: "advanced",
      max_turns: 24,
      modules: ["CP-0", "CP-MODEL"],
    });
  });

  it("keeps focus and announces the result after inspecting documents", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    expect(await screen.findByRole("heading", { name: "Documents" })).not.toHaveFocus();
    expect(screen.getByText("Add at least one document to continue.")).toBeInTheDocument();
    await fillInputs();
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    expect(
      (await screen.findByText("1 document inspected, 0 ignored.")).closest("[role=status]"),
    ).not.toBeNull();
  });

  it("reads readiness as four status rows", async () => {
    testingFetch({ ...plan, items: cascade });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    const panel = within(screen.getByRole("complementary", { name: "Readiness" }));
    // The rail also lists the run's modules; the four status rows are the list "Before Submit".
    expect(
      within(panel.getByRole("list", { name: "Before Submit" })).getAllByRole("listitem"),
    ).toHaveLength(4);
    await advanceToPurpose();
    expect(
      screen.getByText(
        "Public cases can use approved lookups. Web search through Copilot is unavailable.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Advanced adds model, effort, turns per module, module selection and valuation and assumption fields.",
      ),
    ).toBeInTheDocument();
    // A card is selected on the Purpose step, so the rail reads the purpose as chosen there.
    expect(panel.getByText("Purpose chosen").closest("li")).not.toHaveTextContent("Not met");
    advanceToContext();
    expect(panel.getByText("Purpose chosen").closest("li")).not.toHaveTextContent("Not met");
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    expect(panel.getByText("Decisions made").closest("li")).toHaveTextContent("0 of 1");
    expect(screen.getByText(/of 4 ready · Cap USD 30\.00/)).toBeInTheDocument();
  });

  it("keeps a section edited at Advanced drawn at Basic: Valuation and the assumptions groups", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Peer source"), { target: { value: "none" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Pin Downside" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Purpose" });
    chooseControl("Run form level", "basic");
    advanceToContext();
    expect(screen.getByRole("button", { name: "Add rating" })).toBeInTheDocument();
    expect(screen.getByLabelText("Peer source")).toHaveValue("none");
    expect(screen.getByRole("checkbox", { name: "Pin Downside" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Pin Liquidity" })).not.toBeChecked();
  });

  it("draws neither Valuation nor the assumptions groups at Basic when nothing was edited", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    expect(screen.getByRole("button", { name: "Add rating" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Peer source")).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Pin Downside" })).toBeNull();
  });

  it("passes a prior run's rows through untouched when not edited", async () => {
    const rows = [{ facility_id: "A", size_m: 500, extra: "x" }];
    const fetchMock = testingFetch(plan, undefined, {
      "/api/runs/earlier/inputs": {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        level: "basic",
        max_turns: 32,
        modules: [],
        context: { ...context, deal_terms: rows, quotes: "not-a-list" },
        files: [{ name: file.name, size: file.size }],
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    expect(await screen.findByLabelText("Issuer name")).toHaveValue("Northbridge");
    typeDate();
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const sent = sentSummary(fetchMock);
    expect(sent.context.deal_terms).toEqual(rows);
    expect(sent.context.quotes).toBe("not-a-list");
  });

  it("shows refusals and cannot submit an unapproved draft", async () => {
    const fetchMock = testingFetch({ ...plan, error: "This context was refused", digest: "" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    expect(await screen.findByRole("alert")).toHaveTextContent("This context was refused");
    expect(screen.queryByRole("button", { name: "Submit run" })).toBeNull();
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
  });

  it("shows a refusal in the screen's own labels, not a field path", async () => {
    testingFetch({
      ...plan,
      error: "assumptions.cp4c.ev_multiple: must be 99.99 or less.",
      digest: "",
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Scenario assumptions · Recovery & fulcrum · EV multiple: must be 99.99 or less.",
    );
    expect(document.body).not.toHaveTextContent("assumptions.cp4c");
  });

  it("lists identical problems as separate items; the first goes to its control", async () => {
    const one = "deal_terms[0].size_m: is required.";
    testingFetch({ ...plan, error: `${one}; ${one}; ${one}`, digest: "" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    await screen.findByRole("button", { name: /^1 problem to fix: Facilities and deal terms/ });
    const notice = screen.getAllByRole("alert").find((alert) => alert.querySelector("ul"));
    expect(within(notice as HTMLElement).getAllByRole("listitem")).toHaveLength(2);
  });

  it("lists several refusals that name no control inside the alert", async () => {
    testingFetch({
      ...plan,
      error: "run.as_of: is required.; identity.ticker: is required.",
      digest: "",
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    const alert = await screen.findByRole("alert");
    expect(within(alert).getAllByRole("listitem")).toHaveLength(2);
    expect(alert).toHaveTextContent("Issuer and case date · As-of date: is required.");
  });
});

describe("connected run start: Module options and Valuation as fields", () => {
  const blankMarket = {
    market_cap_m: "",
    net_debt_m: "",
    ev_m: "",
    ebitda_basis: "LTM",
    as_of: "",
    source: "",
  };
  const blankMultiple = { value: "", basis: "LTM", rationale: "" };
  const peer = {
    name: "Harbour Industrial",
    ticker: "HBI",
    ev_m: "4200",
    ebitda_m: "520",
    as_of: "2026-09-30",
    source: "Company filings",
  };
  const loadedValuation = {
    peer_source: "user_comps",
    basis: "public_comps",
    issuer_market: blankMarket,
    peers: [peer],
    precedents: [],
    user_multiple: blankMultiple,
  };
  const loadedOptions = { cp3_mode: "capital_structure_rv", cp6_deep_debate: false };
  const deepContext = {
    ...context,
    run: { ...context.run, pathway: "deep_credit_assessment" },
    submission_caps_usd: submissionCaps,
    valuation: loadedValuation,
    module_options: loadedOptions,
  };

  async function advancedStart(loaded: Record<string, unknown> = {}) {
    const fetchMock = testingFetch({ ...plan, cap: "50" }, undefined, {
      "/connected/context": { ...deepContext, ...loaded },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    return fetchMock;
  }

  async function sentContext(fetchMock: ReturnType<typeof testingFetch>) {
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    return sentSummary(fetchMock).context as {
      valuation: Record<string, unknown>;
      module_options: Record<string, unknown>;
    };
  }

  const pick = (name: string, value: string) => {
    fireEvent.change(screen.getByLabelText(name), { target: { value } });
  };
  const typeIn = (scope: HTMLElement, name: string, value: string) => {
    fireEvent.change(within(scope).getByLabelText(name), { target: { value } });
  };
  const peers = () => screen.getByRole("region", { name: "Peers" });
  const precedents = () => screen.getByRole("region", { name: "Precedents" });

  it("K1 sends the loaded values when nothing is touched", async () => {
    const sent = await sentContext(await advancedStart());
    expect(sent.valuation).toEqual(loadedValuation);
    expect(sent.module_options).toEqual(loadedOptions);
  });

  it("K2 sends the chosen relative value mode and Deep Debate", async () => {
    const fetchMock = await advancedStart();
    pick("Relative value mode", "single_name_rv");
    fireEvent.click(screen.getByRole("checkbox", { name: "Deep Debate" }));
    const sent = await sentContext(fetchMock);
    expect(sent.module_options).toEqual({ cp3_mode: "single_name_rv", cp6_deep_debate: true });
  });

  it("K3 asks a named peer list for a name and ticker only", async () => {
    const fetchMock = await advancedStart({ valuation: { ...loadedValuation, peers: [] } });
    pick("Peer source", "user_list");
    fireEvent.click(within(peers()).getByRole("button", { name: "Add peer" }));
    typeIn(peers(), "Name", "Harbour Industrial");
    typeIn(peers(), "Ticker", "HBI");
    for (const hidden of ["EV (m)", "EBITDA (m)", "As-of", "Source"])
      expect(within(peers()).queryByLabelText(hidden)).toBeNull();
    const sent = await sentContext(fetchMock);
    expect(sent.valuation.peers).toEqual([
      { name: "Harbour Industrial", ticker: "HBI", ev_m: "", ebitda_m: "", as_of: "", source: "" },
    ]);
  });

  it("K4 sends peer figures, and no peers once the source no longer takes them", async () => {
    const fetchMock = await advancedStart({ valuation: { ...loadedValuation, peers: [] } });
    pick("Peer source", "user_comps");
    fireEvent.click(within(peers()).getByRole("button", { name: "Add peer" }));
    typeIn(peers(), "Name", "Harbour Industrial");
    typeIn(peers(), "Ticker", "HBI");
    typeIn(peers(), "EV (m)", "4200");
    typeIn(peers(), "EBITDA (m)", "520");
    typeIn(peers(), "As-of", "2026-09-30");
    typeIn(peers(), "Source", "Company filings");
    expect(within(peers()).getByLabelText("As-of")).toHaveAttribute("type", "date");
    const sent = await sentContext(fetchMock);
    expect(sent.valuation.peers).toEqual([peer]);
    cleanup();
    const second = await advancedStart();
    pick("Peer source", "cp_dr_public");
    expect(screen.queryByRole("region", { name: "Peers" })).toBeNull();
    expect((await sentContext(second)).valuation.peers).toEqual([]);
  });

  it("K5 sends the analyst's own multiple", async () => {
    const fetchMock = await advancedStart();
    pick("Valuation basis", "user_multiple");
    pick("Multiple (x)", "8.5");
    pick("Multiple basis", "NTM");
    pick("Rationale", "Sector median less a size discount");
    const sent = await sentContext(fetchMock);
    expect(sent.valuation.user_multiple).toEqual({
      value: "8.5",
      basis: "NTM",
      rationale: "Sector median less a size discount",
    });
  });

  it("K5 blanks the analyst's own multiple when the basis changes", async () => {
    const second = await advancedStart();
    pick("Valuation basis", "user_multiple");
    pick("Multiple (x)", "8.5");
    pick("Valuation basis", "auto");
    for (const gone of ["Multiple (x)", "Multiple basis", "Rationale"])
      expect(screen.queryByLabelText(gone)).toBeNull();
    expect((await sentContext(second)).valuation.user_multiple).toEqual(blankMultiple);
  });

  it("K6 sends precedents for a basis that uses them", async () => {
    const fetchMock = await advancedStart();
    pick("Valuation basis", "precedents");
    fireEvent.click(within(precedents()).getByRole("button", { name: "Add precedent" }));
    typeIn(precedents(), "Target", "Northgate Tools");
    typeIn(precedents(), "Acquirer", "Orion Capital");
    typeIn(precedents(), "Date", "2025-06-30");
    typeIn(precedents(), "EV (m)", "2400");
    typeIn(precedents(), "EBITDA (m)", "300");
    typeIn(precedents(), "Source", "Press release");
    const sent = await sentContext(fetchMock);
    expect(sent.valuation.precedents).toEqual([
      {
        target: "Northgate Tools",
        acquirer: "Orion Capital",
        date: "2025-06-30",
        ev_m: "2400",
        ebitda_m: "300",
        source: "Press release",
      },
    ]);
  });

  it("K6 sends no precedents once the basis no longer uses them", async () => {
    const second = await advancedStart();
    pick("Valuation basis", "precedents");
    fireEvent.click(within(precedents()).getByRole("button", { name: "Add precedent" }));
    typeIn(precedents(), "Target", "Northgate Tools");
    pick("Valuation basis", "auto");
    expect(screen.queryByRole("region", { name: "Precedents" })).toBeNull();
    expect((await sentContext(second)).valuation.precedents).toEqual([]);
  });

  it("K7 sends the issuer's market values for the issuer's own trading multiple", async () => {
    const fetchMock = await advancedStart();
    expect(screen.queryByLabelText("Market cap (m)")).toBeNull();
    pick("Valuation basis", "issuer_trading");
    pick("Market cap (m)", "3100");
    pick("Net debt (m)", "1900");
    pick("Enterprise value (m)", "5000");
    pick("EBITDA basis", "LTM");
    pick("Market data as-of", "2026-10-30");
    pick("Market data source", "Exchange close");
    const sent = await sentContext(fetchMock);
    expect(sent.valuation.issuer_market).toEqual({
      market_cap_m: "3100",
      net_debt_m: "1900",
      ev_m: "5000",
      ebitda_basis: "LTM",
      as_of: "2026-10-30",
      source: "Exchange close",
    });
  });

  it("K8 gives each issuer detail an example", async () => {
    await advancedStart();
    const examples = {
      "Borrower (legal entity)": "e.g. Northbridge Holdings LLC",
      Parent: "e.g. Northbridge Group plc",
      Sector: "e.g. Industrials",
      Country: "e.g. United States",
      Sponsor: "e.g. Harbour Peak Capital",
    };
    for (const [name, example] of Object.entries(examples))
      expect(screen.getByLabelText(name)).toHaveAttribute("placeholder", example);
  });

  it("K9 has no JSON box for these two sections and none for the assumptions either", async () => {
    await advancedStart();
    expect(screen.queryByRole("textbox", { name: "Valuation and peers" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Module options" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Scenario assumptions" })).toBeNull();
  });

  it("K10 shows a prior run's peer in its boxes", async () => {
    testingFetch({ ...plan, cap: "50" }, undefined, {
      "/api/runs/earlier/inputs": {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        level: "advanced",
        max_turns: 32,
        modules: [],
        context: { ...deepContext, valuation: { ...loadedValuation, peers: [peer] } },
        files: [{ name: file.name, size: file.size }],
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    expect(await screen.findByLabelText("Issuer name")).toHaveValue("Northbridge");
    typeDate();
    typeName();
    await advanceToPurpose();
    advanceToContext();
    const shown = peers();
    expect(within(shown).getByLabelText("Name")).toHaveValue(peer.name);
    expect(within(shown).getByLabelText("Ticker")).toHaveValue(peer.ticker);
    expect(within(shown).getByLabelText("EV (m)")).toHaveValue(peer.ev_m);
    expect(within(shown).getByLabelText("EBITDA (m)")).toHaveValue(peer.ebitda_m);
    expect(within(shown).getByLabelText("As-of")).toHaveValue(peer.as_of);
    expect(within(shown).getByLabelText("Source")).toHaveValue(peer.source);
  });
});

describe("connected run start: Scenario assumptions as fields", () => {
  const PIN_MODULES = {
    cp2a: "CP-2A",
    cp2d: "CP-2D",
    cp2e: "CP-2E",
    cp3c: "CP-3C",
    cp3d: "CP-3D",
    cp4c: "CP-4C",
  } as const;
  const noPins = { cp2a: null, cp2d: null, cp2e: null, cp3c: null, cp3d: null, cp4c: null };
  const cp3dPin = { recovery_pct: "40", rationale: "Agency study" };
  const loadedAssumptions = {
    ...noPins,
    cp2d: { horizon_months: "12", minimum_cash_m: "100", rationale: "Policy" },
  };
  const title = (key: keyof typeof PIN_MODULES) => moduleName(PIN_MODULES[key]);

  async function start(pathway: string, loaded: Record<string, unknown> = {}) {
    const cap = submissionCaps[pathway as keyof typeof submissionCaps];
    const fetchMock = testingFetch({ ...plan, cap }, undefined, {
      "/connected/context": {
        ...context,
        run: { ...context.run, pathway },
        submission_caps_usd: submissionCaps,
        assumptions: noPins,
        ...loaded,
      },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    chooseControl("Run form level", "advanced");
    advanceToContext();
    return fetchMock;
  }
  const deepStart = (loaded: Record<string, unknown> = {}) =>
    start("deep_credit_assessment", loaded);

  async function sentAssumptions(fetchMock: ReturnType<typeof testingFetch>) {
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    return sentSummary(fetchMock).context.assumptions as Record<string, unknown>;
  }

  const groupOf = (key: keyof typeof PIN_MODULES) =>
    screen.getByRole("region", { name: title(key) });
  const pin = (key: keyof typeof PIN_MODULES) => {
    fireEvent.click(within(groupOf(key)).getByRole("checkbox", { name: `Pin ${title(key)}` }));
  };
  const typeIn = (key: keyof typeof PIN_MODULES, name: string, value: string) => {
    fireEvent.change(within(groupOf(key)).getByLabelText(name), { target: { value } });
  };

  it("B1 sends the loaded assumptions when nothing is touched", async () => {
    const sent = await sentAssumptions(await deepStart({ assumptions: loadedAssumptions }));
    expect(sent).toEqual(loadedAssumptions);
  });

  it("B2 sends one to four downside scenarios, and a rationale", async () => {
    const fetchMock = await deepStart();
    pin("cp2a");
    typeIn("cp2a", "EBITDA decline (%)", "20");
    typeIn("cp2a", "Interest increase (%)", "15");
    fireEvent.click(within(groupOf("cp2a")).getByRole("button", { name: "Add scenario" }));
    const declines = within(groupOf("cp2a")).getAllByLabelText("EBITDA decline (%)");
    const interests = within(groupOf("cp2a")).getAllByLabelText("Interest increase (%)");
    expect(declines).toHaveLength(2);
    fireEvent.change(declines[1] as HTMLElement, { target: { value: "35" } });
    fireEvent.change(interests[1] as HTMLElement, { target: { value: "25" } });
    typeIn("cp2a", "Rationale", "Committee stress cases");
    const add = within(groupOf("cp2a")).getByRole("button", { name: "Add scenario" });
    fireEvent.click(add);
    fireEvent.click(add);
    expect(within(groupOf("cp2a")).getAllByLabelText("EBITDA decline (%)")).toHaveLength(4);
    expect(add).toBeDisabled();
    fireEvent.click(within(groupOf("cp2a")).getByRole("button", { name: "Remove Scenario 4" }));
    fireEvent.click(within(groupOf("cp2a")).getByRole("button", { name: "Remove Scenario 3" }));
    expect((await sentAssumptions(fetchMock)).cp2a).toEqual({
      scenarios: [
        { ebitda_decline_pct: "20", interest_increase_pct: "15" },
        { ebitda_decline_pct: "35", interest_increase_pct: "25" },
      ],
      rationale: "Committee stress cases",
    });
  });

  it("B3 sends the liquidity pin", async () => {
    const fetchMock = await deepStart();
    pin("cp2d");
    typeIn("cp2d", "Horizon (months)", "18");
    typeIn("cp2d", "Minimum cash (m)", "150");
    typeIn("cp2d", "Rationale", "Treasury policy minimum");
    expect((await sentAssumptions(fetchMock)).cp2d).toEqual({
      horizon_months: "18",
      minimum_cash_m: "150",
      rationale: "Treasury policy minimum",
    });
  });

  it("B4 sends the rate and FX shocks as lists, and an optional hedge ratio", async () => {
    const fetchMock = await deepStart();
    pin("cp2e");
    typeIn("cp2e", "Rate shocks (bps)", "100, 200");
    typeIn("cp2e", "FX shocks (%)", "10");
    typeIn("cp2e", "Hedge ratio (%)", "60");
    typeIn("cp2e", "Rationale", "House scenarios");
    expect((await sentAssumptions(fetchMock)).cp2e).toEqual({
      rate_shocks_bps: ["100", "200"],
      fx_shocks_pct: ["10"],
      hedge_ratio_pct: "60",
      rationale: "House scenarios",
    });
  });

  it("B5 sends the refinancing, recovery and recovery-valuation pins", async () => {
    const fetchMock = await deepStart();
    pin("cp3c");
    typeIn("cp3c", "Repricing (bps)", "50");
    typeIn("cp3c", "Rationale", "Desk view");
    pin("cp3d");
    typeIn("cp3d", "Recovery (%)", "40");
    typeIn("cp3d", "Rationale", "Agency study");
    pin("cp4c");
    typeIn("cp4c", "EV multiple", "7.5");
    typeIn("cp4c", "Rationale", "Distressed comps");
    const sent = await sentAssumptions(fetchMock);
    expect(sent.cp3c).toEqual({ repricing_bps: "50", rationale: "Desk view" });
    expect(sent.cp3d).toEqual(cp3dPin);
    expect(sent.cp4c).toEqual({ ev_multiple: "7.5", rationale: "Distressed comps" });
  });

  it("B6 sends null for a group that is unticked again", async () => {
    const fetchMock = await deepStart();
    pin("cp2a");
    typeIn("cp2a", "EBITDA decline (%)", "20");
    pin("cp2a");
    expect(within(groupOf("cp2a")).queryByLabelText("EBITDA decline (%)")).toBeNull();
    expect((await sentAssumptions(fetchMock)).cp2a).toBeNull();
  });

  it("B7 shows only the groups whose modules the pathway runs", async () => {
    await start("lite_credit_assessment");
    const runs = pathwayModules("lite_credit_assessment");
    const keys = Object.keys(PIN_MODULES) as (keyof typeof PIN_MODULES)[];
    const expected = keys.filter((key) => runs.includes(PIN_MODULES[key]));
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(keys.length);
    for (const key of keys) {
      const box = screen.queryByRole("checkbox", { name: `Pin ${title(key)}` });
      if (expected.includes(key)) expect(box).toBeInTheDocument();
      else expect(box).toBeNull();
    }
  });

  it("B7b sends a group of a module the pathway does not run as it was loaded", async () => {
    const hidden = { ...noPins, cp3d: cp3dPin };
    const fetchMock = await start("lite_credit_assessment", { assumptions: hidden });
    expect(screen.queryByRole("checkbox", { name: "Pin Market-implied risk" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Pin Downside" }));
    const sent = await sentAssumptions(fetchMock);
    expect(sent.cp3d).toEqual(cp3dPin);
    expect(sent.cp2d).toBeNull();
    expect(sent.cp2a).toEqual({
      scenarios: [{ ebitda_decline_pct: "", interest_increase_pct: "" }],
      rationale: "",
    });
  });

  it("B8 shows no JSON and no assumptions text area", async () => {
    await deepStart();
    expect(screen.queryByRole("textbox", { name: "Scenario assumptions" })).toBeNull();
    expect(screen.queryByLabelText("Scenario assumptions")).toBeNull();
    expect(document.body.textContent).not.toMatch(/JSON/i);
  });

  it("B9 shows a prior run's pin ticked with its values", async () => {
    testingFetch({ ...plan, cap: "50" }, undefined, {
      "/api/runs/earlier/inputs": {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        level: "advanced",
        max_turns: 32,
        modules: [],
        context: {
          ...context,
          run: { ...context.run, pathway: "deep_credit_assessment" },
          assumptions: { ...noPins, cp3d: cp3dPin },
        },
        files: [{ name: file.name, size: file.size }],
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    expect(await screen.findByLabelText("Issuer name")).toHaveValue("Northbridge");
    typeDate();
    typeName();
    await advanceToPurpose();
    advanceToContext();
    expect(
      within(groupOf("cp3d")).getByRole("checkbox", { name: "Pin Market-implied risk" }),
    ).toBeChecked();
    expect(within(groupOf("cp3d")).getByLabelText("Recovery (%)")).toHaveValue("40");
    expect(within(groupOf("cp3d")).getByLabelText("Rationale")).toHaveValue("Agency study");
  });

  it("gives every box an example and a unit and range hint", async () => {
    await deepStart();
    for (const key of Object.keys(PIN_MODULES) as (keyof typeof PIN_MODULES)[]) pin(key);
    for (const key of Object.keys(PIN_MODULES) as (keyof typeof PIN_MODULES)[]) {
      const boxes = within(groupOf(key)).getAllByRole("textbox");
      expect(boxes.length).toBeGreaterThan(1);
      for (const box of boxes) {
        expect(box.getAttribute("placeholder")).toMatch(/^e\.g\. /);
        const hint = box.getAttribute("aria-describedby");
        expect(hint && document.getElementById(hint)?.textContent).toBeTruthy();
      }
    }
  });
});

describe("connected activity and reports", () => {
  const report = {
    id: "test-run",
    issuer: "Synthetic Générale",
    asOf: "2026-10-31",
    pathway: "credit_snapshot",
  };

  function activityFetch(body: unknown, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path !== "/connected/activity") throw new Error(`Unexpected request ${path}`);
        return Promise.resolve(Response.json(body, { status }));
      }),
    );
  }
  const waiting = {
    id: "harbour-2026-11",
    issuer_name: "Harbour Packaging",
    pathway: "credit_snapshot",
    status: "queued",
    reason: "3 runs are already running",
    submitted_by: "",
    started_at: "",
    name_differs: false,
    stalled: false,
    files: 2,
    modules: [
      ["CP-0", "waiting"],
      ["Report", "waiting"],
    ],
  };

  it("lists the runs in progress and waiting, with module progress and no run code", async () => {
    activityFetch({
      updated: "2026-11-16T14:32:10Z",
      held: "daily limit of 30 runs reached; waiting until tomorrow",
      runs: [
        {
          ...waiting,
          id: "meridian-2026-11",
          issuer_name: "Meridian Foods",
          status: "running",
          reason: "",
          submitted_by: "Dana Reyes",
          started_at: "2026-11-16T14:02:00Z",
          name_differs: true,
          stalled: true,
          files: 14,
          modules: [
            ["CP-0", "done"],
            ["CP-1", "running"],
            ["Report", "waiting"],
          ],
        },
        waiting,
      ],
    });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    expect(await screen.findByRole("link", { name: "Meridian Foods" })).toHaveAttribute(
      "href",
      "/run/meridian-2026-11",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Run activity" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Run activity" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Run activity" })).toHaveAttribute("href", "/runs");
    // The page draws no run action of its own while runs are listed: the top bar carries it.
    expect(screen.queryByRole("link", { name: "Start a run" })).toBeNull();
    expect(screen.getByRole("link", { name: "Start run" })).toHaveAttribute("href", "/start");
    expect(screen.getByText("Updated 16 Nov 2026, 14:32 UTC")).toBeInTheDocument();
    for (const term of ["Running", "Waiting"])
      expect(screen.getByText(term, { selector: "dt" }).nextElementSibling).toHaveTextContent("1");
    expect(screen.getByRole("progressbar", { name: "1 of 2 modules" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    // A run in flight is one row: how far, and the module it is on. Every module is on Run progress.
    expect(screen.getByText("1 of 2")).toBeVisible();
    expect(screen.getByText("Now: Financial foundation")).toBeVisible();
    expect(screen.queryByText("Source readiness")).toBeNull();
    expect(
      screen.getByText("submitted by Dana Reyes · started 16 Nov 2026, 14:02 UTC"),
    ).toBeInTheDocument();
    expect(screen.getByText("No activity in the last hour")).toBeInTheDocument();
    expect(screen.getByText("14 source files")).toBeInTheDocument();
    expect(screen.getByText("Issuer name differs from earlier runs")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Harbour Packaging" })).toHaveAttribute(
      "href",
      "/run/harbour-2026-11",
    );
    expect(screen.getByText("3 runs are already running")).toBeInTheDocument();
    expect(screen.getByText(/daily limit of 30 runs reached/)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/2026-11\b/);
  });

  it("says so when no run is in progress and when activity cannot be read", async () => {
    activityFetch({ updated: "2026-11-16T14:32:10Z", held: "", runs: [] });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    expect(await screen.findByText("No run in progress")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the library" })).toHaveAttribute("href", "/");
    cleanup();
    activityFetch({ error: "run activity is unavailable" }, 500);
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    expect(await screen.findByText("Run activity could not be read")).toBeInTheDocument();
    expect(screen.queryByText("No run in progress")).toBeNull();
  });

  it("lists a run that ended without a report", async () => {
    activityFetch({
      updated: "2026-11-16T14:32:10Z",
      held: "",
      runs: [],
      ended: [
        {
          id: "c-capped",
          issuer_name: "Harbour Packaging",
          pathway: "credit_snapshot",
          status: "capped",
          reason: "Spending cap reached",
          ended_at: "2026-10-31T12:05:00Z",
          submitted_by: "analyst",
        },
      ],
    });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    const ended = await screen.findByRole("region", { name: "Ended without a report" });
    expect(within(ended).getByRole("link", { name: "Harbour Packaging" })).toHaveAttribute(
      "href",
      "/run/c-capped",
    );
    expect(within(ended).getByText("Capped")).toBeVisible();
    expect(within(ended).getByText("Spending cap reached")).toBeVisible();
    expect(within(ended).getByText("31 Oct 2026, 12:05 UTC")).toBeVisible();
    expect(
      screen.getByText("Ended without a report", { selector: "dt" }).nextElementSibling,
    ).toHaveTextContent("1");
    expect(screen.queryByText("No run in progress")).toBeNull();
  });

  it("says so when an ended run has no recorded end time", async () => {
    activityFetch({
      updated: "2026-11-16T14:32:10Z",
      held: "",
      runs: [],
      ended: [
        {
          id: "x-rejected",
          issuer_name: "Harbour Packaging",
          pathway: "credit_snapshot",
          status: "rejected",
          reason: "",
          ended_at: "",
          submitted_by: "",
        },
      ],
    });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    const ended = await screen.findByRole("region", { name: "Ended without a report" });
    expect(await within(ended).findByText("Ended: not recorded")).toBeVisible();
    expect(within(ended).getByText("Rejected")).toBeVisible();
  });

  it("counts every ended run and says how many are drawn", async () => {
    const row = (n: number) => ({
      id: `f-${String(n)}`,
      issuer_name: `Issuer ${String(n)}`,
      pathway: "credit_snapshot",
      status: "failed",
      reason: "Provider error",
      ended_at: "2026-10-31T12:05:00Z",
      submitted_by: "",
    });
    const rows = Array.from({ length: 20 }, (_, n) => row(n));
    activityFetch({
      updated: "2026-11-16T14:32:10Z",
      held: "",
      runs: [],
      ended: rows,
      ended_total: 23,
    });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    const ended = await screen.findByRole("region", { name: "Ended without a report" });
    expect(within(ended).getByText("Showing the latest 20 of 23.")).toBeVisible();
    expect(
      screen.getByText("Ended without a report", { selector: "dt" }).nextElementSibling,
    ).toHaveTextContent("23");
    cleanup();
    activityFetch({
      updated: "2026-11-16T14:32:10Z",
      held: "",
      runs: [],
      ended: rows,
      ended_total: 20,
    });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    await screen.findByRole("region", { name: "Ended without a report" });
    expect(screen.queryByText(/Showing the latest/)).toBeNull();
    expect(
      screen.getByText("Ended without a report", { selector: "dt" }).nextElementSibling,
    ).toHaveTextContent("20");
  });

  it("says how many run records could not be read", async () => {
    activityFetch({
      updated: "2026-11-16T14:32:10Z",
      held: "",
      runs: [],
      ended: [],
      ended_total: 0,
      unreadable: 2,
    });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    expect(await screen.findByText("Some run records could not be read")).toBeVisible();
    expect(screen.getByText("2 run records could not be read and are not listed.")).toBeVisible();
    expect(screen.getByText("No active runs listed")).toBeVisible();
    expect(
      screen.getByText("Other runs may be in progress if their records could not be read."),
    ).toBeVisible();
    expect(screen.queryByText("No run in progress")).toBeNull();
    cleanup();
    activityFetch({
      updated: "2026-11-16T14:32:10Z",
      held: "",
      runs: [],
      ended: [],
      ended_total: 0,
      unreadable: 1,
    });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    expect(
      await screen.findByText("1 run record could not be read and is not listed."),
    ).toBeVisible();
    cleanup();
    for (const extra of [{ unreadable: 0 }, {}]) {
      activityFetch({ updated: "2026-11-16T14:32:10Z", held: "", runs: [], ...extra });
      render(<ConnectedApp path="/runs" mode="synthetic" />);
      expect(await screen.findByText("No run in progress")).toBeVisible();
      expect(screen.queryByText("Some run records could not be read")).toBeNull();
      cleanup();
    }
  });

  it("draws the list from a service that sends no ended runs", async () => {
    activityFetch({ updated: "2026-11-16T14:32:10Z", held: "", runs: [] });
    render(<ConnectedApp path="/runs" mode="synthetic" />);
    expect(await screen.findByText("No run in progress")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Ended without a report" })).toBeNull();
  });

  it("says why a held run still reads running and shows the module the stop ended", async () => {
    const reason = "the library could not be rebuilt (disk full); ended runs wait for it";
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path !== "/connected/activity/test-run") throw new Error(`Unexpected request ${path}`);
        return Promise.resolve(
          Response.json({
            id: "test-run",
            status: "running",
            issuer_name: report.issuer,
            pathway: report.pathway,
            modules: [
              ["CP-0", "done"],
              ["CP-1", "stopped"],
              ["Report", "waiting"],
            ],
            as_of: report.asOf,
            cap: "30",
            spent: "0",
            started_at: "2026-10-31T17:31:00Z",
            observed_at: "2026-10-31T17:35:00Z",
            events: [{ kind: "stopped", at: "2026-10-31T17:32:01Z" }],
            held_reason: reason,
            reason: "",
          }),
        );
      }),
    );
    render(<ConnectedApp path="/run/test-run" mode="synthetic" />);
    const alert = await screen.findByText(reason);
    expect(alert.closest("[role]")).toHaveTextContent("Held by the service");
    expect(screen.getByRole("list", { name: "Modules in this run" })).toHaveTextContent(
      /Interrupted/,
    );
    expect(screen.getByRole("progressbar", { name: "Modules finished" })).toHaveAttribute(
      "aria-valuetext",
      "1 of 2 modules",
    );
  });

  it("waits for report publication after the run has finished", async () => {
    let reportRequests = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path === "/connected/activity/test-run")
          return Promise.resolve(
            Response.json({
              id: "test-run",
              status: "finished",
              issuer_name: report.issuer,
              pathway: report.pathway,
              modules: [
                ["CP-0", "done"],
                ["Report", "done"],
              ],
              as_of: report.asOf,
              cap: "30",
              spent: "0",
              settled_spent: "0",
              held: "0",
              started_at: "2026-10-31T17:31:00Z",
              ended_at: "2026-10-31T17:32:14Z",
              observed_at: "2026-10-31T17:35:00Z",
              events: [{ kind: "delivered", at: "2026-10-31T17:32:01Z" }],
              reason: "",
            }),
          );
        if (path !== "/connected/report/test-run") throw new Error(`Unexpected request ${path}`);
        reportRequests += 1;
        return Promise.resolve(
          reportRequests === 1
            ? Response.json({ error: "unknown report" }, { status: 404 })
            : Response.json(report),
        );
      }),
    );
    render(<ConnectedApp path="/run/test-run" mode="synthetic" />);
    expect(await screen.findByText(/Waiting for the report/)).toBeInTheDocument();
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: "Run activity" }),
    ).toHaveAttribute("href", "/runs");
    expect(screen.getByText("Source readiness")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Spend against cap" })).toHaveAttribute(
      "aria-valuetext",
      expect.stringMatching(/USD 0.00 of USD 30.00 cap usage/),
    );
    expect(screen.getByRole("progressbar", { name: "Spend against cap" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByRole("progressbar", { name: "Modules finished" })).toHaveAttribute(
      "aria-valuetext",
      "1 of 1 modules",
    );
    // The numerals are mono and the units text, so the value is one element of several nodes.
    expect(screen.getByText("Elapsed").nextElementSibling?.textContent).toBe("1 min 14 s");
    expect(screen.getByText("Report delivered.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open report" })).toBeNull();
    expect(
      await screen.findByRole("link", { name: "Open report" }, { timeout: 3000 }),
    ).toHaveAttribute("href", "/report/test-run");
  });

  it("reads the published handoff, keeps citations in Evidence, and links the matching download", async () => {
    const folder = "Rapport Émetteur";
    const path = `/report/${encodeURIComponent(folder)}`;
    const download = `downloads/${encodeURIComponent(folder)}/CP-2.md`;
    const output = `${folder}/deliveries/published/CP-2.md`;
    const filing = "issuer-filing.pdf";
    const snapshot = {
      catalogue: {
        real: [
          {
            id: folder,
            name: report.issuer,
            issuer: "SG",
            title: "Full credit assessment",
            date: report.asOf,
            sector: "",
            period: "FY2026",
            metrics: {},
          },
        ],
      },
      workspace: {
        runs: {
          "legacy-route-alias": {
            folder,
            issuer: "SG",
            issuerHeading: report.issuer,
            publicationVerified: true,
            assessmentScope: "unverified",
            lead: {
              module: "CP-2",
              output,
              sha256: "d".repeat(64),
              line: 3,
              text: `The report read the filing.
Basis: ${filing}, page 7.`,
            },
            asOf: report.asOf,
            pathway: report.pathway,
            period: "FY2026",
            changes: { first_run: true },
            modules: { "CP-2": { outputs: [output], default: output } },
            evidence: {
              sources: [
                {
                  name: filing,
                  type: "PDF",
                  documentDate: report.asOf,
                  readBy: ["CP-2"],
                  sha256: null,
                },
              ],
              unused: [],
              unrecorded: [],
              noSourcesModules: [],
              handoffs: [
                { module: "CP-2", name: "CP-2.md", href: download },
                { module: "CP-1", name: "CP-1.md", href: "downloads/other/CP-1.md" },
              ],
              zip: null,
              downloads: [],
              record: { hashes: [], instructions: [], calls: [], cap: null },
            },
          },
        },
        outputs: {
          [output]: {
            id: output,
            module: "CP-2",
            label: "Published output",
            sha256: "d".repeat(64),
            issue: "Chart data: risk exposure is not in its fixed table",
          },
        },
        handoffs: {
          ["d".repeat(64)]: [
            { heading: "Findings", level: 2, line: 1, blocks: [] },
            {
              heading: "Bottom line",
              level: 3,
              line: 2,
              blocks: [
                {
                  type: "text",
                  line: 3,
                  end: 4,
                  text: `The report read the filing.\nBasis: ${filing}, page 7.`,
                },
              ],
            },
            {
              heading: "Financial inputs",
              level: 3,
              line: 6,
              blocks: [
                {
                  type: "table",
                  line: 7,
                  headers: ["Year", "Cash", "Source"],
                  rows: [
                    { line: 9, cells: ["2026", "0", filing] },
                    { line: 10, cells: ["2025", "", "prior-filing.pdf"] },
                  ],
                },
              ],
            },
            {
              heading: "Next module",
              level: 2,
              line: 12,
              blocks: [{ type: "text", line: 13, end: 13, text: "Downstream-only instructions." }],
            },
          ],
        },
        models: [],
      },
      chips: {},
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path !== `/connected/snapshot?run=${encodeURIComponent(folder)}`)
          throw new Error(`Unexpected request ${path}`);
        return Promise.resolve(Response.json(snapshot));
      }),
    );
    window.history.replaceState(null, "", path);
    render(<ConnectedApp path={path} mode="synthetic" />);
    expect(
      await screen.findByRole("heading", { name: report.issuer }, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("The report read the filing.")).toBeInTheDocument();
    expect(screen.queryByText(filing, { exact: false })).toBeNull();
    expect(screen.queryByRole("link", { name: "Download Fundamental credit" })).toBeNull();
    // Handoff downloads are machinery of the Record tab of Evidence.
    window.location.hash = "evidence/record";
    await screen.findByRole("link", { name: "Download Fundamental credit" });
    expect(screen.getByRole("link", { name: "Download Fundamental credit" })).toHaveAttribute(
      "href",
      `/library/${download}`,
    );
    expect(screen.getByRole("link", { name: "Download Fundamental credit" })).toHaveAttribute(
      "download",
    );
    expect(screen.queryByRole("link", { name: "Download Financial foundation" })).toBeNull();
    expect(screen.getByRole("link", { name: /^Modules(?: \d+)?$/ })).toHaveAttribute(
      "href",
      "#modules",
    );
    window.location.hash = "modules/CP-2";
    // The module's table is in its records region, closed until the reader opens it.
    fireEvent.click(await screen.findByRole("button", { name: "Show records" }));
    expect(await screen.findByRole("cell", { name: "0" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Source" })).toBeNull();
    expect(screen.queryByText("Downstream-only instructions.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show sources for 2026" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(filing);
    expect(screen.getByRole("link", { name: "Open in Evidence" })).toHaveAttribute(
      "href",
      `${path}#evidence/${encodeURIComponent(output)}~${"d".repeat(64)}-9`,
    );
    window.location.hash = `evidence/${encodeURIComponent(output)}~${"d".repeat(64)}-9`;
    expect(
      await screen.findByRole("heading", { name: "Fundamental credit · Line 9" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: filing })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "prior-filing.pdf" })).toBeNull();
    expect(screen.queryByText("Downstream-only instructions.")).toBeNull();
    expect(screen.queryByText("Chart data: risk exposure is not in its fixed table")).toBeNull();
    window.location.hash = "evidence/0-9";
    expect(await screen.findByRole("alert")).toHaveTextContent("Evidence link unavailable");
    window.location.hash = "evidence/record/CP-2";
    expect(
      await screen.findByText("Chart data: risk exposure is not in its fixed table"),
    ).toBeInTheDocument();
    window.location.hash = "changes";
    expect(await screen.findByText("No earlier run to compare.")).toBeInTheDocument();
    window.history.replaceState(null, "", "/");
  }, 20_000);

  it.each(["%2F", "%5C", "%2e%2e", "demo%0a"])(
    "refuses an invalid published folder %s",
    (folder) => {
      render(<ConnectedApp path={`/report/${folder}`} mode="synthetic" />);
      expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    },
  );

  it("says an unknown address has no page and offers the Library and Run activity", () => {
    render(<ConnectedApp path="/nope" mode="synthetic" />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText(/This address has no page/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the Library" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Open Run activity" })).toHaveAttribute(
      "href",
      "/runs",
    );
  });

  it("carries Start run in the top bar on every screen but Start run itself, never read-only", async () => {
    const first = render(<ConnectedApp path="/nope" mode="synthetic" />);
    const action = screen.getByRole("link", { name: "Start run" });
    expect(action).toHaveAttribute("href", "/start");
    expect(screen.getByRole("banner")).toContainElement(action);
    first.unmount();
    const second = render(<ConnectedApp path="/nope" mode="synthetic" readOnly />);
    expect(screen.queryByRole("link", { name: "Start run" })).toBeNull();
    second.unmount();
    testingFetch(plan);
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await screen.findByRole("heading", { level: 1, name: "Start a run" });
    expect(screen.queryByRole("link", { name: "Start run" })).toBeNull();
  });

  it("hides the bar's Start run on a test preview, as the page hides its own", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(Response.json({ issuers: [], preview: { reason: "Retained preview." } })),
      ),
    );
    render(<ConnectedApp path="/coverage" mode="synthetic" />);
    expect(await screen.findByText("No published runs yet")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Start run" })).toBeNull();
    });
    expect(screen.queryByRole("link", { name: "Start a run" })).toBeNull();
  });

  it("offers only the Library on an unknown address when the page is read-only", () => {
    render(<ConnectedApp path="/nope" mode="synthetic" readOnly />);
    expect(screen.getByRole("link", { name: "Open the Library" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Run activity" })).toBeNull();
  });

  it("uses the summary's seat status when the picker advertised the pair earlier", async () => {
    const fetchMock = testingFetch(plan, undefined, {
      "/connected/context": {
        ...context,
        submission_caps_usd: submissionCaps,
        copilot_models: { gpt: ["balanced"] },
      },
      "/api/submissions/sub-1/summary": { ...plan, copilot_verified: false },
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await review();
    expect(
      await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Paid Submit is unavailable because this model and effort pair/),
    ).toBeVisible();
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
  });

  it("uses the same reviewed submit in live mode with each limit accepted", async () => {
    const fetchMock = testingFetch({
      ...plan,
      items: [
        { id: "gap", scope: "run", outcome: "gap", reason: "Gap to review" },
        { id: "check", scope: "CP-0", outcome: "check", reason: "Check source" },
      ],
    });
    const navigate = vi.fn();
    render(<ConnectedApp path="/start" mode="live" navigate={navigate} />);
    await review();
    const submit = await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" });
    expect(submit).toBeDisabled();
    const approval = screen.getByRole("checkbox", { name: /Approve: I have read this summary/ });
    expect(approval).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "I accept this limit" }));
    expect(approval).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "I have checked this" }));
    expect(approval).toBeEnabled();
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
    approve();
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    const dialog = await screen.findByRole("dialog", { name: "Start a paid run?" });
    expect(dialog).toHaveTextContent("spend up to USD 30.00");
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
    fireEvent.click(submit);
    fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 30.00" }));
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/test-run");
    });
  });
});

const FIX = "Add the executed agreement and declare it.";
const cascade = [
  {
    id: "CP-4:declared-none",
    scope: "CP-4",
    outcome: "will_refuse",
    reason: "Legal documents declared none.",
    fix: FIX,
    inherited_from: [],
  },
  {
    id: "CP-2A:from:CP-4",
    scope: "CP-2A",
    outcome: "limited",
    reason: "Expected to be limited because it reads CP-4.",
    fix: "",
    inherited_from: ["CP-4"],
  },
  {
    id: "CP-5:from:CP-2A",
    scope: "CP-5",
    outcome: "limited",
    reason: "Expected to be limited because it reads CP-2A.",
    fix: "",
    inherited_from: ["CP-2A"],
  },
  {
    id: "run:section-omitted-x",
    scope: "run",
    outcome: "information",
    reason: "This pathway does not produce the x report section.",
  },
];

describe("connected run start limits as decisions", () => {
  it("groups a cause with the limits that follow from it, in paid mode", async () => {
    const fetchMock = testingFetch({ ...plan, items: cascade });
    render(<ConnectedApp path="/start" mode="live" />);
    await review();
    const submit = await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" });
    const limits = screen.getByRole("region", { name: "Limits to decide" });
    expect(within(limits).getAllByRole("checkbox")).toHaveLength(1);
    expect(limits).toHaveTextContent("Will refuse");
    expect(limits).toHaveTextContent("Legal documents declared none.");
    expect(limits).toHaveTextContent("Also affects: Downside, Evidence validation");
    expect(limits).toHaveTextContent("No action needed (1)");
    expect(limits).not.toHaveTextContent(/CP-\d/);
    expect(screen.getByText("1 decision left before you can approve.")).toBeInTheDocument();
    const approval = screen.getByRole("checkbox", { name: /Approve: I have read this summary/ });
    expect(approval).toBeDisabled();
    expect(submit).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    );
    expect(approval).toBeEnabled();
    expect(submit).toBeDisabled();
    approve();
    expect(submit).toBeEnabled();
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
  });

  it("names the following modules that will refuse apart from those that are only limited", async () => {
    const refusing = [
      {
        id: "CP-4:declared-none",
        scope: "CP-4",
        outcome: "will_refuse",
        reason: "Legal documents declared none.",
        fix: FIX,
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
      {
        id: "CP-5:from:CP-4",
        scope: "CP-5",
        outcome: "limited",
        reason: "Expected to be limited because it reads CP-4.",
        fix: "",
        inherited_from: ["CP-4"],
      },
    ];
    testingFetch({ ...plan, items: refusing });
    render(<ConnectedApp path="/start" mode="live" />);
    await review();
    await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" });
    const limits = screen.getByRole("region", { name: "Limits to decide" });
    expect(limits).toHaveTextContent("Will also refuse: Recovery & fulcrum");
    expect(limits).toHaveTextContent("Also affects: Evidence validation");
    expect(limits).not.toHaveTextContent("Also affects: Recovery");
    expect(
      screen.getByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    ).toBeInTheDocument();
    expect(limits).not.toHaveTextContent(/CP-\d/);
  });

  it("draws the reason and the fix of an item that needs no action", async () => {
    const passive = [
      {
        id: "run:workbook-none",
        scope: "run",
        outcome: "information",
        reason: "No portfolio workbook was chosen.",
        fix: "Add the fund's workbook and choose it under Issuer and dates.",
      },
    ];
    testingFetch({ ...plan, items: passive });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    await screen.findByRole("button", { name: "Submit run" });
    const limits = screen.getByRole("region", { name: "Limits to decide" });
    expect(limits).toHaveTextContent("No action needed (1)");
    const details = limits.querySelector("details");
    expect(details).toHaveTextContent("No portfolio workbook was chosen.");
    expect(details).toHaveTextContent(
      "Add the fund's workbook and choose it under Issuer and dates.",
    );
  });

  it("says there are no limits when the service finds none", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    await screen.findByRole("button", { name: "Submit run" });
    expect(screen.getByText("No limits found for this run.")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Approve: I have read this summary/ }),
    ).toBeEnabled();
  });

  it("keeps an acceptance when the same limit comes back, and never the approval", async () => {
    testingFetch({ ...plan, items: cascade });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    );
    approve();
    fireEvent.click(screen.getByRole("button", { name: "Edit context" }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /Approve: I have read this summary/ }),
    ).not.toBeChecked();
  });

  it("does not keep an acceptance when the limit's reason changed", async () => {
    const changed = cascade.map((item, i) =>
      i === 0 ? { ...item, reason: "Legal documents declared none (draft found)." } : item,
    );
    const base = testingFetch({ ...plan, items: cascade });
    let summaries = 0;
    vi.stubGlobal("fetch", (path: string, init?: RequestInit) => {
      if (!path.endsWith("/summary")) return base(path, init);
      summaries += 1;
      return summaries === 1
        ? base(path, init)
        : Promise.resolve(Response.json({ ...plan, items: changed }));
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit context" }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /Approve: I have read this summary/ }),
    ).toBeDisabled();
  });

  it("drops acceptances when the issuer is changed", async () => {
    testingFetch({ ...plan, items: cascade }, undefined, {
      "/api/runs/earlier/inputs": {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        level: "basic",
        max_turns: 32,
        modules: [],
        context,
        files: [{ name: file.name, size: file.size }],
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    await screen.findByLabelText("Issuer name");
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit issuer and documents" }));
    fireEvent.click(screen.getByRole("button", { name: "This is a different issuer" }));
    await fillInputs();
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    ).not.toBeChecked();
  });

  it("does not carry an acceptance after a reset when the same issuer is typed again", async () => {
    testingFetch({ ...plan, items: cascade }, undefined, {
      "/api/runs/earlier/inputs": {
        issuer_id: "northbridge",
        issuer_name: "Northbridge",
        level: "basic",
        max_turns: 32,
        modules: [],
        context,
        files: [{ name: file.name, size: file.size }],
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    await screen.findByLabelText("Issuer name");
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit issuer and documents" }));
    fireEvent.click(screen.getByRole("button", { name: "This is a different issuer" }));
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(
      await screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" }),
    ).not.toBeChecked();
  });

  it("closes the stepper, Edit buttons and approval after an uncertain submit", async () => {
    testingFetch(plan, () => new Response("failed", { status: 500 }));
    render(<ConnectedApp path="/start" mode="live" />);
    await review();
    await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" });
    approve();
    fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 30.00" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 30.00" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Submitting again is safe.");
    expect(screen.queryAllByRole("button", { name: /^Go back to/ })).toHaveLength(0);
    for (const name of ["Edit issuer and documents", "Edit purpose and modules", "Edit context"])
      expect(screen.getByRole("button", { name })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: /Approve: I have read this summary/ }),
    ).toBeDisabled();
  });

  it("closes the stepper, Edit buttons and approval while a submit is in flight", async () => {
    let release!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const fetchMock = testingFetch(plan);
    const navigate = vi.fn();
    const base = fetchMock.getMockImplementation();
    vi.stubGlobal("fetch", (path: string, init?: RequestInit) =>
      path.endsWith("/submit") ? pending : base?.(path, init),
    );
    render(<ConnectedApp path="/start" mode="live" navigate={navigate} />);
    await review();
    await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" });
    approve();
    fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 30.00" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 30.00" }));
    await screen.findByRole("button", { name: "Submitting…" });
    for (const name of ["Edit issuer and documents", "Edit purpose and modules", "Edit context"])
      expect(screen.getByRole("button", { name })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: /Approve: I have read this summary/ }),
    ).toBeDisabled();
    expect(screen.queryAllByRole("button", { name: /^Go back to/ })).toHaveLength(0);
    release(Response.json({ run: "test-run", status: "queued" }));
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/test-run");
    });
  });
});

describe("connected run start: what an acceptance carries to", () => {
  const limitBox = () =>
    screen.findByRole("checkbox", { name: "I accept this limit and its 2 consequences" });
  const approvalBox = () =>
    screen.getByRole("checkbox", { name: /Approve: I have read this summary/ });

  async function acceptThenEdit(edit: string) {
    await review();
    fireEvent.click(await limitBox());
    fireEvent.click(screen.getByRole("button", { name: edit }));
  }

  it("describes each group's checkbox by its first cause", async () => {
    const gap = {
      id: "run:portfolio-missing",
      scope: "run",
      outcome: "gap",
      reason: "No portfolio workbook.",
      fix: "Attach the portfolio workbook.",
    };
    testingFetch({ ...plan, items: [...cascade, gap] });
    render(<ConnectedApp path="/start" mode="live" />);
    await review();
    expect(await limitBox()).toHaveAccessibleDescription("Legal documents declared none.");
    expect(
      screen.getByRole("checkbox", { name: "I accept this limit" }),
    ).toHaveAccessibleDescription("No portfolio workbook.");
  });

  it("drops an acceptance when a different issuer name is typed", async () => {
    testingFetch({ ...plan, items: cascade });
    render(<ConnectedApp path="/start" mode="live" />);
    await acceptThenEdit("Edit issuer and documents");
    fireEvent.change(screen.getByLabelText("Issuer name"), {
      target: { value: "Other Issuer plc" },
    });
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await limitBox()).not.toBeChecked();
    expect(approvalBox()).toBeDisabled();
  });

  it("drops an acceptance when a different issuer ID is typed", async () => {
    testingFetch({ ...plan, items: cascade });
    render(<ConnectedApp path="/start" mode="live" />);
    await acceptThenEdit("Edit issuer and documents");
    fireEvent.change(screen.getByLabelText("Issuer ID"), { target: { value: "another-issuer" } });
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await limitBox()).not.toBeChecked();
    expect(approvalBox()).toBeDisabled();
  });

  it("keeps an acceptance across a stepper hop between form steps", async () => {
    testingFetch({ ...plan, items: cascade });
    render(<ConnectedApp path="/start" mode="live" />);
    await acceptThenEdit("Edit context");
    fireEvent.click(screen.getByRole("button", { name: "Go back to Purpose" }));
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await limitBox()).toBeChecked();
    expect(approvalBox()).not.toBeChecked();
  });

  it("drops an acceptance when another pathway is chosen", async () => {
    const base = testingFetch({ ...plan, items: cascade });
    let summaries = 0;
    vi.stubGlobal("fetch", (path: string, init?: RequestInit) => {
      if (!path.endsWith("/summary")) return base(path, init);
      summaries += 1;
      return summaries === 1
        ? base(path, init)
        : Promise.resolve(Response.json({ ...plan, cap: "50", items: cascade }));
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await acceptThenEdit("Edit purpose and modules");
    fireEvent.click(screen.getByRole("radio", { name: "Deep credit assessment" }));
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit, spend up to USD 50.00" });
    expect(await limitBox()).not.toBeChecked();
    expect(approvalBox()).toBeDisabled();
  });

  it("uses a carried acceptance once: a refused submit leaves nothing for the next review", async () => {
    testingFetch({ ...plan, items: cascade }, () =>
      Response.json({ error: "stale" }, { status: 400 }),
    );
    render(<ConnectedApp path="/start" mode="live" />);
    await acceptThenEdit("Edit context");
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await limitBox()).toBeChecked();
    approve();
    fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 30.00" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 30.00" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Review the run again before submitting.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await limitBox()).not.toBeChecked();
    expect(approvalBox()).toBeDisabled();
  });

  it("counts a group with only some members accepted as undecided", async () => {
    const gap = {
      id: "run:portfolio-missing",
      scope: "run",
      outcome: "gap",
      reason: "No portfolio workbook.",
      fix: "Attach the portfolio workbook.",
    };
    const first = [...cascade, gap];
    const revised = first.map((item, i) =>
      i === 2 ? { ...item, reason: "Expected to be limited through CP-2A (revised)." } : item,
    );
    const base = testingFetch({ ...plan, items: first });
    let summaries = 0;
    vi.stubGlobal("fetch", (path: string, init?: RequestInit) => {
      if (!path.endsWith("/summary")) return base(path, init);
      summaries += 1;
      return summaries === 1
        ? base(path, init)
        : Promise.resolve(Response.json({ ...plan, items: revised }));
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await review();
    fireEvent.click(await limitBox());
    fireEvent.click(screen.getByRole("checkbox", { name: "I accept this limit" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit context" }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await limitBox()).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "I accept this limit" })).toBeChecked();
    expect(screen.getByText("1 decision left before you can approve.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Limits to decide" })).toHaveTextContent(
      "1 of 2 decided",
    );
    expect(approvalBox()).toBeDisabled();
  });

  it("carries nothing after Use inputs from latest run", async () => {
    testingFetch({ ...plan, items: cascade }, undefined, {
      "/api/issuers/acme": { latest_run: "earlier", runs: 1, latest_as_of: "2026-09-30" },
      "/api/runs/earlier/inputs": {
        issuer_id: "acme",
        issuer_name: "Acme",
        level: "basic",
        max_turns: 32,
        modules: [],
        context: null,
        files: [{ name: file.name, size: file.size }],
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" mode="live" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    fireEvent.click(await limitBox());
    fireEvent.click(screen.getByRole("button", { name: "Edit issuer and documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByRole("button", { name: "This is a different issuer" });
    typeDate();
    typeName();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await limitBox()).not.toBeChecked();
    expect(approvalBox()).toBeDisabled();
  });
});

describe("connected run start: leave out modules that would refuse", () => {
  const refusing = [
    {
      id: "CP-4:declared-none",
      scope: "CP-4",
      outcome: "will_refuse",
      reason: "Legal documents declared none.",
      fix: FIX,
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
    {
      id: "CP-2A:from:CP-4",
      scope: "CP-2A",
      outcome: "limited",
      reason: "Expected to be limited because it reads CP-4.",
      fix: "",
      inherited_from: ["CP-4"],
    },
  ];

  function summaryBodies(fetchMock: ReturnType<typeof testingFetch>) {
    return fetchMock.mock.calls
      .filter(([path]) => path.endsWith("/summary"))
      .map(([, init]) => {
        const body = init?.body;
        return JSON.parse(typeof body === "string" ? body : "null") as { modules: string[] };
      });
  }

  it("leaves the modules out, makes a new summary, and puts them back", async () => {
    const fetchMock = testingFetch({ ...plan, cap: "20", items: refusing });
    render(<ConnectedApp path="/start" mode="live" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: /Distressed & Restructuring/ }));
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const leave = await screen.findByRole("button", {
      name: "Leave out Legal & covenants and Recovery & fulcrum",
    });
    expect(screen.getAllByRole("button", { name: /^Leave out / })).toHaveLength(1);
    expect(screen.queryByText(/^Left out:/)).toBeNull();
    const everyModule = pathwayModules("distressed_restructuring");
    fireEvent.click(leave);
    expect(
      screen.queryByRole("checkbox", { name: /Approve: I have read this summary/ }),
    ).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: "Review run" }));
    await screen.findByText("Left out: Legal & covenants, Recovery & fulcrum");
    expect(summaryBodies(fetchMock)[1]?.modules).toEqual(
      everyModule.filter((code) => code !== "CP-4" && code !== "CP-4C"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Put back" }));
    fireEvent.click(await screen.findByRole("button", { name: "Review run" }));
    await vi.waitFor(() => {
      expect(summaryBodies(fetchMock)).toHaveLength(3);
    });
    expect(summaryBodies(fetchMock)[2]?.modules).toEqual([]);
  });
});

describe("connected run start: the Basic run sends what it sent before", () => {
  const entered = "Compare the covenant package with the last amendment.";
  const sentBody = (fetchMock: ReturnType<typeof testingFetch>) => {
    const body = fetchMock.mock.calls.find(([path]) => path.endsWith("/summary"))?.[1]?.body;
    return JSON.parse(typeof body === "string" ? body : "null") as unknown;
  };

  it("N8 sends no modules, the Basic settings and the entered context", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Anything the analysis should know"), {
      target: { value: entered },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    expect(sentBody(fetchMock)).toEqual({
      context: {
        run: {
          as_of: "2026-10-31",
          cutoff: "2026-10-31",
          pathway: "credit_snapshot",
          case_kind: "synthetic",
        },
        identity: { issuer_name: "Synthetic Générale", issuer_id: "synthetic-generale" },
        research_questions: [{ text: entered, focus_module: "" }],
      },
      modules: [],
      level: "basic",
      max_turns: 32,
      model: "gpt",
      effort: "balanced",
      submitted_by: "Ana L",
    });
  });

  it("N8b asks for no reporting currency and sends none: the library reads CP-1's", async () => {
    // docs/rulings/2026-11-16-reporting-currency-from-sources.md: the template's USD is not shown.
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    expect(screen.queryByLabelText("Reporting currency")).toBeNull();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    expect(screen.queryByText("Reporting currency")).toBeNull();
    const body = sentBody(fetchMock) as { context: { run: Record<string, unknown> } };
    expect(Object.keys(body.context.run)).not.toContain("reporting_currency");
  });

  it("N9 sends the pathway's modules without the left-out ones, the rest as in N8", async () => {
    const fetchMock = testingFetch({
      ...plan,
      cap: "20",
      items: [
        {
          id: "CP-4:declared-none",
          scope: "CP-4",
          outcome: "will_refuse",
          reason: "No agreement is chosen among the documents.",
          fix: FIX,
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
      ] as never,
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: /Distressed & Restructuring/ }));
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Leave out Legal & covenants and Recovery & fulcrum",
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Review run" }));
    await screen.findByText("Left out: Legal & covenants, Recovery & fulcrum");
    const bodies = fetchMock.mock.calls
      .filter(([path]) => path.endsWith("/summary"))
      .map(
        ([, init]) => JSON.parse(typeof init?.body === "string" ? init.body : "null") as unknown,
      );
    expect(bodies[1]).toEqual({
      context: {
        run: {
          as_of: "2026-10-31",
          cutoff: "2026-10-31",
          pathway: "distressed_restructuring",
          run_type: "research",
          case_kind: "synthetic",
        },
        identity: { issuer_name: "Synthetic Générale", issuer_id: "synthetic-generale" },
      },
      modules: [
        "CP-0",
        "CP-1",
        "CP-1A",
        "CP-1C",
        "CP-DR",
        "CP-2",
        "CP-2A",
        "CP-2E",
        "CP-2G",
        "CP-2H",
        "CP-5",
      ],
      level: "basic",
      max_turns: 32,
      model: "gpt",
      effort: "balanced",
      submitted_by: "Ana L",
    });
  });
});

describe("connected run start: readiness after going back, and repeated announcements", () => {
  const rowOf = (name: string) =>
    within(screen.getByRole("complementary", { name: "Readiness" }))
      .getByText(name)
      .closest("li");
  const earlier = {
    issuer_id: "northbridge",
    issuer_name: "Northbridge",
    level: "basic",
    max_turns: 32,
    modules: [],
    context: { ...context, run: { ...context.run, as_of: "" } },
    files: [{ name: file.name, size: file.size }],
  };

  async function chosenPurpose() {
    testingFetch({ ...plan, cap: "50" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    expect(rowOf("Purpose chosen")).not.toHaveTextContent("Not met");
    fireEvent.click(screen.getByRole("radio", { name: "Deep credit assessment" }));
    expect(rowOf("Purpose chosen")).not.toHaveTextContent("Not met");
    advanceToContext();
    expect(rowOf("Purpose chosen")).not.toHaveTextContent("Not met");
  }

  it("keeps Purpose chosen met after Previous", async () => {
    await chosenPurpose();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Purpose" });
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Documents" });
    expect(screen.getByText(/^2 of 4 ready/)).toBeInTheDocument();
  });

  it("keeps Purpose chosen met after the stepper and after Edit on the review", async () => {
    await chosenPurpose();
    fireEvent.click(screen.getByRole("button", { name: "Go back to Documents" }));
    await screen.findByRole("heading", { name: "Documents" });
    expect(rowOf("Purpose chosen")).not.toHaveTextContent("Not met");
    expect(screen.getByText(/^2 of 4 ready/)).toBeInTheDocument();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    fireEvent.click(screen.getByRole("button", { name: "Edit issuer and documents" }));
    await screen.findByRole("heading", { name: "Documents" });
    expect(rowOf("Purpose chosen")).not.toHaveTextContent("Not met");
  });

  it("returns Purpose chosen to not met on a carry-over and on a reset", async () => {
    testingFetch(plan, undefined, {
      "/api/issuers/northbridge": {
        latest_run: "latest-case",
        runs: 1,
        latest_as_of: "2025-03-31",
      },
      "/api/runs/latest-case/inputs": earlier,
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Go back to Documents" }));
    fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "Northbridge" } });
    expect(rowOf("Purpose chosen")).not.toHaveTextContent("Not met");
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByRole("button", { name: "This is a different issuer" });
    expect(rowOf("Purpose chosen")).toHaveTextContent("Not met");
    typeDate();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Go back to Documents" }));
    expect(rowOf("Purpose chosen")).not.toHaveTextContent("Not met");
    fireEvent.click(screen.getByRole("button", { name: "This is a different issuer" }));
    expect(rowOf("Purpose chosen")).toHaveTextContent("Not met");
  });

  it("announces a second inspection with the same result again", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    const status = (await screen.findByText("1 document inspected, 0 ignored.")).closest(
      "[role=status]",
    );
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((seen) => records.push(...seen));
    observer.observe(status as Element, { childList: true, characterData: true, subtree: true });
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await screen.findByRole("button", { name: "Reading documents…" });
    await screen.findByRole("button", { name: "Inspect documents" });
    records.push(...observer.takeRecords());
    observer.disconnect();
    expect(records.length).toBeGreaterThan(0);
  });

  it("draws no inspection line once no document is left", async () => {
    const fetchMock = testingFetch(plan, undefined, {
      "/api/submissions/sub-1/reading": () =>
        Promise.resolve(
          Response.json({
            documents: fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")
              ? []
              : plan.documents,
            ignored: [],
            error: "",
          }),
        ),
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await screen.findByText("1 document inspected, 0 ignored.");
    fireEvent.click(screen.getByRole("button", { name: `Remove ${file.name}` }));
    await screen.findByText("No documents yet.");
    expect(screen.queryByText(/documents? inspected/)).toBeNull();
  });

  it("says None needed, not 0 of 0, when the review has no limit groups", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    await screen.findByRole("button", { name: "Submit run" });
    const row = rowOf("Decisions made");
    expect(row).toHaveTextContent("None needed");
    expect(row).not.toHaveTextContent("0 of 0");
    expect(row).not.toHaveTextContent("Not met");
  });

  it("says the cap is unavailable on the one line when the service sends none", async () => {
    testingFetch(plan, undefined, {
      "/connected/context": { ...context, submission_caps_usd: {} },
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await fillInputs();
    expect(screen.getByText("0 of 4 ready · Cap unavailable")).toBeInTheDocument();
  });

  it("leaves focus alone when the pressed button became a different control", async () => {
    // jsdom does not drop focus when a fieldset is disabled; the service call does it here.
    testingFetch(plan, undefined, {
      "/api/issuers/northbridge": {
        latest_run: "latest-case",
        runs: 1,
        latest_as_of: "2025-03-31",
      },
      "/api/runs/latest-case/inputs": () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return Promise.resolve(Response.json(earlier));
      },
      "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    const pressed = screen.getByRole("button", { name: "Use inputs from latest run" });
    pressed.focus();
    fireEvent.click(pressed);
    await screen.findByText(/Using an earlier run as a starting point/);
    await waitFor(() => expect(pressed).toBeEnabled());
    expect(pressed).toHaveTextContent("This is a different issuer");
    expect(document.activeElement).not.toBe(pressed);
  });
});

describe("select field with both help and a problem", () => {
  it("draws both and keeps both in the description", () => {
    render(
      <SelectField
        title="Legal documents"
        value=""
        choices={{ "": "None", agreement: "Agreement" }}
        onChange={vi.fn()}
        help="Pick the kind of legal document."
        problemField="agreement"
        problem={{ name: "Error", message: "Choose the agreement.", field: "agreement" }}
      />,
    );
    const select = screen.getByRole("combobox", { name: "Legal documents" });
    expect(screen.getByText("Pick the kind of legal document.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose the agreement.");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription(
      "Pick the kind of legal document. Choose the agreement.",
    );
  });
});

describe("connected run start: one mechanism for a refusal that names a control", () => {
  const P1 = "assumptions.cp4c.ev_multiple: must be 99.99 or less.";
  const P1_LINE = "Scenario assumptions · Recovery & fulcrum · EV multiple: must be 99.99 or less.";
  const P3 = "deal_terms[0].size_m: is required.; assumptions.cp2e.rate_shocks_bps: is required.";
  const FACILITY_LINE = "Facilities and deal terms · Facility 1 · Size (m): is required.";
  const RATES_LINE = "Scenario assumptions · Rates, FX & hedging · Rate shocks (bps): is required.";

  /** The summary answers with each reply in turn, the last one repeating. */
  function answering(...replies: object[]) {
    let at = 0;
    return testingFetch(plan, undefined, {
      "/api/submissions/sub-1/summary": () =>
        Promise.resolve(Response.json(replies[Math.min(at++, replies.length - 1)])),
    });
  }
  const stepHeading = (step: "documents" | "purpose" | "context") =>
    ({ documents: "Documents", purpose: "Purpose", context: "More context" })[step];
  const refused = (error: string) => ({ ...plan, error, digest: "" });

  async function advancedReview(replies: object[]) {
    answering(...replies);
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: "Deep credit assessment" }));
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  }
  const noticeOf = (text: string) =>
    screen.getAllByRole("alert").find((alert) => alert.textContent.includes(text));

  it("N4 shows a refused assumption on its section, opened and focused, not in the notice", async () => {
    await advancedReview([refused(P1)]);
    const footer = await screen.findByRole("button", { name: `1 problem to fix: ${P1_LINE}` });
    expect(footer).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: stepHeading(stepOfField("assumptions")) }),
    ).toBeInTheDocument();
    const section = screen.getByText("Scenario assumptions").closest("details");
    await waitFor(() => expect(section).toHaveAttribute("open"));
    const control = document.querySelector<HTMLElement>('[data-field="assumptions"]');
    expect(control).not.toBeNull();
    expect(section).toContainElement(control);
    await waitFor(() => expect(control).toHaveFocus());
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription(P1_LINE);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toBe(document.getElementById("error-assumptions"));
  });

  it("N5 sends the facility problem to the Facilities control and keeps the other in the notice", async () => {
    await advancedReview([refused(P3)]);
    await screen.findByRole("button", { name: `1 problem to fix: ${FACILITY_LINE}` });
    expect(
      screen.getByRole("heading", { name: stepHeading(stepOfField("deal_terms")) }),
    ).toBeInTheDocument();
    const control = document.querySelector<HTMLElement>('[data-field="deal_terms"]');
    await waitFor(() => expect(control).toHaveFocus());
    expect(control).toHaveAccessibleDescription(FACILITY_LINE);
    const notice = noticeOf(RATES_LINE);
    expect(notice).toBeDefined();
    expect(notice).toHaveTextContent(RATES_LINE);
    expect(notice).not.toHaveTextContent("Facility 1");
    expect(within(notice as HTMLElement).queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });

  it("N6 keeps a refusal that names no control in the notice only", async () => {
    await advancedReview([refused("foo.bar: must be x.")]);
    expect(await screen.findByRole("alert")).toHaveTextContent("foo.bar: must be x.");
    expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /problem to fix/ })).toBeNull();
  });

  it("N7 clears the field message and the footer once the value is corrected and reviewed again", async () => {
    await advancedReview([refused(P1), { ...plan, cap: "50" }]);
    await screen.findByRole("button", { name: `1 problem to fix: ${P1_LINE}` });
    const control = document.querySelector<HTMLElement>('[data-field="assumptions"]');
    await waitFor(() => expect(control).toHaveFocus());
    fireEvent.click(control as HTMLElement);
    expect(control).not.toHaveAttribute("aria-invalid");
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    expect(document.getElementById("error-assumptions")).toBeNull();
    expect(screen.queryByRole("button", { name: /problem to fix/ })).toBeNull();
  });
});

describe("connected run start: a refusal goes to a control only when it is drawn", () => {
  const OPTIONS = "module_options.cp3_mode: is required.";
  async function reviewOn(pathway: string, error: string, level = "advanced") {
    testingFetch({ ...plan, cap: "50", error, digest: "" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: pathway }));
    chooseControl("Run form level", level);
    advanceToContext();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  }

  it("keeps a Module options refusal in the notice on a pathway with neither CP-3 nor CP-6", async () => {
    await reviewOn("Lite credit assessment", OPTIONS);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Module options");
    expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /problem to fix/ })).toBeNull();
  });

  it("routes the same refusal to its control, open, on Deep credit assessment", async () => {
    await reviewOn("Deep credit assessment", OPTIONS);
    await screen.findByRole("button", { name: /^1 problem to fix: Module options/ });
    const control = document.querySelector<HTMLElement>('[data-field="module_options"]');
    await waitFor(() => expect(control).toHaveFocus());
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription(
      expect.stringContaining("Module options · Relative value mode: is required."),
    );
    expect(screen.getByText("Module options").closest("details")).toHaveAttribute("open");
  });

  it("keeps an assumptions refusal in the notice when the pathway runs none of the pinned modules", async () => {
    await reviewOn(
      "Lite credit assessment",
      "assumptions.cp4c.ev_multiple: must be 99.99 or less.",
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("EV multiple: must be 99.99");
    expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /problem to fix/ })).toBeNull();
  });

  it("opens Valuation and peers for a valuation refusal", async () => {
    await reviewOn("Deep credit assessment", "valuation.user_multiple.value: is required.");
    await screen.findByRole("button", { name: /^1 problem to fix: Valuation and peers/ });
    const control = document.querySelector<HTMLElement>('[data-field="valuation"]');
    await waitFor(() => expect(control).toHaveFocus());
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription(
      expect.stringContaining(
        "Valuation and peers · Your own multiple · Multiple (x): is required.",
      ),
    );
    expect(screen.getByText("Valuation and peers").closest("details")).toHaveAttribute("open");
  });

  it("shows a legal documents refusal on the Legal documents select", async () => {
    await reviewOn("Deep credit assessment", "attachments.legal_documents: is required.");
    await screen.findByRole("button", { name: /^1 problem to fix:/ });
    const select = screen.getByLabelText("Legal documents");
    await waitFor(() => expect(select).toHaveFocus());
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("data-field", "legal_documents");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    fireEvent.change(select, { target: { value: "executed" } });
    expect(select).not.toHaveAttribute("aria-invalid");
  });
});

describe("the step each refusable control is drawn on", () => {
  async function toStep(step: "documents" | "context") {
    testingFetch({ ...plan, cap: "50" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    if (step === "documents") return;
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: "Deep credit assessment" }));
    chooseControl("Run form level", "advanced");
    fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
    await screen.findByRole("heading", { name: "More context" });
  }
  const marked = (field: string) => document.querySelector(`[data-field="${field}"]`);

  it("draws the issuer name on Documents", async () => {
    await toStep("documents");
    expect(marked("issuer_name")).not.toBeNull();
    expect(stepOfField("issuer_name")).toBe("documents");
  });

  it.each([
    "cutoff",
    "legal_documents",
    "deal_terms",
    "quotes",
    "ratings",
    "research_questions",
    "valuation",
    "assumptions",
    "module_options",
  ] as const)("draws %s on Context", async (field) => {
    await toStep("context");
    expect(marked(field)).not.toBeNull();
    expect(stepOfField(field)).toBe("context");
  });
});

describe("connected run start: module choices sent", () => {
  const summaryBodies = (fetchMock: ReturnType<typeof testingFetch>) =>
    fetchMock.mock.calls
      .filter(([path]) => path.endsWith("/summary"))
      .map(
        ([, init]) =>
          JSON.parse(typeof init?.body === "string" ? init.body : "null") as {
            modules: string[];
            level: string;
            max_turns: number;
            model: string;
            effort: string;
          },
      );

  it("R1 a Basic run sends no modules after a module choice made at Advanced", async () => {
    const fetchMock = testingFetch({ ...plan, cap: "20" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: /Relative Value/ }));
    chooseControl("Run form level", "advanced");
    advanceToContext();
    fireEvent.click(await screen.findByRole("checkbox", { name: moduleName("CP-3D") }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Purpose" });
    chooseControl("Run form level", "basic");
    advanceToContext();
    fireEvent.click(await screen.findByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    expect(summaryBodies(fetchMock)[0]).toMatchObject({
      modules: [],
      level: "basic",
      max_turns: 32,
      model: "gpt",
      effort: "balanced",
    });
  });

  const earningsPeriods = () => {
    fireEvent.change(screen.getByLabelText(/^Current period/), { target: { value: "q3-2026" } });
    fireEvent.change(screen.getByLabelText(/^Prior period/), { target: { value: "q2-2026" } });
  };

  const kept = (pathway: RegExp, left: string, expected: string[]) => async () => {
    const fetchMock = testingFetch({
      ...plan,
      cap: "20",
      items: [
        {
          id: `${left}:declared`,
          scope: left,
          outcome: "will_refuse",
          reason: "Expected to refuse.",
          fix: FIX,
          inherited_from: [],
        },
      ] as never,
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: pathway }));
    advanceToContext();
    if (left === "CP-1D") earningsPeriods();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    fireEvent.click(await screen.findByRole("button", { name: `Leave out ${moduleName(left)}` }));
    fireEvent.click(await screen.findByRole("button", { name: "Review run" }));
    await screen.findByText(`Left out: ${moduleName(left)}`);
    expect(summaryBodies(fetchMock).at(-1)?.modules).toEqual(expected);
  };

  it(
    "R2a Earnings Update leaves CP-1D out and keeps the forecast",
    kept(/Earnings Update/, "CP-1D", [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1A",
      "CP-1B",
      "CP-DR",
      "CP-2E",
      "CP-5",
    ]),
  );
  it(
    "R2b Relative Value leaves CP-3D out and keeps the forecast",
    kept(/Relative Value/, "CP-3D", [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1C",
      "CP-DR",
      "CP-2",
      "CP-2D",
      "CP-2E",
      "CP-3",
      "CP-3C",
      "CP-5",
    ]),
  );
  it(
    "R2c Portfolio Decision leaves CP-6 out and keeps the forecast",
    kept(/Portfolio Decision/, "CP-6", [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-DR",
      "CP-2",
      "CP-2E",
      "CP-3",
      "CP-5",
    ]),
  );

  it("R4 an Advanced choice on Earnings Update ends with CP-MODEL and holds no unticked code", async () => {
    const fetchMock = testingFetch({ ...plan, cap: "20" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: /Earnings Update/ }));
    chooseControl("Run form level", "advanced");
    advanceToContext();
    earningsPeriods();
    fireEvent.click(await screen.findByRole("checkbox", { name: moduleName("CP-1D") }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    const sent = summaryBodies(fetchMock)[0]?.modules ?? [];
    expect(sent.filter((code) => code === "CP-MODEL")).toHaveLength(1);
    expect(sent).not.toContain("CP-1D");
  });

  it("R10 the review's Leave out never names the forecast the run keeps", async () => {
    const fetchMock = testingFetch({
      ...plan,
      cap: "20",
      items: [
        {
          id: "CP-1D:declared",
          scope: "CP-1D",
          outcome: "will_refuse",
          reason: "Expected to refuse.",
          fix: FIX,
          inherited_from: [],
        },
      ] as never,
    });
    render(<ConnectedApp path="/start" mode="live" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: /Earnings Update/ }));
    chooseControl("Run form level", "advanced");
    advanceToContext();
    earningsPeriods();
    fireEvent.click(await screen.findByRole("checkbox", { name: moduleName("CP-2E") }));
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const leave = await screen.findByRole("button", { name: /^Leave out / });
    expect(leave).toHaveAccessibleName("Leave out Earnings quality");
    expect(screen.queryByText(/Cash flow model/)).toBeNull();
    fireEvent.click(leave);
    fireEvent.click(await screen.findByRole("button", { name: "Review run" }));
    await screen.findByText("Left out: Earnings quality, Rates, FX & hedging");
    expect(summaryBodies(fetchMock).at(-1)?.modules).toEqual([
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1A",
      "CP-1B",
      "CP-DR",
      "CP-5",
    ]);
  });

  it("R7 a prior run's page list carries over as the page list", () => {
    const pathway = "relative_value";
    const prior = {
      issuer_id: "x",
      issuer_name: "X",
      context: { ...context, run: { ...context.run, pathway } },
      files: [],
      level: "advanced",
      modules: pathwayModules(pathway).filter((code) => code !== "CP-3D"),
      max_turns: 32,
    };
    expect(carriedModules(prior as never)).toEqual(
      pathwayModules(pathway).filter((code) => code !== "CP-3D"),
    );
    expect(carriedModules({ ...prior, modules: ["CP-NOPE"] })).toEqual([]);
  });

  it("S8 the review sheet counts and lists the service's plan without CP-MODEL", async () => {
    testingFetch({
      ...plan,
      cap: "20",
      modules: ["CP-0", "CP-1", "CP-1A", "CP-1B", "CP-DR", "CP-2E", "CP-MODEL", "CP-1D", "CP-5"],
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: /Earnings Update/ }));
    advanceToContext();
    earningsPeriods();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    fireEvent.click(screen.getByText("Everything Submit sends"));
    expect(screen.getByText("Modules (8)")).toBeVisible();
    expect(screen.queryByText(/Cash flow model/)).toBeNull();
  });

  it("L1 a carried list holding no drawn module carries nothing", () => {
    const prior = {
      issuer_id: "x",
      issuer_name: "X",
      context: { ...context, run: { ...context.run, pathway: "credit_snapshot" } },
      files: [],
      level: "advanced",
      modules: ["CP-MODEL"],
      max_turns: 32,
    };
    expect(carriedModules(prior as never)).toEqual([]);
  });

  it("S7 a carried list gains CP-MODEL only where the carried pathway's preset holds it", () => {
    const prior = (pathway: string, modules: string[]) =>
      ({
        issuer_id: "x",
        issuer_name: "X",
        context: { ...context, run: { ...context.run, pathway } },
        files: [],
        level: "advanced",
        modules,
        max_turns: 32,
      }) as never;
    expect(carriedModules(prior("credit_snapshot", ["CP-0"]))).toEqual(["CP-0", "CP-MODEL"]);
    expect(carriedModules(prior("lite_credit_assessment", ["CP-0", "CP-1"]))).toEqual([
      "CP-0",
      "CP-1",
    ]);
    expect(carriedModules(prior("relative_value", ["CP-0", "CP-1A"]))).toEqual([]);
    expect(carriedModules(prior("relative_value", []))).toEqual([]);
  });

  it.each([
    "Earnings Update",
    "Relative Value",
    "Portfolio Decision",
    "Full credit assessment",
    "Deep credit assessment",
  ])("S3 %s draws no Cash flow model checkbox", async (name) => {
    testingFetch({ ...plan, cap: "20" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(name) }));
    chooseControl("Run form level", "advanced");
    advanceToContext();
    if (name === "Earnings Update") earningsPeriods();
    expect(screen.queryByRole("checkbox", { name: "Cash flow model" })).toBeNull();
    if (name === "Relative Value" || name === "Portfolio Decision") {
      expect(screen.queryByRole("checkbox", { name: "Business & governance" })).toBeNull();
    }
    fireEvent.click(await screen.findByRole("button", { name: "Add research question" }));
    const focus = await screen.findByLabelText("Focus module");
    expect(within(focus).queryByText("Cash flow model")).toBeNull();
  });

  it("S4 the pathway cards count the modules without CP-MODEL", async () => {
    testingFetch({ ...plan, cap: "20" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    const counts: Record<string, string> = {
      "Deep credit assessment": "20 base modules",
      "Relative Value": "11 base modules",
      "Portfolio Decision": "8 base modules",
      "Full credit assessment": "17 base modules",
      "Earnings Update": "8 base modules",
      "Lite credit assessment": "9 base modules",
    };
    for (const [name, text] of Object.entries(counts)) {
      const card = screen.getByRole("radio", { name: new RegExp(name) }).closest("label");
      expect(card).not.toBeNull();
      expect(within(card as HTMLElement).getByText(text, { exact: true })).toBeVisible();
    }
  });

  it("S5 the last drawn module stays ticked and the run sends it with CP-MODEL", async () => {
    const fetchMock = testingFetch({ ...plan, cap: "20" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: /Earnings Update/ }));
    chooseControl("Run form level", "advanced");
    advanceToContext();
    earningsPeriods();
    const drawn = pathwayModules("earnings_update").filter((code) => code !== "CP-MODEL");
    for (const code of drawn.slice(1)) {
      fireEvent.click(await screen.findByRole("checkbox", { name: moduleName(code) }));
    }
    const [first] = drawn;
    const last = await screen.findByRole("checkbox", { name: moduleName(first ?? "") });
    expect(last).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    expect(summaryBodies(fetchMock)[0]?.modules).toEqual([first, "CP-MODEL"]);
  });
});

describe("connected run start: the analyst note's refusal", () => {
  const PIPE =
    "contains a pipe character, a line feed or a carriage return, which a dossier table cell cannot hold.";
  const noteLine = `Anything the analysis should know: ${PIPE}`;

  async function refused(error: string, rows = false) {
    testingFetch({ ...plan, digest: "", error });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    if (rows) {
      fireEvent.click(await screen.findByRole("button", { name: "Add research question" }));
      fireEvent.change(await screen.findByLabelText("Question"), {
        target: { value: "How is leverage trending" },
      });
    }
    fireEvent.change(await screen.findByLabelText("Anything the analysis should know"), {
      target: { value: "Leverage | coverage trend" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  }

  it("R8 goes to the note box, not to a question row", async () => {
    await refused(`research_questions[0].text: ${PIPE}`);
    const note = screen.getByLabelText("Anything the analysis should know");
    await waitFor(() => {
      expect(note).toHaveFocus();
    });
    expect(note).toHaveAttribute("aria-invalid", "true");
    expect(note).toHaveAccessibleDescription(noteLine);
    expect(
      await screen.findByRole("button", { name: `1 problem to fix: ${noteLine}` }),
    ).toBeTruthy();
    const editor = document.querySelector('[data-field="research_questions"]');
    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(editor).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText(/Question 1/)).toBeNull();
  });

  it("R11 editing the note clears its problem", async () => {
    await refused(`research_questions[0].text: ${PIPE}`);
    const note = screen.getByLabelText("Anything the analysis should know");
    await waitFor(() => {
      expect(note).toHaveAttribute("aria-invalid", "true");
    });
    fireEvent.change(note, { target: { value: "Leverage and coverage trend" } });
    expect(note).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(noteLine)).toBeNull();
  });

  it("R9 a problem on a held question row stays on the editor; the next index is the note's", async () => {
    await refused(`research_questions[0].text: ${PIPE}`, true);
    const add = await screen.findByRole("button", { name: "Add research question" });
    await waitFor(() => {
      expect(add).toHaveFocus();
    });
    expect(add).toHaveAccessibleDescription(expect.stringContaining("Question 1"));
    cleanup();
    vi.unstubAllGlobals();
    await refused(`research_questions[1].text: ${PIPE}`, true);
    const note = screen.getByLabelText("Anything the analysis should know");
    await waitFor(() => {
      expect(note).toHaveFocus();
    });
    expect(note).toHaveAccessibleDescription(noteLine);
  });
});

describe("connected run start: the review sheet shows every input Submit sends", () => {
  // The shape of the service's own template (cases/context/research-minimal.json): every part of
  // the context, so each part is sent. The short template above carries only run and identity.
  const fullTemplate = {
    schema: "context/1",
    run: { ...context.run, run_type: "research", current_period: "", prior_period: "" },
    identity: {
      issuer_name: "",
      issuer_id: "",
      borrower_name: "",
      parent_name: "",
      guarantors: [],
      aliases: [],
      listed_equity: false,
      ticker: "",
      sector: "",
      country: "",
      sponsor: "",
    },
    deal_terms: [],
    quotes: [],
    ratings: [],
    valuation: {
      peer_source: "cp_dr_public",
      basis: "auto",
      issuer_market: {
        market_cap_m: "",
        net_debt_m: "",
        ev_m: "",
        ebitda_basis: "LTM",
        as_of: "",
        source: "",
      },
      peers: [],
      precedents: [],
      user_multiple: { value: "", basis: "LTM", rationale: "" },
    },
    assumptions: { cp2a: null, cp2d: null, cp2e: null, cp3c: null, cp3d: null, cp4c: null },
    attachments: {
      portfolio_workbook: false,
      prior_case: false,
      management_bridge: false,
      legal_documents: "executed",
    },
    research_questions: [],
  };
  const NOTE = "Compare the covenant package with the last amendment.";
  const QUESTION = "How much of 2025 adjusted EBITDA is run-rate cost savings?";

  type Steps = {
    documents?: () => void;
    purpose?: () => void;
    more?: () => void;
    advanced?: boolean;
    template?: Record<string, unknown>;
    summary?: Parameters<typeof testingFetch>[0];
  };

  /** Fills the start page, applies each step's own inputs, and opens the review. */
  async function sheetAfter(steps: Steps = {}) {
    const { template = fullTemplate, summary = plan } = steps;
    const fetchMock = testingFetch(summary, undefined, {
      "/connected/context": { ...template, submission_caps_usd: submissionCaps },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    steps.documents?.();
    await advanceToPurpose();
    if (steps.advanced) chooseControl("Run form level", "advanced");
    steps.purpose?.();
    advanceToContext();
    steps.more?.();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    return { sheet: screen.getByRole("region", { name: "What will run" }), fetchMock };
  }

  function pick(name: string, value: string, scope: HTMLElement = document.body) {
    fireEvent.change(within(scope).getByLabelText(name), { target: { value } });
  }
  const region = (name: string) => screen.getByRole("region", { name });
  function addRow(section: string, button: string, values: Record<string, string>) {
    fireEvent.click(within(region(section)).getByRole("button", { name: button }));
    for (const [name, value] of Object.entries(values)) pick(name, value, region(section));
  }
  /** The values the sheet shows beside `label` inside `scope`, in order. */
  const shown = (scope: HTMLElement, label: string) =>
    within(scope)
      .queryAllByText(label, { selector: "dt" })
      .map((term) => term.nextElementSibling?.textContent);
  const part = (scope: HTMLElement, name: string) => within(scope).getByRole("group", { name });

  const describeIssuer = () => {
    pick("Borrower (legal entity)", "Northbridge Holdings LLC");
    pick("Parent", "Northbridge Group plc");
    pick("Sector", "Industrials");
    pick("Country", "United States");
    pick("Sponsor", "Harbour Peak Capital");
    pick("Other names in the filings", "Northbridge\nNBG Holdings");
    pick("Guarantors", "Northbridge Operations Ltd");
    fireEvent.click(screen.getByRole("checkbox", { name: "Listed equity" }));
    pick("Ticker", "NBG");
  };
  const addFacility = (extra: Record<string, string> = {}) => {
    addRow("Facilities and deal terms", "Add facility", {
      "Facility ID": "tlb-2031",
      Instrument: "Term loan B",
      Currency: "USD",
      "Size (m)": "1250",
      "Floor (%)": "0.50",
      "As-of": "2026-10-01",
      Provider: "Lead arranger",
      ...extra,
    });
  };
  const addQuoteRatingQuestion = () => {
    addRow("Observed quotes", "Add quote", {
      "Facility ID": "tlb-2031",
      Bid: "98.50",
      "As-of": "2026-10-20",
      Provider: "Dealer run",
    });
    addRow("Ratings", "Add rating", { Agency: "S&P", Rating: "B+", Outlook: "Stable" });
    addRow("Research questions", "Add research question", {
      Question: QUESTION,
      "Focus module": "CP-2",
    });
    pick("Anything the analysis should know", NOTE);
  };
  const peerFiguresAndOwnMultiple = () => {
    pick("Peer source", "user_comps");
    addRow("Peers", "Add peer", {
      Name: "Harbour Industrial",
      Ticker: "HBI",
      "EV (m)": "4200",
      "EBITDA (m)": "520",
      Source: "Company filings",
    });
    pick("Valuation basis", "user_multiple");
    pick("Multiple (x)", "8.5", region("Your own multiple"));
    pick("Multiple basis", "NTM", region("Your own multiple"));
    pick("Rationale", "Sector median less a size discount", region("Your own multiple"));
  };
  const chooseModuleOptions = () => {
    pick("Relative value mode", "clo_screening");
    fireEvent.click(screen.getByRole("checkbox", { name: "Deep Debate" }));
  };
  const pinDownsideAndRates = () => {
    fireEvent.click(screen.getByRole("checkbox", { name: "Pin Downside" }));
    pick("EBITDA decline (%)", "20", region("Downside"));
    pick("Interest increase (%)", "15", region("Downside"));
    pick("Rationale", "Committee stress cases", region("Downside"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Pin Rates, FX & hedging" }));
    pick("Rate shocks (bps)", "100, 200", region("Rates, FX & hedging"));
    pick("FX shocks (%)", "10", region("Rates, FX & hedging"));
    pick("Rationale", "House scenarios", region("Rates, FX & hedging"));
  };
  const chooseAttachments = () => {
    pick("Legal documents", "draft");
    pick("The agreement", file.name);
    pick("Management EBITDA bridge", file.name);
  };

  it("V1 keeps the inputs it showed before: issuer, as-of date, analyst, pathway, case kind, cutoff", async () => {
    const { sheet } = await sheetAfter({
      purpose: () => {
        chooseControl("Case kind", "private");
      },
      more: () => {
        pick("Research cutoff", "2026-09-30");
      },
    });
    const issuer = part(sheet, "Issuer and documents");
    expect(shown(issuer, "Issuer")).toEqual(["Synthetic Générale"]);
    expect(shown(issuer, "As-of date")).toEqual(["2026-10-31"]);
    expect(shown(issuer, "Submitted by")).toEqual(["Ana L"]);
    const purpose = part(sheet, "Purpose and modules");
    expect(shown(purpose, "Pathway")).toEqual(["Full credit assessment"]);
    expect(shown(purpose, "Case kind")).toEqual(["Private"]);
    expect(shown(part(sheet, "Context"), "Research cutoff")).toEqual(["2026-09-30"]);
  });

  it("V2 shows the issuer ID and the issue classification", async () => {
    const { sheet } = await sheetAfter({
      documents: () => {
        pick("Issuer ID", "synthetic-generale-sa");
        pick("Issue classification", "high_yield");
      },
    });
    const issuer = part(sheet, "Issuer and documents");
    expect(shown(issuer, "Issuer ID")).toEqual(["synthetic-generale-sa"]);
    expect(shown(issuer, "Issue classification")).toEqual(["High yield"]);
  });

  it("V3 reads an issue classification left unchosen as not given", async () => {
    const { sheet } = await sheetAfter();
    expect(shown(part(sheet, "Issuer and documents"), "Issue classification")).toEqual([
      "Not given",
    ]);
  });

  it("V4 shows the run purpose, the form level, and the model, effort and turns below Advanced", async () => {
    const { sheet } = await sheetAfter({
      purpose: () => {
        chooseControl("Market view", "secondary");
      },
    });
    const purpose = part(sheet, "Purpose and modules");
    expect(shown(purpose, "Market view")).toEqual(["Trading (secondary)"]);
    expect(shown(purpose, "Form level")).toEqual(["Basic"]);
    const advanced = part(sheet, "Advanced choices");
    expect(shown(advanced, "Model and effort")).toEqual(["GPT Sol · Balanced"]);
    expect(shown(advanced, "Turns per module")).toEqual(["32"]);
    expect(advanced).toHaveTextContent("Model and effort are set at the Advanced form level.");
  });

  it("V5 reads a purpose the context does not carry as not given", async () => {
    const { sheet } = await sheetAfter({ template: context });
    expect(shown(part(sheet, "Purpose and modules"), "Market view")).toEqual(["Not given"]);
  });

  it("V6 shows the Advanced model, effort and turns as chosen, with no fixed note", async () => {
    const { sheet } = await sheetAfter({
      advanced: true,
      summary: { ...plan, model: "claude", effort: "high" },
      more: () => {
        pick("Model", "claude");
        pick("Reasoning effort", "high");
        pick("Turns per module", "48");
      },
    });
    expect(shown(part(sheet, "Purpose and modules"), "Form level")).toEqual(["Advanced"]);
    const advanced = part(sheet, "Advanced choices");
    expect(shown(advanced, "Model and effort")).toEqual(["Claude Opus · High"]);
    expect(shown(advanced, "Turns per module")).toEqual(["48"]);
    expect(advanced).not.toHaveTextContent("Model and effort are set at the Advanced form level.");
  });

  it("V7 shows the periods, and a blank period as not given, never 0", async () => {
    const { sheet } = await sheetAfter({
      more: () => {
        pick("Current period", "q3-2026");
      },
    });
    const more = part(sheet, "Context");
    expect(shown(more, "Current period")).toEqual(["q3-2026"]);
    expect(shown(more, "Prior period")).toEqual(["Not given"]);
  });

  it("V8 shows the legal documents and, for each attachment among the documents, its file", async () => {
    const { sheet } = await sheetAfter({ advanced: true, more: chooseAttachments });
    const more = part(sheet, "Context");
    expect(shown(more, "Legal documents")).toEqual(["Draft agreement"]);
    // The page holds the file the analyst chose for the box, and names it (coordinator, round 3).
    expect(shown(more, "Management EBITDA bridge")).toEqual([file.name]);
    expect(shown(more, "Portfolio workbook")).toEqual(["Not given"]);
    expect(shown(more, "Prior decision record")).toEqual(["Not given"]);
  });

  it("V9 reads attachments the context does not carry as not given", async () => {
    const { sheet } = await sheetAfter({ template: context });
    const more = part(sheet, "Context");
    expect(shown(more, "Legal documents")).toEqual(["Not given"]);
    expect(shown(more, "Management EBITDA bridge")).toEqual(["Not given"]);
  });

  it("V10 shows each Issuer details box by its label", async () => {
    const { sheet } = await sheetAfter({ more: describeIssuer });
    const details = part(sheet, "Issuer details");
    expect(shown(details, "Borrower (legal entity)")).toEqual(["Northbridge Holdings LLC"]);
    expect(shown(details, "Parent")).toEqual(["Northbridge Group plc"]);
    expect(shown(details, "Sector")).toEqual(["Industrials"]);
    expect(shown(details, "Country")).toEqual(["United States"]);
    expect(shown(details, "Sponsor")).toEqual(["Harbour Peak Capital"]);
    expect(shown(details, "Other names in the filings")).toEqual(["Northbridge, NBG Holdings"]);
    expect(shown(details, "Guarantors")).toEqual(["Northbridge Operations Ltd"]);
    expect(shown(details, "Listed equity")).toEqual(["Yes"]);
    expect(shown(details, "Ticker")).toEqual(["NBG"]);
  });

  it("V11 reads blank Issuer details as not given, and an unlisted issuer as No with no ticker", async () => {
    const { sheet } = await sheetAfter();
    const details = part(sheet, "Issuer details");
    expect(shown(details, "Sector")).toEqual(["Not given"]);
    expect(shown(details, "Guarantors")).toEqual(["Not given"]);
    expect(shown(details, "Listed equity")).toEqual(["No"]);
    expect(shown(details, "Ticker")).toEqual([]);
  });

  it("V12 shows each facility box, a blank box as not given, and no new-issue box", async () => {
    const { sheet } = await sheetAfter({
      more: () => {
        addFacility();
      },
    });
    const facility = part(part(sheet, "Context details"), "Facility 1");
    expect(shown(facility, "Facility ID")).toEqual(["tlb-2031"]);
    expect(shown(facility, "Instrument")).toEqual(["Term loan B"]);
    expect(shown(facility, "Currency")).toEqual(["USD"]);
    expect(shown(facility, "Size (m)")).toEqual(["1250"]);
    expect(shown(facility, "Floor (%)")).toEqual(["0.50"]);
    expect(shown(facility, "Coupon (%)")).toEqual(["Not given"]);
    expect(shown(facility, "Maturity")).toEqual(["Not given"]);
    expect(shown(facility, "As-of")).toEqual(["2026-10-01"]);
    expect(shown(facility, "Provider")).toEqual(["Lead arranger"]);
    expect(shown(facility, "Tenor (years)")).toEqual([]);
  });

  it("V13 shows a new issue's tenor and pricing talk", async () => {
    const { sheet } = await sheetAfter({
      purpose: () => {
        chooseControl("Market view", "primary");
      },
      more: () => {
        addFacility({
          "Tenor (years)": "7",
          "Talk spread low (bps)": "325",
          "Talk spread high (bps)": "350",
        });
      },
    });
    const facility = part(part(sheet, "Context details"), "Facility 1");
    expect(shown(facility, "Tenor (years)")).toEqual(["7"]);
    expect(shown(facility, "Talk spread low (bps)")).toEqual(["325"]);
    expect(shown(facility, "Talk spread high (bps)")).toEqual(["350"]);
    expect(shown(facility, "Talk OID low")).toEqual(["Not given"]);
  });

  it("V14 shows each quote, rating and research question, the note among the questions", async () => {
    const { sheet } = await sheetAfter({ more: addQuoteRatingQuestion });
    const details = part(sheet, "Context details");
    const quote = part(details, "Quote 1");
    expect(shown(quote, "Facility ID")).toEqual(["tlb-2031"]);
    expect(shown(quote, "Kind")).toEqual(["Observed"]);
    expect(shown(quote, "Bid")).toEqual(["98.50"]);
    expect(shown(quote, "Ask")).toEqual(["Not given"]);
    expect(shown(quote, "As-of")).toEqual(["2026-10-20"]);
    expect(shown(quote, "Provider")).toEqual(["Dealer run"]);
    const rating = part(details, "Rating 1");
    expect(shown(rating, "Agency")).toEqual(["S&P"]);
    expect(shown(rating, "Scope")).toEqual(["Issuer"]);
    expect(shown(rating, "Rating")).toEqual(["B+"]);
    expect(shown(rating, "Outlook")).toEqual(["Stable"]);
    expect(shown(rating, "As-of")).toEqual(["Not given"]);
    const question = part(details, "Question 1");
    expect(shown(question, "Question")).toEqual([QUESTION]);
    expect(shown(question, "Focus module")).toEqual(["Fundamental credit"]);
    const note = part(details, "Question 2");
    expect(shown(note, "Question")).toEqual([NOTE]);
    expect(shown(note, "Focus module")).toEqual(["Any"]);
  });

  it("V15 reads a row section with no rows as not given", async () => {
    const { sheet } = await sheetAfter();
    // A block whose every input is not given is one line that names each of them.
    expect(part(sheet, "Context details")).toHaveTextContent(
      "Context detailsNot given: Facilities and deal terms, Observed quotes, Ratings, Research questions",
    );
  });

  it("V16 shows the valuation the template sends at the Basic level", async () => {
    const { sheet } = await sheetAfter();
    const valuation = part(sheet, "Valuation and peers");
    expect(shown(valuation, "Peer source")).toEqual(["Research finds public peers (default)"]);
    expect(shown(valuation, "Valuation basis")).toEqual(["Automatic"]);
    expect(within(valuation).queryByRole("group", { name: "Peers" })).toBeNull();
  });

  it("V17 shows peer figures and the analyst's own multiple", async () => {
    const { sheet } = await sheetAfter({ advanced: true, more: peerFiguresAndOwnMultiple });
    const valuation = part(sheet, "Valuation and peers");
    expect(shown(valuation, "Peer source")).toEqual(["I'll give peer figures"]);
    expect(shown(valuation, "Valuation basis")).toEqual(["My own multiple"]);
    const peer = part(part(valuation, "Peers"), "Peer 1");
    expect(shown(peer, "Name")).toEqual(["Harbour Industrial"]);
    expect(shown(peer, "Ticker")).toEqual(["HBI"]);
    expect(shown(peer, "EV (m)")).toEqual(["4200"]);
    expect(shown(peer, "EBITDA (m)")).toEqual(["520"]);
    expect(shown(peer, "As-of")).toEqual(["Not given"]);
    expect(shown(peer, "Source")).toEqual(["Company filings"]);
    const multiple = part(valuation, "Your own multiple");
    expect(shown(multiple, "Multiple (x)")).toEqual(["8.5"]);
    expect(shown(multiple, "Multiple basis")).toEqual(["NTM (next twelve months)"]);
    expect(shown(multiple, "Rationale")).toEqual(["Sector median less a size discount"]);
  });

  it("V18 shows a named peer list by name and ticker only, and each precedent", async () => {
    const { sheet } = await sheetAfter({
      advanced: true,
      more: () => {
        pick("Peer source", "user_list");
        addRow("Peers", "Add peer", { Name: "Harbour Industrial", Ticker: "HBI" });
        pick("Valuation basis", "precedents");
        addRow("Precedents", "Add precedent", {
          Target: "Northgate Tools",
          Date: "2025-06-30",
          "EV (m)": "2400",
          "EBITDA (m)": "300",
          Source: "Press release",
        });
      },
    });
    const valuation = part(sheet, "Valuation and peers");
    expect(shown(valuation, "Peer source")).toEqual(["I'll name the peers"]);
    expect(shown(valuation, "Valuation basis")).toEqual(["Precedents"]);
    const peer = part(part(valuation, "Peers"), "Peer 1");
    expect(shown(peer, "Name")).toEqual(["Harbour Industrial"]);
    expect(shown(peer, "Ticker")).toEqual(["HBI"]);
    expect(shown(peer, "EV (m)")).toEqual([]);
    const precedent = part(part(valuation, "Precedents"), "Precedent 1");
    expect(shown(precedent, "Target")).toEqual(["Northgate Tools"]);
    expect(shown(precedent, "Acquirer")).toEqual(["Not given"]);
    expect(shown(precedent, "Date")).toEqual(["2025-06-30"]);
    expect(shown(precedent, "EV (m)")).toEqual(["2400"]);
    expect(shown(precedent, "EBITDA (m)")).toEqual(["300"]);
    expect(shown(precedent, "Source")).toEqual(["Press release"]);
  });

  it("V19 shows the issuer's market values", async () => {
    const { sheet } = await sheetAfter({
      advanced: true,
      more: () => {
        pick("Valuation basis", "issuer_trading");
        pick("Market cap (m)", "3100");
        pick("Net debt (m)", "1900");
        pick("Market data as-of", "2026-10-30");
        pick("Market data source", "Exchange close");
      },
    });
    const valuation = part(sheet, "Valuation and peers");
    expect(shown(valuation, "Valuation basis")).toEqual(["Issuer's own trading multiple"]);
    const market = part(valuation, "Issuer market values");
    expect(shown(market, "Market cap (m)")).toEqual(["3100"]);
    expect(shown(market, "Net debt (m)")).toEqual(["1900"]);
    expect(shown(market, "Enterprise value (m)")).toEqual(["Not given"]);
    expect(shown(market, "EBITDA basis")).toEqual(["LTM (last twelve months)"]);
    expect(shown(market, "Market data as-of")).toEqual(["2026-10-30"]);
    expect(shown(market, "Market data source")).toEqual(["Exchange close"]);
  });

  it("V20 reads a valuation the context does not carry as not given", async () => {
    const { sheet } = await sheetAfter({ template: context, advanced: true });
    expect(part(sheet, "Valuation and peers")).toHaveTextContent("Not given");
  });

  it("V21 shows the module options by their labels", async () => {
    const { sheet } = await sheetAfter({ advanced: true, more: chooseModuleOptions });
    const options = part(sheet, "Module options");
    expect(shown(options, "Relative value mode")).toEqual(["CLO Screening"]);
    expect(shown(options, "Deep Debate")).toEqual(["On"]);
  });

  it("V22 shows module options a carried context sends, even below Advanced", async () => {
    const { sheet } = await sheetAfter({
      template: { ...fullTemplate, module_options: { cp3_mode: "", cp6_deep_debate: false } },
    });
    const options = part(sheet, "Module options");
    expect(shown(options, "Relative value mode")).toEqual(["Let the module decide (default)"]);
    expect(shown(options, "Deep Debate")).toEqual(["Off"]);
  });

  it("V23 reads unsent module options as not given at Advanced, and leaves them out below it", async () => {
    const { sheet } = await sheetAfter({ advanced: true });
    const options = part(sheet, "Module options");
    expect(within(options).getByText("Not given")).toBeInTheDocument();
    expect(shown(options, "Relative value mode")).toEqual([]);
    cleanup();
    vi.unstubAllGlobals();
    const basic = await sheetAfter();
    expect(within(basic.sheet).queryByRole("group", { name: "Module options" })).toBeNull();
  });

  it("V24 shows each pinned assumption by module name, and an unpinned one as not given", async () => {
    const { sheet } = await sheetAfter({ advanced: true, more: pinDownsideAndRates });
    const assumptions = part(sheet, "Scenario assumptions");
    const downside = part(assumptions, "Downside");
    expect(shown(downside, "Rationale")).toEqual(["Committee stress cases"]);
    const scenario = part(downside, "Scenario 1");
    expect(shown(scenario, "EBITDA decline (%)")).toEqual(["20"]);
    expect(shown(scenario, "Interest increase (%)")).toEqual(["15"]);
    const rates = part(assumptions, "Rates, FX & hedging");
    expect(shown(rates, "Rate shocks (bps)")).toEqual(["100, 200"]);
    expect(shown(rates, "FX shocks (%)")).toEqual(["10"]);
    expect(shown(rates, "Hedge ratio (%)")).toEqual(["Not given"]);
    expect(shown(rates, "Rationale")).toEqual(["House scenarios"]);
    expect(part(assumptions, "Liquidity")).toHaveTextContent("LiquidityNot given");
    expect(part(assumptions, "Refinancing & LME")).toHaveTextContent("Not given");
    expect(within(assumptions).queryByRole("group", { name: "Recovery & fulcrum" })).toBeNull();
  });

  it("V25 shows a pin a carried context holds for a module this pathway does not run", async () => {
    const { sheet } = await sheetAfter({
      template: {
        ...fullTemplate,
        assumptions: {
          ...fullTemplate.assumptions,
          cp4c: { ev_multiple: "6.5", rationale: "Distressed comps" },
        },
      },
    });
    const recovery = part(part(sheet, "Scenario assumptions"), "Recovery & fulcrum");
    expect(shown(recovery, "EV multiple")).toEqual(["6.5"]);
    expect(shown(recovery, "Rationale")).toEqual(["Distressed comps"]);
  });

  it("V26 shows the modules by name, the left-out ones, and never the forecast", async () => {
    const run = pathwayModules("credit_snapshot").filter((code) => code !== "CP-6");
    const { sheet, fetchMock } = await sheetAfter({
      advanced: true,
      summary: { ...plan, modules: run },
      more: () => {
        fireEvent.click(screen.getByRole("checkbox", { name: "Committee decision" }));
      },
    });
    expect(sentSummary(fetchMock)).toMatchObject({ modules: run });
    const purpose = part(sheet, "Purpose and modules");
    expect(within(purpose).getByRole("heading", { name: "Modules (16)" })).toBeInTheDocument();
    expect(within(purpose).getByText("Fundamental credit")).toBeInTheDocument();
    expect(purpose).toHaveTextContent("Left out: Committee decision");
    expect(purpose).not.toHaveTextContent("Cash flow model");
  });

  // Fills every group so the check covers every block: slower than the default 5 s under load.
  it("V27 shows no raw data: no braces, keys, module codes, ids or the form's version", async () => {
    const { sheet, fetchMock } = await sheetAfter({
      advanced: true,
      summary: {
        ...plan,
        modules: pathwayModules("credit_snapshot"),
        prior: { id: "20261116-083145-01", as_of: "2025-03-31", pathway: "credit_snapshot" },
        changes: "CP-8 compares with the credit_snapshot run (20261116-083145-01)",
        omitted: ["liquidity-runway"],
        omitted_titles: ["Liquidity runway"],
        items: [
          {
            id: "CP-4:declared-none",
            scope: "CP-4",
            outcome: "will_refuse",
            reason: "No agreement is chosen among the documents.",
          },
        ],
      },
      documents: () => {
        pick("Issue classification", "investment_grade");
      },
      more: () => {
        chooseAttachments();
        describeIssuer();
        addFacility();
        addQuoteRatingQuestion();
        peerFiguresAndOwnMultiple();
        chooseModuleOptions();
        pinDownsideAndRates();
      },
    });
    const sent = sentSummary(fetchMock);
    expect(sent.context.schema).toBe("context/1");
    expect(JSON.stringify(sent)).toContain("investment_grade");
    for (const shownText of [
      sheet.textContent,
      screen.getByRole("region", { name: "Limits to decide" }).textContent,
    ]) {
      expect(shownText).not.toMatch(/[{}[\]]/);
      expect(shownText).not.toMatch(/\b[a-z][a-z0-9]*_[a-z0-9_]+\b/);
      expect(shownText).not.toMatch(/\bCP-[A-Z0-9]+\b/);
      expect(shownText).not.toMatch(/20261116-083145-01|declared-none|sub-1|server-approved/);
      expect(shownText).not.toMatch(/context\/1|true|false|null|undefined|NaN/);
    }
  }, 20_000);
});

/** An earlier Northbridge run as the service describes it to a new form, and the lookups that find it. */
const earlierRun = {
  issuer_id: "northbridge",
  issuer_name: "Northbridge",
  level: "basic",
  max_turns: 32,
  modules: [],
  context: { ...context, run: { ...context.run, as_of: "" } },
  files: [{ name: file.name, size: file.size }],
};
const latestRun = {
  "/api/issuers/northbridge": { latest_run: "latest-case", runs: 1, latest_as_of: "2025-03-31" },
  "/api/runs/latest-case/inputs": earlierRun,
};

describe("connected run start: an example issuer is a hint, not a value (J2-002)", () => {
  it("opens with the issuer name and ID empty and the example as the placeholder", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    const name = await screen.findByLabelText("Issuer name");
    expect(name).toBeRequired();
    expect(name).toHaveValue("");
    expect(name).toHaveAttribute("placeholder", "e.g. Northbridge Group plc");
    const id = screen.getByLabelText("Issuer ID");
    expect(id).toBeRequired();
    expect(id).toHaveValue("");
    expect(id).toHaveAttribute("placeholder", "e.g. northbridge-group-plc");
  });
});

describe("connected run start: the case date is the analyst's to enter (J2-002, J1-015)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  const dated = (day: Date) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(day);
  };

  it("opens a new form with the as-of date empty and required, and nothing said about it", async () => {
    dated(new Date(2026, 10, 17, 12));
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    const date = await screen.findByLabelText("As-of date");
    expect(date).toBeRequired();
    expect(date).toHaveValue("");
    expect(screen.queryByText(/Set to today/)).toBeNull();
  });

  it("asks for the date before the form goes on, and takes the one entered", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Synthetic Générale" },
    });
    fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
    typeName();
    fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([path]) => path === "/api/submissions")).toBe(false);
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    await advanceToPurpose();
  });

  it("opens empty again once the analyst says it is a different issuer", async () => {
    dated(new Date(2026, 10, 17, 12));
    testingFetch(plan, undefined, latestRun);
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByText(/Using an earlier run as a starting point/);
    fireEvent.click(await screen.findByRole("button", { name: "This is a different issuer" }));
    expect(screen.getByLabelText("As-of date")).toHaveValue("");
    expect(screen.queryByText(/Set to today/)).toBeNull();
  });

  it("opens Start from this run with the as-of date empty and required, the service's blank date", async () => {
    dated(new Date(2026, 10, 17, 12));
    testingFetch(plan, undefined, { "/api/runs/earlier/inputs": earlierRun });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    expect(await screen.findByLabelText("Issuer name")).toHaveValue("Northbridge");
    const date = screen.getByLabelText("As-of date");
    expect(date).toHaveValue("");
    expect(date).toBeRequired();
    expect(screen.queryByText(/Set to today/)).toBeNull();
  });

  it("carries the latest run with the as-of date empty and required", async () => {
    dated(new Date(2026, 10, 17, 12));
    testingFetch(plan, undefined, latestRun);
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByText(/Using an earlier run as a starting point/);
    const date = screen.getByLabelText("As-of date");
    expect(date).toHaveValue("");
    expect(date).toBeRequired();
    expect(screen.queryByText(/Set to today/)).toBeNull();
  });

  it("sends the same request bodies and digest once the date is entered", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" navigate={vi.fn()} />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.change(screen.getByLabelText("Date of your newest file"), {
      target: { value: "2026-10-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const submit = await screen.findByRole("button", { name: "Submit run" });
    approve();
    await confirmSynthetic(submit);
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(true);
    });
    const bodyTo = (suffix: string) => {
      const body = fetchMock.mock.calls.find(([path]) => path.endsWith(suffix))?.[1]?.body;
      return JSON.parse(typeof body === "string" ? body : "null") as unknown;
    };
    const answers = {
      context: {
        run: {
          as_of: "2026-10-31",
          pathway: "credit_snapshot",
          case_kind: "synthetic",
          cutoff: "2026-10-31",
        },
        identity: { issuer_name: "Synthetic Générale", issuer_id: "synthetic-generale" },
      },
      modules: [],
      max_turns: 32,
      level: "basic",
      model: "gpt",
      effort: "balanced",
      submitted_by: "Ana L",
      newest_document_date: "2026-10-30",
    };
    expect(bodyTo("/summary")).toEqual(answers);
    expect(bodyTo("/submit")).toEqual({ answers, digest: "server-approved" });
  });
});

describe("connected run start: leaving the form without losing it (C2-002)", () => {
  const away = () => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };
  const settle = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

  it("gives each step its own history entry, so Back and Forward move between steps", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    window.history.back();
    expect(await screen.findByRole("heading", { name: "Documents" })).toHaveFocus();
    expect(screen.getByLabelText("Issuer name")).toHaveValue("Synthetic Générale");
    expect(screen.getByLabelText("Your name")).toHaveValue("Ana L");
    expect(screen.getByRole("list", { name: "Documents added" })).toHaveTextContent(file.name);
    window.history.forward();
    expect(await screen.findByRole("heading", { name: "Purpose" })).toBeInTheDocument();
    advanceToContext();
    expect(await screen.findByRole("heading", { name: "More context" })).toBeInTheDocument();
    window.history.back();
    expect(await screen.findByRole("heading", { name: "Purpose" })).toBeInTheDocument();
  });

  it("gives the Previous button an entry too, so Back retraces it", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    await screen.findByRole("heading", { name: "More context" });
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Purpose" });
    window.history.back();
    expect(await screen.findByRole("heading", { name: "More context" })).toBeInTheDocument();
  });

  it("returns from the review sheet to More context with the typed note kept", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    fireEvent.change(await screen.findByLabelText("Anything the analysis should know"), {
      target: { value: "Check the 2028 maturities." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("button", { name: "Submit run" });
    window.history.back();
    expect(await screen.findByRole("heading", { name: "More context" })).toBeInTheDocument();
    expect(screen.getByLabelText("Anything the analysis should know")).toHaveValue(
      "Check the 2028 maturities.",
    );
    expect(screen.queryByRole("button", { name: "Submit run" })).toBeNull();
    // Forward does not rebuild a review the page no longer holds: it stays on More context.
    window.history.forward();
    await settle();
    expect(screen.getByRole("heading", { name: "More context" })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([path]) => path.endsWith("/summary"))).toHaveLength(1);
  });

  it("passes over the entry of a review that was left by an Edit button", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    await screen.findByRole("button", { name: "Submit run" });
    fireEvent.click(screen.getByRole("button", { name: "Edit issuer and documents" }));
    await screen.findByRole("heading", { name: "Documents" });
    window.history.back();
    expect(await screen.findByRole("heading", { name: "More context" })).toBeInTheDocument();
  });

  it("does not move Forward onto a step whose documents were changed after it", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    window.history.back();
    await screen.findByRole("heading", { name: "Documents" });
    const other = new File(["more"], "More facts.html", { type: "text/html" });
    fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [other] } });
    window.history.forward();
    await settle();
    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Purpose" })).toBeNull();
  });

  it("asks before the page is left once the form holds a document or an answer, not before", async () => {
    testingFetch();
    const { unmount } = render(<ConnectedApp path="/start" mode="synthetic" />);
    await screen.findByLabelText("Issuer name");
    expect(away()).toBe(false);
    fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "Synthetic" } });
    expect(away()).toBe(true);
    fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "" } });
    expect(away()).toBe(false);
    fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
    expect(away()).toBe(true);
    unmount();
    expect(away()).toBe(false);
  });

  const carriedOver = { "/api/submissions/sub-1/carry": { carried: [file.name], kept: [] } };

  it("asks once Start from this run has carried its documents, with nothing typed", async () => {
    testingFetch(plan, undefined, { "/api/runs/earlier/inputs": earlierRun, ...carriedOver });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    await screen.findByLabelText("Issuer name");
    expect(away()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    expect(await screen.findByRole("list", { name: "Documents added" })).toHaveTextContent(
      file.name,
    );
    await screen.findByText("1 document inspected, 0 ignored.");
    expect(screen.getByLabelText("Your name")).toHaveValue("");
    expect(away()).toBe(true);
  });

  it("asks once Use inputs from latest run has carried its documents, with nothing typed", async () => {
    testingFetch(plan, undefined, { ...latestRun, ...carriedOver });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByText(/Using an earlier run as a starting point/);
    // The carry lands outside act, so the commit that shows this text still has the typed name's
    // leave warning attached; React removes it when its effects run, a task later.
    await waitFor(() => {
      expect(away()).toBe(false);
    });
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await screen.findByRole("list", { name: "Documents added" });
    await screen.findByText("1 document inspected, 0 ignored.");
    expect(away()).toBe(true);
  });

  it.each([
    ["on the Purpose step", false],
    ["on and past the Purpose step", true],
  ])(
    "asks only if a purpose was chosen, once every document was taken out again: %s",
    async (_name, chosen) => {
      let held = true;
      testingFetch(plan, undefined, {
        "/api/submissions/sub-1/reading": () =>
          Promise.resolve(
            Response.json({ documents: held ? plan.documents : [], ignored: [], error: "" }),
          ),
      });
      render(<ConnectedApp path="/start" mode="synthetic" />);
      await fillInputs();
      await advanceToPurpose();
      if (chosen) advanceToContext();
      fireEvent.click(await screen.findByRole("button", { name: "Go back to Documents" }));
      held = false;
      fireEvent.click(await screen.findByRole("button", { name: `Remove ${file.name}` }));
      await screen.findByText("No documents yet.");
      fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "" } });
      fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "" } });
      fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "" } });
      expect(away()).toBe(chosen);
    },
  );

  it("does not ask once Submit has started the run, and makes no second draft", async () => {
    const fetchMock = testingFetch();
    let askedAtNavigation: boolean | undefined;
    const navigate = vi.fn(() => {
      askedAtNavigation = away();
    });
    render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
    await review();
    const submit = await screen.findByRole("button", { name: "Submit run" });
    approve();
    expect(away()).toBe(true);
    await confirmSynthetic(submit);
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/test-run");
    });
    expect(askedAtNavigation).toBe(false);
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/submissions")).toHaveLength(1);
  });

  it("sends the same answers and digest after Back and a second review", async () => {
    const fetchMock = testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" navigate={vi.fn()} />);
    await review();
    await screen.findByRole("button", { name: "Submit run" });
    window.history.back();
    await screen.findByRole("heading", { name: "More context" });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const submit = await screen.findByRole("button", { name: "Submit run" });
    approve();
    await confirmSynthetic(submit);
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(true);
    });
    const sent = fetchMock.mock.calls.find(([path]) => path.endsWith("/submit"))?.[1]?.body;
    expect(JSON.parse(typeof sent === "string" ? sent : "null")).toMatchObject({
      digest: plan.digest,
      answers: {
        submitted_by: "Ana L",
        context: {
          identity: { issuer_name: "Synthetic Générale", issuer_id: "synthetic-generale" },
        },
      },
    });
  });
});

describe("connected run start: carrying an earlier run keeps what it recorded (C2-003)", () => {
  const recorded = (attachments?: Record<string, unknown>) => ({
    issuer_id: "northbridge",
    issuer_name: "Northbridge",
    level: "basic",
    max_turns: 32,
    modules: [],
    context: { ...context, run: { ...context.run, as_of: "" }, attachments },
    files: [{ name: file.name, size: file.size }],
  });
  const roles = {
    legal_documents: "executed",
    portfolio_workbook: true,
    management_bridge: false,
    prior_case: false,
  };
  const carried = { carried: [file.name], kept: [] as string[] };
  const latest = {
    "/api/issuers/northbridge": { latest_run: "latest-case", runs: 1, latest_as_of: "2025-03-31" },
    "/api/submissions/sub-1/carry": carried,
  };

  async function contextStepFrom(inputs: object) {
    const fetchMock = testingFetch(plan, undefined, {
      "/api/runs/earlier/inputs": inputs,
      "/api/submissions/sub-1/carry": carried,
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    await screen.findByLabelText("Issuer name");
    typeDate();
    typeName();
    await advanceToPurpose();
    advanceToContext();
    await screen.findByRole("heading", { name: "More context" });
    return fetchMock;
  }

  it("opens the Legal documents choice the earlier run recorded and asks for the file again", async () => {
    const fetchMock = await contextStepFrom(recorded(roles));
    expect(screen.getByLabelText("Legal documents")).toHaveValue("executed");
    expect(screen.getByLabelText("The agreement")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose the uploaded file that is the agreement.",
    );
    expect(fetchMock.mock.calls.some(([path]) => path.endsWith("/summary"))).toBe(false);
  });

  it("says which file choices the earlier run did not record, and only those it had", async () => {
    testingFetch(plan, undefined, { "/api/runs/earlier/inputs": recorded(roles) });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    expect(await screen.findByText(/Using an earlier run as a starting point/)).toHaveTextContent(
      "Using an earlier run as a starting point. Review the answers, enter the new dates, and inspect any documents available to reuse. " +
        "The earlier run didn’t record the files chosen for the agreement and the portfolio workbook. Choose them again in More context.",
    );
    cleanup();
    vi.unstubAllGlobals();
    testingFetch(plan, undefined, {
      "/api/runs/earlier/inputs": recorded({
        ...roles,
        legal_documents: "none",
        portfolio_workbook: false,
      }),
    });
    render(<ConnectedApp path="/start" search="?from=earlier" mode="synthetic" />);
    expect(
      await screen.findByText(/Using an earlier run as a starting point/),
    ).not.toHaveTextContent("didn’t record");
  });

  it.each([
    ["no attachments recorded", undefined, "none"],
    ["a choice the page does not offer", { ...roles, legal_documents: "signed" }, "none"],
    ["a draft agreement", { ...roles, legal_documents: "draft" }, "draft"],
  ])("applies only what was recorded: %s", async (_name, attachments, expected) => {
    await contextStepFrom(recorded(attachments));
    expect(screen.getByLabelText("Legal documents")).toHaveValue(expected);
    expect(screen.queryByLabelText("The agreement") === null).toBe(expected === "none");
  });

  it("applies the recorded choice when the latest run is carried by the button, and not after a different issuer", async () => {
    testingFetch(plan, undefined, { ...latest, "/api/runs/latest-case/inputs": recorded(roles) });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name"), {
      target: { value: "Northbridge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    await screen.findByText(/Using an earlier run as a starting point/);
    typeDate();
    typeName();
    await advanceToPurpose();
    advanceToContext();
    await screen.findByRole("heading", { name: "More context" });
    expect(screen.getByLabelText("Legal documents")).toHaveValue("executed");
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(await screen.findByRole("button", { name: "This is a different issuer" }));
    fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "Other Issuer" } });
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
    fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
    await advanceToPurpose();
    advanceToContext();
    await screen.findByRole("heading", { name: "More context" });
    expect(screen.getByLabelText("Legal documents")).toHaveValue("none");
  });
});

describe("T08: run options, Submit failures and required periods", () => {
  it("says the run options could not be loaded in a fixed sentence with Try again, and no intro (C2-004)", async () => {
    let calls = 0;
    testingFetch(plan, undefined, {
      "/connected/context": () => {
        calls += 1;
        return Promise.resolve(
          calls === 1
            ? Response.json({ error: "boom: internal" }, { status: 500 })
            : Response.json({ ...context, submission_caps_usd: submissionCaps }),
        );
      },
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The run options could not be loaded");
    expect(alert).not.toHaveTextContent("boom");
    expect(screen.queryByRole("heading", { name: "Documents" })).toBeNull();
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText("Issuer name")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
  });

  it("draws a skeleton, not a sentence, while the run options load (C2-004)", () => {
    testingFetch(plan, undefined, { "/connected/context": () => new Promise<Response>(() => {}) });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    expect(screen.queryByText("Loading run options…")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Documents" })).toBeNull();
    expect(screen.getByRole("status", { name: "Loading run options" })).toBeInTheDocument();
  });

  it.each([
    [
      400,
      "documents or answers changed after approval",
      "Documents or answers changed after approval.",
    ],
    [
      404,
      "unknown submission",
      "This draft is unavailable and may have expired. Your answers and selected documents are still here. Continue the form or review the run again to create a new draft and re-upload the documents.",
    ],
  ])(
    "writes a refused Submit (%i) as capitalised sentences (C2-006)",
    async (status, error, text) => {
      testingFetch(plan, Response.json({ error }, { status }));
      render(<ConnectedApp path="/start" mode="synthetic" />);
      await review();
      const submit = await screen.findByRole("button", { name: "Submit run" });
      approve();
      await confirmSynthetic(submit);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        `${text} Review the run again before submitting.`,
      );
    },
  );

  it("draws a lost Submit beside the Submit button and does not claim nothing was started (J2-013, C2-006)", async () => {
    testingFetch(plan, () => {
      throw new TypeError("Failed to fetch");
    });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await review();
    const submit = await screen.findByRole("button", { name: "Submit run" });
    approve();
    await confirmSynthetic(submit);
    const alert = await screen.findByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert.nextElementSibling).toContainElement(submit);
    expect(alert).toHaveTextContent(
      "The page lost contact with the service, so it cannot tell whether the run started. Submitting again is safe. The service starts one run for this approval and returns that run if it already exists.",
    );
    expect(alert.textContent).not.toMatch(/try again|Failed to fetch/i);
  });

  it("marks Current period and Prior period required for Earnings Update and reports them in the page (J1-004)", async () => {
    testingFetch({ ...plan, cap: "20" });
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    fireEvent.click(screen.getByRole("radio", { name: "Earnings Update" }));
    advanceToContext();
    expect(screen.getByText(/^Current period and Prior period are required/)).toBeInTheDocument();
    expect(screen.queryByText(/^Optional\. You can continue/)).toBeNull();
    expect(screen.getByLabelText("Current period (required)")).not.toHaveAttribute("required");
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Current period is required for Earnings Update.");
    expect(screen.getByLabelText("Current period (required)")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    fireEvent.change(screen.getByLabelText("Current period (required)"), {
      target: { value: "q3-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Prior period is required for Earnings Update.",
    );
  });

  it("keeps the Optional step text on a pathway with no required periods (J1-004)", async () => {
    testingFetch();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    await fillInputs();
    await advanceToPurpose();
    advanceToContext();
    expect(screen.getByText(/^Optional\. You can continue/)).toBeInTheDocument();
    expect(screen.getByLabelText("Current period")).not.toBeRequired();
  });
});
