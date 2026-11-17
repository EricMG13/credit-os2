import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportLibrary } from "./LibraryIndex";
import { RunActivity } from "./RunActivity";
import { RunProgress } from "./RunProgress";

const entry = {
  id: "north-2026",
  issuer: "raw-north-key",
  name: "Northbridge",
  date: "2026-03-31",
  sector: "Industrials",
  title: "Full credit assessment",
  period: "FY2025",
  metrics: {},
};
const library = {
  catalogue: { real: [entry] },
  workspace: {
    runs: { north: { folder: entry.id, issuerKey: entry.issuer, pathway: "credit_snapshot" } },
  },
};
const running = {
  id: "north-run",
  issuer_name: "Northbridge",
  pathway: "credit_snapshot",
  status: "running",
  reason: "",
  submitted_by: "",
  started_at: "2026-11-17T07:00:00Z",
  name_differs: false,
  stalled: false,
  files: 2,
  modules: [["CP-1", "running"]],
};
const queued = { ...running, id: "south-run", issuer_name: "Southbridge", status: "queued" };
const run = {
  ...running,
  status: "failed",
  as_of: "2026-03-31",
  observed_at: "2026-11-17T07:02:00Z",
  ended_at: "2026-11-17T07:01:00Z",
  events: [],
  cap: "25",
  spent: "0",
  modules: [
    ["CP-1", "done"],
    ["Report", "stopped"],
  ],
};

