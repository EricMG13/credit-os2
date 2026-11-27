import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublishedChanges } from "../../publishedReport";
import { Dumbbell } from "./Dumbbell";
import { MaturityPair, usableProfile } from "./MaturityPair";
import { ModuleMatrix } from "./ModuleMatrix";

describe("Dumbbell", () => {
  const left = (container: HTMLElement, mark: "earlier" | "current" | "axis-zero") =>
    Number.parseFloat(container.querySelector<HTMLElement>(`[data-${mark}]`)?.style.left ?? "");

  it("places both marks on an axis from zero so the length is the size of the move", () => {
    const { container } = render(
      <Dumbbell before={2} after={4} tone="worse" reading="Cover, 2x to 4x" />,
    );
    expect(left(container, "axis-zero")).toBeCloseTo(0, 5);
    expect(left(container, "earlier")).toBeCloseTo(50, 5);
    expect(left(container, "current")).toBeCloseTo(100, 5);
  });

  it("draws the earlier figure as a tick taller than the current dot, so a small move shows two marks", () => {
    const { container } = render(
      <Dumbbell before={3.2} after={3.1} tone="worse" reading="Cover, 3.2x to 3.1x" />,
    );
    const earlier = container.querySelector("[data-earlier]");
    const current = container.querySelector("[data-current]");
    expect(earlier?.className).toMatch(/inset-y-0/);
    expect(earlier?.className).toMatch(/w-0\.5/);
    expect(current?.className).toMatch(/size-2\.5/);
    expect(left(container, "current")).toBeLessThan(left(container, "earlier"));
  });

  it.each([
    [5.4, 5.8, "up"],
    [3.2, 3.1, "down"],
  ])("points the way the figure went, %s to %s", (before, after, way) => {
    const { container } = render(
      <Dumbbell before={before} after={after} tone={null} reading="A, 1 to 2" />,
    );
    const mark = container.querySelector('[data-mark="dumbbell"]');
    expect(mark).toHaveAttribute("data-direction", way);
    expect(mark?.querySelectorAll("svg")).toHaveLength(1);
  });

  it.each([
    ["worse", "bg-worse-mark", "text-worse-mark"],
    ["better", "bg-better-mark", "text-better-mark"],
  ] as const)("draws a %s move in the %s mark", (tone, fill, ink) => {
    const { container } = render(
      <Dumbbell before={2} after={4} tone={tone} reading="Cover, 2x to 4x" />,
    );
    expect(container.querySelector("[data-current]")).toHaveClass(fill);
    expect(container.querySelector("svg")).toHaveClass(ink);
  });

  it("says in its text alternative what the axis starts at", () => {
    const { unmount } = render(
      <Dumbbell before={2} after={4} tone="worse" reading="Cover, 2x to 4x" />,
    );
    expect(
      screen.getByRole("img", { name: "Cover, 2x to 4x; the axis starts at zero" }),
    ).toBeInTheDocument();
    unmount();
    render(<Dumbbell before={-1} after={3} tone={null} reading="Net cash, -1 to 3" />);
    expect(
      screen.getByRole("img", {
        name: "Net cash, -1 to 3; the axis starts at the lowest figure and marks zero",
      }),
    ).toBeInTheDocument();
  });

  it("tells the earlier marker from the zero tick by colour, in a tinted row too (colour-signal-build ruling H3)", () => {
    const { container } = render(
      <Dumbbell before={2} after={4} tone="worse" reading="Cover, 2x to 4x" />,
    );
    const earlier = container.querySelector("[data-earlier]");
    const zero = container.querySelector("[data-axis-zero]");
    expect(earlier).toHaveClass("bg-text-secondary");
    expect(zero).toHaveClass("bg-border-control");
    expect(earlier).not.toHaveClass("bg-border-control");
    expect(earlier).not.toHaveClass("bg-chart-3");
  });

  it("marks zero inside the axis when a figure is negative", () => {
    const { container } = render(
      <Dumbbell before={-1} after={3} tone={null} reading="Net cash, -1 to 3" />,
    );
    expect(left(container, "axis-zero")).toBeCloseTo(25, 5);
    expect(left(container, "earlier")).toBeCloseTo(0, 5);
  });
});

