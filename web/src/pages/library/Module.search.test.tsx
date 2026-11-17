import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { useSourcesOn } from "./parts/SourcesSwitch";
import { routes } from "./routes";

type Json = Record<string, unknown>;

const fixture = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "..", "..", "..", "fixtures", "library.json"),
    "utf8",
  ),
) as { issuers: LibraryData["issuers"]; slice: Json };

function renderModule(module: string) {
  const data: LibraryData = {
    schema: "credit-os-data/1",
    issuers: fixture.issuers,
    library: fixture.slice,
  };
  const route = routes.find((r) => r.path === "/library/:issuer/:run/modules/:module");
  if (route === undefined) throw new Error("no module route");
  return render(
    <SourceContext.Provider value={data}>
      {route.render({ issuer: "halden-aerostructures", run: "2026-09-30", module })}
    </SourceContext.Provider>,
  );
}

afterEach(() => {
  cleanup();
  renderHook(() => useSourcesOn()).result.current[1](false);
});

const nav = () => screen.getByRole("navigation", { name: "Modules and sections" });
const search = () => within(nav()).getByRole("textbox", { name: "Search modules" });
const moduleNames = () =>
  within(nav())
    .queryAllByRole("link")
    .map((link) => link.querySelector("span:last-child")?.textContent ?? "");
const type = (value: string) => {
  fireEvent.change(search(), { target: { value } });
};
const follows = (a: Node, b: Node) =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

/**
 * S3-006 with C3-025. "Search sits at the top" of the Modules navigator (decision 5 of the reader
 * ruling, CM-028, CT-044). It narrows the list of the run's modules by plain name; it takes the
 * kit's input, as the library Home's issuer search does.
 */
describe("the module navigator's search", () => {
  it("is the first thing in the navigator, above On this page and the module list", () => {
    renderModule("business-profile");
    expect(search()).toHaveAttribute("placeholder", "Search modules");
    expect(search()).toHaveValue("");
    expect(follows(search(), within(nav()).getByText("On this page"))).toBe(true);
    expect(follows(search(), within(nav()).getByText("Modules in this run"))).toBe(true);
  });

  it("lists every module of the run until something is typed", () => {
    renderModule("business-profile");
    expect(moduleNames()).toHaveLength(13);
  });

  it("narrows the list to the modules whose plain name holds the text, ignoring case", () => {
    renderModule("business-profile");
    const all = moduleNames();
    type("  CAPITAL ");
    expect(moduleNames()).toEqual(all.filter((name) => /capital/i.test(name)));
    expect(moduleNames().length).toBeGreaterThan(0);
    expect(moduleNames().length).toBeLessThan(all.length);
  });

  it("keeps each remaining entry's address and leaves the page's sections alone", () => {
    renderModule("business-profile");
    type("capital");
    const link = within(nav()).getByRole("link", { name: /^Capital structure, / });
    expect(link).toHaveAttribute(
      "href",
      "#/library/halden-aerostructures/2026-09-30/modules/capital-structure",
    );
    expect(
      within(within(nav()).getAllByRole("list")[0] as HTMLElement)
        .getAllByRole("button")
        .map((section) => section.textContent),
    ).toEqual([
      "Bottom line",
      "Key findings",
      "Contrary evidence",
      "What would change the view",
      "Limitations",
      "Risks by probability and impact",
      "Indicators to watch",
      "Questions this module set out to answer",
      "How a programme delay reaches the credit",
    ]);
  });

  it("says no module matches, draws no empty list, and returns every module when cleared", () => {
    renderModule("business-profile");
    const all = moduleNames();
    type("zzz");
    expect(moduleNames()).toEqual([]);
    expect(within(nav()).getByText("No module matches")).toBeVisible();
    expect(within(nav()).getAllByRole("list")).toHaveLength(1);
    type("");
    expect(within(nav()).queryByText("No module matches")).toBeNull();
    expect(moduleNames()).toEqual(all);
  });
});
