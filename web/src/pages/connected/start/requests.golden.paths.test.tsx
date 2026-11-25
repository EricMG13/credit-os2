/**
 * Every request the Start run page sends on the paths `requests.golden.test.tsx` does not drive:
 * expired drafts, service refusals and the offers they make, the issuer and carry controls,
 * rejected and failing documents, and leaving modules out from the review. Recorded from the
 * branch head before the second-round rebuild (2026-11-25), in the same form as the first five,
 * so the rebuild is proven against them. Rewrite a file only for a ruled change to the service
 * contract, and then by hand, never with `-u`.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { ConnectedApp } from "../ConnectedApp";
import {
  golden,
  issuerReads,
  recorded,
  toContext,
  toPurpose,
  setUpConnectedPage,
  type Recorded,
} from "./connectedTesting";

setUpConnectedPage();
import {
  AGREEMENT,
  DOCUMENTS,
  FILING,
  ITEMS,
  summaryFor,
  TEMPLATE,
  WORKBOOK,
} from "./goldenFixtures";

const TWIN = new File(["Northbridge annual filing"], "northbridge-filing-copy.txt", {
  type: "text/plain",
});
const HUGE = new File(["too big"], "northbridge-annex.pdf", { type: "application/pdf" });
Object.defineProperty(HUGE, "size", { value: 60 * 1024 * 1024 });
// A distinct name the service stores under a name already held: the draft is discarded.
const RENAMED = new File(["another filing"], "northbridge-filing (revised).txt", {
  type: "text/plain",
});
const KNOWN = [FILING, WORKBOOK, AGREEMENT, TWIN, HUGE, RENAMED];

/** What a drive changes in the service's answers: the n-th call (from 1) to a route. */
type Override = (call: { route: string; count: number; name: string }) => Response | undefined;

const RUN = "20261125-120000-01";
const ok = (value: unknown) => Response.json(value);
const refused = (error: string, status = 400) => Response.json({ error }, { status });
const EXPIRED = () => refused("unknown submission", 404);

/**
 * The synthetic service as the first goldens answer it, for any number of drafts (sub-1, sub-2,
 * …), with `override` answering first. Each call is recorded as it was made.
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
  items = ITEMS,
  extra = {},
  override = () => undefined,
}: {
  cap?: string;
  modules?: readonly string[];
  items?: readonly unknown[];
  extra?: Record<string, unknown>;
  override?: Override;
} = {}) {
  const log: Recorded[] = [];
  const stored = new Map<string, Set<string>>();
  const counts = new Map<string, number>();
  let drafts = 0;
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    const entry = recorded(input, init, KNOWN);
    log.push(entry);
    const method = entry.method;
    const url = new URL(input, "http://service.test");
    const name = url.searchParams.get("name") ?? "";
    const draft = /^\/api\/submissions\/(sub-\d+)\/(\w+)$/.exec(url.pathname);
    const route = draft ? `${method} ${draft[2] ?? ""}` : `${method} ${url.pathname}`;
    const count = (counts.get(route) ?? 0) + 1;
    counts.set(route, count);
    const answer = override({ route, count, name });
    if (answer) return Promise.resolve(answer);
    if (Object.hasOwn(extra, input)) return Promise.resolve(ok(extra[input]));
    if (input === "/connected/context") return Promise.resolve(ok(TEMPLATE));
    if (input === "/api/submissions" && method === "POST") {
      drafts += 1;
      stored.set(`sub-${String(drafts)}`, new Set());
      return Promise.resolve(ok({ id: `sub-${String(drafts)}` }));
    }
    const files = stored.get(draft?.[1] ?? "") ?? new Set<string>();
    if (route === "POST files") {
      files.add(name);
      return Promise.resolve(ok({ name }));
    }
    if (route === "DELETE files") {
      files.delete(name);
      return Promise.resolve(ok({ name }));
    }
    if (route === "POST carry") {
      files.add("northbridge-filing.txt");
      return Promise.resolve(ok({ carried: ["northbridge-filing.txt"], kept: [] }));
    }
    if (route === "GET reading")
      return Promise.resolve(
        ok({
          documents: DOCUMENTS.filter(({ source }) => files.has(source)),
          ignored: [],
          error: "",
        }),
      );
    if (route === "POST summary")
      return Promise.resolve(ok({ ...summaryFor(cap, modules), items }));
    if (route === "POST submit") return Promise.resolve(ok({ run: RUN, status: "queued" }));
    if (url.pathname.startsWith("/api/issuers/"))
      return Promise.resolve(ok({ latest_run: "", runs: 0, latest_as_of: "" }));
    return Promise.resolve(refused(`unknown path ${input}`, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return log;
}

async function identify(log: readonly Recorded[], name = "Northbridge Synthetic Group") {
  fireEvent.change(await screen.findByLabelText("Issuer name", {}, { timeout: 10000 }), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  const before = issuerReads(log);
  await waitFor(() => {
    expect(issuerReads(log)).toBeGreaterThan(before);
  });
}

function addFiles(files: readonly File[]) {
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files } });
}

async function inspect(expected: RegExp = /documents? inspected, 0 ignored\./) {
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText(expected);
}

/** The inspection has ended (its button is back) with this refusal in the page's notice. */
async function inspectionEnded(refusal: RegExp) {
  await waitFor(
    () => {
      expect(screen.getByRole("alert")).toHaveTextContent(refusal);
      expect(screen.getByRole("button", { name: "Inspect documents" })).toBeEnabled();
    },
    { timeout: 15000 },
  );
}

