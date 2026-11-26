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

describe("a failed automatic fetch", () => {
  it("is worded as the fetch failing, and is cleared by a later fetch that succeeds", async () => {
    service({
      [`GET ${BASE}`]: { body: { portfolios: [CLO, LVLN, JNK] } },
      [`POST ${BASE}/ensure`]: {
        status: 502,
        body: { error: "The fund manager's site did not answer." },
      },
      [`POST ${BASE}/lvln/refresh`]: {
        body: {
          outcome: "stored",
          as_of: "2026-11-24",
          file_as_of: "2026-11-24",
          message: null,
          columns_gained: [],
          columns_lost: [],
          portfolios: [CLO, LVLN_SET, JNK],
        },
      },
    });
    render(<Standing />);
    const problem = await screen.findByText(
      /^The automatic fetch of the standing portfolios failed\./,
    );
    expect(problem).toHaveTextContent(
      "The automatic fetch of the standing portfolios failed. The fund manager's site did not answer.",
    );
    expect(screen.queryByText(new RegExp(LISTED))).toBeNull();
    const button = screen.getByRole("button", {
      name: "Fetch latest holdings: Loan index fund (LVLN)",
    });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    fireEvent.click(button);
    await waitFor(() => {
      expect(
        within(screen.getByRole("region", { name: "Standing portfolios" })).queryByText(
          /automatic fetch/,
        ),
      ).toBeNull();
    });
  });
});
