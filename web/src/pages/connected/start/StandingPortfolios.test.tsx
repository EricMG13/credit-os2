/**
 * The Documents step's standing portfolios, drawn by their own hook against a synthetic service:
 * the line each portfolio is given, the fetch of an index fund's latest holdings, the first fetch
 * asked for once and only when a fund was never fetched, and a replacement from the analyst's own
 * file. Every name, date and count is SYNTHETIC; the expected words are written by hand.
 */
import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StandingPortfolio } from "../api";
import { recorded, type Recorded } from "./connectedTesting";
import { StandingPortfolios } from "./StandingPortfolios";
import { useStandingPortfolios } from "./standingPortfolios";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const LVLN = "Loan index fund (LVLN)";
const JNK = "High-yield bond fund (JNK)";
const NOT_FOUND = `${LVLN}: the holdings file could not be fetched (server answered HTTP 404).`;
const NO_TABLE =
  "No holdings table was found. notes.csv has no header row naming a holding and its weight, par or market value.";
const BUSY = `${LVLN} is already being fetched or replaced; try again when it has finished.`;
const BASE = "/api/reference-portfolios";

function entry(over: Partial<StandingPortfolio> & Pick<StandingPortfolio, "key">) {
  return {
    name: "",
    as_of: null,
    stored_at: null,
    positions: null,
    failure: null,
    error: null,
    fetchable: true,
    ...over,
  };
}

const CLO_SET = entry({
  key: "clo",
  name: "CLO portfolio",
  as_of: "2026-10-31",
  stored_at: "2026-11-01T08:00:00+00:00",
  positions: 7,
  fetchable: false,
});
const CLO_NONE = entry({ key: "clo", name: "CLO portfolio", fetchable: false });
const LVLN_SET = entry({
  key: "lvln",
  name: LVLN,
  as_of: "2026-11-24",
  stored_at: "2026-11-24T18:00:00+00:00",
  positions: 5,
});
const LVLN_FAILED = {
  ...LVLN_SET,
  failure: { message: NOT_FOUND, at: "2026-11-25T09:30:00+00:00" },
};
const LVLN_NONE = entry({ key: "lvln", name: LVLN });
const JNK_SET = entry({
  key: "jnk",
  name: JNK,
  as_of: "2026-11-23",
  stored_at: "2026-11-25T09:30:00+00:00",
  positions: 2,
});
const JNK_NONE = entry({ key: "jnk", name: JNK });
const JNK_FAILED = {
  ...JNK_NONE,
  failure: {
    message: `${JNK}: the holdings file could not be fetched (server answered HTTP 503).`,
    at: "2026-11-25T09:30:00+00:00",
  },
};

type Answer = { status?: number; body: unknown } | (() => Promise<Response>);

