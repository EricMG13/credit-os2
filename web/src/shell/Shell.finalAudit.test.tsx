import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Shell } from "./Shell";

afterEach(cleanup);

it("S1-011 lets the not-found screen mark no rail area as current", () => {
  render(<Shell current={null}>Missing page</Shell>);
  expect(document.querySelector("[aria-current=page]")).toBeNull();
});

it("S1-019 gives the current area a distinct line marker", () => {
  render(<Shell current="library">Library page</Shell>);
  const markers = document.querySelectorAll("[data-current-area]");
  expect(markers).toHaveLength(1);
  expect(markers[0]).toHaveClass("border-l-2");
  expect(markers[0]?.closest("li")).toContainElement(screen.getByRole("link", { name: "Library" }));
});

it("J1-011 lets a connected rail name its run list Run activity", () => {
  render(
    <Shell current="run" sections={[{ area: "run", href: "/runs", label: "Run activity" }]}>
      Run list
    </Shell>,
  );
  expect(screen.getByRole("link", { name: "Run activity" })).toHaveAttribute("href", "/runs");
});
