// Final batch item 7 (C6): the Coverage page names CP-L10 by the run's pathway.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { Coverage, CoverageRun, Issuer } from "../coverageData";
import { IssuerDetail } from "./IssuerDetail";
import { RunStates } from "./RunStates";
import { named } from "./shared";

afterEach(cleanup);

const column = { code: "CP-L10", title: "Service title" };
const runOf = (pathway: string): CoverageRun => ({
  key: "r1",
  folder: "r1-run",
  asOf: "2026-03-31",
  pathway,
  pathwayTitle: pathway,
  cells: { "CP-L10": { state: "assessed" } },
  other: [{ code: "CP-L10", title: "Service title", state: "assessed" }],
});
const data = { columns: [column], issuers: [], fields: [], facts: [] } as Coverage;
const issuerOf = (pathway: string): Issuer => ({
  key: "a",
  name: "Alpha plc",
  sector: "Industrial",
  runs: [runOf(pathway)],
});

it("named() takes the pathway and keeps the default without one", () => {
  expect(named(column, "credit_screening")).toBe("Credit screening");
  expect(named(column)).toBe("Short credit snapshot");
  expect(named({ code: "CP-ZZ", title: "Service title" }, "credit_screening")).toBe("Service title");
});

it("RunStates and the issuer detail name the module for a credit screening run", () => {
  render(<RunStates data={data} run={runOf("credit_screening")} />);
  expect(screen.getByRole("link", { name: "Credit screening" })).toBeInTheDocument();
  cleanup();
  render(<IssuerDetail data={data} issuer={issuerOf("credit_screening")} />);
  expect(screen.getAllByText(/Credit screening/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Short credit snapshot/)).toBeNull();
});

it("leave another pathway's name unchanged", () => {
  render(<IssuerDetail data={data} issuer={issuerOf("short_snapshot")} />);
  expect(screen.getAllByText(/Short credit snapshot/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Credit screening/)).toBeNull();
});
