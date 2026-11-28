/**
 * The standing portfolios' first fetch failing: the page says the automatic fetch failed, not that
 * the listing did, and says nothing stale once a later fetch succeeds. The service is SYNTHETIC.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StandingPortfolio } from "../api";
import { StandingPortfolios } from "./StandingPortfolios";
import { useStandingPortfolios } from "./standingPortfoliosModel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const BASE = "/api/reference-portfolios";
const base = { as_of: null, stored_at: null, positions: null, failure: null, error: null };
const CLO: StandingPortfolio = { ...base, key: "clo", name: "CLO portfolio", fetchable: false };
const LVLN: StandingPortfolio = {
  ...base,
  key: "lvln",
  name: "Loan index fund (LVLN)",
  fetchable: true,
};
const JNK: StandingPortfolio = {
  ...base,
  key: "jnk",
  name: "High-yield bond fund (JNK)",
  fetchable: true,
};
const LVLN_SET: StandingPortfolio = {
  ...LVLN,
  as_of: "2026-11-24",
  stored_at: "2026-11-24T18:00:00+00:00",
  positions: 5,
};

function service(routes: Record<string, { status?: number; body: unknown }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string, init?: RequestInit) => {
      const answer = routes[`${init?.method ?? "GET"} ${input}`];
      if (!answer)
        return Promise.resolve(Response.json({ error: "unknown path" }, { status: 404 }));
      return Promise.resolve(Response.json(answer.body, { status: answer.status ?? 200 }));
    }),
  );
}

function Standing() {
  return <StandingPortfolios view={useStandingPortfolios()} />;
}

const LISTED = "The standing portfolios could not be listed.";

const JNK_SET: StandingPortfolio = {
  ...JNK,
  as_of: "2026-11-23",
  stored_at: "2026-11-25T09:30:00+00:00",
  positions: 2,
};
const NOTICE =
  "The automatic fetch of the standing portfolios failed. The fund manager's site did not answer.";

const stored = (key: string, portfolios: StandingPortfolio[]) => ({
  [`POST ${BASE}/${key}/refresh`]: {
    body: {
      outcome: "stored",
      as_of: "2026-11-24",
      file_as_of: "2026-11-24",
      message: null,
      columns_gained: [],
      columns_lost: [],
      portfolios,
    },
  },
});

const ENSURE_502 = {
  [`POST ${BASE}/ensure`]: {
    status: 502,
    body: { error: "The fund manager's site did not answer." },
  },
};

async function fetchLatest(name: string) {
  const button = screen.getByRole("button", { name: `Fetch latest holdings: ${name}` });
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  fireEvent.click(button);
}

const region = () => screen.getByRole("region", { name: "Standing portfolios" });

describe("a failed automatic fetch", () => {
  it("is worded as the fetch failing and stays until no fund is still never fetched", async () => {
    service({
      [`GET ${BASE}`]: { body: { portfolios: [CLO, LVLN, JNK] } },
      ...ENSURE_502,
      ...stored("lvln", [CLO, LVLN_SET, JNK]),
      ...stored("jnk", [CLO, LVLN_SET, JNK_SET]),
    });
    render(<Standing />);
    const problem = await screen.findByText(
      /^The automatic fetch of the standing portfolios failed\./,
    );
    expect(problem).toHaveTextContent(NOTICE);
    expect(screen.queryByText(new RegExp(LISTED))).toBeNull();
    await fetchLatest("Loan index fund (LVLN)");
    await screen.findByText(/As of 2026-11-24 · 5 positions/);
    expect(region()).toHaveTextContent(NOTICE); // JNK is still never fetched
    await fetchLatest("High-yield bond fund (JNK)");
    await screen.findByText(/As of 2026-11-23 · 2 positions/);
    await waitFor(() => {
      expect(within(region()).queryByText(/automatic fetch/)).toBeNull();
    });
  });

  it("stays when a fetch of one fund failed while the other is still never fetched", async () => {
    const failed = {
      ...LVLN,
      failure: { message: "Loan index fund (LVLN): HTTP 404.", at: "2026-11-25T09:30:00+00:00" },
    };
    service({
      [`GET ${BASE}`]: { body: { portfolios: [CLO, LVLN, JNK] } },
      ...ENSURE_502,
      [`POST ${BASE}/lvln/refresh`]: {
        body: {
          outcome: "failed",
          as_of: null,
          file_as_of: null,
          message: "Loan index fund (LVLN): HTTP 404.",
          columns_gained: [],
          columns_lost: [],
          portfolios: [CLO, failed, JNK],
        },
      },
    });
    render(<Standing />);
    await screen.findByText(/^The automatic fetch of the standing portfolios failed\./);
    await fetchLatest("Loan index fund (LVLN)");
    await screen.findByText(/The last fetch failed: Loan index fund \(LVLN\): HTTP 404\./);
    expect(region()).toHaveTextContent(NOTICE);
  });
});
