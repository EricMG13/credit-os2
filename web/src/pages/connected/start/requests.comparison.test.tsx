/**
 * The requests the Start run page sends for a run with a comparison portfolio (a reference
 * portfolio supplied for that run). The portfolio goes on its own routes: every other request is
 * the one the same drive sends without it, byte for byte, so it is never part of the answers or
 * of the run's documents. The request goldens (`requests.golden*.test.tsx`) hold the drives with
 * no comparison portfolio, unchanged.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReferencePortfolio } from "../api";
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
import { DOCUMENTS, FILING, summaryFor, TEMPLATE } from "./goldenFixtures";

setUpConnectedPage();

const HOLDINGS = new File(["holdings"], "SYNTHETIC holdings.csv", { type: "text/csv" });
const LIMITS = new File(["limits"], "SYNTHETIC constraints.csv", { type: "text/csv" });
const NOTES = new File(["notes"], "notes.csv", { type: "text/csv" });
const SLIDES = new File(["slides"], "slides.pdf", { type: "application/pdf" });
const MODULES = ["CP-0", "CP-1", "CP-MODEL", "CP-1A", "CP-DR", "CP-2", "CP-5"];
const READ: ReferencePortfolio = {
  name: "Example comparison fund",
  as_of: "2026-10-31",
  positions: 7,
  unpriced: 1,
  limits: 3,
  found: ["Borrower", "Instrument", "Bid", "Ask"],
  not_found: ["CUSIP", "Coupon"],
  findings: [],
};
const REFUSAL =
  "No holdings table was found. notes.csv has no header row naming a holding and its weight, par or market value.";
const REFERENCE = "/api/submissions/sub-1/reference-portfolio";

/** The synthetic service with the comparison portfolio's routes; it reads any file but notes.csv. */
function service() {
  const log: Recorded[] = [];
  const documents = new Set<string>();
  const portfolio = new Set<string>();
  let named = "";
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    const entry = recorded(input, init, [FILING, HOLDINGS, LIMITS, NOTES]);
    log.push(entry);
    const { method } = entry;
    const url = new URL(input, "http://service.test");
    const name = url.searchParams.get("name") ?? "";
    const reply = (value: unknown, status = 200) =>
      Promise.resolve(Response.json(value, { status }));
    const readable = portfolio.size > 0 && !portfolio.has(NOTES.name);
    if (input === "/connected/context") return reply(TEMPLATE);
    if (input === "/api/submissions" && method === "POST") return reply({ id: "sub-1" });
    if (url.pathname === "/api/submissions/sub-1/files" && method === "POST") {
      documents.add(name);
      return reply({ name });
    }
    if (url.pathname === `${REFERENCE}/files` && method === "POST") {
      portfolio.add(name);
      return reply({ name });
    }
    if (input === REFERENCE && method === "POST") {
      named = (JSON.parse(typeof entry.body === "string" ? entry.body : "{}") as { name: string })
        .name;
      return reply({
        name: named,
        holds: "",
        files: [...portfolio].sort(),
        portfolio: readable ? { ...READ, name: named } : null,
        error: readable ? "" : REFUSAL,
      });
    }
    if (input === REFERENCE && method === "DELETE") {
      portfolio.clear();
      return reply({ removed: true });
    }
    if (input === "/api/submissions/sub-1/reading")
      return reply({
        documents: DOCUMENTS.filter(({ source }) => documents.has(source)),
        ignored: [],
        error: "",
      });
    if (input === "/api/submissions/sub-1/summary")
      return reply({
        ...summaryFor(TEMPLATE.submission_caps_usd.credit_snapshot, MODULES),
        ...(readable ? { reference_portfolio: { ...READ, name: named } } : {}),
      });
    if (input === "/api/submissions/sub-1/submit")
      return reply({ run: "20261125-093000-01", status: "queued" });
    if (url.pathname.startsWith("/api/issuers/"))
      return reply({ latest_run: "", runs: 0, latest_as_of: "" });
    return reply({ error: `unknown path ${input}` }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return log;
}

async function start(log: readonly Recorded[]) {
  const navigate = vi.fn();
  render(<ConnectedApp path="/start" mode="synthetic" navigate={navigate} />);
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
  await screen.findByText("1 document inspected, 0 ignored.");
  return navigate;
}

function choosePortfolio(name: string, files: readonly File[]) {
  fireEvent.change(screen.getByLabelText("Portfolio name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Comparison portfolio files"), { target: { files } });
}

async function review() {
  await toPurpose();
  await toContext();
  fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));
  await screen.findByRole("region", { name: "Limits to decide" });
}

async function submit(navigate: ReturnType<typeof vi.fn>) {
  const limits = screen.getByRole("region", { name: "Limits to decide" });
  for (const box of within(limits).getAllByRole("checkbox")) fireEvent.click(box);
  fireEvent.click(screen.getByRole("checkbox", { name: /^Approve: I have read this summary/ }));
  fireEvent.click(screen.getByRole("button", { name: "Submit run" }));
  fireEvent.click(await screen.findByRole("button", { name: "Start no-cost test" }));
  await waitFor(() => {
    expect(navigate).toHaveBeenCalledWith("/run/20261125-093000-01");
  });
}

const onPortfolio = ({ path }: Recorded) => path.startsWith(REFERENCE);
const fact = (term: string) =>
  screen.queryAllByText(term).find((node) => node.tagName === "DT")?.nextElementSibling;

