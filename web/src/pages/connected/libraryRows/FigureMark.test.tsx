import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FigureMark } from "./FigureMark";

afterEach(cleanup);

const lev = {
  value: "2.25",
  unit: "x",
  period: "FY2024",
  prior: { value: "3.00", period: "FY2023" },
  change: "-0.75",
};

it("draws the value in mono with its period, and the change from the prior value with its direction word", () => {
  const { container } = render(
    <FigureMark name="Net leverage" metricKey="net_leverage" figure={lev} />,
  );
  expect(screen.getAllByText("2.25x")[0]).toHaveClass("font-mono", "tabular-nums");
  expect(screen.getByText("FY2024")).toBeVisible();
  expect(screen.getByText(/-0\.75x/)).toBeVisible();
  expect(screen.getByText("better")).toBeVisible();
  expect(screen.getByText("from 3.00x in FY2023")).toBeVisible();
  // No bar: a bar on each row's own scale would look comparable across rows.
  expect(container.querySelector("svg:not([aria-hidden])")).toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
});

it("states a missing prior period and draws no mark", () => {
  render(
    <FigureMark
      name="Interest cover"
      metricKey="coverage"
      figure={{ value: "4.19", unit: "x", period: "FY2025" }}
    />,
  );
  expect(screen.getByText("4.19x")).toBeVisible();
  expect(screen.getByText("No prior period stated")).toBeVisible();
  expect(screen.queryByRole("img")).toBeNull();
});

it("writes an empty prior as the empty text it is, never as zero", () => {
  render(
    <FigureMark
      name="Net leverage"
      metricKey="net_leverage"
      figure={{ value: "2", unit: "x", prior: { value: "", period: "FY2023" }, change: "2" }}
    />,
  );
  expect(screen.getByText("No prior period stated")).toBeVisible();
  expect(screen.queryByText(/from /)).toBeNull();
});

it("names worse in words, not by colour alone", () => {
  render(
    <FigureMark
      name="Net leverage"
      metricKey="net_leverage"
      figure={{ value: "4.0", unit: "x", prior: { value: "3.0", period: "FY2023" }, change: "1.0" }}
    />,
  );
  expect(screen.getByText("worse")).toBeVisible();
  expect(screen.getByText(/\+1\.0x/)).toBeVisible();
});

it("draws a direction for a measure the owner's table gives none, without better or worse", () => {
  render(
    <FigureMark
      name="Cash"
      metricKey="cash"
      figure={{
        value: "100",
        unit: "US$m",
        prior: { value: "80", period: "FY2023" },
        change: "20",
      }}
    />,
  );
  expect(screen.queryByText("better")).toBeNull();
  expect(screen.queryByText("worse")).toBeNull();
  expect(screen.getByText(/\+\$20m/)).toBeVisible();
});

it("says a figure the catalogue does not quote is not shown here, never zero or 'not supplied'", () => {
  render(<FigureMark name="Interest cover" metricKey="coverage" figure={undefined} />);
  expect(screen.getByText("n.a.")).toBeInTheDocument();
  expect(screen.getByText("Not shown here")).toBeVisible();
  expect(screen.queryByText("0")).toBeNull();
  expect(screen.queryByText("Not supplied")).toBeNull();
});

it("qualifies interest cover read as reported EBITDA over cash interest on debt", () => {
  render(
    <FigureMark
      name="Interest cover"
      metricKey="coverage"
      figure={{
        value: "4.19",
        unit: "x",
        basis: "LTM reported EBITDA over LTM cash interest for debt 776; calculation C34",
      }}
    />,
  );
  expect(screen.getByText("Reported EBITDA / cash interest on debt")).toBeInTheDocument();
});

it("places the figure's single trace control beside it", () => {
  render(
    <FigureMark
      name="Net leverage"
      metricKey="net_leverage"
      figure={lev}
      trace={<button>trace</button>}
    />,
  );
  expect(screen.getByRole("button", { name: "trace" })).toBeVisible();
});

it("shows the qualified label in the cell on a wide screen when the header does not carry it", () => {
  const figure = {
    value: "4.19",
    unit: "x",
    basis: "LTM reported EBITDA over LTM cash interest for debt 776; calculation C34",
  };
  const { container, rerender } = render(
    <FigureMark name="Interest cover" metricKey="coverage" figure={figure} />,
  );
  expect(screen.getByText("Reported EBITDA / cash interest on debt")).toHaveClass("xl:sr-only");
  rerender(<FigureMark name="Interest cover" metricKey="coverage" figure={figure} showLabel />);
  expect(screen.getByText("Reported EBITDA / cash interest on debt")).not.toHaveClass("xl:sr-only");
  expect(container.textContent).toContain("4.19x");
});

