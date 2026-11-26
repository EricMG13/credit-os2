/**
 * What the page sends when it starts from an earlier run: the carried answers the analyst did not
 * touch go as the Context step describes them, and nothing dated for the earlier case goes with
 * the new one. The review request is read from the recorded fetch calls; expected values are
 * literals.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { StartRun } from "../StartRun";
import { chooseControl } from "./testControls";
import { CUSTOM_TEMPLATE } from "./customFixtures";

Element.prototype.scrollIntoView = vi.fn();

const caps = { credit_snapshot: "30", lite_credit_assessment: "20", custom: "20" };
const template = {
  run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
  identity: { issuer_name: "", issuer_id: "" },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type Body = {
  context: Record<string, unknown> & {
    run: Record<string, string>;
    attachments?: Record<string, unknown>;
  };
};

/** A service holding one earlier run, `earlier`, with the given context; returns the summary bodies. */
function service(context: Record<string, unknown>, level = "basic") {
  const bodies: Body[] = [];
  const json = (value: unknown) => Promise.resolve(Response.json(value));
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs")
        return json({
          run: "earlier",
          issuer_id: "northbridge",
          issuer_name: "Northbridge",
          context,
          files: [{ name: "a.txt", size: 5 }],
          level,
          modules: [],
          max_turns: 32,
        });
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "d1" });
      if (url.pathname === "/api/submissions/d1/carry")
        return json({ carried: ["a.txt"], kept: [] });
      if (url.pathname === "/api/submissions/d1/reading")
        return json({
          documents: [{ source: "a.txt", kind: "annual_report" }],
          ignored: [],
          error: "",
        });
      if (url.pathname === "/api/submissions/d1/summary") {
        bodies.push(JSON.parse(typeof init?.body === "string" ? init.body : "{}") as Body);
        return json({ error: "stop here" });
      }
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  return bodies;
}

const base = {
  identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
};

async function openContext() {
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("a.txt")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
}

async function review(bodies: Body[]) {
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  await waitFor(() => {
    expect(bodies.length).toBeGreaterThan(0);
  });
  return bodies[0] as Body;
}

it("B3 a file box the form level no longer draws is not sent as chosen", async () => {
  const bodies = service(
    {
      ...base,
      run: {
        as_of: "2024-12-31",
        pathway: "lite_credit_assessment",
        run_type: "research",
        case_kind: "public",
      },
      attachments: { legal_documents: "none" },
    },
    "advanced",
  );
  await openContext();
  chooseControl("Run form level", "advanced");
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
  fireEvent.change(screen.getByLabelText("Management EBITDA bridge"), {
    target: { value: "a.txt" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  await screen.findByRole("heading", { name: "Purpose" });
  chooseControl("Run form level", "basic");
  const sent = await review(bodies);
  expect(sent.context.attachments).toEqual({
    legal_documents: "none",
    management_bridge: false,
    portfolio_workbook: false,
    prior_case: false,
  });
});

/** A Custom run on the Portfolio Fit modules with one research question added; the page is at More context. */
async function runWithQuestion(custom: boolean, portfolioFit = custom) {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      const json = (value: unknown) => Promise.resolve(Response.json(value));
      if (path === "/connected/context") return json(CUSTOM_TEMPLATE);
      if (path === "/api/submissions") return json({ id: "d1" });
      if (path.startsWith("/api/submissions/d1/files")) return json({ name: "a.txt" });
      if (path === "/api/submissions/d1/reading")
        return json({
          documents: [{ source: "a.txt", kind: "annual_report" }],
          ignored: [],
          error: "",
        });
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      return json({ error: "unknown" });
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText("Issuer name"), {
    target: { value: "Northbridge" },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  fireEvent.change(screen.getByLabelText("Documents"), {
    target: { files: [new File(["x"], "a.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText(/document inspected, 0 ignored\./);
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
  chooseControl("Run form level", "advanced");
  if (custom) fireEvent.click(screen.getByRole("radio", { name: "Custom selection" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
  if (portfolioFit) {
    fireEvent.click(
      within(screen.getByRole("group", { name: "Start from" })).getByRole("button", {
        name: "Portfolio Fit",
      }),
    );
  }
  fireEvent.click(screen.getByRole("button", { name: "Add research question" }));
  fireEvent.change(screen.getByLabelText("Question"), { target: { value: "Run-rate savings?" } });
}

const focusOptions = () =>
  [...screen.getByLabelText<HTMLSelectElement>("Focus module").options].map((option) => [
    option.value,
    option.text,
  ]);

it("B10 a custom run's research question can be aimed only at a requested module the service accepts", async () => {
  await runWithQuestion(true);
  expect(focusOptions()).toEqual([
    ["", "Any"],
    ["CP-2", "Fundamental credit"],
  ]);
});

it("B20 a preset pathway offers the focus modules it requests, in the service's order", async () => {
  await runWithQuestion(false);
  expect(focusOptions().map(([value]) => value)).toEqual(["", "CP-1C", "CP-2", "CP-DR"]);
});

it("B21 a focus whose module is no longer requested is refused at Review, naming the question", async () => {
  await runWithQuestion(true, false);
  const picker = within(screen.getByRole("group", { name: "Modules for this run" }));
  fireEvent.click(picker.getByRole("checkbox", { name: "Fundamental credit" }));
  fireEvent.change(screen.getByLabelText("Focus module"), { target: { value: "CP-2" } });
  fireEvent.click(picker.getByRole("checkbox", { name: "Fundamental credit" }));
  expect(picker.getByRole("checkbox", { name: "Fundamental credit" })).not.toBeChecked();
  // The stale value stays shown, as the page shows any held value that is not offered.
  expect(focusOptions()).toEqual([
    ["", "Any"],
    ["CP-2", "Fundamental credit"],
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Choose the focus again for the research question \u201cRun-rate savings?\u201d: Fundamental credit is not requested in this run.",
  );
  expect(screen.getByRole("heading", { name: "More context" })).toBeTruthy();
});

it("B26 a preset run's focus is offered and checked against the modules kept, not the whole preset", async () => {
  await runWithQuestion(false);
  fireEvent.change(screen.getByLabelText("Focus module"), { target: { value: "CP-1C" } });
  const kept = within(screen.getByRole("group", { name: "Requested modules" }));
  fireEvent.click(kept.getByRole("checkbox", { name: "Peer benchmark" }));
  expect(kept.getByRole("checkbox", { name: "Peer benchmark" })).not.toBeChecked();
  expect(focusOptions().map(([value]) => value)).toEqual(["", "CP-2", "CP-DR", "CP-1C"]);
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Choose the focus again for the research question \u201cRun-rate savings?\u201d: Peer benchmark is not requested in this run.",
  );
  expect(screen.getByRole("heading", { name: "More context" })).toBeTruthy();
});
