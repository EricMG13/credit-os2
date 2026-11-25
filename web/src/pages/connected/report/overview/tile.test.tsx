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

it("draws the default head's kicker as a quiet caption under the title, never above it", () => {
  render(
    <Tile span={12} label="Sources" title="Sources" kicker="The supplied files.">
      <p>Body</p>
    </Tile>,
  );
  const title = screen.getByRole("heading", { level: 3, name: "Sources" });
  const caption = screen.getByText("The supplied files.");
  expect(title.nextElementSibling).toBe(caption);
  expect(caption).toHaveClass("text-caption", "text-text-tertiary");
});

it("takes focus from script, with the token ring, only when it is given an address", () => {
  const { unmount } = render(
    <Tile id="evidence-claim" span={7} label="The claim" title="Net leverage">
      <p>Body</p>
    </Tile>,
  );
  const tile = screen.getByRole("region", { name: "The claim" });
  expect(tile).toHaveAttribute("tabindex", "-1");
  expect(tile).toHaveClass("outline-focus-ring", "focus-visible:outline-2");
  tile.focus();
  expect(tile).toHaveFocus();
  unmount();
  render(
    <Tile span={7} label="Plain" title="Plain">
      <p>Body</p>
    </Tile>,
  );
  expect(screen.getByRole("region", { name: "Plain" })).not.toHaveAttribute("tabindex");
});

it("keeps the default head's title style and gives the small head the asked level", () => {
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
