import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, renderHook, screen, within } from "@testing-library/react";
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

const h3s = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
const navSections = () =>
  within(
    within(screen.getByRole("navigation", { name: "Modules and sections" })).getAllByRole(
      "list",
    )[0] as HTMLElement,
  )
    .getAllByRole("button")
    .map((b) => b.textContent);

/**
 * S3-005. The reading order of a prose module is bottom line, key findings, contrary evidence and
 * what would change the view, then limitations, then the typed records, figures and tables
 * (CM-005): the limitations qualify the figures, so a reader meets them before the tables.
 */
describe("a module page's reading order", () => {
  it("draws Limitations straight after what would change the view, before the records", () => {
    renderModule("business-profile");
    expect(h3s()).toEqual([
      "A sole-source aftermarket franchise carries a thinner, more cyclical original-equipment business.",
      "Key findings",
      "Contrary evidence",
      "What would change the view",
      "Limitations2",
      "Risks by probability and impact",
      "Indicators to watch",
      "Questions this module set out to answer",
      "How a programme delay reaches the credit",
    ]);
  });

  it("lists Limitations before Records in the navigator, as the page draws them", () => {
    renderModule("business-profile");
    expect(navSections()).toEqual([
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

  it("draws Limitations after Key findings and before every record block of a module without contrary evidence", () => {
    renderModule("capital-structure");
    expect(h3s().slice(0, 3)).toEqual([
      expect.stringMatching(/^Secured debt is long-dated/),
      "Key findings",
      expect.stringMatching(/^Limitations\d+$/),
    ]);
    expect(navSections().slice(0, 3)).toEqual(["Bottom line", "Key findings", "Limitations"]);
    expect(navSections().at(-1)).toBe("Hedges");
  });
});