it("names a figure on the heading the catalogue states it under when that is not the plain name", () => {
  render(
    <FigureMark
      name="Net leverage"
      metricKey="net_leverage"
      figure={{ ...lev, label: "Net debt / adjusted EBITDA" }}
      showLabel
    />,
  );
  expect(screen.getByText("Net debt / adjusted EBITDA")).toBeVisible();
  expect(screen.queryByText("Net leverage")).toBeNull();
});

const worse = {
  value: "4.0",
  unit: "x",
  period: "FY2025",
  prior: { value: "3.0", period: "FY2024" },
  change: "1.0",
};

it("tints a better cell green and a worse cell orange, by its tone, and marks the cell", () => {
  const { container, rerender } = render(
    <FigureMark name="Net leverage" metricKey="net_leverage" figure={lev} />,
  );
  const better = container.querySelector("[data-tone]");
  expect(better).toHaveAttribute("data-tone", "better");
  expect((better as HTMLElement).style.backgroundColor).toBe("var(--color-scale-better-2)");
  rerender(<FigureMark name="Net leverage" metricKey="net_leverage" figure={worse} />);
  const bad = container.querySelector("[data-tone]");
  expect(bad).toHaveAttribute("data-tone", "worse");
  expect((bad as HTMLElement).style.backgroundColor).toBe("var(--color-scale-worse-2)");
});

it("puts the mark colour on the glyphs only: the words and figures stay in ink", () => {
  const { container } = render(
    <FigureMark name="Net leverage" metricKey="net_leverage" figure={lev} />,
  );
  expect(screen.getByText("better").parentElement).toHaveClass("**:data-shape:text-better-mark");
  expect(screen.getByText("better")).not.toHaveClass("text-better-mark");
  expect(screen.getByText("2.25x")).toHaveClass("text-text-primary");
  expect(container.querySelector("svg:not([data-shape])")).toHaveClass("text-better-mark");
});

it("never tints a cash cell, whatever its change, and draws a grey arrow", () => {
  const { container } = render(
    <FigureMark
      name="Cash"
      metricKey="cash"
      figure={{
        value: "100",
        unit: "US$m",
        prior: { value: "80", period: "FY2023" },
        change: "20",
      }}
    />,
  );
  const cell = container.querySelector("[data-tone]") as HTMLElement;
  expect(cell).toHaveAttribute("data-tone", "none");
  expect(cell.getAttribute("style") ?? "").toBe("");
  for (const word of ["scale-better", "scale-worse", "better-mark", "worse-mark"])
    expect(cell.outerHTML).not.toContain(word);
  expect(container.querySelector("svg:not([data-shape])")).toHaveClass("text-text-secondary");
});

it("leaves the gap cell and a cell with no prior untinted", () => {
  const { container, rerender } = render(
    <FigureMark name="Interest cover" metricKey="coverage" figure={undefined} />,
  );
  expect((container.querySelector("[data-tone]") as HTMLElement).getAttribute("style") ?? "").toBe(
    "",
  );
  rerender(
    <FigureMark
      name="Interest cover"
      metricKey="coverage"
      figure={{ value: "4.19", unit: "x", period: "FY2025" }}
    />,
  );
  expect((container.querySelector("[data-tone]") as HTMLElement).getAttribute("style") ?? "").toBe(
    "",
  );
});

it("draws at most two content lines under the head, and no tertiary text or grey mark on a tint", () => {
  const { container, rerender } = render(
    <FigureMark
      name="Net leverage"
      metricKey="net_leverage"
      figure={lev}
      trace={<button>t</button>}
    />,
  );
  expect(container.querySelectorAll("[data-line]")).toHaveLength(2);
  expect(container.querySelector(".text-text-tertiary")).toBeNull();
  expect(container.querySelector(".bg-chart-3")).toBeNull();
  rerender(<FigureMark name="Net leverage" metricKey="net_leverage" figure={undefined} />);
  expect(container.querySelectorAll("[data-line]")).toHaveLength(2);
  rerender(
    <FigureMark
      name="Interest cover"
      metricKey="coverage"
      figure={{ value: "4.19", unit: "x", period: "FY2025" }}
    />,
  );
  expect(container.querySelectorAll("[data-line]")).toHaveLength(2);
});
