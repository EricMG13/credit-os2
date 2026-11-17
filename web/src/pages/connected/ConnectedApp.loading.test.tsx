import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";
import { use } from "react";

vi.mock("./LibraryIndex", () => {
  const pending = new Promise<void>(() => undefined);
  return {
    ReportLibrary() {
      use(pending);
      return null;
    },
  };
});

afterEach(cleanup);

it("C1-032 keeps static content-shaped blocks while a page chunk is loading", () => {
  render(<ConnectedApp path="/" mode="synthetic" />);
  const loading = screen.getByRole("status");
  expect(document.title).toBe("Library — Credit OS");
  expect(loading.querySelectorAll(".bg-surface-subtle").length).toBeGreaterThan(1);
  expect(loading.className).not.toMatch(/pulse|shimmer|animate/);
});
