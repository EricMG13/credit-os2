import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, assert, expect, it, vi } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { MapTile, mapLayout } from "./parts";
import { mapOf } from "./read";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const NAME = "Ownership";
const TARGET_A = "target-a.pdf holding company";
const TARGET_B = "target-b.pdf holding company";

function drawMap({ target = TARGET_A, source = TARGET_A } = {}) {
  const handoff = entry(
    "CP-1A",
    [],
    [
      section(
        `Map: ${NAME}`,
        1,
        table(
          3,
          ["From", "Relationship", "Edge type", "To", "Evidence"],
          [
            ["Issuer A", "Owns", "Ownership", target, "Filing p.1"],
            ["Issuer B", "Holds", "Ownership", TARGET_B, "Filing p.2"],
            [source, "Issues", "Debt", "Notes", "Filing p.3"],
          ],
        ),
      ),
    ],
  );
  const map = mapOf(handoff, NAME);
  const rendered = render(
    <MapTile
      map={map}
      span={7}
      label={NAME}
      title={NAME}
      href={(line) => `#trace-${String(line)}`}
      absent="Map absent"
    />,
  );
  return { ...rendered, map };
}

it("keeps differently screened target entities and their links distinct in the figure and table", () => {
  const { container } = drawMap();
  const list = screen.getByRole("list", { name: NAME });
  const sources = [...list.children];
  expect(sources.map((node) => node.textContent)).toEqual([
    "Issuer A↓OwnsOwnershipIn Evidence (1)",
    "Issuer B↓HoldsOwnershipIn Evidence (2)",
    "In Evidence (1)↓IssuesDebtNotes",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  const [, issuerA, issuerB] = within(screen.getByRole("table")).getAllByRole("row");
  assert(issuerA && issuerB);
  expect(within(issuerA).getByRole("link")).toHaveAttribute("href", "#trace-5");
  expect(within(issuerA).getByRole("cell", { name: "In Evidence (1)" })).toBeVisible();
  expect(within(issuerB).getByRole("link")).toHaveAttribute("href", "#trace-6");
  expect(within(issuerB).getByRole("cell", { name: "In Evidence (2)" })).toBeVisible();
  expect(container.innerHTML).not.toMatch(/target-[ab]\.pdf/);
});

it("joins each wide-map connector to its own screened node without exposing either locator", () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width: 1000 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );
  const coordinates = new Map([
    ["Issuer A", [0, 0]],
    ["Issuer B", [0, 100]],
    ["In Evidence (1)", [300, 20]],
    ["In Evidence (2)", [300, 120]],
    ["Notes", [600, 50]],
  ]);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const [x = 0, y = 0] = coordinates.get(this.textContent) ?? [];
    return new DOMRect(x, y, this.hasAttribute("data-map-columns") ? 1000 : 100, 20);
  });
  const { container } = drawMap();
  const drawing = container.querySelector("[data-map-columns]");
  assert(drawing);
  expect(drawing).toHaveAttribute("data-map-columns", "3");
  expect([...drawing.children].slice(0, 3).map((column) => column.textContent)).toEqual([
    "Issuer AIssuer B",
    "In Evidence (1)In Evidence (2)",
    "Notes",
  ]);
  expect(
    [...drawing.querySelectorAll("path[marker-end]")].map((path) => path.getAttribute("d")),
  ).toEqual([
    "M100,10 C200,10 200,30 300,30",
    "M100,110 C200,110 200,130 300,130",
    "M400,30 C500,30 500,60 600,60",
  ]);
  expect(container.innerHTML).not.toMatch(/target-[ab]\.pdf/);
});

it.each([
  { target: TARGET_A, source: `**${TARGET_A}**` },
  { target: "  `target-a.pdf  holding company`  ", source: TARGET_A },
])("reuses a screened target as a source across authored formatting ($target)", (endpoints) => {
  const { container, map } = drawMap(endpoints);
  const list = screen.getByRole("list", { name: NAME });
  expect([...list.children].map((node) => node.textContent)).toEqual([
    "Issuer A↓OwnsOwnershipIn Evidence (1)",
    "Issuer B↓HoldsOwnershipIn Evidence (2)",
    "In Evidence (1)↓IssuesDebtNotes",
  ]);
  assert(map.state === "ready");
  const [first, second, outgoing] = map.edges;
  expect(first?.toKey).toBe(TARGET_A);
  expect(second?.toKey).toBe(TARGET_B);
  expect(outgoing?.key).toBe(TARGET_A);
  expect(mapLayout(map.edges).map((column) => column.map(({ name }) => name))).toEqual([
    ["Issuer A", "Issuer B"],
    ["In Evidence (1)", "In Evidence (2)"],
    ["Notes"],
  ]);
  expect(container.innerHTML).not.toMatch(/target-[ab]\.pdf/);
});
