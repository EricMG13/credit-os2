import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MeasureList } from "./MeasureList";
import type { MeasureChange } from "./model";

afterEach(cleanup);

const item = (over: Partial<MeasureChange>): MeasureChange => ({
  index: 0,
  key: "k",
  label: "Measure k",
  before: "1x",
  after: "2x",
  beforeValue: 1,
  afterValue: 2,
  delta: "+1x",
  sign: 1,
  tone: null,
  reason: "",
  cause: { kind: "written", text: "New period" },
  effect: null,
  href: undefined,
  ...over,
});

const list = (items: MeasureChange[]) =>
  render(<MeasureList items={items} label="Measures that moved" />);

describe("MeasureList colour", () => {
  it("draws a tone-less change with a grey arrow, no tint and no better or worse word", () => {
    list([item({})]);
    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute("data-tone", "none");
    expect(row.getAttribute("style") ?? "").not.toMatch(/scale/);
    expect(row.querySelector("[data-change] svg")).toHaveClass("text-text-tertiary");
    expect(row.querySelector("[data-change]")?.textContent).not.toMatch(/better|worse/);
  });

  it("draws an arrow for a negative sign and none for a zero sign", () => {
    list([item({ key: "a", label: "A", sign: -1 }), item({ key: "b", label: "B", sign: 0 })]);
    const [down, zero] = screen.getAllByRole("listitem");
    expect(down?.querySelector("[data-change] svg")).not.toBeNull();
    expect(zero?.querySelector("[data-change] svg")).toBeNull();
  });

  it("gives a tinted and an untinted row the same padding, vertical padding included", () => {
    list([item({ key: "a", label: "A", tone: "worse" }), item({ key: "b", label: "B" })]);
    for (const row of screen.getAllByRole("listitem")) {
      expect(row).toHaveClass("px-3", "rounded-ds-sm", "py-4");
      expect(row.className).not.toMatch(/first:pt-0|last:pb-0/);
    }
  });

  it("draws a legend in words outside the list for tinted and arrow-only rows", () => {
    list([item({ key: "a", label: "A", tone: "better" }), item({ key: "b", label: "B" })]);
    const ul = screen.getByRole("list", { name: "Measures that moved" });
    for (const words of [
      "Green: better",
      "Orange: worse",
      "Grey arrow: no better or worse is drawn; the owner's table gives this measure none, or the comparison left its cause unresolved",
    ]) {
      expect(screen.getByText(words)).toBeVisible();
      expect(ul).not.toContainElement(screen.getByText(words));
    }
  });

  it("draws no legend when no row is tinted or arrow-only", () => {
    list([item({ tone: "flat", sign: 0, delta: "0x" })]);
    expect(screen.queryByText("Green: better")).toBeNull();
  });

  it("marks an unresolved cause with an ink triangle and no warning colour", () => {
    list([item({ cause: { kind: "written", text: "Unresolved" } })]);
    const cause = screen.getByText("Cause: Unresolved");
    expect(cause.className).not.toMatch(/warning/);
    expect(cause).toHaveClass("text-text-secondary");
    expect(cause.querySelector('[data-shape="triangle"]')).not.toBeNull();
  });
});