function reply(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json(data))),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("Library batch findings", () => {
  it("C1-008 shows delivery state and sector instead of the raw issuer ID", async () => {
    reply(library);
    render(<ReportLibrary />);
    await screen.findByRole("heading", { name: "Northbridge" });
    expect(screen.getByText("Delivered")).toBeVisible();
    expect(screen.getByText("Industrials", { selector: "p" })).toBeVisible();
    expect(document.body).not.toHaveTextContent("raw-north-key");
  });

  it("C1-019 restores every filter and layout from its copied address after returning", async () => {
    reply(library);
    render(<ReportLibrary />);
    fireEvent.change(await screen.findByRole("searchbox"), { target: { value: "North" } });
    fireEvent.change(screen.getByLabelText("Sector"), { target: { value: "Industrials" } });
    fireEvent.change(screen.getByLabelText("Pathway"), {
      target: { value: "Full credit assessment" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    const query = new URLSearchParams(window.location.search);
    expect(query.get("q")).toBe("North");
    expect(query.get("sector")).toBe("Industrials");
    expect(query.get("pathway")).toBe("Full credit assessment");
    expect(query.get("layout")).toBe("list");
    cleanup();
    render(<ReportLibrary />);
    expect(await screen.findByRole("searchbox")).toHaveValue("North");
    expect(screen.getByLabelText("Sector")).toHaveValue("Industrials");
    expect(screen.getByLabelText("Pathway")).toHaveValue("Full credit assessment");
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
  });

  it("C1-022 uses the same label style for the three related filters", async () => {
    reply(library);
    render(<ReportLibrary />);
    await screen.findByRole("searchbox");
    for (const name of ["Search issuers", "Sector", "Pathway"])
      expect(screen.getByLabelText(name).closest("label")).toHaveClass(
        "font-medium",
        "text-sm",
        "text-text-primary",
        "gap-1.5",
      );
  });

  it("C1-023 and C1-014 use the long case date and identify the Library browser tab", async () => {
    reply(library);
    render(<ReportLibrary />);
    expect(await screen.findByText("31 March 2026")).toBeVisible();
    expect(document.title).toBe("Library — Credit OS");
  });

  it("C1-032 draws static loading blocks in place of report cards", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    render(<ReportLibrary />);
    const loading = screen.getByRole("status", { name: "Loading reports" });
    expect(loading.querySelectorAll(".bg-surface-subtle").length).toBeGreaterThan(1);
    expect(loading.className).not.toMatch(/animate|pulse|shimmer/);
  });
});

describe("Run activity batch findings", () => {
  it("C1-018 draws the module name beside a visible state word", async () => {
    reply({ updated: "2026-11-17T08:00:00Z", held: "", runs: [running], ended: [] });
    render(<RunActivity />);
    const item = (await screen.findByText("Financial foundation")).closest("li");
    expect(item).not.toBeNull();
    expect(within(item as HTMLElement).getByText("Running")).not.toHaveClass("sr-only");
  });

  it("J1-008 names what the ended count covers and always points to published reports", async () => {
    reply({
      updated: "2026-11-17T08:00:00Z",
      held: "",
      runs: [running],
      ended: [],
      ended_total: 4,
    });
    render(<RunActivity />);
    expect(await screen.findByText("Ended without a report", { selector: "dt" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Finished runs are in the library" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(document.title).toBe("Run activity — Credit OS");
  });

  it("J2-015 explains a queued row's wait when no specific reason was supplied", async () => {
    reply({ updated: "2026-11-17T08:00:00Z", held: "", runs: [queued], ended: [] });
    render(<RunActivity />);
    expect(
      await screen.findByText(
        "Waiting for an available run slot. It starts when the service can accept it.",
      ),
    ).toBeVisible();
  });
});

describe("Run progress batch findings", () => {
  it("J2-009 says Start from this run opens a separate run with its own cap", async () => {
    reply(run);
    render(<RunProgress id={run.id} mode="synthetic" />);
    expect(await screen.findByRole("link", { name: "Start from this run" })).toHaveAttribute(
      "href",
      "/start?from=north-run",
    );
    expect(
      screen.getByText(
        "Start from this run opens a new run with its own cap. The earlier run stays as it is.",
      ),
    ).toBeVisible();
  });

  it("S6-037 names the delivery step alongside analytical modules and formats the case date", async () => {
    reply(run);
    render(<RunProgress id={run.id} mode="synthetic" />);
    expect(
      await screen.findByRole("heading", { name: "Modules and report delivery" }),
    ).toBeVisible();
    expect(screen.getByText("31 March 2026")).toBeVisible();
    expect(document.title).toBe("Northbridge run — Credit OS");
  });

  it("J2-015 explains a queued run's wait without inventing a count or queue position", async () => {
    reply({ ...run, status: "queued", reason: "", ended_at: undefined });
    render(<RunProgress id={run.id} mode="synthetic" />);
    expect(
      await screen.findByText(
        "Waiting for an available run slot. It starts when the service can accept it.",
      ),
    ).toBeVisible();
  });
});

describe("C1-008 original card credit view", () => {
  const lead = {
    module: "CP-2",
    output: "north-2026/CP-2.md",
    sha256: "a".repeat(64),
    line: 12,
    text: "Cover is 2.67x and debt is USD 3,105m.\nBasis: filing.txt, p. 2.",
  };

  it("draws the original finding with one source control to its exact published line", async () => {
    reply({
      ...library,
      workspace: { runs: { north: { ...library.workspace.runs.north, lead } } },
    });
    render(<ReportLibrary />);
    expect(await screen.findByText("Cover is 2.67x and debt is USD 3,105m.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Sources for this credit view" })).toHaveAttribute(
      "href",
      `/report/north-2026#evidence/north-2026%2FCP-2.md~${"a".repeat(64)}-12`,
    );
    expect(document.body).not.toHaveTextContent("filing.txt");
    expect(document.body).not.toHaveTextContent("p. 2");
  });

  it("keeps a source-bearing passage in its exact Evidence location", async () => {
    reply({
      ...library,
      workspace: {
        runs: {
          north: {
            ...library.workspace.runs.north,
            lead: { ...lead, text: "The finding is in filing.txt." },
          },
        },
      },
    });
    render(<ReportLibrary />);
    expect(
      await screen.findByRole("link", { name: "Read this credit view in Evidence" }),
    ).toHaveAttribute(
      "href",
      `/report/north-2026#evidence/north-2026%2FCP-2.md~${"a".repeat(64)}-12`,
    );
    expect(document.body).not.toHaveTextContent("The finding is in filing.txt.");
  });
});

describe("C1-028 published blocked modules", () => {
  it("keeps delivery and progress counts while naming a declared blocked output Not assessable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) =>
        Promise.resolve(
          Response.json(
            path.startsWith("/connected/report/")
              ? { id: run.id, not_assessable: ["CP-1"] }
              : {
                  ...run,
                  status: "finished",
                  modules: [
                    ["CP-1", "done"],
                    ["Report", "done"],
                  ],
                },
          ),
        ),
      ),
    );
    render(<RunProgress id={run.id} mode="synthetic" />);
    const state = await screen.findByText("Not assessable");
    expect(state.closest("li")).toHaveTextContent("Financial foundation");
    expect(screen.getByRole("progressbar", { name: "1 of 1 modules" })).toBeVisible();
    expect(screen.getByText("Report", { selector: "span" }).closest("li")).toHaveTextContent(
      "Finished",
    );
  });

  it("keeps an older report with no assessment metadata readable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) =>
        Promise.resolve(
          Response.json(
            path.startsWith("/connected/report/")
              ? { id: run.id }
              : {
                  ...run,
                  status: "finished",
                  modules: [
                    ["CP-1", "done"],
                    ["Report", "done"],
                  ],
                },
          ),
        ),
      ),
    );
    render(<RunProgress id={run.id} mode="synthetic" />);
    await screen.findByRole("link", { name: "Open report" });
    expect(screen.queryByText("Not assessable")).toBeNull();
    expect(
      screen.getByText("Financial foundation", { selector: "span" }).closest("li"),
    ).toHaveTextContent("Finished");
  });
});
