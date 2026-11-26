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

// Blocked: carried-from-earlier.golden and carried-with-left-out.golden (the carry drives in
// requests.golden.test.tsx) pin the carried cutoff 2024-12-31 as sent. The fix in
// intake.ts `startingContext` is written but not applied until that expectation is ruled changed;
// `it.fails` records that this test fails for the reported cause.
it.fails("B2 a carried run's cutoff and periods are not sent for the new case", async () => {
  const bodies = service({
    ...base,
    run: {
      as_of: "2024-12-31",
      cutoff: "2024-12-31",
      current_period: "Q4 2024",
      prior_period: "Q3 2024",
      pathway: "credit_snapshot",
      run_type: "research",
      case_kind: "public",
    },
  });
  await openContext();
  const sent = await review(bodies);
  expect(sent.context.run.as_of).toBe("2025-03-31");
  expect(sent.context.run.cutoff).toBe("2025-03-31");
  expect(sent.context.run.current_period).toBe("");
  expect(sent.context.run.prior_period).toBe("");
});

// Blocked: ConnectedApp.test.tsx "connected run start > passes a prior run's rows through untouched
// when not edited" pins a carried, never-edited facility sent raw (size_m: 500 as a number, no
// other keys). The fix (send sendableRows(kind, rowsOf(kind), primary) for every kind) is written
// but not applied until that expectation is ruled changed; `it.fails` records the reported cause.
it.fails(
  "B1 a carried facility the analyst never opened is sent as the page describes it",
  async () => {
    const bodies = service({
      ...base,
      run: {
        as_of: "2024-12-31",
        pathway: "credit_snapshot",
        run_type: "primary",
        case_kind: "public",
      },
      deal_terms: [
        {
          facility_id: "tlb-2031",
          currency: "USD",
          size_m: " 1250 ",
          tenor_years: "7",
          talk_spread_bps_low: "325",
          talk_spread_bps_high: "350",
          talk_oid_low: "99.0",
          talk_oid_high: "99.5",
          floor_pct: "0.50",
        },
        { facility_id: "", currency: "", size_m: "", tenor_years: "5" },
      ],
    });
    await openContext();
    chooseControl("Market view", "research");
    const sent = await review(bodies);
    expect(sent.context.deal_terms).toEqual([
      {
        facility_id: "tlb-2031",
        instrument: "",
        currency: "USD",
        size_m: "1250",
        tenor_years: "",
        maturity: "",
        talk_spread_bps_low: "",
        talk_spread_bps_high: "",
        talk_oid_low: "",
        talk_oid_high: "",
        floor_pct: "0.50",
        coupon_pct: "",
        margin_bps: "",
        call_protection: "",
        use_of_proceeds: "",
        as_of: "",
        provider: "",
      },
    ]);
  },
);

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

it("B10 a custom run's research question can be aimed at each requested module", async () => {
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
  fireEvent.click(screen.getByRole("radio", { name: "Custom selection" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
  fireEvent.click(
    within(screen.getByRole("group", { name: "Start from" })).getByRole("button", {
      name: "Portfolio Fit",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add research question" }));
  const focus = screen.getByLabelText<HTMLSelectElement>("Focus module");
  expect([...focus.options].map((option) => option.value)).toEqual([
    "",
    "CP-0",
    "CP-1",
    "CP-1A",
    "CP-2",
    "CP-3",
    "CP-5",
    "CP-6",
  ]);
});
