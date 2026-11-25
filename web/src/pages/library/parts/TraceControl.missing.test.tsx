import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { BottomLine } from "./BottomLine";
import { RunContext } from "./RunContext";
import { TraceButton, TraceControl } from "./TraceControl";

const LABEL = "Show sources for this finding";
const MARKER = `${LABEL}: no source recorded`;

function inRun(node: React.ReactNode, open: (key: string) => void = () => {}) {
  return render(<RunContext.Provider value={{ traces: {}, open }}>{node}</RunContext.Provider>);
}

it("draws the focus ring in the one focus colour: no surface is dark", () => {
  render(<TraceButton label="On light" open={() => {}} />);
  const onLight = screen.getByRole("button", { name: "On light" }).className;
  expect(onLight).toMatch(/focus-visible:ring-focus(?!-inverse)/);
  expect(onLight).not.toContain("ring-focus-inverse");
});

it("draws a marker, not nothing, for a null trace, with the same footprint as a control", () => {
  const open = vi.fn();
  inRun(<TraceControl trace={null} label={LABEL} />, open);
  const marker = screen.getByRole("button", { name: MARKER });
  expect(marker.className).toContain("size-8");
  expect(marker.className).toContain("flex-none");
  expect(marker.className).toContain("border-dashed");
  expect(marker.querySelectorAll("svg")).toHaveLength(1);
  fireEvent.click(marker);
  expect(open).not.toHaveBeenCalled();
});

it("draws the same marker for an absent trace", () => {
  inRun(<TraceControl label={LABEL} />);
  expect(screen.getByRole("button", { name: MARKER })).toBeInTheDocument();
});

it("keeps the marker reachable by keyboard and tells assistive technology it opens nothing", () => {
  inRun(<TraceControl trace={null} label={LABEL} />);
  const marker = screen.getByRole("button", { name: MARKER });
  expect(marker).toHaveAttribute("aria-disabled", "true");
  expect(marker).not.toBeDisabled();
  marker.focus();
  expect(marker).toHaveFocus();
});

it("says no source was recorded in the tooltip on keyboard focus", async () => {
  inRun(<TraceControl trace={null} label={LABEL} />);
  const marker = screen.getByRole("button", { name: MARKER });
  fireEvent.keyDown(document.body, { key: "Tab" });
  act(() => {
    marker.focus();
  });
  const tip = await screen.findByRole("tooltip");
  expect(tip).toHaveTextContent("No source recorded");
  expect(tip).not.toHaveTextContent("Show sources");
});

it("draws a held trace as a control, not a marker, and throws for a key the run does not hold", () => {
  const open = vi.fn();
  render(
    <RunContext.Provider value={{ traces: { held: { title: "t" } as never }, open }}>
      <TraceControl trace="held" label={LABEL} />
    </RunContext.Provider>,
  );
  const control = screen.getByRole("button", { name: LABEL });
  expect(control.className).not.toContain("border-dashed");
  expect(control).not.toHaveAttribute("aria-disabled");
  fireEvent.click(control);
  expect(open).toHaveBeenCalledWith("held");
  expect(() => inRun(<TraceControl trace="missing" label={LABEL} />)).toThrow(RangeError);
});

it("throws outside a RunFrame, with or without a trace", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<TraceControl trace={null} label={LABEL} />)).toThrow(
    "TraceControl was drawn outside a RunFrame",
  );
  expect(() => render(<TraceControl label={LABEL} />)).toThrow(
    "TraceControl was drawn outside a RunFrame",
  );
});

it("draws the marker on the bottom-line tile in the gap treatment, as anywhere else", () => {
  inRun(
    <BottomLine
      level="h2"
      text={{ label: "Bottom line", lead: "Watchlist", rest: "Review liquidity.", trace: null }}
    />,
  );
  const band = screen.getByRole("region", { name: "Bottom line" });
  const marker = within(band).getByRole("button", {
    name: "Show sources for the bottom line: no source recorded",
  });
  expect(marker.className).toContain("border-dashed");
  expect(marker.className).toContain("border-border-gap");
  expect(marker.className).toContain("focus-visible:ring-focus");
});
