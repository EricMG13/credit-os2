import { afterEach, expect, it, vi } from "vitest";
import { getLatestIssuerRun } from "./api";

afterEach(() => vi.unstubAllGlobals());

it("J2-012 retains the filed issuer name in the latest-run contract", async () => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({
    latest_run: "prior-run", runs: 2, latest_as_of: "2026-03-31", issuer_name: "Northbridge plc",
  }))));
  const filed = await getLatestIssuerRun("northbridge");
  expect(filed.issuer_name).toBe("Northbridge plc");
});

it("J5-010 retains exact approved summary limits in the public run contract", async () => {
  const { getRun } = await import("./api");
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({
    approved_summary_limits: [{ id: "quotes-none", scope: "Market", outcome: "Will limit", reason: "No quotes were supplied." }],
  }))));
  const run = await getRun("prior-run", new AbortController().signal);
  expect(run.approved_summary_limits?.[0]?.reason).toBe("No quotes were supplied.");
});
