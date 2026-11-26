import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";

const EMPTY = { catalogue: { real: [] }, workspace: { runs: {} } };
const ENTRY = {
  id: "alpha-2026-10",
  name: "Alpha Foods",
  issuer: "Alpha Foods",
  title: "Lite credit assessment",
  date: "2026-10-31",
  sector: "Food",
  period: "FY2026",
  metrics: {},
};
const FILLED = {
  catalogue: { real: [ENTRY] },
  workspace: {
    runs: { alpha: { folder: ENTRY.id, issuerKey: "alpha", pathway: "lite_credit_assessment" } },
  },
};

type Answer = () => Response;

/** Serves `/connected/library` from the answers in order, the last one again and again; counts requests. */
function serve(...answers: Answer[]) {
  const calls = { library: 0 };
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      if (path !== "/connected/library") throw new Error(`Unexpected request ${path}`);
      const answer = answers[Math.min(calls.library, answers.length - 1)];
      calls.library += 1;
      if (!answer) throw new Error("No answer given");
      return Promise.resolve(answer());
    }),
  );
  return calls;
}

const ok = (body: unknown) => () => Response.json(body);
const refused = () => Response.json({ error: "boom" }, { status: 500 });
const unreachable = () => {
  throw new TypeError("Failed to fetch");
};

// The page is a lazy chunk; load it once so the tests wait for the service, not the chunk.
beforeAll(async () => {
  await import("./LibraryIndex");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

function open() {
  render(<ConnectedApp path="/" mode="synthetic" />);
}

/** The empty state the page shows: its root holds the icon, the title, the sentence and the action. */
async function emptyState() {
  const title = await screen.findByRole("heading", { level: 2, name: "No reports yet" });
  const root = title.parentElement?.parentElement;
  if (!root) throw new Error("The empty state has no root");
  return root;
}

describe.each([
  ["an index with no report", ok(EMPTY)],
  ["no index at all", ok(null)],
])("a library with nothing in it (%s)", (_name, answer) => {
  it("is the empty state: icon, title, one sentence and the next action", async () => {
    serve(answer);
    open();
    const root = await emptyState();
    expect(root.querySelector("svg")).not.toBeNull();
    expect(within(root).getByText(/Reports appear here after they’re published/)).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Start a run" })).toHaveLength(1);
    const start = within(root).getByRole("link", { name: "Start a run" });
    expect(start).toHaveAttribute("href", "/start");
    // The one action on the page is the primary button, not an outline.
    expect(start.className).toContain("bg-brand-solid");
  });

  it("offers no filter or layout control, because there is nothing to filter", async () => {
    serve(answer);
    open();
    await emptyState();
    expect(screen.queryByRole("group", { name: "Sector" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Pathway" })).toBeNull();
    expect(screen.queryByRole("searchbox", { name: "Search issuers" })).toBeNull();
  });
});

describe("a library with a report", () => {
  it("keeps its search and filter chips and draws no empty state", async () => {
    serve(ok(FILLED));
    open();
    expect(await screen.findByRole("heading", { name: "Alpha Foods" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Sector" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Pathway" })).toBeVisible();
    expect(screen.getByRole("group", { name: "State" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Search issuers" })).toBeVisible();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("heading", { name: "No reports yet" })).toBeNull();
    // Why no decision is drawn is said once for the list, not in each row.
    expect(screen.getAllByText(/committee decision only with a recorded clearance/)).toHaveLength(
      1,
    );
  });

  it("keeps an unavailable saved filter explicit and clears back to an unfiltered library", async () => {
    window.history.replaceState(null, "", "/?sector=Mining&layout=list&pathway=Old+review");
    serve(ok(FILLED));
    open();

    const clear = await screen.findByRole("button", { name: "Clear filters" });
    expect(screen.getByRole("button", { name: "Mining (unavailable)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Old review (unavailable)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("No issuers match these filters.");

    fireEvent.click(clear);
    expect(screen.getByRole("searchbox", { name: "Search issuers" })).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Alpha Foods" })).toBeVisible();
    expect(window.location.search).toBe("");
  });
});

describe("a library address", () => {
  it("clearing the filters leaves the address's other parameters alone", async () => {
    window.history.replaceState(null, "", "/?sector=Mining&state=Delivered&ref=mail");
    serve(ok(FILLED));
    open();
    fireEvent.click(await screen.findByRole("button", { name: "Clear filters" }));
    expect(window.location.search).toBe("?ref=mail");
  });

  it("says an unpublished run has no report and links nothing for it", async () => {
    serve(
      ok({
        catalogue: { real: [ENTRY] },
        workspace: { runs: {} },
      }),
    );
    open();
    const row = within(await screen.findByRole("list", { name: "Issuers" }));
    expect(row.getByText("No report published")).toBeVisible();
    expect(row.queryByRole("link", { name: "Open report" })).toBeNull();
  });

  it("keeps the preview reason on screen above its rows", async () => {
    serve(ok({ ...FILLED, preview: { reason: "Retained test record." } }));
    open();
    expect(await screen.findByText("Retained test record.")).toBeVisible();
    expect(
      within(screen.getByRole("list", { name: "Issuers" })).getByText("Test preview"),
    ).toBeVisible();
  });
});

describe("a library that cannot be read", () => {
  it("says so in an alert with an icon and a Try again action, not a plain line", async () => {
    window.history.replaceState(null, "", "/?sector=Food");
    serve(refused);
    open();
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("The library could not be loaded")).toBeVisible();
    expect(alert.querySelector("svg")).not.toBeNull();
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.queryByText("The published library could not be loaded.")).toBeNull();
    expect(screen.queryByText("No reports yet")).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
    expect(window.location.search).toBe("?sector=Food");
  });

  it("names a service that cannot be reached, never the browser's own word", async () => {
    serve(unreachable);
    open();
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("The service cannot be reached")).toBeVisible();
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeVisible();
    expect(document.body).not.toHaveTextContent("Failed to fetch");
  });

  it("asks again on Try again, keeps the alert until the answer, then shows the library", async () => {
    const calls = serve(refused, ok(FILLED));
    open();
    const alert = await screen.findByRole("alert");
    expect(calls.library).toBe(1);
    await act(async () => {
      within(alert).getByRole("button", { name: "Try again" }).click();
      await Promise.resolve();
    });
    expect(await screen.findByRole("heading", { name: "Alpha Foods" })).toBeVisible();
    expect(calls.library).toBe(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the alert when the second answer is a failure too", async () => {
    const calls = serve(refused, refused);
    open();
    const alert = await screen.findByRole("alert");
    await act(async () => {
      within(alert).getByRole("button", { name: "Try again" }).click();
      await Promise.resolve();
    });
    expect(calls.library).toBe(2);
    expect(screen.getByRole("alert")).toHaveTextContent("The library could not be loaded");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});
