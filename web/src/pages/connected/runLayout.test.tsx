import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";

const ID = "20261124-210000-01";
const run = {
  id: ID,
  status: "running",
  issuer_name: "Northbridge",
  as_of: "2025-03-31",
  pathway: "credit_snapshot",
  modules: [
    ["CP-0", "done"],
    ["CP-1", "running"],
    ["CP-4", "waiting"],
    ["Report", "waiting"],
  ],
  cap: "25",
  spent: "7.4",
  settled_spent: "6.1",
  held: "1.3",
  started_at: "2026-11-24T21:00:00Z",
  observed_at: "2026-11-24T21:04:10Z",
  events: [{ kind: "module_started", at: "2026-11-24T21:03:00Z", module: "CP-1" }],
  reason: "",
};

function serve(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json(body, { status }))),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Run progress layout", () => {
  it("draws the live run as the staged pipeline with the Report as its own last stage", async () => {
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const pipeline = await screen.findByRole("list", { name: "Modules in this run" });
    expect(
      within(pipeline)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Sources1", "Financials1", "Structure and market1", "Report delivery1"]);
    const running = within(pipeline).getByText("Financial foundation").closest("li");
    expect(running).toHaveTextContent("Running");
    expect(running).toHaveAttribute("aria-current", "step");
    expect(running?.querySelector("[data-edge='running']")).toHaveClass("pipeline-flow");
    // Only the path into the running module moves: its own edge in (it sits on the trunk).
    expect(pipeline.querySelectorAll(".pipeline-flow")).toHaveLength(1);
  });

  it("makes the pipeline the h2 of its region, with the stage names beneath it", async () => {
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    await screen.findByRole("list", { name: "Modules in this run" });
    const region = screen.getByRole("region", { name: "Pipeline" });
    expect(
      within(region).getByRole("heading", { level: 2, name: "Module pipeline" }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("heading").map((h) => h.tagName)).not.toContain("H4");
  });

  it("moves nothing on a run that has ended", async () => {
    serve({
      ...run,
      status: "capped",
      reason: "Stopped at the cap.",
      ended_at: "2026-11-24T21:05:00Z",
    });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const pipeline = await screen.findByRole("list", { name: "Modules in this run" });
    expect(pipeline.querySelector(".pipeline-flow, .pipeline-flow-y")).toBeNull();
  });

  it("draws spend against the cap as one meter with a visible track, the cap marked and stated once", async () => {
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const amount = await screen.findByText("USD 7.40");
    expect(amount).toHaveClass("font-mono");
    const region = screen.getByRole("region", { name: "Spend" });
    const meter = within(region).getByRole("progressbar", { name: "Spend against cap" });
    expect(meter).toHaveAttribute(
      "aria-valuetext",
      expect.stringMatching(/USD 7.40 of USD 25.00 cap usage/),
    );
    expect(meter).toHaveClass("border", "bg-surface-subtle");
    // The cap is in the meter's label once, not again beside it.
    expect(document.body.textContent.match(/USD 25\.00/g)).toHaveLength(1);
    expect(within(region).getAllByRole("progressbar")).toHaveLength(1);
    expect(screen.queryByText("Synthetic test")).toBeNull();
  });

  it("gives the page's two meters distinct names, and the module meter says how many modules", async () => {
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    await screen.findByText("USD 7.40");
    const meters = screen.getAllByRole("progressbar");
    expect(meters.map((m) => m.getAttribute("aria-label"))).toEqual([
      "Spend against cap",
      "Modules finished",
    ]);
    expect(screen.getByRole("progressbar", { name: "Modules finished" })).toHaveAttribute(
      "aria-valuetext",
      "1 of 3 modules",
    );
    expect(screen.getByText("1 of 3 modules")).toBeVisible();
  });

  it("draws each module's state on its node (finished, running, queued)", async () => {
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const pipeline = await screen.findByRole("list", { name: "Modules in this run" });
    const node = (name: string) => within(pipeline).getByText(name).closest("li");
    expect(node("Source readiness")).toHaveTextContent("Finished");
    expect(node("Financial foundation")).toHaveTextContent("Running");
    expect(node("Legal & covenants")).toHaveTextContent("Queued");
    expect(node("Report")).toHaveTextContent("Queued");
  });

  it("puts spend before the pipeline in reading order, beside it from lg up", async () => {
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const spend = await screen.findByRole("region", { name: "Spend" });
    const pipeline = screen.getByRole("region", { name: "Pipeline" });
    expect(pipeline.contains(spend)).toBe(true);
    const title = within(pipeline).getByRole("heading", { level: 2 });
    expect(spend.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(spend).toHaveClass("lg:col-start-2", "lg:row-start-1");
    expect(
      within(pipeline).getByRole("heading", { level: 2 }).parentElement?.parentElement,
    ).toHaveClass("lg:col-start-1", "lg:row-start-1");
  });

  it("draws the loading page in the same layout as the loaded one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    const { unmount } = render(<ConnectedApp path={`/run/${ID}`} mode="synthetic" />);
    const loading = (
      await screen.findByRole("status", { name: "Loading run progress" })
    ).querySelectorAll("section");
    const shapes = [...loading].map((tile) => [
      tile.getAttribute("aria-label")?.replace(", loading", ""),
      tile.className,
    ]);
    unmount();
    vi.unstubAllGlobals();
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="synthetic" />);
    await screen.findByRole("list", { name: "Modules in this run" });
    for (const [label, classes] of shapes) {
      expect(screen.getByRole("region", { name: label ?? "" }).className).toBe(classes);
    }
  });

  it("marks a synthetic run from the first paint, before the run has loaded", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    render(<ConnectedApp path={`/run/${ID}`} mode="synthetic" />);
    expect(screen.getByText("Synthetic test")).toBeVisible();
    expect(screen.getByRole("status", { name: "Loading run progress" })).toBeVisible();
  });

  const stopped = {
    ...run,
    status: "failed",
    stopped_by: "checker",
    reason: "The checks rejected a draft.",
    ended_at: "2026-11-24T21:03:30Z",
  };

  it("names the module whose drafts the record says were rejected, not an earlier one still in flight", async () => {
    serve({
      ...stopped,
      modules: [
        ["CP-0", "done"],
        ["CP-2", "stopped"],
        ["CP-2A", "stopped"],
        ["CP-2D", "stopped"],
        ["Report", "waiting"],
      ],
      events: [
        { kind: "module_started", at: "2026-11-24T21:03:00Z", module: "CP-2" },
        { kind: "module_started", at: "2026-11-24T21:03:01Z", module: "CP-2A" },
        { kind: "module_started", at: "2026-11-24T21:03:02Z", module: "CP-2D" },
        { kind: "draft_rejected", at: "2026-11-24T21:03:20Z", module: "CP-2A" },
        { kind: "draft_rejected", at: "2026-11-24T21:03:25Z", module: "CP-2A" },
        { kind: "stopped", at: "2026-11-24T21:03:30Z" },
      ],
    });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const alert = await screen.findByRole("alert");
    // Fundamental credit is earlier in plan order and still open, but the record rejected Downside's drafts.
    expect(
      within(alert).getByText(
        "Where it stopped: Downside. The run stopped here after the checks rejected its draft 2 times.",
      ),
    ).toBeVisible();
    expect(alert).not.toHaveTextContent("Fundamental credit");
  });

  it("names the earliest module in plan order when the record names none it rejected", async () => {
    serve({
      ...stopped,
      modules: [
        ["CP-0", "done"],
        ["CP-2", "stopped"],
        ["CP-2A", "stopped"],
        ["Report", "waiting"],
      ],
      events: [
        { kind: "module_started", at: "2026-11-24T21:03:00Z", module: "CP-2" },
        { kind: "module_started", at: "2026-11-24T21:03:01Z", module: "CP-2A" },
        { kind: "stopped", at: "2026-11-24T21:03:30Z" },
      ],
    });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Where it stopped: Fundamental credit\./)).toBeVisible();
  });

  it("draws the stop notice, with its action inside, when the record gives no reason", async () => {
    serve({ ...stopped, reason: "" });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Run failed.")).toBeVisible();
    expect(within(alert).getByText("The run record gives no reason.")).toBeVisible();
    const again = within(alert).getByRole("link", { name: "Use this run’s inputs" });
    expect(again).toHaveAttribute("href", `/start?from=${ID}`);
    // One such control, not one in the header as well.
    expect(screen.getAllByRole("link", { name: "Use this run’s inputs" })).toHaveLength(1);
  });

  it("states the gap when the record does not say where a stopped run stopped", async () => {
    serve({
      ...stopped,
      status: "capped",
      stopped_by: "",
      modules: [
        ["CP-0", "done"],
        ["CP-1", "done"],
        ["Report", "waiting"],
      ],
    });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Where it stopped: the run record does not say.")).toBeVisible();
  });

  it("draws no empty well and no empty key when the run lists no modules", async () => {
    serve({ ...run, modules: [] });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    await screen.findByRole("region", { name: "Pipeline" });
    expect(screen.queryByRole("list", { name: "Pipeline key" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Modules in this run" })).toBeNull();
    expect(screen.getByText("No analytical modules listed")).toBeVisible();
  });

  it("orders the feed down each column, not across", async () => {
    serve(run);
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    await screen.findByText("USD 7.40");
    const feed = screen.getByRole("region", { name: "Activity" }).querySelector("ul");
    expect(feed).toHaveClass("lg:columns-2", "xl:columns-3");
  });

  it("makes the stop notice compact: one paragraph, then its action", async () => {
    serve({ ...stopped, reason: "The checks rejected a draft." });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const alert = await screen.findByRole("alert");
    expect(alert.querySelectorAll("p")).toHaveLength(1);
  });

  it("makes the page's buttons and links 44px tall on a phone", async () => {
    serve({ ...stopped, reason: "x" });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const again = await screen.findByRole("link", { name: "Use this run’s inputs" });
    expect(again).toHaveClass("max-md:min-h-11");
  });

  it("says where a stopped run stopped and what to do, inside its notice", async () => {
    serve({
      ...stopped,
      modules: [
        ["CP-0", "done"],
        ["CP-4", "stopped"],
        ["Report", "waiting"],
      ],
      events: [
        { kind: "module_started", at: "2026-11-24T21:03:00Z", module: "CP-4" },
        { kind: "stopped", at: "2026-11-24T21:03:30Z" },
      ],
    });
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Where it stopped: Legal & covenants\./)).toBeVisible();
    expect(within(alert).getByText(/Review the inputs in a new draft/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Open report" })).toBeNull();
  });

  it("draws the three tiles as gaps, not blanks or zeros, when the service cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    render(<ConnectedApp path={`/run/${ID}`} mode="live" />);
    expect(await screen.findByText("The service cannot be reached")).toBeVisible();
    expect(screen.getByText("Progress is not known while this run cannot be read.")).toBeVisible();
    expect(screen.getByText("Spend is not known.")).toBeVisible();
    expect(screen.queryByText(/USD 0/)).toBeNull();
  });
});

