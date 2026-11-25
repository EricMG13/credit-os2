/**
 * Every request the Start run page sends, in order, for five fixed drives: paths, methods,
 * headers, bodies. Recorded from the form as it stood before the 2026-11-24 redesign (S9) and held
 * here as files, so a change to what the form sends fails this test. A presentation change must
 * leave `requests.golden/*.golden` untouched; only a ruled change to the service contract may
 * rewrite them, and then by hand, never with `-u`.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "../ConnectedApp";
import {
  golden,
  issuerReads,
  recorded,
  toContext,
  toPurpose,
  setUpConnectedPage,
  standingApart,
  type Recorded,
} from "./connectedTesting";

setUpConnectedPage();

import {
  AGREEMENT,
  DOCUMENTS,
  EXTRA,
  FILES,
  FILING,
  summaryFor,
  TEMPLATE,
  WORKBOOK,
} from "./goldenFixtures";
import { chooseControl } from "./testControls";

/** What each drive sent on the standing portfolios' own routes, kept out of its golden file. */
let standingCalls: Recorded[] = [];
/** The standing portfolios' requests of a drive whose listing has every set stored: one listing. */
const LISTED_ONCE: Recorded[] = [{ method: "GET", path: "/api/reference-portfolios" }];

/**
 * A fetch that answers as the synthetic service would and records every call. `submits` answers
 * Submit in turn; a path the service would not know is answered 404, as it would be. The standing
 * portfolios' routes are answered apart (`standingApart`) and recorded in `standingCalls`.
 */
function service({
  cap = "30",
  modules = [
    "CP-0",
    "CP-1",
    "CP-MODEL",
    "CP-1A",
    "CP-DR",
    "CP-2",
    "CP-3",
    "CP-4",
    "CP-4C",
    "CP-5",
    "CP-6",
  ],
  submits = [() => Response.json({ run: "20261124-120000-01", status: "queued" })],
  extra = {},
}: {
  cap?: string;
  modules?: string[];
  submits?: (() => Response)[];
  extra?: Record<string, unknown>;
} = {}) {
  const log: Recorded[] = [];
  const stored = new Set<string>();
  let submitAt = 0;
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    const entry = recorded(input, init, FILES);
    log.push(entry);
    const method = entry.method;
    const url = new URL(input, "http://service.test");
    const name = url.searchParams.get("name") ?? "";
    const reply = (value: unknown, status = 200) =>
      Promise.resolve(Response.json(value, { status }));
    if (Object.hasOwn(extra, input)) return reply(extra[input]);
    if (input === "/connected/context") return reply(TEMPLATE);
    if (input === "/api/submissions" && method === "POST") return reply({ id: "sub-1" });
    if (url.pathname === "/api/submissions/sub-1/files" && method === "POST") {
      stored.add(name);
      return reply({ name });
    }
    if (url.pathname === "/api/submissions/sub-1/files" && method === "DELETE") {
      stored.delete(name);
      return reply({ name });
    }
    if (input === "/api/submissions/sub-1/carry") {
      stored.add("northbridge-filing.txt");
      return reply({ carried: ["northbridge-filing.txt"], kept: [] });
    }
    if (input === "/api/submissions/sub-1/reading")
      return reply({
        documents: DOCUMENTS.filter(({ source }) => stored.has(source)).concat(
          stored.has(EXTRA.name)
            ? [
                {
                  source: EXTRA.name,
                  kind: "unrecognised",
                  signal: "",
                  executed: null,
                  period_end: null,
                },
              ]
            : [],
        ),
        ignored: [],
        error: "",
      });
    if (input === "/api/submissions/sub-1/summary") return reply(summaryFor(cap, modules));
    if (input === "/api/submissions/sub-1/submit") {
      const answer = submits[Math.min(submitAt, submits.length - 1)];
      submitAt += 1;
      return Promise.resolve(
        answer ? answer() : Response.json({ error: "no answer" }, { status: 500 }),
      );
    }
    if (url.pathname.startsWith("/api/issuers/"))
      return reply({ latest_run: "", runs: 0, latest_as_of: "" });
    return reply({ error: `unknown path ${input}` }, 404);
  });
  standingCalls = [];
  vi.stubGlobal("fetch", standingApart(fetchMock, standingCalls));
  return log;
}

/** Types the issuer, the case date and the analyst's name, waiting out the issuer notice's lookup. */
async function identify(log: readonly Recorded[], name = "Northbridge Synthetic Group") {
  fireEvent.change(await screen.findByLabelText("Issuer name", {}, { timeout: 10000 }), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  await waitFor(() => {
    expect(issuerReads(log)).toBeGreaterThan(0);
  });
}

async function addAndInspect(files: readonly File[]) {
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files } });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText(/documents? inspected, 0 ignored\./);
}

