import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { routes } from "./routes";

const fixture = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../fixtures/library.json"), "utf8"),
) as {
  issuers: LibraryData["issuers"];
  slice: unknown;
};

beforeEach(() => {
  window.history.replaceState({}, "");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "");
});

function show(page: string, params: Record<string, string> = {}) {
  const route = routes.find((item) => item.path === page);
  if (!route) throw new Error(`missing route ${page}`);
  return render(
    <SourceContext.Provider
      value={{ schema: "credit-os-data/1", issuers: fixture.issuers, library: fixture.slice }}
    >
      <main>{route.render(params)}</main>
    </SourceContext.Provider>,
  );
}

function pick(name: string, value: string) {
  const trigger = screen.getByRole("button", { name: new RegExp(`^${name}:`) });
  const select = trigger.closest("div")?.querySelector("select");
  if (!select) throw new Error(`missing ${name} select`);
  fireEvent.change(select, { target: { value: `option:${value}` } });
}

it("S2-020 restores search, filters, layout and range bands on returning to the home entry", async () => {
  const first = show("/library/home");
  fireEvent.click(screen.getByRole("radio", { name: "List" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Search issuers" }), {
    target: { value: "o" },
  });
  pick("Sector", "Rigid packaging");
  pick("Leverage", "3.0x to under 5.0x");
  first.unmount();
  show("/library/home");
  expect(screen.getByRole("textbox", { name: "Search issuers" })).toHaveValue("o");
  expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
  expect(await screen.findByRole("button", { name: /Sector: Rigid packaging/ })).toBeVisible();
  expect(await screen.findByRole("button", { name: /Leverage: 3.0x to under 5.0x/ })).toBeVisible();
});

it("S2-025 draws key findings before headline figures and For and against", () => {
  show("/library/:issuer/:run/overview", { issuer: "halden-aerostructures", run: "2026-09-30" });
  const findings = screen.getByRole("region", { name: "Key findings" });
  for (const label of ["Headline figures", "For and against"]) {
    expect(
      findings.compareDocumentPosition(screen.getByRole("region", { name: label })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
});

it("S3-012 gives an unassessable module a Bottom line containing its exact reason", () => {
  show("/library/:issuer/:run/modules/:module", {
    issuer: "halden-aerostructures",
    run: "2026-09-30",
    module: "recovery",
  });
  const band = screen.getByRole("region", { name: "Bottom line" });
  expect(within(band).getByRole("heading", { level: 3 })).toHaveTextContent(
    "The security package documents were not among the files provided, so recovery by class could not be assessed.",
  );
});

it("S3-017 and S3-018 keep every limitation whole without individual disclosure controls", () => {
  show("/library/:issuer/:run/modules/:module", {
    issuer: "halden-aerostructures",
    run: "2026-09-30",
    module: "business-profile",
  });
  const limits = screen.getByRole("region", { name: "Limitations" });
  expect(limits.querySelector('[class*="line-clamp"]')).toBeNull();
  expect(within(limits).queryByRole("button", { name: /^Show (all|less)$/ })).toBeNull();
  expect(within(limits).getByRole("button", { name: "Collapse limitations" })).toBeVisible();
});

it("S3-020 gives every statement cell the same card surface", () => {
  show("/library/:issuer/:run/modules/:module", {
    issuer: "halden-aerostructures",
    run: "2026-09-30",
    module: "capital-structure",
  });
  const table = screen.getByRole("table", { name: "Debt and leverage by year" });
  expect(table.closest("[data-statement-surface]")).toHaveClass("bg-surface-card");
});

it("S3-025 updates the section marker when the reader scrolls back to the top", () => {
  show("/library/:issuer/:run/modules/:module", {
    issuer: "halden-aerostructures",
    run: "2026-09-30",
    module: "business-profile",
  });
  const main = screen.getByRole("main");
  const nav = screen.getByRole("navigation", { name: "Modules and sections" });
  Object.defineProperty(main, "clientHeight", { configurable: true, value: 900 });
  vi.spyOn(main, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
  for (const [index, target] of Array.from(
    main.querySelectorAll<HTMLElement>("[data-section]"),
  ).entries()) {
    target.scrollIntoView = vi.fn();
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: index * 500 } as DOMRect);
  }
  fireEvent.click(within(nav).getByRole("button", { name: "Limitations" }));
  fireEvent.scroll(main);
  expect(within(nav).getByRole("button", { name: "Bottom line" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  expect(within(nav).getByRole("button", { name: "Limitations" })).not.toHaveAttribute(
    "aria-current",
  );
});

it.each([
  ["/library/:issuer/:run/modules/:module", { module: "capital-structure" }, "modules"],
  ["/library/:issuer/:run/evidence/summary", {}, "evidence"],
])("S2-015 draws a page-shaped loading skeleton for %s", (page, params, shape) => {
  const { container } = show(page, {
    issuer: "halden-aerostructures",
    run: "2026-06-30",
    ...params,
  });
  expect(container.querySelector('[aria-busy="true"]')).toHaveAttribute("data-loading-page", shape);
  if (shape === "modules") {
    expect(screen.getByRole("link", { name: /^Modules/ })).toHaveAttribute("aria-current", "page");
  }
});
