import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Tile } from "./Tile";

afterEach(cleanup);

it("keeps the trace and caption of a small head that has no title", () => {
  render(
    <Tile
      span={4}
      label="Figure"
      head="small"
      kicker="FY2024"
      trace={<button type="button">Trace</button>}
    >
      <p>Body</p>
    </Tile>,
  );
  const tile = screen.getByRole("region", { name: "Figure" });
  expect(within(tile).getByRole("button", { name: "Trace" })).toBeVisible();
  expect(within(tile).getByText("FY2024")).toBeVisible();
  expect(within(tile).queryByRole("heading")).toBeNull();
});

it("leaves the default head unchanged and gives the small head the asked level", () => {
  const { unmount } = render(
    <Tile span={4} label="A" title="Default">
      <p>Body</p>
    </Tile>,
  );
  expect(screen.getByRole("heading", { level: 3, name: "Default" })).toHaveClass("text-h4");
  unmount();
  render(
    <Tile span={12} label="B" title="Runs" head="small" as="h2">
      <p>Body</p>
    </Tile>,
  );
  expect(screen.getByRole("heading", { level: 2, name: "Runs" })).toHaveClass("text-small");
});