describe("MaturityPair", () => {
  const rows = [
    { period: "FY2026", prior: "10", current: "5" },
    { period: "FY2029", prior: null, current: "7" },
    { period: "Thereafter", prior: "3", current: "3" },
  ];
  // The first real profile: seven periods, one a long label, the largest figure in the last two.
  it("lets seven periods share a 1024px page: a column needs no more than 120px", () => {
    const real = [
      { period: "FY2025", prior: "93", current: null },
      { period: "FY2026", prior: "92", current: null },
      { period: "FY2027", prior: "92", current: null },
      { period: "FY2028", prior: "6637", current: null },
      { period: "FY2029", prior: "4768", current: null },
      {
        period: "All remaining maturities, unallocated at 2024-06-29",
        prior: null,
        current: "22057",
      },
      { period: "Thereafter", prior: "12637", current: null },
    ];
    render(<MaturityPair profile={{ unit: "US$m", rows: real }} />);
    const walls = screen.getByRole("region", { name: "Maturity walls" });
    const column = within(walls).getByText("FY2025").parentElement as HTMLElement;
    expect(column.className).toMatch(/\bmin-w-28\b/);
    expect(column.className).not.toMatch(/min-w-52/);
    expect(within(walls).getByText("22057")).toBeInTheDocument();
    expect(within(walls).getByText("12637")).toBeInTheDocument();
  });

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
        ["CP-4", "Legal & covenants"],
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
    expect(mark("Legal & covenants")).toEqual(["Missing"]);
    expect(mark("Evidence validation")).toEqual([]);
    expect(within(table).getByText("Weakened")).toBeVisible();
    expect(within(table).getByText("Explanation not stated")).toBeVisible();
  });

  it("gives a weakened or strengthened conclusion its direction with a shape, and a reversed one none", () => {
    const status = (word: string) => ({ status: word, cause: "", why: "" });
    render(
      <ModuleMatrix
        change={{
          ...change,
          verdicts: {
            modules: {
              "CP-1": status("Strengthened"),
              "CP-2": status("Weakened"),
              "CP-3": status("Reversed"),
              "CP-4": status("Unchanged"),
            },
          },
        }}
        source={() => undefined}
      />,
    );
    const direction = (word: string) =>
      screen
        .getAllByText(word)
        .find((node) => !node.matches("th, .sr-only"))
        ?.closest("[data-direction]") ?? null;
    expect(direction("Strengthened")).toHaveAttribute("data-direction", "better");
    expect(direction("Strengthened")).toHaveClass("text-text-primary");
    expect(direction("Weakened")).toHaveAttribute("data-direction", "worse");
    expect(direction("Weakened")).toHaveClass("text-text-primary");
    expect(direction("Weakened")?.querySelector("svg")).not.toBeNull();
    expect(direction("Reversed")).toBeNull();
    expect(direction("Unchanged")).toBeNull();
  });

  it("draws every status glyph and direction in ink, never in chrome blue or a better or worse colour", () => {
    const status = (word: string) => ({ status: word, cause: "", why: "" });
    const { container } = render(
      <ModuleMatrix
        change={{
          ...change,
          verdicts: {
            modules: {
              "CP-1": status("Strengthened"),
              "CP-2": status("Weakened"),
              "CP-3": status("New"),
              "CP-4": status("Not run this time"),
              "CP-5": status("Unchanged"),
            },
          },
        }}
        source={() => undefined}
      />,
    );
    const cells = [...container.querySelectorAll("tbody td > span, [data-direction]")];
    expect(cells.length).toBeGreaterThan(0);
    const banned =
      /^(text-action|text-success-.*|text-warning-.*|text-better-mark|text-worse-mark)$/;
    for (const cell of cells)
      for (const token of [cell, ...cell.querySelectorAll("*")].flatMap((n) => [...n.classList]))
        expect(token).not.toMatch(banned);
    const missing = container.querySelector('[data-shape="dashed ring"]')?.parentElement;
    expect(missing).toHaveClass("text-gap-text");
  });

  // The first real pack titled its modules "Canonical data foundation", "Downside pathway": names the
  // reader meets nowhere else. A module the page has no name for arrives titled with its code.
  it("names each module as the rest of the report does, never by the pack's own title or a code", () => {
    const module = (code: string, title: string) => ({
      module: code,
      title,
      ran_prior: true,
      ran_current: true,
      prior_bottom_line: "Before.",
      current_bottom_line: "Now.",
    });
    render(
      <ModuleMatrix
        change={{
          pack: {
            modules: [
              module("CP-1", "Canonical data foundation"),
              module("CP-2A", "Downside pathway"),
              module("CP-ZZ", "CP-ZZ"),
            ],
          },
        }}
        source={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /^Financial foundation/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Downside/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Unnamed module/ })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Canonical data foundation|pathway|CP-/);
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

describe("MaturityPair amount fill", () => {
  const draw = (rows: { period: string; prior: string | null; current: string | null }[]) =>
    render(<MaturityPair profile={{ unit: "US$m", rows }} />).container;
  const fill = (el: Element | null) => (el as HTMLElement | null)?.style.backgroundColor ?? "";

  it("fills this run's bar by its share of the largest stated figure, and leaves the earlier run an outline", () => {
    const c = draw([
      { period: "FY2026", prior: "10", current: "5" },
      { period: "FY2027", prior: null, current: "10" },
    ]);
    const current = [...c.querySelectorAll('[data-bar="current"]')];
    expect(fill(current[0] ?? null)).toBe("var(--color-scale-amount-3)");
    expect(fill(current[1] ?? null)).toBe("var(--color-scale-amount-5)");
    expect(current[0]).toHaveClass("border", "border-scale-amount-edge");
    const earlier = c.querySelector('[data-bar="earlier"]');
    expect(fill(earlier)).toBe("");
    expect(earlier).toHaveClass("border-chart-3");
  });

  it("steps a negative figure by its size and keeps a gap hatched with no amount fill", () => {
    const c = draw([
      { period: "FY2026", prior: "-10", current: "-5" },
      { period: "FY2027", prior: "10", current: null },
    ]);
    expect(fill(c.querySelector('[data-bar="current"]'))).toBe("var(--color-scale-amount-3)");
    const gap = c.querySelector("[data-gap]");
    expect(gap).not.toBeNull();
    expect(fill(gap)).toBe("");
  });

  it("draws an all-zero profile as ticks with no amount fill and no division by zero", () => {
    const c = draw([{ period: "FY2026", prior: "0", current: "0" }]);
    for (const bar of c.querySelectorAll<HTMLElement>("[data-bar]"))
      expect(bar.style.backgroundColor).toBe("");
  });

  it("names the marks in its legend", () => {
    draw([{ period: "FY2026", prior: "1", current: "2" }]);
    expect(screen.getByText("Earlier run: grey outlined bar, left")).toBeVisible();
    expect(
      screen.getByText("This run: amber bar, right, deeper for a larger amount"),
    ).toBeVisible();
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
