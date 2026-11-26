import { describe, expect, it } from "vitest";
import type { ReadinessItem } from "../api";
import { limitedRows, moduleReadiness } from "./moduleReadiness";

const item = (
  scope: string,
  outcome: string,
  reason: string,
  inherited_from: string[] = [],
): ReadinessItem => ({ id: `${scope}:${reason}`, scope, outcome, reason, inherited_from });

describe("moduleReadiness", () => {
  it("before a review lists the planned modules by stage, unchecked, without the forecast", () => {
    const shown = moduleReadiness([
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1A",
      "CP-2",
      "CP-4",
      "CP-3",
      "CP-5",
      "CP-6",
    ]);
    expect(shown.checked).toBe(false);
    expect(shown.count).toBe(8);
    expect(shown.run).toBeUndefined();
    expect(shown.other).toEqual([]);
    expect(
      shown.groups.map((group) => [group.number, group.name, group.rows.map((row) => row.name)]),
    ).toEqual([
      ["01", "Sources", ["Source readiness"]],
      ["02", "Financials", ["Financial foundation"]],
      ["03", "Credit", ["Business & governance", "Fundamental credit"]],
      // Within a stage, the stage's own module order (report/stages.ts), not the pathway's.
      ["04", "Structure and market", ["Security selection", "Legal & covenants"]],
      ["05", "Validation and decision", ["Evidence validation", "Committee decision"]],
    ]);
    expect(shown.groups.flatMap((group) => group.rows.map((row) => row.mark))).toEqual(
      Array(8).fill("unchecked"),
    );
    expect(limitedRows(shown)).toEqual([]);
  });

  it("shows a scoped custom choice as one module before the review", () => {
    const shown = moduleReadiness(["CP-4", "CP-4D"], undefined, "custom");
    expect(shown.count).toBe(3);
    expect(shown.groups.flatMap((group) => group.rows.map((row) => row.id))).toEqual([
      "CP-0",
      "CP-1",
      "CP-4",
    ]);
  });

  it("after a review marks each module by its most severe limit, from the summary alone", () => {
    const shown = moduleReadiness(["CP-0", "CP-1", "CP-4"], {
      modules: ["CP-0", "CP-1", "CP-MODEL", "CP-3", "CP-4", "CP-4C", "CP-8"],
      items: [
        item("CP-1", "check", "No file is recognised as a financial report."),
        item("CP-3", "gap", "No quotes and no price talk were entered."),
        item("CP-4", "limited", "The agreement has no schedules."),
        item("CP-4", "will_refuse", "No executed agreement is among the files."),
        item("CP-4C", "will_refuse", "Expected to refuse because it reads CP-4.", ["CP-4"]),
        item("CP-0", "information", "This is the first run of this pathway."),
        item("CP-0", "ready", "Every file was read."),
      ],
    });
    const marks = Object.fromEntries(
      shown.groups.flatMap((group) => group.rows).map((row) => [row.id, row.mark]),
    );
    expect(shown.checked).toBe(true);
    expect(shown.count).toBe(6);
    // A module the summary names no limit for, or calls ready, is "none": the page never says ready.
    expect(marks).toEqual({
      "CP-0": "none",
      "CP-1": "check",
      "CP-3": "gap",
      "CP-4": "will_refuse",
      "CP-4C": "will_refuse",
      "CP-8": "none",
    });
    expect(limitedRows(shown).map((row) => [row.name, row.mark])).toEqual([
      ["Financial foundation", "check"],
      ["Security selection", "gap"],
      ["Legal & covenants", "will_refuse"],
      ["Recovery & fulcrum", "will_refuse"],
    ]);
  });

  it("draws limits on the whole run as their own row, and only limits", () => {
    const shown = moduleReadiness(["CP-0"], {
      modules: ["CP-0"],
      items: [
        item("run", "check", "Financials are management claims, not filed statements."),
        item("run", "information", "Lookups are off for a synthetic case."),
      ],
    });
    expect(shown.run).toEqual({ id: "run", name: "Whole run", mark: "check" });
    expect(moduleReadiness(["CP-0"], { modules: ["CP-0"], items: [] }).run).toBeUndefined();
  });

  it("keeps a limit on something not drawn as a module under Other limits (Q1)", () => {
    const shown = moduleReadiness(["CP-0", "CP-1"], {
      modules: ["CP-0", "CP-1", "CP-MODEL"],
      items: [item("CP-MODEL", "limited", "The model has no interim period.")],
    });
    expect(shown.other).toEqual([{ id: "CP-MODEL", name: "Cash flow model", mark: "limited" }]);
    expect(shown.groups.flatMap((group) => group.rows.map((row) => row.mark))).toEqual([
      "none",
      "none",
    ]);
    // So the overview never reads "no limit" for everything while a limit exists.
    expect(limitedRows(shown)).toEqual([
      { id: "CP-MODEL", name: "Cash flow model", mark: "limited" },
    ]);
  });

  it("puts a module no stage names under Other, unnumbered, last", () => {
    const shown = moduleReadiness(["CP-0", "CP-9Z"]);
    expect(shown.groups.map((group) => [group.number, group.name])).toEqual([
      ["01", "Sources"],
      [undefined, "Other"],
    ]);
  });
});
