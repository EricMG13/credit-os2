import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { ScriptCheckOutcome } from "../publishedReport";
import { ModuleOutcomeTable } from "./ModuleOutcomeTable";

afterEach(cleanup);

const of = (status: string): ScriptCheckOutcome => ({
  figure: null,
  register: null,
  row: null,
  status,
  reason: null,
  script: null,
  stated: null,
  recomputed: null,
  recomputedLabel: null,
  tolerance: null,
  unit: null,
});
const many = (...statuses: string[]) => statuses.map(of);
const STATUSES = ["agreed", "disagreed", "not checked", "noted"];

/** Hand-counted: CP-1 holds 4 outcomes, CP-2 holds 4 (two agreed, one disagreed, one noted). */
const MODULES = [
  ["CP-1", many("agreed", "disagreed", "not checked", "noted")],
  ["CP-2", many("agreed", "agreed", "disagreed", "noted")],
] as const;

const cellsOf = (row: HTMLElement) =>
  within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);

/** The i-th row of the table that has a row header (module rows in order, then the Total row). */
function rowOf(index: number) {
  return table().getAllByRole("rowheader")[index]?.closest("tr") ?? null;
}

function table() {
  return within(screen.getByRole("table", { name: /Outcomes by module/ }));
}

it("draws every check mark and word in ink, without a status colour", () => {
  render(<ModuleOutcomeTable modules={MODULES} statuses={STATUSES} />);
  const view = table();
  for (const word of STATUSES)
    expect(view.getByRole("columnheader", { name: word })).toHaveTextContent(
      new RegExp(`^${word}$`),
    );
  const marks = (kind: string) => Array.from(document.querySelectorAll(`[data-mark="${kind}"]`));
  const header = view.getByRole("columnheader", { name: "disagreed" });
  expect(header.querySelector("[data-mark='fail']")).toHaveClass("text-text-primary");
  expect(marks("fail").length).toBeGreaterThan(0);
  for (const cross of marks("fail")) expect(cross).toHaveClass("text-text-primary");
  const tick = view.getByRole("columnheader", { name: "agreed" }).querySelector("[data-mark]");
  expect(tick).toHaveAttribute("data-mark", "pass");
  expect(tick).toHaveClass("text-text-primary");
  const word = view.getByRole("columnheader", { name: "agreed" }).lastElementChild;
  expect(word?.className ?? "").not.toMatch(/error|warning|success|brand|green|red/);
  const dash = view.getByRole("columnheader", { name: "noted" }).querySelector("[data-mark]");
  expect(dash).toHaveAttribute("data-mark", "other");
  expect(dash?.getAttribute("class") ?? "").not.toMatch(/error|warning|success|brand|green|red/);
});

it("sets the not-checked word and a non-zero count on the grey hatch", () => {
  render(<ModuleOutcomeTable modules={MODULES} statuses={STATUSES} />);
  const header = table().getByRole("columnheader", { name: "not checked" });
  expect(header.querySelector("[data-mark='not-run']")).toHaveClass("gap-hatch");
  const cp1 = rowOf(0);
  const cp2 = rowOf(1);
  if (!cp1 || !cp2) throw new Error("rows missing");
  expect(within(cp1).getAllByRole("cell")[2]?.querySelector(".gap-hatch")).not.toBeNull();
  // A zero is a plain recorded 0, with no hatch.
  expect(within(cp2).getAllByRole("cell")[2]?.querySelector(".gap-hatch")).toBeNull();
});

it("keeps a non-zero failing count in ink and leaves a zero plain", () => {
  render(
    <ModuleOutcomeTable
      modules={[...MODULES, ["CP-3", many("agreed")]]}
      statuses={["agreed", "disagreed"]}
    />,
  );
  const [cp1] = within(table().getAllByRole("rowgroup")[1] as HTMLElement).getAllByRole("row");
  if (!cp1) throw new Error("row missing");
  const zeroRow = rowOf(2);
  if (!zeroRow) throw new Error("zero row missing");
  const zero = within(zeroRow).getAllByRole("cell")[1];
  expect(zero).toHaveTextContent(/^0$/);
  expect(zero?.querySelector("[data-mark]")).toBeNull();
  const cp2 = rowOf(1);
  if (!cp2) throw new Error("second module row missing");
  const disagreement = within(cp2).getAllByRole("cell")[1]?.firstElementChild;
  expect(disagreement).toHaveClass("text-text-primary");
  expect(disagreement?.className).not.toMatch(/border-error|bg-error|text-error/);
  expect(disagreement?.querySelector("[data-mark='fail']")).toHaveClass("text-text-primary");
});

it("counts each module and a Total row exactly as recorded, Total column last", () => {
  render(<ModuleOutcomeTable modules={MODULES} statuses={STATUSES} />);
  const heads = table()
    .getAllByRole("columnheader")
    .map((head) => head.textContent);
  expect(heads).toEqual(["Module", "agreed", "disagreed", "not checked", "noted", "Total"]);
  const cp1 = rowOf(0);
  const cp2 = rowOf(1);
  const total = table().getByRole("rowheader", { name: "Total" }).closest("tr");
  if (!cp1 || !cp2 || !total) throw new Error("rows missing");
  expect(cellsOf(cp1)).toEqual(["1", "1", "1", "1", "4"]);
  expect(cellsOf(cp2)).toEqual(["2", "1", "0", "1", "4"]);
  expect(cellsOf(total)).toEqual(["3", "2", "1", "2", "8"]);
});

it("draws no Total row for a single module", () => {
  render(<ModuleOutcomeTable modules={[MODULES[0]]} statuses={STATUSES} />);
  expect(table().queryByRole("rowheader", { name: "Total" })).toBeNull();
  expect(table().getAllByRole("rowheader")).toHaveLength(1);
});

it("says a module with no outcome has none recorded, never 0", () => {
  render(
    <ModuleOutcomeTable
      modules={[
        ["CP-1", many("agreed")],
        ["CP-2", []],
      ]}
      statuses={["agreed"]}
    />,
  );
  const empty = rowOf(1);
  if (!empty) throw new Error("row missing");
  const [count, total] = within(empty).getAllByRole("cell");
  expect(count).toHaveTextContent(/^0$/);
  expect(total).toHaveTextContent("No outcome recorded");
  expect(total).not.toHaveTextContent(/^0$/);
  const footer = table().getByRole("rowheader", { name: "Total" }).closest("tr");
  if (!footer) throw new Error("footer missing");
  expect(cellsOf(footer)).toEqual(["1", "1"]);
});
