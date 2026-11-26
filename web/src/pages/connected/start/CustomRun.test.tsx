/**
 * The Start run page's Custom selection (PR 7a task 5): offered at the Advanced level only, a picker
 * of whole modules with their reasons and the running sum, hold and cap, three presets, GPT only,
 * and a summary whose server estimate replaces the page's own. The figures are the answer key's
 * (.superpowers/sdd/pr-7a-custom-routing/answer-key-caps.md), copied here as literals.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PriorInputs } from "../api";
import { ConnectedApp } from "../ConnectedApp";
import { carriedModules } from "../StartRun";
import {
  golden,
  issuerReads,
  recorded,
  setUpConnectedPage,
  standingApart,
  toContext,
  toPurpose,
  type Recorded,
} from "./connectedTesting";
import { chooseControl } from "./testControls";
import { DOCUMENTS, FILES, FILING } from "./goldenFixtures";
import {
  CUSTOM_TEMPLATE,
  PORTFOLIO_FIT_ROWS,
  customSummary,
  serverEstimate,
  type ServerRow,
} from "./customFixtures";

setUpConnectedPage();

/** What a test makes the service answer Submit with; the usual run is answered when unset. */
let submitAnswer: (() => Response) | undefined;
afterEach(() => {
  submitAnswer = undefined;
});

type Reply = (body: { answers?: { modules?: string[] } }) => Record<string, unknown>;

/** The service as it answers a custom run: `summary` builds the reply to each summary request. */
function service(summary: Reply = () => customSummary(PORTFOLIO_FIT_MODULES, estimateOf())) {
  const log: Recorded[] = [];
  const stored = new Set<string>();
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    log.push(recorded(input, init, FILES));
    const url = new URL(input, "http://service.test");
    const name = url.searchParams.get("name") ?? "";
    const reply = (value: unknown, status = 200) =>
      Promise.resolve(Response.json(value, { status }));
    if (input === "/connected/context") return reply(CUSTOM_TEMPLATE);
    if (input === "/api/submissions") return reply({ id: "sub-1" });
    if (url.pathname === "/api/submissions/sub-1/files") {
      stored.add(name);
      return reply({ name });
    }
    if (input === "/api/submissions/sub-1/reading")
      return reply({
        documents: DOCUMENTS.filter(({ source }) => stored.has(source)),
        ignored: [],
        error: "",
      });
    if (input === "/api/submissions/sub-1/summary")
      return reply(
        summary(
          JSON.parse(typeof init?.body === "string" ? init.body : "{}") as {
            answers?: { modules?: string[] };
          },
        ),
      );
    if (input === "/api/submissions/sub-1/submit")
      return submitAnswer
        ? Promise.resolve(submitAnswer())
        : reply({ run: "20261126-120000-01", status: "queued" });
    if (url.pathname.startsWith("/api/issuers/"))
      return reply({ latest_run: "", runs: 0, latest_as_of: "" });
    return reply({ error: `unknown path ${input}` }, 404);
  });
  vi.stubGlobal("fetch", standingApart(fetchMock));
  return log;
}

const PORTFOLIO_FIT_MODULES = ["CP-0", "CP-1", "CP-1A", "CP-2", "CP-3", "CP-5", "CP-6"];
const estimateOf = (rows: readonly ServerRow[] = PORTFOLIO_FIT_ROWS, sum = "5.07", cap = "13") =>
  serverEstimate(rows, sum, cap);

/** Opens the page at Documents with one file read, on the Purpose step. */
async function atPurpose(summary?: Reply, mode: "synthetic" | "live" = "live") {
  const log = service(summary);
  render(<ConnectedApp path="/start" mode={mode} navigate={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText("Issuer name", {}, { timeout: 10000 }), {
    target: { value: "Northbridge Synthetic Group" },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  await waitFor(() => {
    expect(issuerReads(log)).toBeGreaterThan(0);
  });
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [FILING] } });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText(/documents? inspected, 0 ignored\./);
  await toPurpose();
  return log;
}

const customCard = () => screen.queryByRole("radio", { name: "Custom selection" });

/** The Custom selection chosen at the Advanced level, and the More context step opened. */
async function atPicker(summary?: Reply) {
  const log = await atPurpose(summary);
  chooseControl("Run form level", "advanced");
  fireEvent.click(screen.getByRole("radio", { name: "Custom selection" }));
  await toContext();
  return log;
}

const picker = () => screen.getByRole("group", { name: "Modules for this run" });
const estimateBox = () => screen.getByRole("region", { name: "Estimated from earlier runs" });
const box = (name: string) => within(picker()).getByRole("checkbox", { name });

