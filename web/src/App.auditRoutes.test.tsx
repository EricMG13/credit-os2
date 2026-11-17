import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { App } from "./App";
import type { RouteTable } from "./pages/route-table";

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

it("S1-008 ignores one trailing slash on the kit address", () => {
  window.location.hash = "#/kit/";
  render(<App result={{ kind: "missing" }} />);
  expect(screen.getByRole("heading", { name: "Component kit", level: 1 })).toBeVisible();
  expect(document.title).toBe("Component kit — Credit OS");
});

it("J6-014 and S1-011 give an unknown page a route back with no current area", () => {
  window.location.hash = "#/nowhere";
  render(<App result={{ kind: "missing" }} />);
  expect(within(screen.getByRole("main")).getByRole("link", { name: "Back to the library" }))
    .toHaveAttribute("href", "#/");
  expect(within(screen.getByRole("navigation", { name: "Areas" })).queryAllByRole("link", {
    current: "page",
  })).toHaveLength(0);
});

it.each([
  ["model", "Model statements", "Model"],
  ["run", "Run documents", "Run"],
])("S1-011 keeps a missing-data %s page's own title and rail", (area, title, label) => {
  const absent = () => ({ kind: "absent" }) as const;
  const table: RouteTable = {
    routes: [{ path: `/${area}/example`, title, render: () => null }],
    readers: { library: absent, model: absent, run: absent, signal: absent },
  };
  window.location.hash = `#/${area}/example`;
  render(<App result={{ kind: "missing" }} table={table} />);
  expect(screen.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  expect(document.title).toBe(`${title} — Credit OS`);
});
