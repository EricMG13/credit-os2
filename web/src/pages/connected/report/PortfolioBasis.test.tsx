import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LegacyVisuals } from "../visuals";
import { PortfolioBasisProvider, usePortfolioBasisFailed } from "./PortfolioBasis";

const output = {
  charts: [
    {
      title: "Portfolio limits",
      table: 20,
      kind: "limits",
      label: 0,
      current: 1,
      proposed: 2,
      limit: 3,
      unit: "% NAV",
    },
  ],
};
const sections = [
  {
    blocks: [
      {
        type: "table",
        line: 20,
        headers: [
          "Limit",
          "Current exposure",
          "Proposed exposure",
          "Limit value",
          "Reporting unit",
          "Basis and limitation",
        ],
        rows: [{ cells: ["Sector", "12.50", "13.25", "15.0", "% NAV", "Synthetic."] }],
      },
    ],
  },
];

function draw(enabled: boolean) {
  return render(
    <PortfolioBasisProvider folder="run" enabled={enabled}>
      <LegacyVisuals
        output={output}
        sections={sections}
        evidenceHref={(line) => `#line-${String(line)}`}
      />
    </PortfolioBasisProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("says nothing about the portfolio basis until its request has answered", async () => {
  let answer: (response: Response) => void = () => {};
  vi.stubGlobal(
    "fetch",
    () =>
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
  );
  draw(true);
  expect(screen.getByRole("status")).toHaveTextContent("Loading the portfolio limits");
  expect(screen.queryByText("Not established for this run")).toBeNull();
  expect(screen.queryByRole("table")).toBeNull();
  answer(Response.json({ basis: null }));
  await waitFor(() => {
    expect(screen.getByText("Not established for this run")).toBeInTheDocument();
  });
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("table", { name: "Portfolio limits" })).toBeInTheDocument();
});

it("shows the gap at once when no portfolio basis is requested", () => {
  draw(false);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText("Not established for this run")).toBeInTheDocument();
});

it("does not read a failed request as no basis, and logs it with the folder and status", async () => {
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", () => Promise.resolve(new Response("boom", { status: 500 })));
  let failed = false;
  function Probe() {
    failed = usePortfolioBasisFailed();
    return null;
  }
  render(
    <PortfolioBasisProvider folder="run" enabled>
      <Probe />
    </PortfolioBasisProvider>,
  );
  await waitFor(() => {
    expect(failed).toBe(true);
  });
  expect(logged).toHaveBeenCalledWith("The portfolio basis could not be loaded", {
    folder: "run",
    detail: { status: 500 },
  });
  logged.mockRestore();
});

it("reads a 404 as no basis, not a failure", async () => {
  vi.stubGlobal("fetch", () => Promise.resolve(new Response("", { status: 404 })));
  const seen: boolean[] = [];
  function Probe() {
    seen.push(usePortfolioBasisFailed());
    return null;
  }
  render(
    <PortfolioBasisProvider folder="run" enabled>
      <Probe />
    </PortfolioBasisProvider>,
  );
  await waitFor(() => {
    expect(seen.length).toBeGreaterThan(1);
  });
  expect(seen).not.toContain(true);
});

it("does not take the disabled load as the answer once the basis is requested", async () => {
  let answer: (response: Response) => void = () => {};
  vi.stubGlobal(
    "fetch",
    () =>
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
  );
  const { rerender } = draw(false);
  // Let the disabled load settle first, as it does in the browser before the basis is requested.
  await act(async () => {
    await Promise.resolve();
  });
  rerender(
    <PortfolioBasisProvider folder="run" enabled>
      <LegacyVisuals
        output={output}
        sections={sections}
        evidenceHref={(line) => `#line-${String(line)}`}
      />
    </PortfolioBasisProvider>,
  );
  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Loading the portfolio limits");
  });
  expect(screen.queryByText("Not established for this run")).toBeNull();
  answer(Response.json({ basis: null }));
  await waitFor(() => {
    expect(screen.getByText("Not established for this run")).toBeInTheDocument();
  });
});