function noAgreement() {
  fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
}

async function review() {
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  await screen.findByRole("region", { name: "Limits to decide" });
}

function decideAndApprove() {
  const limits = screen.getByRole("region", { name: "Limits to decide" });
  for (const box of within(limits).getAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(screen.getByRole("checkbox", { name: /^Approve: I have read this summary/ }));
}

async function submit(navigate: ReturnType<typeof vi.fn>) {
  fireEvent.click(screen.getByRole("button", { name: "Submit run" }));
  fireEvent.click(await screen.findByRole("button", { name: "Start synthetic run" }));
  await waitFor(() => {
    expect(navigate).toHaveBeenCalledWith(`/run/${RUN}`);
  });
}

/** From Documents with one file read, through Purpose and More context to a review. */
async function throughToReview() {
  await toPurpose();
  await toContext();
  noAgreement();
  await review();
}

function start(search?: string) {
  const navigate = vi.fn();
  render(
    <ConnectedApp
      path="/start"
      mode="synthetic"
      navigate={navigate}
      {...(search ? { search } : {})}
    />,
  );
  return navigate;
}

const filedElsewhere = (id: string) =>
  `Issuer ID "${id}" is filed under the name "Other Co", not "Northbridge Synthetic Group". If that is this issuer under another name, type that name; otherwise use another Issuer ID.`;

// Hashing documents for repeated content is slow in jsdom: each drive gets 30 s.
/**
 * Holds the issuer notice's lookup (its 250 ms timer, `intakeHooks.ts`) until released. These
 * drives were recorded at a pace where that lookup, set off by "Use {id}", is sent after the
 * second summary; under CPU load the drive's own steps can outlast 250 ms and the lookup moves
 * ahead of it. Holding it fixes when the drive lets it fire, never what any request is.
 */
function holdIssuerNotice() {
  const realSet = window.setTimeout.bind(window);
  const realClear = window.clearTimeout.bind(window);
  const held = new Map<number, () => void>();
  let next = -1;
  const set = vi.spyOn(window, "setTimeout").mockImplementation(((
    handler: TimerHandler,
    ms?: number,
    ...args: unknown[]
  ) => {
    if (ms !== 250 || typeof handler !== "function") return realSet(handler, ms, ...args);
    const id = next;
    next -= 1;
    held.set(id, () => {
      (handler as (...rest: unknown[]) => void)(...args);
    });
    return id;
  }) as typeof window.setTimeout);
  const clear = vi.spyOn(window, "clearTimeout").mockImplementation(((id?: number) => {
    if (id !== undefined && held.delete(id)) return;
    realClear(id);
  }) as typeof window.clearTimeout);
  return () => {
    set.mockRestore();
    clear.mockRestore();
    for (const run of held.values()) run();
    held.clear();
  };
}

/** Lets the held lookup go once the summary is drawn, and waits for it to be sent. */
async function releaseIssuerNotice(release: () => void, log: readonly Recorded[]) {
  release();
  await waitFor(() => {
    expect(log.at(-1)?.path).toMatch(/^\/api\/issuers\/northbridge-synthetic-group-/);
  });
}

describe("the requests the Start run page sends on the remaining paths", { timeout: 30000 }, () => {
  it("a draft that expired at the summary is made again", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "POST summary" && count === 1 ? EXPIRED() : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await toPurpose();
    await toContext();
    noAgreement();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await screen.findByText(/This draft is unavailable and may have expired/);
    await review();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/expired-at-summary.golden");
  });

  it("a draft that expired at Submit is made again after a new review", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "POST submit" && count === 1 ? EXPIRED() : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await throughToReview();
    decideAndApprove();
    fireEvent.click(screen.getByRole("button", { name: "Submit run" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start synthetic run" }));
    await screen.findByText(/Review the run again before submitting/);
    await review();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/expired-at-submit.golden");
  });

  it("a draft that expired at the reading is made again on the next Continue", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "GET reading" && count === 1 ? EXPIRED() : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING]);
    fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
    await screen.findByText(/This draft is unavailable and may have expired/);
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/expired-at-reading.golden");
  });

  it("a summary refusal that names the research cutoff, fixed on its field", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "POST summary" && count === 1
          ? refused("run.cutoff: must be on or before the as-of date.")
          : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await toPurpose();
    await toContext();
    noAgreement();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Research cutoff")).toHaveAttribute("aria-invalid", "true");
    });
    fireEvent.change(screen.getByLabelText("Research cutoff"), {
      target: { value: "2025-03-30" },
    });
    await review();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/refusal-names-cutoff.golden");
  });

  it("an Issuer ID refused at the summary, and the offered ID used", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "POST summary" && count === 1
          ? refused(filedElsewhere("northbridge-synthetic-group"))
          : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await toPurpose();
    await toContext();
    noAgreement();
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const offer = await screen.findByRole("button", { name: /^Use northbridge-synthetic-group-/ });
    const release = holdIssuerNotice();
    fireEvent.click(offer);
    await throughToReview();
    await releaseIssuerNotice(release, log);
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/id-refused-at-summary.golden");
  });

  it("an Issuer ID refused at Submit, the offered ID used and the run reviewed again", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "POST submit" && count === 1
          ? refused(filedElsewhere("northbridge-synthetic-group"))
          : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await throughToReview();
    decideAndApprove();
    fireEvent.click(screen.getByRole("button", { name: "Submit run" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start synthetic run" }));
    const offer = await screen.findByRole("button", { name: /^Use northbridge-synthetic-group-/ });
    const release = holdIssuerNotice();
    fireEvent.click(offer);
    await throughToReview();
    await releaseIssuerNotice(release, log);
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/id-refused-at-submit.golden");
  });

  it("a typed Issuer ID and an issue classification", async () => {
    const log = service();
    const navigate = start();
    await identify(log);
    fireEvent.change(screen.getByLabelText("Issuer ID"), { target: { value: "nb-group" } });
    await waitFor(() => {
      expect(log.some(({ path }) => path === "/api/issuers/nb-group")).toBe(true);
    });
    fireEvent.change(screen.getByLabelText("Issue classification"), {
      target: { value: "high_yield" },
    });
    addFiles([FILING]);
    await inspect();
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/typed-id-and-class.golden");
  });

  it("the latest run carried by its button, then 'This is a different issuer'", async () => {
    const prior = {
      issuer_id: "northbridge",
      issuer_name: "Northbridge",
      level: "basic",
      max_turns: 32,
      modules: [],
      context: { ...TEMPLATE, run: { ...TEMPLATE.run, as_of: "" } },
      files: [{ name: "northbridge-filing.txt", size: 25 }],
    };
    const log = service({
      extra: {
        "/api/issuers/northbridge": {
          latest_run: "latest-case",
          runs: 1,
          latest_as_of: "2025-03-31",
        },
        "/api/runs/latest-case/inputs": prior,
      },
    });
    const navigate = start();
    await identify(log, "Northbridge");
    fireEvent.click(screen.getByRole("button", { name: "Use inputs from latest run" }));
    fireEvent.click(await screen.findByRole("button", { name: "This is a different issuer" }));
    await identify(log, "Southgate Synthetic Holdings");
    addFiles([FILING]);
    await inspect();
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/different-issuer.golden");
  });

  it("an earlier run whose inputs carry an error, and one whose inputs cannot be read", async () => {
    const withError = {
      issuer_id: "northbridge-synthetic-group",
      issuer_name: "Northbridge Synthetic Group",
      level: "basic",
      max_turns: 32,
      modules: [],
      context: null,
      files: [{ name: "northbridge-filing.txt", size: 25 }],
      error: "The earlier run's answers could not be read.",
    };
    let log = service({ extra: { "/api/runs/earlier/inputs": withError } });
    let navigate = start("?from=earlier");
    await screen.findByText("The earlier run's answers could not be read.");
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/prior-with-error.golden");
    cleanup();
    vi.unstubAllGlobals();
    vi.stubGlobal("crypto", webcrypto);
    log = service({
      override: ({ route }) =>
        route === "GET /api/runs/broken/inputs"
          ? refused("run records are unreadable", 500)
          : undefined,
    });
    navigate = start("?from=broken");
    await screen.findByText(/run records are unreadable/);
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/prior-unreadable.golden");
  });

  it("repeated content, an oversized file and a stored-name collision are refused before reading", async () => {
    const log = service({
      override: ({ route, name }) =>
        route === "POST files" && name === RENAMED.name
          ? ok({ name: "northbridge-filing.txt" })
          : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING, TWIN, HUGE]);
    await screen.findByText(/northbridge-annex\.pdf exceeds the 50 MB limit\./);
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await inspectionEnded(/Same content as northbridge-filing\.txt/);
    fireEvent.click(screen.getByRole("button", { name: `Remove ${TWIN.name}` }));
    await waitFor(
      () => {
        expect(screen.queryByRole("button", { name: `Remove ${TWIN.name}` })).toBeNull();
        expect(screen.getByRole("button", { name: "Inspect documents" })).toBeEnabled();
      },
      { timeout: 15000 },
    );
    addFiles([RENAMED]);
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await inspectionEnded(/same stored name/);
    fireEvent.click(screen.getByRole("button", { name: `Remove ${RENAMED.name}` }));
    await waitFor(
      () => {
        expect(screen.queryByRole("button", { name: `Remove ${RENAMED.name}` })).toBeNull();
        expect(screen.getByRole("button", { name: "Inspect documents" })).toBeEnabled();
      },
      { timeout: 15000 },
    );
    await inspect();
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/rejected-documents.golden");
  });

  it("a reading that refuses one file, which is then removed", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "GET reading" && count === 1
          ? refused("cannot read northbridge-portfolio.xlsx: not a workbook")
          : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING, WORKBOOK]);
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await inspectionEnded(/northbridge-portfolio\.xlsx could not be read/);
    fireEvent.click(screen.getByRole("button", { name: `Remove ${WORKBOOK.name}` }));
    await waitFor(
      () => {
        expect(screen.queryByRole("button", { name: `Remove ${WORKBOOK.name}` })).toBeNull();
        expect(screen.getByRole("button", { name: "Inspect documents" })).toBeEnabled();
      },
      { timeout: 15000 },
    );
    await inspect();
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/reading-refuses-file.golden");
  });

  it("an upload that fails midway, and the inspection tried again", async () => {
    const log = service({
      override: ({ route, count }) =>
        route === "POST files" && count === 2
          ? refused("the service could not store the file", 500)
          : undefined,
    });
    const navigate = start();
    await identify(log);
    addFiles([FILING, WORKBOOK]);
    fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
    await inspectionEnded(/could not store the file/);
    await inspect();
    await throughToReview();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/upload-fails-midway.golden");
  });

  it("modules left out from the review, then put back", async () => {
    const refusal = [
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
    ];
    const deep = [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1A",
      "CP-1B",
      "CP-DR",
      "CP-1C",
      "CP-1D",
      "CP-2",
      "CP-4",
      "CP-2A",
      "CP-2E",
      "CP-2D",
      "CP-2G",
      "CP-2H",
      "CP-3D",
      "CP-3C",
      "CP-4C",
      "CP-3",
      "CP-5",
      "CP-6",
    ];
    const log = service({ cap: "50", modules: deep, items: refusal });
    const navigate = start();
    await identify(log);
    addFiles([FILING]);
    await inspect();
    await toPurpose();
    fireEvent.click(screen.getByRole("radio", { name: "Deep credit assessment" }));
    await toContext();
    noAgreement();
    await review();
    fireEvent.click(screen.getByRole("button", { name: /^Leave out Legal & covenants/ }));
    await screen.findByRole("heading", { name: "More context" });
    await review();
    fireEvent.click(await screen.findByRole("button", { name: "Put back" }));
    await screen.findByRole("heading", { name: "More context" });
    await review();
    decideAndApprove();
    await submit(navigate);
    await expect(golden(log)).toMatchFileSnapshot("./requests.golden/leave-out-put-back.golden");
  });
});