describe("a run with a comparison portfolio", { timeout: 30000 }, () => {
  it("sends the portfolio on its own routes and every other request as a run without one", async () => {
    const plain = service();
    const plainNavigate = await start(plain);
    await review();
    expect(fact("Comparison portfolio")).toBeUndefined();
    await submit(plainNavigate);
    expect(plain.filter(onPortfolio)).toEqual([]);
    cleanup();

    const log = service();
    const navigate = await start(log);
    choosePortfolio("  Example comparison fund ", [HOLDINGS, LIMITS]);
    expect(log.filter(onPortfolio)).toEqual([]); // choosing sends nothing
    fireEvent.click(screen.getByRole("button", { name: "Read portfolio" }));
    const status = await screen.findByText(/^As of 2026-10-31\./);
    expect(status).toHaveTextContent(
      "As of 2026-10-31. 7 positions. 1 position has no price. 3 limits read. Not found in the file: CUSIP, Coupon.",
    );
    await review();
    expect(fact("Comparison portfolio")).toHaveTextContent(
      "Example comparison fund · as of 2026-10-31 · 7 positions",
    );
    await submit(navigate);

    expect(log.filter(onPortfolio)).toEqual([
      {
        method: "POST",
        path: `${REFERENCE}/files?name=SYNTHETIC%20holdings.csv`,
        body: { file: "SYNTHETIC holdings.csv" },
      },
      {
        method: "POST",
        path: `${REFERENCE}/files?name=SYNTHETIC%20constraints.csv`,
        body: { file: "SYNTHETIC constraints.csv" },
      },
      {
        method: "POST",
        path: REFERENCE,
        headers: { "Content-Type": "application/json" },
        body: '{"name":"Example comparison fund","holds":""}',
      },
    ]);
    // Read once, before the review: the review found the draft settled and sent it no more.
    expect(golden(log.filter((entry) => !onPortfolio(entry)))).toBe(golden(plain));
  });

  it("settles an unread portfolio before the summary, so the review covers it", async () => {
    const log = service();
    await start(log);
    choosePortfolio("Example comparison fund", [HOLDINGS]);
    fireEvent.change(screen.getByLabelText("What it holds"), { target: { value: "loans" } });
    await review();
    const paths = log.map(({ method, path }) => `${method} ${path}`);
    expect(
      paths.slice(paths.indexOf(`POST ${REFERENCE}/files?name=SYNTHETIC%20holdings.csv`)),
    ).toEqual([
      `POST ${REFERENCE}/files?name=SYNTHETIC%20holdings.csv`,
      `POST ${REFERENCE}`,
      "POST /api/submissions/sub-1/summary",
    ]);
    expect(log.find(({ path, method }) => path === REFERENCE && method === "POST")?.body).toBe(
      '{"name":"Example comparison fund","holds":"loans"}',
    );
    expect(fact("Comparison portfolio")).toHaveTextContent("Example comparison fund");
  });

  it("says the service's refusal on the name box; once removed the run is reviewed without it", async () => {
    const log = service();
    const navigate = await start(log);
    choosePortfolio("Not a portfolio", [NOTES]);
    fireEvent.click(screen.getByRole("button", { name: "Read portfolio" }));
    expect(await screen.findByText(REFUSAL)).toHaveRole("alert");
    const name = screen.getByLabelText("Portfolio name");
    expect(name).toBeInvalid();
    expect(name).toHaveAccessibleDescription(REFUSAL);
    await waitFor(() => {
      expect(name).toHaveFocus();
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove comparison portfolio" }));
    expect(screen.queryByText(REFUSAL)).toBeNull();
    expect(screen.getByLabelText("Portfolio name")).toHaveValue("");
    expect(screen.queryByRole("list", { name: "Comparison portfolio files chosen" })).toBeNull();
    await review();
    expect(fact("Comparison portfolio")).toBeUndefined();
    await submit(navigate);
    const paths = log.map(({ method, path }) => `${method} ${path}`);
    // The draft still held the refused files: they are removed before the summary is asked for.
    expect(paths.indexOf(`DELETE ${REFERENCE}`)).toBe(
      paths.indexOf("POST /api/submissions/sub-1/summary") - 1,
    );
    expect(paths.filter((path) => path === `DELETE ${REFERENCE}`)).toHaveLength(1);
  });

  it("asks for a name before sending anything, and refuses a file that is not CSV or Excel", async () => {
    const log = service();
    await start(log);
    fireEvent.change(screen.getByLabelText("Comparison portfolio files"), {
      target: { files: [SLIDES, HOLDINGS, HOLDINGS] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "slides.pdf is not a CSV or Excel file. SYNTHETIC holdings.csv is already chosen.",
    );
    expect(
      within(screen.getByRole("list", { name: "Comparison portfolio files chosen" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Read portfolio" }));
    expect(await screen.findByText("Give the comparison portfolio a name.")).toHaveRole("alert");
    expect(log.filter(onPortfolio)).toEqual([]);
    // A portfolio with no name stops the review on Documents, at its name box.
    await toPurpose();
    await toContext();
    fireEvent.change(screen.getByLabelText("Legal documents"), { target: { value: "none" } });
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    expect(await screen.findByText("Give the comparison portfolio a name.")).toHaveRole("alert");
    expect(screen.getByRole("heading", { name: "Documents", level: 2 })).toBeVisible();
    expect(log.some(({ path }) => path.endsWith("/summary"))).toBe(false);
  });
});