describe("Run activity layout", () => {
  const live = (id: string, issuer: string, extra: object = {}) => ({
    id,
    issuer_name: issuer,
    pathway: "credit_snapshot",
    status: "running",
    reason: "",
    submitted_by: "",
    started_at: "",
    name_differs: false,
    stalled: false,
    files: 1,
    modules: [
      ["CP-0", "done"],
      ["CP-1", "running"],
      ["CP-2", "waiting"],
    ],
    ...extra,
  });
  const ended = (id: string, issuer: string, reason: string) => ({
    id,
    issuer_name: issuer,
    pathway: "credit_snapshot",
    status: "failed",
    reason,
    ended_at: "2026-11-23T10:00:00Z",
    submitted_by: "",
  });
  const list = {
    updated: "2026-11-24T21:04:10Z",
    held: "",
    runs: [
      live("a", "Alder Metals"),
      live("w", "Waiting Co", { status: "queued", reason: "3 runs are already running" }),
    ],
    ended: [ended("b", "Birch Retail", "The checks rejected a draft of the legal module.")],
    ended_total: 1,
  };

  it("draws a run in flight as one compact row: state, modules done of total, and the module it is on", async () => {
    serve(list);
    render(<ConnectedApp path="/runs" mode="live" />);
    await screen.findByRole("link", { name: "Alder Metals" });
    const running = screen.getByRole("region", { name: "Running" });
    const rows = within(running).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(rows[0] as HTMLElement).getByText("1 of 3")).toHaveClass("font-mono");
    expect(within(rows[0] as HTMLElement).getAllByRole("progressbar")).toHaveLength(1);
    expect(within(rows[0] as HTMLElement).getByText("Now: Financial foundation")).toBeVisible();
    // The per-module view is Run progress's: the row does not list every module.
    expect(rows[0]).not.toHaveTextContent("Fundamental credit");
    expect(within(running).queryByRole("grid")).toBeNull();
  });

  it("says what a run is doing when only the report is left, from the record's own row", async () => {
    serve({
      ...list,
      runs: [
        live("a", "Alder Metals", {
          modules: [
            ["CP-0", "done"],
            ["CP-1", "done"],
            ["Report", "running"],
          ],
        }),
      ],
    });
    render(<ConnectedApp path="/runs" mode="live" />);
    const row = (await screen.findByRole("link", { name: "Alder Metals" })).closest("li");
    expect(row).toHaveTextContent("2 of 2");
    expect(within(row as HTMLElement).getByText("Now: Report delivery")).toBeVisible();
  });

  it("names every module that is running, none left to a count", async () => {
    serve({
      ...list,
      runs: [
        live("a", "Alder Metals", {
          modules: [
            ["CP-0", "done"],
            ["CP-2", "running"],
            ["CP-2A", "running"],
            ["CP-2D", "running"],
            ["CP-2E", "running"],
          ],
        }),
      ],
    });
    render(<ConnectedApp path="/runs" mode="live" />);
    const row = (await screen.findByRole("link", { name: "Alder Metals" })).closest("li");
    expect(within(row as HTMLElement).getByText(/^Now: /).textContent).toBe(
      "Now: Fundamental credit, Downside, Liquidity, Rates, FX & hedging",
    );
    expect(row).not.toHaveTextContent(/more/);
  });

  it("draws the gap when a running run lists no modules", async () => {
    serve({ ...list, runs: [live("a", "Alder Metals", { modules: [] })] });
    render(<ConnectedApp path="/runs" mode="live" />);
    const row = (await screen.findByRole("link", { name: "Alder Metals" })).closest("li");
    expect(within(row as HTMLElement).getByText("No analytical modules listed")).toBeVisible();
    expect(within(row as HTMLElement).queryByRole("progressbar")).toBeNull();
  });

  it("labels an end time that was not recorded, and the one that was", async () => {
    serve({
      ...list,
      ended: [{ ...ended("b", "Birch Retail", "x"), ended_at: "" }, ended("c", "Cedar Co", "y")],
      ended_total: 2,
    });
    render(<ConnectedApp path="/runs" mode="live" />);
    await screen.findByRole("link", { name: "Birch Retail" });
    const birch = screen.getByRole("link", { name: "Birch Retail" }).closest("li") as HTMLElement;
    expect(within(birch).getByText("Ended: not recorded")).toBeVisible();
    const cedar = screen.getByRole("link", { name: "Cedar Co" }).closest("li") as HTMLElement;
    expect(cedar).toHaveTextContent(/Ended 23 Nov 2026, 10:00 UTC/);
  });

  it("makes the activity page's controls 44px tall on a phone", async () => {
    serve(list);
    render(<ConnectedApp path="/runs" mode="live" />);
    const library = await screen.findByRole("link", { name: "Finished runs are in the library" });
    expect(library).toHaveClass("min-h-8", "max-[480px]:min-h-11");
    expect(screen.getByRole("link", { name: "Start a run" })).toHaveClass("max-md:min-h-11");
  });

  it("puts runs in flight first, the runs that stopped directly under them, and waiting runs after", async () => {
    serve(list);
    render(<ConnectedApp path="/runs" mode="live" />);
    await screen.findByRole("link", { name: "Alder Metals" });
    const [first, second, third] = ["Running", "Ended without a report", "Waiting"].map((name) =>
      screen.getByRole("region", { name }),
    ) as [HTMLElement, HTMLElement, HTMLElement];
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(second.compareDocumentPosition(third) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("says why a run stopped, in words, on its own row", async () => {
    serve(list);
    render(<ConnectedApp path="/runs" mode="live" />);
    await screen.findByRole("link", { name: "Birch Retail" });
    const stopped = screen.getByRole("region", { name: "Ended without a report" });
    const row = within(stopped).getByRole("link", { name: "Birch Retail" }).closest("li");
    expect(row).toHaveTextContent("Failed");
    expect(row).toHaveTextContent("The checks rejected a draft of the legal module.");
  });

  it("says when a stopped run's record gives no reason, rather than leaving the row blank", async () => {
    serve({ ...list, ended: [ended("b", "Birch Retail", "")] });
    render(<ConnectedApp path="/runs" mode="live" />);
    await screen.findByRole("link", { name: "Birch Retail" });
    const stopped = screen.getByRole("region", { name: "Ended without a report" });
    expect(within(stopped).getByText("The run record gives no reason.")).toBeVisible();
  });

  it("makes a run's link 32px tall, 44px on a phone, and breaks its name only between words", async () => {
    serve(list);
    render(<ConnectedApp path="/runs" mode="live" />);
    const link = await screen.findByRole("link", { name: "Alder Metals" });
    expect(link).toHaveClass("min-h-8", "max-[480px]:min-h-11", "wrap-break-word");
    expect(link).not.toHaveClass("wrap-anywhere");
  });

  it("draws the synthetic chip from the app for a synthetic service, and none for a live one", async () => {
    serve(list);
    const { unmount } = render(<ConnectedApp path="/runs" mode="synthetic" />);
    expect(await screen.findByText("Synthetic test")).toBeVisible();
    unmount();
    render(<ConnectedApp path="/runs" mode="live" />);
    expect(await screen.findByRole("link", { name: "Alder Metals" })).toBeVisible();
    expect(screen.queryByText("Synthetic test")).toBeNull();
  });

  it("draws the loading page in the same layout as the loaded one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    const { unmount } = render(<ConnectedApp path="/runs" mode="live" />);
    const loading = await screen.findByRole("status", { name: "Loading run activity" });
    const shapes = [...loading.querySelectorAll("section")].map((tile) => [
      tile.getAttribute("aria-label")?.replace(", loading", ""),
      tile.className,
    ]);
    unmount();
    vi.unstubAllGlobals();
    serve(list);
    render(<ConnectedApp path="/runs" mode="live" />);
    await screen.findByRole("link", { name: "Alder Metals" });
    for (const [label, classes] of shapes)
      expect(screen.getByRole("region", { name: label ?? "" }).className).toBe(classes);
  });

  it("draws nothing as a run when the service cannot be reached, only a gap that says so", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    render(<ConnectedApp path="/runs" mode="live" />);
    expect(await screen.findByText("Run activity could not be read")).toBeVisible();
    expect(screen.getByText(/is not known\./)).toBeVisible();
  });

  it("explains a read-only preview of either run screen as a gap with a way back", () => {
    for (const [path, title] of [
      ["/runs", "Run activity"],
      [`/run/${ID}`, "Run progress"],
    ] as const) {
      render(<ConnectedApp path={path} mode="live" readOnly />);
      expect(screen.getByRole("heading", { level: 1, name: title })).toBeVisible();
      expect(screen.getByText(/not available in a read-only preview/)).toBeVisible();
      expect(screen.getByRole("link", { name: "Back to Library" })).toHaveAttribute("href", "/");
      cleanup();
    }
  });
});
