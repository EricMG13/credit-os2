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
const MARKS = ["text-better-mark", "text-worse-mark"];
const GLYPH = ["**:data-shape:text-better-mark", "**:data-shape:text-worse-mark"];
/** The better/worse mark classes anywhere in the figure: on a glyph wrapper or the arrow, never the chip itself. */
const status = (el: HTMLElement) => {
  expect(
    MARKS.concat(GLYPH, "text-success-text", "text-warning-text").filter((c) =>
      el.classList.contains(c),
    ),
  ).toEqual([]);
  return [...el.querySelectorAll<HTMLElement>("*")]
    .flatMap((node) => [...node.classList])
    .filter((name) => MARKS.includes(name) || GLYPH.includes(name))
    .map((name) => name.replace("**:data-shape:", ""));
};
const arrow = (el: HTMLElement) => el.querySelector("svg:not([data-shape])");
const rowOf = (el: HTMLElement) => el.closest("li") as HTMLLIElement;
const background = (row: HTMLElement) => row.getAttribute("style") ?? "";
const TINT = { better: "--color-scale-better-2", worse: "--color-scale-worse-2" };
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
    expect(status(worse)).toEqual(["text-worse-mark", "text-worse-mark"]);
    expect(rowOf(worse)).toHaveAttribute("data-tone", "worse");
    expect(background(rowOf(worse))).toContain(TINT.worse);
    expect(arrow(worse)).toHaveClass("text-worse-mark");
    expect(word(worse)).toBe("worse");
    expect(worse).toHaveClass("text-text-primary");
    expect(worse.className).not.toMatch(/bg-surface-subtle/);
    expect(shape(worse)).toEqual(["diamond"]);
    const better = need(figure("coverage"));
    expect(status(better)).toEqual(["text-better-mark", "text-better-mark"]);
    expect(rowOf(better)).toHaveAttribute("data-tone", "better");
    expect(background(rowOf(better))).toContain(TINT.better);
    expect(arrow(better)).toHaveClass("text-better-mark");
    expect(word(better)).toBe("better");
    expect(shape(better)).toEqual(["filled circle"]);
    const flat = need(figure("undrawn"));
    expect(status(flat)).toEqual([]);
    expect(rowOf(flat)).toHaveAttribute("data-tone", "flat");
    expect(background(rowOf(flat))).not.toMatch(/scale-(better|worse)/);
    expect(arrow(flat)).toBeNull();
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
    expect(rowOf(cash)).toHaveAttribute("data-tone", "none");
    expect(background(rowOf(cash))).not.toMatch(/scale-(better|worse)/);
    expect(arrow(cash)).toHaveClass("text-text-tertiary");
    expect(arrow(cash)?.getAttribute("class") ?? "").not.toMatch(/better|worse/);
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
    expect(status(need(figure("gross_debt")))).toContain("text-worse-mark");
    expect(status(need(figure("net_debt")))).toContain("text-better-mark");
    expect(status(need(figure("free_cash_flow")))).toContain("text-worse-mark");
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
    expect(background(rowOf(unknown))).not.toMatch(/scale-(better|worse)/);
    expect(word(unknown)).toBeNull();
    expect(shape(unknown)).toEqual([]);
  });

  it("a tinted row holds no tertiary text and no chart-3 mark, and a tone-less row is not tinted", () => {
    const figure = draw([
      { key: "net_leverage", difference: 0.3 },
      { key: "coverage", difference: 0.5 },
      { key: "mystery", difference: 5 },
    ]);
    for (const key of ["net_leverage", "coverage"]) {
      const row = rowOf(need(figure(key)));
      expect(row.querySelector(".text-text-tertiary")).toBeNull();
      expect(row.querySelector(".bg-chart-3")).toBeNull();
    }
    expect(rowOf(need(figure("mystery")))).not.toHaveAttribute(
      "style",
      expect.stringMatching(/scale/),
    );
  });

  it("draws one legend in words outside the list where a row is tinted", () => {
    draw([{ key: "net_leverage", difference: 0.3 }]);
    const list = screen.getAllByRole("list").find((l) => l.getAttribute("aria-label"));
    expect(list?.textContent).not.toMatch(/Green: better/);
    expect(screen.getAllByText("Green: better")).toHaveLength(1);
    expect(screen.getAllByText("Orange: worse")).toHaveLength(1);
    expect(screen.getAllByText(/^Grey arrow: no better or worse is drawn/)).toHaveLength(1);
  });

  it("a flat-only list draws no legend", () => {
    draw([{ key: "undrawn", difference: 0 }]);
    expect(screen.queryByText("Green: better")).toBeNull();
  });
});
