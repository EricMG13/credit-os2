import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BarCell } from "./BarCell";
import { Segmented } from "./Segmented";
import { StatsStrip } from "./StatsStrip";

afterEach(cleanup);

it("draws a stat's value as written, its change with the direction word, and a gap in words", () => {
  render(
    <StatsStrip
      label="Headline figures"
      stats={[
        {
          label: "Net leverage",
          value: "2.25x",
          prior: "3.00x in FY2023",
          delta: "-0.75x",
          tone: "better",
        },
        { label: "Adjusted EBITDA", value: null, gap: "Not supplied: the measure is not stated" },
      ]}
    />,
  );
  const strip = screen.getByLabelText("Headline figures");
  expect(within(strip).getByText("2.25x")).toHaveClass("font-mono", "tabular-nums");
  expect(within(strip).getByText("-0.75x better")).toHaveClass("text-better-mark");
  expect(within(strip).getByText(/from 3\.00x in FY2023/)).toBeInTheDocument();
  expect(within(strip).getByText("Not supplied: the measure is not stated")).toBeInTheDocument();
  expect(within(strip).queryByText("0")).toBeNull();
});

it("draws a worse change in the worse mark with its word", () => {
  render(
    <StatsStrip
      label="Worse strip"
      stats={[{ label: "Net leverage", value: "3.00x", delta: "+0.75x", tone: "worse" }]}
    />,
  );
  expect(within(screen.getByLabelText("Worse strip")).getByText("+0.75x worse")).toHaveClass(
    "text-worse-mark",
  );
});

it("lays four figures two by two, then four across: never three with one alone on a row", () => {
  const stat = (label: string) => ({ label, value: "1.0x" });
  const { rerender } = render(<StatsStrip label="Four" stats={["A", "B", "C", "D"].map(stat)} />);
  expect(screen.getByLabelText("Four")).toHaveClass("md:grid-cols-2", "lg:grid-cols-4");
  expect(screen.getByLabelText("Four")).not.toHaveClass("md:grid-cols-3");
  // Any other count keeps the strip's three-across row.
  rerender(<StatsStrip label="Three" stats={["A", "B", "C"].map(stat)} />);
  expect(screen.getByLabelText("Three")).toHaveClass("md:grid-cols-3");
  expect(screen.getByLabelText("Three")).not.toHaveClass("lg:grid-cols-4");
});

it("marks the current link segment as the current page and draws a navigation landmark", () => {
  render(
    <Segmented
      label="Report sections"
      current="overview"
      segments={[
        { key: "overview", label: "Overview", href: "#overview" },
        { key: "changes", label: "Changes", href: "#changes" },
      ]}
    />,
  );
  const nav = screen.getByRole("navigation", { name: "Report sections" });
  expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(within(nav).getByRole("link", { name: "Changes" })).not.toHaveAttribute("aria-current");
});

it("draws button segments as a pressed group and reports the choice", () => {
  const onSelect = vi.fn();
  render(
    <Segmented
      label="Case"
      current="base"
      onSelect={onSelect}
      segments={[
        { key: "base", label: "Base" },
        { key: "downside", label: "Downside" },
      ]}
    />,
  );
  const group = screen.getByRole("group", { name: "Case" });
  expect(within(group).getByRole("button", { name: "Base" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(within(group).getByRole("button", { name: "Downside" }));
  expect(onSelect).toHaveBeenCalledWith("downside");
});

it("sizes the bar from the share and draws no fill for a missing value", () => {
  const { container, rerender } = render(<BarCell text="1,200" share={0.6} />);
  expect(screen.getByText("1,200")).toBeInTheDocument();
  expect(container.querySelector("[style]")).toHaveStyle({ width: "60%" });
  rerender(<BarCell text="Not supplied" share={null} />);
  expect(container.querySelector("[style]")).toBeNull();
});

it("keeps the figure column at its default width and takes a width class for a list of rows", () => {
  const { container, rerender } = render(<BarCell text="1" share={0.5} />);
  expect(container.querySelector(".w-20")).not.toBeNull();
  rerender(<BarCell text="US$1,250.00m" share={0.5} valueWidth="w-32" />);
  expect(container.querySelector(".w-32")).not.toBeNull();
  expect(container.querySelector(".w-20")).toBeNull();
});

it("floors a small share at the minimum width and marks zero with a tick, not a fill", () => {
  const { container, rerender } = render(<BarCell text="17" share={17 / 3632} />);
  const fill = () => container.querySelector("[style]");
  const tick = () => container.querySelector(".w-px");
  // A small figure keeps a visible bar: its share, but never narrower than 2 px.
  expect(fill()).toHaveStyle({ width: `${String((17 / 3632) * 100)}%`, minWidth: "2px" });
  expect(tick()).toBeNull();
  rerender(<BarCell text="1" share={1 / 3632} minimum={4} />);
  expect(fill()).toHaveStyle({ minWidth: "4px" });
  // Zero draws no fill: a 1 px tick at the track's start, hidden from assistive technology.
  rerender(<BarCell text="0" share={0} />);
  expect(fill()).toBeNull();
  expect(tick()).not.toBeNull();
  expect(tick()?.closest("[aria-hidden='true']")).not.toBeNull();
  expect(screen.getByText("0")).toBeInTheDocument();
  // A missing value draws neither a fill nor a tick.
  rerender(<BarCell text="Not supplied" share={null} />);
  expect(fill()).toBeNull();
  expect(tick()).toBeNull();
});
