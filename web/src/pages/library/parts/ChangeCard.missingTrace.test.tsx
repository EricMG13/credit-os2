import { fireEvent, render, screen } from "@testing-library/react";
import type { Change } from "../slice";
import { ChangeCard } from "./ChangeCard";
import { RunContext } from "./RunContext";

const change: Change = {
  measure: "Net leverage",
  kind: "Value",
  current: { kind: "value", text: "4.6x", at: 4.6 },
  from: { kind: "value", text: "4.9x", at: 4.9 },
  direction: "down",
  change: "Lower by 0.3x",
  cause: "EBITDA grew 10% while net debt rose 3%.",
  effect: "The outlook moves from negative to stable.",
  trace: null,
};

it("shows the existing missing-source marker for a change claim with no recorded trace", () => {
  const open = vi.fn();
  render(
    <RunContext.Provider value={{ traces: {}, open }}>
      <ul>
        <ChangeCard change={change} />
      </ul>
    </RunContext.Provider>,
  );
  const marker = screen.getByRole("button", {
    name: "Show sources for this change: no source recorded",
  });
  expect(marker).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(marker);
  expect(open).not.toHaveBeenCalled();
  expect(screen.getByText("4.6x")).toBeVisible();
  expect(screen.getByText("4.9x")).toBeVisible();
});

it("keeps the caller's source slot authoritative without drawing a second marker", () => {
  render(
    <ul>
      <ChangeCard change={change} source={<button>Comparison row source</button>} />
    </ul>,
  );
  expect(screen.getByRole("button", { name: "Comparison row source" })).toBeVisible();
  expect(screen.queryByRole("button", { name: /no source recorded/ })).toBeNull();
});

it("preserves an explicit empty source slot used by connected comparison rows", () => {
  render(
    <ul>
      <ChangeCard change={change} source={false} />
    </ul>,
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("4.6x")).toBeVisible();
});