/** Per preset and effort: the sum, the hold and the cap, from the answer key (rows without CP-8). */
const PRESET_KEY = [
  ["Governance and ESG", "fast", "USD 1.92", "USD 10.00"],
  ["Governance and ESG", "balanced", "USD 2.03", "USD 10.00"],
  ["Governance and ESG", "high", "USD 2.52", "USD 10.00"],
  ["Covenant Capacity", "fast", "USD 1.08", "USD 9.00"],
  ["Covenant Capacity", "balanced", "USD 1.08", "USD 9.00"],
  ["Covenant Capacity", "high", "USD 1.43", "USD 9.00"],
  ["Portfolio Fit", "fast", "USD 4.36", "USD 12.00"],
  ["Portfolio Fit", "balanced", "USD 5.07", "USD 13.00"],
  ["Portfolio Fit", "high", "USD 5.69", "USD 13.00"],
] as const;

describe("the Custom selection option", () => {
  it("is offered at the Advanced level only, with the report's question", async () => {
    await atPurpose();
    expect(customCard()).not.toBeInTheDocument();
    chooseControl("Run form level", "advanced");
    const card = screen.getByRole("radio", { name: "Custom selection" });
    expect(card).not.toBeChecked();
    expect(
      within(screen.getByRole("radiogroup", { name: "Pathway" })).getByText(
        "What do the modules you chose find about this issuer?",
      ),
    ).toBeInTheDocument();
    chooseControl("Run form level", "basic");
    expect(customCard()).not.toBeInTheDocument();
  });

  it("falls back to the default pathway when the level leaves Advanced", async () => {
    await atPurpose();
    chooseControl("Run form level", "advanced");
    fireEvent.click(screen.getByRole("radio", { name: "Custom selection" }));
    expect(screen.getByRole("radio", { name: "Custom selection" })).toBeChecked();
    chooseControl("Run form level", "basic");
    expect(screen.getByRole("radio", { name: "Full credit assessment" })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      /Custom selection is offered at the Advanced level/,
    );
  });

  it("leaves a preset's page as it was: Advanced adds no card to it and no picker", async () => {
    await atPurpose();
    chooseControl("Run form level", "advanced");
    fireEvent.click(screen.getByRole("radio", { name: "Deep credit assessment" }));
    await toContext();
    expect(screen.getByRole("group", { name: "Requested modules" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Modules for this run" })).not.toBeInTheDocument();
  });
});

describe("the picker's design", () => {
  it("draws an unchosen module's figure as an addition and a chosen one plainly", async () => {
    await atPicker();
    fireEvent.click(box("Legal & covenants"));
    expect(box("Legal & covenants").closest("li")).not.toHaveTextContent("+ USD");
    expect(box("Legal & covenants").closest("li")).toHaveTextContent("USD 0.37");
    expect(box("Committee decision").closest("li")).toHaveTextContent("+ USD 0.99");
    expect(box("Source readiness").closest("li")).not.toHaveTextContent("+ USD");
  });

  it("puts the running figures above the list, with the earlier-run caption", async () => {
    await atPicker();
    const totals = estimateBox();
    const list = within(picker()).getAllByRole("list")[0] as HTMLElement;
    expect(totals.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(totals).toHaveTextContent("when one is listed");
    expect(list).toHaveClass("lg:grid-cols-2");
  });

  it("describes each checkbox by its purpose, needs and reason", async () => {
    await atPicker();
    fireEvent.click(box("Committee decision"));
    expect(box("Evidence validation")).toHaveAccessibleDescription(
      /Validates the evidence trace.*Needs first.*Added: Needed by Committee decision\./,
    );
    expect(box("Source readiness")).toHaveAccessibleDescription(/Always in: Every run needs/);
    // The attributes name no module: an id or a reference built from a code would.
    for (const node of picker().querySelectorAll("[id], [aria-describedby]"))
      expect(`${node.id} ${node.getAttribute("aria-describedby") ?? ""}`).not.toMatch(
        /CP-[0-9A-Z]/,
      );
  });

  it("explains the hold in plain words", async () => {
    await atPicker();
    expect(estimateBox()).toHaveTextContent(
      "Reserved for one model call while it runs, so the run cannot pass the cap.",
    );
  });

  it("words the card's cap as coming from the modules", async () => {
    await atPurpose();
    chooseControl("Run form level", "advanced");
    expect(
      screen.getByRole("radio", { name: "Custom selection" }).closest("label"),
    ).toHaveTextContent("Cap from your modules, at most USD 50.00");
  });
});

describe("the picker", () => {
  it("lists every offered module by reader name with what it answers, needs and costs", async () => {
    await atPicker();
    expect(screen.queryByRole("group", { name: "Requested modules" })).not.toBeInTheDocument();
    expect(within(picker()).getAllByRole("checkbox")).toHaveLength(20);
    const text = picker().textContent;
    expect(text).not.toMatch(/CP-/);
    expect(text).not.toMatch(/page only/i);
    const row = box("Committee decision").closest("li");
    expect(row).toHaveTextContent("Runs the investment-committee debate and challenge");
    expect(row).toHaveTextContent(
      "Needs first: Source readiness, Financial foundation, Fundamental credit, Security selection and Evidence validation",
    );
    expect(row).toHaveTextContent("USD 0.99");
    expect(box("Source readiness").closest("li")).toHaveTextContent("Needs nothing first");
    expect(box("Source readiness").closest("li")).toHaveTextContent("No report section of its own");
    expect(box("Committee decision").closest("li")).not.toHaveTextContent(
      "No report section of its own",
    );
    expect(within(picker()).queryByText("Cash flow model")).not.toBeInTheDocument();
    expect(within(picker()).queryByText("Changes since the last run")).not.toBeInTheDocument();
  });

  it("holds Source readiness and Financial foundation in, with the reason", async () => {
    await atPicker();
    for (const name of ["Source readiness", "Financial foundation"]) {
      expect(box(name)).toBeChecked();
      expect(box(name)).toBeDisabled();
      expect(box(name).closest("li")).toHaveTextContent(
        "Every run needs the source register and the financial base.",
      );
    }
  });

  it("ticks a module, adds what it needs with the reason, and takes them away again", async () => {
    await atPicker();
    fireEvent.click(box("Committee decision"));
    for (const name of [
      "Business & governance",
      "Fundamental credit",
      "Security selection",
      "Evidence validation",
    ]) {
      expect(box(name)).toBeChecked();
      expect(box(name)).toBeDisabled();
    }
    expect(box("Evidence validation").closest("li")).toHaveTextContent(
      "Added: Needed by Committee decision.",
    );
    expect(box("Committee decision").closest("li")).not.toHaveTextContent("Added:");
    fireEvent.click(box("Committee decision"));
    expect(box("Fundamental credit")).not.toBeChecked();
    expect(box("Fundamental credit")).toBeEnabled();
  });

  it("starts from one of three presets, which the rules then complete", async () => {
    await atPicker();
    const presets = within(screen.getByRole("group", { name: "Start from" }));
    expect(presets.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Governance and ESG",
      "Covenant Capacity",
      "Portfolio Fit",
    ]);
    fireEvent.click(presets.getByRole("button", { name: "Governance and ESG" }));
    expect(box("Business & governance")).toBeChecked();
    expect(box("Rates, FX & hedging")).toBeChecked();
    expect(box("Fundamental credit")).not.toBeChecked();
    fireEvent.click(presets.getByRole("button", { name: "Portfolio Fit" }));
    expect(box("Rates, FX & hedging")).not.toBeChecked();
    for (const name of ["Committee decision", "Security selection", "Evidence validation"])
      expect(box(name)).toBeChecked();
    expect(box("Evidence validation").closest("li")).toHaveTextContent(
      "No report section of its own",
    );
  });

  it("offers readable phase scope and submits the parent with a selected phase", async () => {
    const log = await atPicker();
    fireEvent.click(
      within(screen.getByRole("group", { name: "Start from" })).getByRole("button", {
        name: "Covenant Capacity",
      }),
    );
    const parent = box("Legal & covenants").closest("li") as HTMLElement;
    const phase = within(parent).getByRole("checkbox", { name: "Covenant capacity" });
    expect(phase).toHaveAccessibleDescription(/Measures covenant headroom.*Whole module runs/);
    fireEvent.click(phase);
    expect(phase).toBeChecked();
    expect(phase).toHaveAccessibleDescription(
      /Measures covenant headroom.*Core analysis and selected phases run/,
    );
    expect(parent).toHaveTextContent("Core analysis and selected phases run.");
    expect(picker().textContent).not.toMatch(/CP-[0-9A-Z]/);
    expect(picker()).toHaveTextContent("full module estimate");
    fireEvent.click(phase);
    expect(phase).not.toBeChecked();
    expect(parent).toHaveTextContent("Whole module runs.");
    fireEvent.click(phase);
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByRole("region", { name: "Limits to decide" });
    const asked = log.find(({ path }) => path.endsWith("/summary"));
    const body = JSON.parse(typeof asked?.body === "string" ? asked.body : "{}") as {
      modules: string[];
    };
    expect(body.modules).toEqual(["CP-4", "CP-4A"]);
  });

  it.each(PRESET_KEY)(
    "%s at %s effort: the running sum, hold and cap are the answer key's",
    async (preset, effort, sum, cap) => {
      await atPicker();
      fireEvent.change(screen.getByLabelText("Reasoning effort"), { target: { value: effort } });
      fireEvent.click(
        within(screen.getByRole("group", { name: "Start from" })).getByRole("button", {
          name: preset,
        }),
      );
      const totals = estimateBox();
      expect(totals).toHaveTextContent("Estimated from earlier runs");
      expect(within(totals).getByText("Sum of the modules").nextSibling).toHaveTextContent(sum);
      expect(within(totals).getByText("Hold for one call").nextSibling).toHaveTextContent(
        "USD 7.17",
      );
      expect(within(totals).getByText("Cap").nextSibling).toHaveTextContent(cap);
      expect(totals.textContent).not.toMatch(/CP-|quote:/);
      expect(totals).toHaveTextContent("not a quote");
      // The rail beside it says the same of its cap until a summary issues one.
      expect(screen.getByText("Estimated cap from earlier runs")).toBeInTheDocument();
    },
  );

  it("offers GPT only, and says why", async () => {
    await atPicker();
    const model = screen.getByLabelText("Model");
    expect([...model.querySelectorAll("option")].map((option) => option.textContent)).toEqual([
      "GPT Sol",
    ]);
    expect(screen.getByText("A custom selection is estimated from GPT runs only.")).toBeVisible();
    const efforts = [...screen.getByLabelText("Reasoning effort").querySelectorAll("option")];
    expect(efforts.map((option) => option.getAttribute("value"))).toEqual([
      "fast",
      "balanced",
      "high",
    ]);
  });

  it("is drawn open on the Model and modules section", async () => {
    await atPicker();
    expect(picker().closest("details")).toHaveAttribute("open");
  });
});

/** Review run from the picker with Portfolio Fit chosen, then every limit decided and approved. */
async function reviewPortfolioFit() {
  fireEvent.click(
    within(screen.getByRole("group", { name: "Start from" })).getByRole("button", {
      name: "Portfolio Fit",
    }),
  );
  fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  await screen.findByRole("region", { name: "Limits to decide" });
}

function approve() {
  const limits = screen.getByRole("region", { name: "Limits to decide" });
  for (const check of within(limits).getAllByRole("checkbox")) fireEvent.click(check);
  fireEvent.click(screen.getByRole("checkbox", { name: /^Approve: I have read this summary/ }));
}

describe("the summary and the submit", () => {
  it("asks for the summary at the table's cap, sends the chosen list, and shows the server's cap", async () => {
    const log = await atPicker();
    await reviewPortfolioFit();
    const asked = log.find(({ path }) => path.endsWith("/summary"));
    expect(asked?.headers?.["X-Shown-Cap"]).toBe("50");
    const body = JSON.parse(typeof asked?.body === "string" ? asked.body : "{}") as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      modules: ["CP-6"],
      level: "advanced",
      model: "gpt",
      context: { run: { pathway: "custom" } },
    });
    expect(screen.getByLabelText("What it will cost")).toHaveTextContent("USD 13.00");
    approve();
    fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 13.00" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 13.00" }));
    await waitFor(() => {
      expect(log.some(({ path }) => path.endsWith("/submit"))).toBe(true);
    });
    const submitted = log.find(({ path }) => path.endsWith("/submit"));
    expect(submitted?.headers?.["X-Shown-Cap"]).toBe("13");
  });

  it("a paid custom run sends the chosen list at the Advanced level, then the issued cap", async () => {
    const log = await atPicker();
    await reviewPortfolioFit();
    approve();
    fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 13.00" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 13.00" }));
    await waitFor(() => {
      expect(log.some(({ path }) => path.endsWith("/submit"))).toBe(true);
    });
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/custom-portfolio-fit.golden");
  });

  it("draws the server's estimate in place of the page's, by name, with reasons and the page-only mark", async () => {
    const rows = [
      ...PORTFOLIO_FIT_ROWS.map((row) =>
        row.module === "CP-6"
          ? {
              ...row,
              phases: [{ name: "Portfolio posture", added: "Needed by Portfolio committee." }],
            }
          : row,
      ),
      {
        module: "CP-8",
        name: "Changes since the last run",
        usd: "0.46",
        measured: true,
        added: "Compares this run with the earlier run named in this summary.",
        modules_page_only: false,
      },
    ];
    await atPicker(() => customSummary(PORTFOLIO_FIT_MODULES, serverEstimate(rows, "5.53", "14")));
    await reviewPortfolioFit();
    const sheet = within(estimateBox());
    expect(sheet.getByText("Changes since the last run")).toBeInTheDocument();
    expect(sheet.getByText("Sum of the modules").nextSibling).toHaveTextContent("USD 5.53");
    expect(sheet.getByText("Cap").nextSibling).toHaveTextContent("USD 14.00");
    expect(sheet.getByText("Hold for one call").nextSibling).toHaveTextContent("USD 7.17");
    expect(estimateBox()).toHaveTextContent(
      "Compares this run with the earlier run named in this summary.",
    );
    expect(estimateBox()).toHaveTextContent("No report section of its own");
    expect(estimateBox()).toHaveTextContent("Analysis scope: Portfolio posture");
    expect(estimateBox()).toHaveTextContent("Portfolio posture: Needed by Portfolio committee.");
    expect(estimateBox().textContent).not.toMatch(/page only/i);
    expect(screen.getByLabelText("What it will cost")).toHaveTextContent("USD 14.00");
    expect(document.body.textContent).not.toMatch(/CP-[0-9A-Z]/);
    // The picker is where a custom run's modules change: no limit offers to leave one out.
    expect(screen.queryByRole("button", { name: /^Leave out/ })).not.toBeInTheDocument();
  });

  it.each([
    [
      "a cap above the table's",
      () => customSummary(PORTFOLIO_FIT_MODULES, estimateOf(PORTFOLIO_FIT_ROWS, "5.07", "51")),
    ],
    [
      "a cap that is not the estimate's",
      () => customSummary(PORTFOLIO_FIT_MODULES, estimateOf(), { cap: "40" }),
    ],
    ["no estimate", () => customSummary(PORTFOLIO_FIT_MODULES, undefined, { cap: "13" })],
  ])("refuses a summary with %s", async (_name, reply) => {
    await atPicker(reply);
    fireEvent.click(
      within(screen.getByRole("group", { name: "Start from" })).getByRole("button", {
        name: "Portfolio Fit",
      }),
    );
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Review the run again/);
    expect(screen.queryByRole("region", { name: "Limits to decide" })).not.toBeInTheDocument();
  });

  it("says a refusal of the submit in names too, never a module id", async () => {
    const log = await atPicker();
    await reviewPortfolioFit();
    approve();
    submitAnswer = () =>
      Response.json(
        { error: "--modules: CP-L20 is a phase of CP-2, not a whole module; choose CP-2." },
        { status: 400 },
      );
    fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 13.00" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 13.00" }));
    const notice = await screen.findByText(/Review the run again before submitting/);
    expect(notice.textContent).toContain("Fundamental credit");
    expect(notice.textContent).not.toMatch(/CP-[0-9A-Z]|--modules/);
    expect(log.some(({ path }) => path.endsWith("/submit"))).toBe(true);
  });

  it("says a custom summary's refusal in names, never a module id", async () => {
    await atPicker(() => ({
      error:
        "--modules: CP-L20 is a phase of CP-2, not a whole module; choose CP-2 (CP-5A needs CP-L23).",
    }));
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent("Fundamental credit");
    expect(notice.textContent).not.toMatch(/CP-[0-9A-Z]|--modules/);
  });
});

describe("an earlier custom run carried into the form", () => {
  const earlier = (modules: string[]): PriorInputs => ({
    issuer_id: "x",
    issuer_name: "X",
    context: {
      schema: "context/1",
      run: { as_of: "", pathway: "custom", case_kind: "public" },
      identity: { issuer_name: "X", issuer_id: "x" },
    },
    files: [],
    level: "advanced",
    modules,
    max_turns: 32,
  });

  it("keeps scoped module phases when an earlier custom run is carried into the form", () => {
    expect(
      carriedModules(earlier(["CP-6", "CP-6A", "CP-MODEL", "CP-1A", "CP-2C", "CP-8"])),
    ).toEqual(["CP-1A", "CP-2C", "CP-6", "CP-6A"]);
    expect(carriedModules(earlier(["CP-6A"]))).toEqual([]);
  });
});
