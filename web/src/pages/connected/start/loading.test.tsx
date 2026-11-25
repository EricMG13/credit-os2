import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConnectedApp } from "../ConnectedApp";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("draws the loading state in the page's final layout: stepper, step and rail, as shapes only", async () => {
  // Everything answers but the run options, which never arrive.
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) =>
      path === "/connected/context"
        ? new Promise<Response>(() => {})
        : Promise.resolve(Response.json({})),
    ),
  );
  render(<ConnectedApp path="/start" mode="synthetic" />);
  const status = await screen.findByRole("status", { name: "Loading run options" });
  const shapes = status.querySelector("[aria-hidden='true']");
  expect(shapes?.querySelectorAll("section")).toHaveLength(3);
  expect(shapes?.querySelector(".xl\\:col-span-8")).not.toBeNull();
  expect(shapes?.querySelector(".xl\\:col-span-4")).not.toBeNull();
  expect(status).toHaveTextContent("");
});
