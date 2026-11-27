import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { ScriptCheckOutcome } from "../publishedReport";
import { CheckCard } from "./scriptCheckParts";

afterEach(cleanup);

const outcome = (register: string | null): ScriptCheckOutcome => ({
  figure: "Net debt",
  register,
  row: null,
  status: "not checked",
  reason: "No script",
  script: null,
  stated: null,
  recomputed: null,
  recomputedLabel: null,
  tolerance: null,
  unit: null,
});

it("counts merged checks when none names a register", () => {
  render(<CheckCard group={[outcome(null), outcome(null)]} />);
  expect(screen.getByRole("heading", { name: "2 checks · Net debt" })).toBeInTheDocument();
});

it("counts registers only when every merged check names one", () => {
  render(<CheckCard group={[outcome("A"), outcome("B")]} />);
  expect(screen.getByRole("heading", { name: "2 registers · Net debt" })).toBeInTheDocument();
});

it("counts checks when only some name a register", () => {
  render(<CheckCard group={[outcome("A"), outcome(null), outcome(null)]} />);
  expect(screen.getByRole("heading", { name: "3 checks · Net debt" })).toBeInTheDocument();
});