/** A fetch answering each `METHOD path` from `routes` in turn (the last answer repeats). */
function service(routes: Record<string, Answer[]>) {
  const log: Recorded[] = [];
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    const entry = recorded(input, init, []);
    log.push(entry);
    const key = `${entry.method} ${input}`;
    const answers = routes[key];
    const answer = answers?.length
      ? answers.length > 1
        ? answers.shift()
        : answers[0]
      : undefined;
    if (answer === undefined)
      return Promise.resolve(Response.json({ error: `unknown path ${key}` }, { status: 404 }));
    if (typeof answer === "function") return answer();
    return Promise.resolve(Response.json(answer.body, { status: answer.status ?? 200 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return log;
}

const listing = (...portfolios: StandingPortfolio[]) => ({ body: { portfolios } });
const calls = (log: readonly Recorded[]) => log.map(({ method, path }) => `${method} ${path}`);

function Standing() {
  return <StandingPortfolios view={useStandingPortfolios()} />;
}

/** What a line says, paragraph by paragraph, its buttons left out. */
const said = (line: HTMLElement) =>
  Array.from(line.querySelectorAll("p"), (paragraph) => paragraph.textContent).filter(Boolean);

async function lineOf(name: string) {
  const list = await screen.findByRole("list", { name: "Standing portfolios" });
  const line = within(list)
    .getAllByRole("listitem")
    .find((item) => item.querySelector("p")?.textContent === name);
  if (!line) throw new Error(`no line for ${name}`);
  return line;
}

describe("the standing portfolios' lines", () => {
  it("say each portfolio's date and size, or that it is not yet available, in a reader's words", async () => {
    const log = service({ [`GET ${BASE}`]: [listing(CLO_NONE, LVLN_SET, JNK_SET)] });
    render(<Standing />);
    const section = screen.getByRole("region", { name: "Standing portfolios" });
    expect(section).toHaveTextContent(
      "The report compares the issuer with these portfolios. The two index holdings are fetched from the fund manager's daily files when you ask, or the first time they are needed; you can also supply a file yourself.",
    );
    expect(await lineOf("CLO portfolio")).toHaveTextContent("CLO portfolioNot yet available");
    expect(await lineOf(LVLN)).toHaveTextContent(`${LVLN}As of 2026-11-24 · 5 positions`);
    expect(await lineOf(JNK)).toHaveTextContent(`${JNK}As of 2026-11-23 · 2 positions`);
    // The CLO portfolio is never fetched: it is supplied as a file. Each fund can be fetched.
    expect(
      screen.getAllByRole("button", { name: /^Fetch latest holdings/ }).map((b) => b.ariaLabel),
    ).toEqual([`Fetch latest holdings: ${LVLN}`, `Fetch latest holdings: ${JNK}`]);
    expect(
      screen.getAllByRole("button", { name: /^Replace with a file/ }).map((b) => b.ariaLabel),
    ).toEqual([
      "Replace with a file: CLO portfolio",
      `Replace with a file: ${LVLN}`,
      `Replace with a file: ${JNK}`,
    ]);
    expect(calls(log)).toEqual([`GET ${BASE}`]); // every fund is stored: no first fetch
    // No module id, key, hash, file address or stored time in what a reader sees.
    expect(section.textContent).not.toMatch(/CP-|lvln|jnk|clo\b|https?:|ssga|sha|T\d\d:\d\d/);
  });

  it("say a failed fetch beside the holdings it left in place, and one with none left", async () => {
    service({ [`GET ${BASE}`]: [listing(CLO_SET, LVLN_FAILED, JNK_FAILED)] });
    render(<Standing />);
    expect(said(await lineOf(LVLN))).toEqual([
      LVLN,
      "As of 2026-11-24 · 5 positions",
      `The last fetch failed: ${NOT_FOUND} Showing the holdings as of 2026-11-24.`,
    ]);
    expect(said(await lineOf(JNK))).toEqual([
      JNK,
      "Not yet available",
      `The last fetch failed: ${JNK}: the holdings file could not be fetched (server answered HTTP 503).`,
    ]);
    expect(screen.queryByRole("alert")).toBeNull(); // the state of the store, not an action's
  });

  it("say why a stored set cannot be read", async () => {
    const error =
      "The stored set cannot be read: its file is damaged or is not a stored portfolio.";
    service({ [`GET ${BASE}`]: [listing(CLO_SET, { ...LVLN_NONE, error }, JNK_SET)] });
    render(<Standing />);
    expect(said(await lineOf(LVLN))).toEqual([LVLN, "Not yet available", error]);
  });

  it("say when the service could not list them, without an alert", async () => {
    service({});
    render(<Standing />);
    expect(
      await screen.findByText(
        "The standing portfolios could not be listed. Unknown path GET /api/reference-portfolios.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("list", { name: "Standing portfolios" })).toBeNull();
  });
});

describe("the first fetch", () => {
  it("is asked for once, even when the page's effects run twice, when a fund was never fetched", async () => {
    let finish: (value: Response) => void = () => undefined;
    const log = service({
      [`GET ${BASE}`]: [listing(CLO_NONE, LVLN_SET, JNK_NONE)],
      [`POST ${BASE}/ensure`]: [
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ],
    });
    render(
      <StrictMode>
        <Standing />
      </StrictMode>,
    );
    const jnk = await lineOf(JNK);
    await waitFor(() => {
      expect(within(jnk).getByRole("status")).toHaveTextContent("Fetching the latest holdings…");
    });
    expect(
      within(jnk).getByRole("button", { name: `Fetch latest holdings: ${JNK}` }),
    ).toBeDisabled();
    // The fund already stored stays usable while the other is fetched.
    expect(screen.getByRole("button", { name: `Fetch latest holdings: ${LVLN}` })).toBeEnabled();
    finish(Response.json({ portfolios: [CLO_NONE, LVLN_SET, JNK_SET] }));
    await waitFor(() => {
      expect(jnk).toHaveTextContent(`${JNK}As of 2026-11-23 · 2 positions`);
    });
    expect(within(jnk).getByRole("status")).toBeEmptyDOMElement();
    expect(calls(log).filter((call) => call.startsWith("POST"))).toEqual([`POST ${BASE}/ensure`]);
  });

  it("is not asked for when every fund is stored or its last fetch failed", async () => {
    const log = service({ [`GET ${BASE}`]: [listing(CLO_NONE, LVLN_FAILED, JNK_FAILED)] });
    render(<Standing />);
    await lineOf(JNK);
    expect(calls(log)).toEqual([`GET ${BASE}`]);
  });
});

describe("fetching the latest holdings", () => {
  it("is disabled while it runs, then says what was stored and how the file changed", async () => {
    let finish: (value: Response) => void = () => undefined;
    const log = service({
      [`GET ${BASE}`]: [listing(CLO_SET, LVLN_SET, JNK_SET)],
      [`POST ${BASE}/lvln/refresh`]: [
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ],
    });
    render(<Standing />);
    const line = await lineOf(LVLN);
    const button = within(line).getByRole("button", { name: `Fetch latest holdings: ${LVLN}` });
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
    expect(within(line).getByRole("button", { name: /^Replace with a file/ })).toBeDisabled();
    expect(within(line).getByRole("status")).toHaveTextContent("Fetching the latest holdings…");
    finish(
      Response.json({
        outcome: "stored",
        as_of: "2026-11-25",
        file_as_of: "2026-11-25",
        message: null,
        columns_gained: ["ISIN"],
        columns_lost: ["Coupon", "Sector"],
        portfolios: [CLO_SET, { ...LVLN_SET, as_of: "2026-11-25" }, JNK_SET],
      }),
    );
    await waitFor(() => {
      expect(within(line).getByRole("status")).toHaveTextContent(
        "Fetched: the holdings as of 2026-11-25 are stored. The file's columns changed. New in the file: ISIN. No longer in the file: Coupon, Sector.",
      );
    });
    expect(line).toHaveTextContent("As of 2026-11-25 · 5 positions");
    expect(button).toBeEnabled();
    expect(calls(log)).toEqual([`GET ${BASE}`, `POST ${BASE}/lvln/refresh`]);
  });

  it("says a file older than the stored set was kept out", async () => {
    const kept = `${LVLN}: the file fetched is as of 20 November 2026, older than the stored set of 24 November 2026, which is kept.`;
    service({
      [`GET ${BASE}`]: [listing(CLO_SET, LVLN_SET, JNK_SET)],
      [`POST ${BASE}/lvln/refresh`]: [
        {
          body: {
            outcome: "kept",
            as_of: "2026-11-24",
            file_as_of: "2026-11-20",
            message: kept,
            columns_gained: [],
            columns_lost: [],
            portfolios: [CLO_SET, LVLN_SET, JNK_SET],
          },
        },
      ],
    });
    render(<Standing />);
    const line = await lineOf(LVLN);
    fireEvent.click(within(line).getByRole("button", { name: `Fetch latest holdings: ${LVLN}` }));
    await waitFor(() => {
      expect(within(line).getByRole("status")).toHaveTextContent(kept);
    });
  });

  it("says a stored file is stale when the service says so", async () => {
    const stale = `${LVLN}: the file fetched is as of 1 October 2026, 55 days before it was fetched on 25 November 2026: it is stale.`;
    service({
      [`GET ${BASE}`]: [listing(CLO_SET, LVLN_NONE, JNK_SET)],
      [`POST ${BASE}/lvln/refresh`]: [
        {
          body: {
            outcome: "stored",
            as_of: "2026-10-01",
            file_as_of: "2026-10-01",
            message: stale,
            columns_gained: [],
            columns_lost: [],
            portfolios: [CLO_SET, { ...LVLN_SET, as_of: "2026-10-01" }, JNK_SET],
          },
        },
      ],
      [`POST ${BASE}/ensure`]: [listing(CLO_SET, LVLN_NONE, JNK_SET)],
    });
    render(<Standing />);
    const line = await lineOf(LVLN);
    const button = within(line).getByRole("button", { name: `Fetch latest holdings: ${LVLN}` });
    await waitFor(() => {
      expect(button).toBeEnabled(); // the first fetch, asked for on loading, has answered
    });
    fireEvent.click(button);
    await waitFor(() => {
      expect(within(line).getByRole("status")).toHaveTextContent(
        `Fetched: the holdings as of 2026-10-01 are stored. ${stale}`,
      );
    });
  });

  it("alerts a failed fetch, whose reason the line gives beside the holdings kept", async () => {
    service({
      [`GET ${BASE}`]: [listing(CLO_SET, LVLN_SET, JNK_SET)],
      [`POST ${BASE}/lvln/refresh`]: [
        {
          body: {
            outcome: "failed",
            as_of: "2026-11-24",
            file_as_of: null,
            message: NOT_FOUND,
            columns_gained: [],
            columns_lost: [],
            portfolios: [CLO_SET, LVLN_FAILED, JNK_SET],
          },
        },
      ],
    });
    render(<Standing />);
    const line = await lineOf(LVLN);
    fireEvent.click(within(line).getByRole("button", { name: `Fetch latest holdings: ${LVLN}` }));
    expect(await within(line).findByRole("alert")).toHaveTextContent(
      "The fetch failed. Nothing was replaced.",
    );
    expect(line).toHaveTextContent(
      `The last fetch failed: ${NOT_FOUND} Showing the holdings as of 2026-11-24.`,
    );
  });

  it("alerts the service's refusal while another fetch of the fund runs", async () => {
    service({
      [`GET ${BASE}`]: [listing(CLO_SET, LVLN_SET, JNK_SET)],
      [`POST ${BASE}/lvln/refresh`]: [{ status: 409, body: { error: BUSY } }],
    });
    render(<Standing />);
    const line = await lineOf(LVLN);
    fireEvent.click(within(line).getByRole("button", { name: `Fetch latest holdings: ${LVLN}` }));
    expect(await within(line).findByRole("alert")).toHaveTextContent(
      `${BUSY} Nothing was replaced.`,
    );
    expect(line).toHaveTextContent("As of 2026-11-24 · 5 positions");
  });
});

describe("replacing a portfolio with a file", () => {
  const HOLDINGS = new File(["holdings"], "SYNTHETIC holdings.csv", { type: "text/csv" });
  const MANDATE = new File(["mandate"], "SYNTHETIC mandate.csv", { type: "text/csv" });
  const NOTES = new File(["notes"], "notes.csv", { type: "text/csv" });

  it("sends the chosen files on the portfolio's own routes and shows what was stored", async () => {
    const log = service({
      [`GET ${BASE}`]: [listing(CLO_NONE, LVLN_SET, JNK_SET)],
      [`DELETE ${BASE}/clo/files`]: [{ body: { cleared: true } }],
      [`POST ${BASE}/clo/files?name=SYNTHETIC%20holdings.csv`]: [{ body: { name: HOLDINGS.name } }],
      [`POST ${BASE}/clo/files?name=SYNTHETIC%20mandate.csv`]: [{ body: { name: MANDATE.name } }],
      [`POST ${BASE}/clo`]: [
        {
          body: {
            portfolio: {
              name: "CLO portfolio",
              as_of: "2026-10-31",
              positions: 7,
              unpriced: 1,
              limits: 0,
              found: ["Borrower", "Bid", "Ask"],
              not_found: ["CUSIP", "Coupon"],
              findings: [],
            },
            portfolios: [CLO_SET, LVLN_SET, JNK_SET],
          },
        },
      ],
    });
    render(<Standing />);
    const line = await lineOf("CLO portfolio");
    const picker = within(line).getByLabelText<HTMLInputElement>("Files for CLO portfolio");
    expect([picker.type, picker.multiple, picker.accept]).toEqual(["file", true, ".csv,.xlsx"]);
    fireEvent.change(picker, { target: { files: [HOLDINGS, MANDATE] } });
    await waitFor(() => {
      expect(within(line).getByRole("status")).toHaveTextContent(
        "Stored. As of 2026-10-31. 7 positions. 1 position has no price. No limits were read. Not found in the file: CUSIP, Coupon.",
      );
    });
    expect(line).toHaveTextContent("CLO portfolioAs of 2026-10-31 · 7 positions");
    expect(log.slice(1)).toEqual([
      { method: "DELETE", path: `${BASE}/clo/files` },
      {
        method: "POST",
        path: `${BASE}/clo/files?name=SYNTHETIC%20holdings.csv`,
        body: { file: "an unknown File object" },
      },
      {
        method: "POST",
        path: `${BASE}/clo/files?name=SYNTHETIC%20mandate.csv`,
        body: { file: "an unknown File object" },
      },
      { method: "POST", path: `${BASE}/clo` },
    ]);
  });

  it("alerts the service's reason when the file is not a portfolio, and keeps the line", async () => {
    service({
      [`GET ${BASE}`]: [listing(CLO_SET, LVLN_SET, JNK_SET)],
      [`DELETE ${BASE}/lvln/files`]: [{ body: { cleared: true } }],
      [`POST ${BASE}/lvln/files?name=notes.csv`]: [{ body: { name: NOTES.name } }],
      [`POST ${BASE}/lvln`]: [{ status: 400, body: { error: NO_TABLE } }],
    });
    render(<Standing />);
    const line = await lineOf(LVLN);
    fireEvent.change(within(line).getByLabelText(`Files for ${LVLN}`), {
      target: { files: [NOTES] },
    });
    expect(await within(line).findByRole("alert")).toHaveTextContent(
      `${NO_TABLE} Nothing was replaced.`,
    );
    expect(line).toHaveTextContent("As of 2026-11-24 · 5 positions");
    expect(within(line).getByRole("button", { name: /^Replace with a file/ })).toBeEnabled();
  });

  it("refuses a file that is not CSV or Excel, or more than four, before sending anything", async () => {
    const log = service({ [`GET ${BASE}`]: [listing(CLO_SET, LVLN_SET, JNK_SET)] });
    render(<Standing />);
    const line = await lineOf("CLO portfolio");
    const slides = new File(["slides"], "slides.pdf", { type: "application/pdf" });
    fireEvent.change(within(line).getByLabelText("Files for CLO portfolio"), {
      target: { files: [slides, HOLDINGS] },
    });
    expect(await within(line).findByRole("alert")).toHaveTextContent(
      "slides.pdf is not a CSV or Excel file. Nothing was replaced.",
    );
    const five = ["a", "b", "c", "d", "e"].map((name) => new File([name], `${name}.csv`));
    fireEvent.change(within(line).getByLabelText("Files for CLO portfolio"), {
      target: { files: five },
    });
    expect(await within(line).findByRole("alert")).toHaveTextContent(
      "Choose at most 4 files. Nothing was replaced.",
    );
    expect(calls(log)).toEqual([`GET ${BASE}`]);
  });
});
