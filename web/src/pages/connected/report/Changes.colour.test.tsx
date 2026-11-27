import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PublishedChanges, PublishedRun, Snapshot } from "../publishedReport";
import { ReportChanges } from "./Changes";

afterEach(cleanup);

const run = { folder: "current" } as PublishedRun;
const snapshot = { chips: {} } as unknown as Snapshot;
const side = (value: string, unit: string, period = "FY2026") => ({ value, unit, period });

type Case = {
  key: string;
  difference: number | string | null;
  kind?: string;
  same_period?: boolean;
  unit?: string;
};

function draw(cases: Case[]) {
  const measures = cases.map(({ key, difference, same_period, unit = "x" }) => ({
    key,
    label: `Measure ${key}`,
    prior: side("1", unit, "FY2025"),
    current: side("2", unit, same_period ? "FY2025" : "FY2026"),
    difference,
    same_period,
    unit,
  }));
  const change: PublishedChanges = {
    pack: { measures },
    verdicts: {
      measures: Object.fromEntries(
        cases.map(({ key, kind = "comparable" }) => [key, { kind, label: "Label", reason: "Why" }]),
      ),
    },
  };
  render(<ReportChanges snapshot={snapshot} run={run} entries={[]} change={change} />);
  return (key: string) => {
    const row = screen.getByText(`Measure ${key}`).closest("li");
    return row?.querySelector<HTMLElement>("[data-change]") ?? null;
  };
}

function need(el: HTMLElement | null) {
  if (!el) throw new Error("the change figure was not drawn");
  return el;
}
const status = (el: HTMLElement) =>
  ["text-success-text", "text-warning-text", "text-better-mark", "text-worse-mark"].filter((name) =>
    el.classList.contains(name),
  );
const WORDS = /better|worse|unchanged/g;
/** The tone word drawn in the figure, once and never sr-only; null when no tone word is drawn. */
const word = (el: HTMLElement) => {
  expect(el.querySelector(".sr-only")).toBeNull();
  const found = el.textContent.match(WORDS) ?? [];
  expect(found.length).toBeLessThanOrEqual(1);
  return found[0] ?? null;
};
const shape = (el: HTMLElement) =>
  [...el.querySelectorAll("[data-shape]")].map((s) => s.getAttribute("data-shape"));

describe("Changes rows colour a comparable change by the owner's table", () => {
  it("worse, better and unchanged carry colour, a visible word and a shape", () => {
    const figure = draw([
      { key: "net_leverage", difference: 0.3 },
      { key: "coverage", difference: 0.5 },
      { key: "undrawn", difference: 0 },
    ]);
    const worse = need(figure("net_leverage"));
    expect(status(worse)).toEqual(["text-worse-mark"]);
    expect(word(worse)).toBe("worse");
    expect(shape(worse)).toEqual(["diamond"]);
    const better = need(figure("coverage"));
    expect(status(better)).toEqual(["text-better-mark"]);
    expect(word(better)).toBe("better");
    expect(shape(better)).toEqual(["filled circle"]);
    const flat = need(figure("undrawn"));
    expect(status(flat)).toEqual([]);
    expect(word(flat)).toBe("unchanged");
    expect(shape(flat)).toEqual(["ring"]);
  });

  it("cash carries no judgement, whichever way it moves", () => {
    const figure = draw([
      { key: "cash", difference: 25 },
      { key: "revenue", difference: -5 },
    ]);
    const cash = need(figure("cash"));
    expect(status(cash)).toEqual([]);
    expect(word(cash)).toBeNull();
    expect(shape(cash)).toEqual([]);
    expect(word(need(figure("revenue")))).toBe("worse");
  });

  it("the Changes measure keys are in the table", () => {
    const figure = draw([
      { key: "gross_debt", difference: "50" },
      { key: "net_debt", difference: "-12.5" },
      { key: "free_cash_flow", difference: "-30" },
    ]);
    expect(status(need(figure("gross_debt")))).toEqual(["text-worse-mark"]);
    expect(status(need(figure("net_debt")))).toEqual(["text-better-mark"]);
    expect(status(need(figure("free_cash_flow")))).toEqual(["text-worse-mark"]);
  });

  it("a Not assessable measure, a same-period revision and an unknown key stay neutral", () => {
    const figure = draw([
      { key: "net_leverage", difference: 0.3, kind: "not_comparable" },
      { key: "coverage", difference: 0.5, same_period: true },
      { key: "mystery", difference: 5 },
    ]);
    expect(figure("net_leverage")).toBeNull();
    expect(figure("coverage")).toBeNull();
    const unknown = need(figure("mystery"));
    expect(status(unknown)).toEqual([]);
    expect(word(unknown)).toBeNull();
    expect(shape(unknown)).toEqual([]);
  });
});
