import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { Trace } from "../slice";
import { TraceCitations } from "./TraceCitations";
import { TraceDrawer } from "./TraceDrawer";
import type { TraceCitation } from "./TraceParts";

afterEach(cleanup);

const trace: Trace = {
  title: "Sources for Findings",
  heading: "Findings",
  subtitle: "Liquidity · Handoff line 5",
  statement: "Cover is thin.",
  derivation: { label: "Evidence", value: "", note: null, children: [] },
  excerpt: { quote: "first only", source: "a.pdf" },
  qualification: null,
  evidenceItem: "out~aaa-5",
};
const cite = (label: string, quote: string | null): TraceCitation => ({
  label,
  file: `${label}.pdf`,
  pages: "Cited page 3",
  quote,
  reason: quote === null ? "page not in source text" : null,
  sha256: "c".repeat(64),
});

function draw(lookup: ((item: string) => TraceCitation[] | undefined) | null) {
  render(
    <TraceCitations.Provider value={lookup}>
      <TraceDrawer trace={trace} evidenceHref="#e" isOpen onClose={() => {}} />
    </TraceCitations.Provider>,
  );
}

it("shows every citation of the line, not only the first passage", () => {
  draw((item) =>
    item === "out~aaa-5"
      ? [cite("one", "Quote one"), cite("two", null), cite("three", "Quote three")]
      : undefined,
  );
  expect(screen.getByText("Quote one")).toBeVisible();
  expect(screen.getByText("Quote three")).toBeVisible();
  expect(screen.getByText("two.pdf")).toBeVisible();
  expect(screen.getByText("page not in source text")).toBeVisible();
  expect(screen.queryByText("first only")).toBeNull();
});

it("says no passage was recorded when the page's lookup finds the line has no citation", () => {
  draw(() => []);
  expect(screen.getByText("No source passage was recorded for this item.")).toBeVisible();
});

it("falls back to the trace's own excerpt where there is no lookup or it does not know the item", () => {
  draw(null);
  expect(screen.getByText("first only")).toBeVisible();
  cleanup();
  draw(() => undefined);
  expect(screen.getByText("first only")).toBeVisible();
});

it("has one way forward in its footer and one close control", () => {
  draw(null);
  expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Open in Evidence" })).toHaveAttribute("href", "#e");
});