function choose(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function reviewAndDecide() {
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  const limits = await screen.findByRole("region", { name: "Limits to decide" });
  for (const box of within(limits).getAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(screen.getByRole("checkbox", { name: /^Approve: I have read this summary/ }));
}

async function submitWith(button: string, action: string) {
  fireEvent.click(screen.getByRole("button", { name: button }));
  fireEvent.click(await screen.findByRole("button", { name: action }));
}

describe("the requests the Start run page sends", { timeout: 30000 }, () => {
  it("the Northbridge drive: three files, a note, workbook, agreement and a rating, synthetic", async () => {
    const log = service();
    const navigate = vi.fn();
    render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
    await identify(log);
    await addAndInspect([FILING, WORKBOOK, AGREEMENT]);
    await toPurpose();
    await toContext();
    fireEvent.change(screen.getByLabelText("Anything the analysis should know"), {
      target: { value: "Check the 2028 maturities.\nInclude refinancing risk." },
    });
    choose("Portfolio workbook", "northbridge-portfolio.xlsx");
    choose("Legal documents", "executed");
    choose("The agreement", "northbridge-credit-agreement.txt");
    const ratings = screen.getByRole("region", { name: "Ratings" });
    fireEvent.click(within(ratings).getByRole("button", { name: "Add rating" }));
    fireEvent.change(within(ratings).getByLabelText("Agency"), { target: { value: "Moody's" } });
    fireEvent.change(within(ratings).getByLabelText("Scope"), { target: { value: "issuer" } });
    fireEvent.change(within(ratings).getByLabelText("Rating"), { target: { value: "B1" } });
    fireEvent.change(within(ratings).getByLabelText("Outlook"), { target: { value: "Negative" } });
    fireEvent.change(within(ratings).getByLabelText("As-of"), { target: { value: "2025-02-28" } });
    await reviewAndDecide();
    await submitWith("Submit run", "Start no-cost test");
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/20261124-120000-01");
    });
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/northbridge-synthetic.golden");
    expect(standingCalls).toEqual(LISTED_ONCE);
  });

  it("a paid Deep run at the Advanced level: a module left out, another model, effort and turns", async () => {
    const log = service({ cap: "50" });
    const navigate = vi.fn();
    render(<ConnectedApp path="/start" mode="live" navigate={navigate} />);
    await identify(log);
    await addAndInspect([FILING, AGREEMENT]);
    await toPurpose();
    fireEvent.click(screen.getByRole("radio", { name: "Deep credit assessment" }));
    chooseControl("Market view", "secondary");
    chooseControl("Case kind", "private");
    chooseControl("Run form level", "advanced");
    await toContext();
    choose("Model", "claude");
    choose("Reasoning effort", "high");
    fireEvent.change(screen.getByLabelText("Turns per module"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Peer benchmark" }));
    choose("Legal documents", "draft");
    choose("The agreement", "northbridge-credit-agreement.txt");
    await reviewAndDecide();
    await submitWith("Submit, spend up to USD 50.00", "Start run, up to USD 50.00");
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/20261124-120000-01");
    });
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/deep-advanced-live.golden");
    expect(standingCalls).toEqual(LISTED_ONCE);
  });

  it("an Earnings Update with periods, a removed file, and a step back and forward", async () => {
    const log = service({ cap: "20" });
    const navigate = vi.fn();
    render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
    await identify(log);
    await addAndInspect([FILING, EXTRA]);
    fireEvent.click(screen.getByRole("button", { name: `Remove ${EXTRA.name}` }));
    await screen.findByText("1 document inspected, 0 ignored.");
    await toPurpose();
    fireEvent.click(screen.getByRole("radio", { name: "Earnings Update" }));
    await toContext();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Purpose" });
    await toContext();
    fireEvent.change(screen.getByLabelText(/^Current period/), { target: { value: "Q3-2026" } });
    fireEvent.change(screen.getByLabelText(/^Prior period/), { target: { value: "q2-2026" } });
    choose("Legal documents", "none");
    await reviewAndDecide();
    await submitWith("Submit run", "Start no-cost test");
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/20261124-120000-01");
    });
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/earnings-update.golden");
    expect(standingCalls).toEqual(LISTED_ONCE);
  });

  it("a run started from an earlier run: its documents carried, a new date, the same issuer", async () => {
    const log = service({
      extra: {
        "/api/runs/earlier/inputs": {
          issuer_id: "northbridge-synthetic-group",
          issuer_name: "Northbridge Synthetic Group",
          level: "basic",
          max_turns: 32,
          modules: [],
          context: {
            ...TEMPLATE,
            run: { ...TEMPLATE.run, as_of: "2024-12-31", cutoff: "2024-12-31" },
            identity: {
              ...TEMPLATE.identity,
              issuer_name: "Northbridge Synthetic Group",
              issuer_id: "northbridge-synthetic-group",
              sector: "Industrials",
            },
            attachments: {
              legal_documents: "none",
              management_bridge: false,
              portfolio_workbook: false,
              prior_case: false,
            },
          },
          files: [{ name: "northbridge-filing.txt", size: 25 }],
        },
      },
    });
    const navigate = vi.fn();
    render(
      <ConnectedApp path="/start" search="?from=earlier" mode="synthetic" navigate={navigate} />,
    );
    await screen.findByText(/Using an earlier run as a starting point/);
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
    await waitFor(() => {
      expect(issuerReads(log)).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await screen.findByText("1 document inspected, 0 ignored.");
    await toPurpose();
    await toContext();
    await reviewAndDecide();
    await submitWith("Submit run", "Start no-cost test");
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/20261124-120000-01");
    });
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/carried-from-earlier.golden");
    expect(standingCalls).toEqual(LISTED_ONCE);
  });

  it("a Submit with no answer, then the same Submit again", async () => {
    const log = service({
      submits: [
        () => Response.json({ error: "Connection lost" }, { status: 500 }),
        () => Response.json({ run: "20261124-120000-01", status: "queued" }),
      ],
    });
    const navigate = vi.fn();
    render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
    await identify(log);
    await addAndInspect([FILING]);
    await toPurpose();
    await toContext();
    choose("Legal documents", "none");
    await reviewAndDecide();
    await submitWith("Submit run", "Start no-cost test");
    await screen.findByText(/Submitting again is safe/);
    await submitWith("Submit run", "Start no-cost test");
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/run/20261124-120000-01");
    });
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/submit-retry.golden");
    expect(standingCalls).toEqual(LISTED_ONCE);
  });
});
