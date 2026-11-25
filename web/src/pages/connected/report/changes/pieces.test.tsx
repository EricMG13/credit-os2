import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublishedChanges } from "../../publishedReport";
import { Dumbbell } from "./Dumbbell";
import { MaturityPair, usableProfile } from "./MaturityPair";
import { ModuleMatrix } from "./ModuleMatrix";

describe("Dumbbell", () => {
  it("places the dots on a zero-based axis so the length is the size of the move", () => {
    const { container } = render(<Dumbbell before={2} after={4} tone="worse" />);
    const dots = [...container.querySelectorAll<HTMLElement>("span.size-3")];
    const left = dots.map((dot) => Number.parseFloat(dot.style.left));
    expect(left[0]).toBeLessThan(left[1] ?? 0);
    expect(left[1]).toBeCloseTo(92, 5);
    expect(left[0]).toBeCloseTo(50, 5);
  });

  it("draws a zero line when a figure is negative", () => {
    const { container } = render(<Dumbbell before={-1} after={3} tone={null} />);
    expect(container.querySelector("span.w-px")).not.toBeNull();
  });
});

describe("MaturityPair", () => {
  const rows = [
    { period: "FY2026", prior: "10", current: "5" },
    { period: "FY2029", prior: null, current: "7" },
    { period: "Thereafter", prior: "3", current: "3" },
  ];
  it("draws the stated periods in the pack's order, inventing none", () => {
    render(<MaturityPair profile={{ unit: "US$m", rows }} />);
    const walls = within(screen.getByRole("region", { name: "Maturity walls" }));
    const labels = walls
      .getAllByText(/^(FY2026|2027|2028|FY2029|Thereafter)$/)
      .map((n) => n.textContent);
    expect(labels).toEqual(["FY2026", "FY2029", "Thereafter"]);
    expect(walls.getByText("Not stated")).toBeInTheDocument();
  });

  it("draws a negative figure below the baseline, not as the same bar as its positive", () => {
    const { container } = render(
      <MaturityPair
        profile={{ unit: "US$m", rows: [{ period: "FY2026", prior: "-100", current: "100" }] }}
      />,
    );
    const earlier = container.querySelector<HTMLElement>('[data-bar="earlier"]');
    const current = container.querySelector<HTMLElement>('[data-bar="current"]');
    expect(earlier?.parentElement?.parentElement?.lastElementChild).not.toBe(
      earlier?.parentElement,
    );
    expect(Number.parseFloat(current?.style.height ?? "0")).toBeGreaterThan(0);
    expect(Number.parseFloat(earlier?.style.height ?? "0")).toBeGreaterThan(0);
  });

  it("is unusable without a unit, distinct periods or any stated figure", () => {
    expect(usableProfile({ unit: "US$m", rows })).toBe(true);
    expect(usableProfile({ unit: "", rows })).toBe(false);
    expect(
      usableProfile({ unit: "US$m", rows: [{ period: "FY2026", prior: null, current: null }] }),
    ).toBe(false);
    expect(usableProfile({ unit: "US$m", rows: [...rows.slice(0, 1), ...rows.slice(0, 1)] })).toBe(
      false,
    );
  });
});

describe("ModuleMatrix", () => {
  const change: PublishedChanges = {
    pack: {
      modules: [
        ["CP-1", "Financial foundation"],
        ["CP-2", "Fundamental credit"],
        ["CP-3", "Security selection"],
        ["CP-4", "Legal and covenants"],
        ["CP-5", "Evidence validation"],
      ].map(([module, title]) => ({
        module: module ?? "",
        title: title ?? "",
        ran_prior: true,
        ran_current: true,
        prior_bottom_line: "Before.",
        current_bottom_line: "Now.",
      })),
    },
    verdicts: {
      modules: {
        "CP-1": { status: "Unchanged", cause: "None", why: "" },
        "CP-2": { status: "Weakened", cause: "New period", why: "" },
        "CP-3": { status: "New", cause: "New source", why: "" },
        "CP-4": { status: "Not run this time", cause: "Unresolved", why: "" },
      },
    },
  };

  it("marks one column per module, keeps the exact status word and marks nothing for an unstated status", () => {
    render(<ModuleMatrix change={change} source={() => undefined} />);
    const table = screen.getByRole("table", { name: "Module conclusions against the earlier run" });
    const mark = (name: string) => {
      const row = within(table).getByRole("row", { name: new RegExp(name) });
      return [...row.querySelectorAll("td .sr-only")].map((node) => node.textContent);
    };
    expect(mark("Financial foundation")).toEqual(["Unchanged"]);
    expect(mark("Fundamental credit")).toEqual(["Revised"]);
    expect(mark("Security selection")).toEqual(["New"]);
    expect(mark("Legal and covenants")).toEqual(["Missing"]);
    expect(mark("Evidence validation")).toEqual([]);
    expect(within(table).getByText("Weakened")).toBeVisible();
    expect(within(table).getByText("Explanation not stated")).toBeVisible();
  });

  it("lists each module once and opens a row to its earlier and current conclusion", () => {
    render(<ModuleMatrix change={change} source={() => undefined} />);
    expect(screen.getAllByText("Financial foundation")).toHaveLength(1);
    const toggle = screen.getByRole("button", { name: /Financial foundation/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("matrix-CP-1")).not.toHaveAttribute("hidden");
  });
});

describe("MaturityPair baseline", () => {
  const draw = (rows: { period: string; prior: string | null; current: string | null }[]) =>
    render(<MaturityPair profile={{ unit: "US$m", rows }} />).container;

  it("draws a stated zero as a tick with its figure, never as a bar", () => {
    const c = draw([{ period: "FY2026", prior: "0", current: "100" }]);
    expect(c.querySelector('[data-bar="earlier"]')?.getAttribute("data-zone")).toBe("zero");
    expect(c.querySelector('[data-bar="current"]')?.getAttribute("data-zone")).toBe("above");
  });

  it("draws all-zero as ticks, not slabs", () => {
    const c = draw([{ period: "FY2026", prior: "0", current: "0" }]);
    expect([...c.querySelectorAll("[data-bar]")].map((n) => n.getAttribute("data-zone"))).toEqual([
      "zero",
      "zero",
    ]);
  });

  it("keeps a small non-zero figure a visible outline, and all-negative sets below the baseline", () => {
    const c = draw([
      { period: "FY2026", prior: "-35", current: "-100" },
      { period: "FY2027", prior: "12", current: "2800" },
    ]);
    const bars = [...c.querySelectorAll<HTMLElement>("[data-bar]")];
    expect(
      bars.every((b) => Number.parseFloat(b.style.height) >= 6 || b.dataset["zone"] === "zero"),
    ).toBe(true);
    expect(bars.slice(0, 2).map((b) => b.dataset["zone"])).toEqual(["below", "below"]);
  });
});

describe("MaturityPair headroom", () => {
  it("reserves room for a long unparsed cell when no value is positive", () => {
    const { container } = render(
      <MaturityPair
        profile={{
          unit: "US$m",
          rows: [{ period: "FY2026", prior: "-5", current: "Not supplied: schedule absent" }],
        }}
      />,
    );
    const above = [...container.querySelectorAll<HTMLElement>("[data-gap]")][0]?.parentElement;
    expect(Number.parseFloat(above?.style.height ?? "0")).toBeGreaterThanOrEqual(66);
    expect(container.querySelector("[data-gap]")?.className).toMatch(/h-6/);
  });
});
