// S1 redesign: the report header (breadcrumb, name, sector, fact chips, section control), the
// Overview assembled from its tile rows in the mockup's order, and History reached from the header.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportReader } from "./ReportLibrary";
import type { Block, Section, Snapshot } from "./publishedReport";

const text = (line: number, value: string): Block => ({
  type: "text",
  line,
  end: line,
  text: value,
});
const h = (heading: string, level: number, line: number, blocks: Block[] = []): Section => ({
  heading,
  level,
  line,
  blocks,
});

const LEAD = "Leverage is high but liquidity covers the next two years.";
/** The fundamental credit module: the run's published credit view. */
const credit: Section[] = [
  h("Findings", 2, 1),
  h("Bottom line", 3, 3, [text(4, LEAD)]),
  h("Key findings", 3, 6, [text(7, "Cover is thin at 2.1x.")]),
  h("Contrary evidence and what would change the view", 3, 9, [text(10, "Cash flow held.")]),
  h("Limitations", 3, 12, [text(13, "The forecast rests on one year of audited figures.")]),
];
/** The committee: its decision is shown on its own page only. */
const committee: Section[] = [
  h("Findings", 2, 1),
  h("Bottom line", 3, 3, [text(4, "The secured layer is watched.")]),
  h("Decision", 3, 15, [text(16, "Final Action Bias: Watchlist. The secured layer is watched.")]),
];

const SHA2 = "2".repeat(64);
const SHA6 = "6".repeat(64);

function snapshot({ preview = false }: { preview?: boolean } = {}) {
  const run = (folder: string, asOf: string) => ({
    folder,
    issuer: "Acme",
    issuerKey: "acme",
    asOf,
    period: "FY2025",
    pathway: "credit_snapshot",
    modules: {
      "CP-2": { outputs: [`${folder}/cp2`], default: `${folder}/cp2` },
      "CP-6": { outputs: [`${folder}/cp6`], default: `${folder}/cp6` },
    },
    record: { steps: [{ module: "CP-2" }, { module: "CP-6" }] },
    publicationVerified: true,
    lead: { module: "CP-2", output: `${folder}/cp2`, sha256: SHA2, line: 4, text: LEAD },
    evidence: { sources: [], unused: [], unrecorded: [], handoffs: [], downloads: [], zip: null },
  });
  return {
    catalogue: {
      real: [
        {
          id: "acme",
          name: "Acme Holdings",
          issuer: "Acme",
          title: "",
          date: "",
          period: "FY2025",
          sector: "Industrial machinery",
          metrics: { cash: { unit: "US$m" } },
          ratings: [
            {
              agency: "Moody's",
              label: "B1",
              scope: "issuer",
              outlook: "Negative",
              date: "2026-02-28",
            },
          ],
        },
      ],
    },
    workspace: {
      runs: { acmeKey: run("acme", "2026-03-31"), oldKey: run("acme-old", "2025-03-31") },
      outputs: {
        "acme/cp2": {
          id: "acme/cp2",
          run: "acmeKey",
          module: "CP-2",
          sha256: SHA2,
          label: "CP-2",
          href: "",
        },
        "acme/cp6": {
          id: "acme/cp6",
          run: "acmeKey",
          module: "CP-6",
          sha256: SHA6,
          label: "CP-6",
          href: "",
        },
      },
      handoffs: { [SHA2]: credit, [SHA6]: committee },
      models: [],
    },
    chips: {},
    ...(preview && { preview: { reason: "A test preview." } }),
  } as unknown as Snapshot;
}

function open(hash: string, snap = snapshot(), mode: "synthetic" | "live" = "synthetic") {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === "/connected/snapshot?run=acme"
          ? Response.json(snap)
          : Response.json({ error: "not found" }, { status: 404 }),
      ),
    ),
  );
  window.history.replaceState(null, "", `/report/acme${hash}`);
  render(<ReportReader id="acme" mode={mode} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

const ORDER = [
  "The call",
  "Confidence",
  "Evidence clearance",
  "Since the earlier run",
  "Headline figures",
  "Key findings",
  "Contrary evidence and what would change the view",
  "Maturity wall",
  "Capital structure by rank",
  "Covenant headroom",
  "Downside scenarios",
  "Forward path",
  "What this run could not do",
  "Bottom line by module",
  "Dates to watch",
];

it("assembles the Overview from its tile rows in the mockup's order, under one hidden h2", async () => {
  open("#overview");
  const page = await screen.findByRole("region", { name: "Overview" });
  const heading = within(page).getByRole("heading", { level: 2, name: "Overview" });
  expect(heading).toHaveClass("sr-only");
  const names = within(page)
    .getAllByRole("region")
    .map((region) => region.getAttribute("aria-label") ?? "")
    .filter((name) => ORDER.includes(name));
  expect(names).toEqual(ORDER);
  // The page's own h2 only: every tile head, the pipeline's included, is an h3 under it.
  expect(within(page).getAllByRole("heading", { level: 2 })).toHaveLength(1);
});

it("draws none of the interim Overview's blocks", async () => {
  open("#overview");
  await screen.findByRole("region", { name: "The call" });
  expect(screen.queryByRole("navigation", { name: "Overview sections" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Key charts" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Credit view" })).toBeNull();
  expect(screen.queryByText("This run")).toBeNull();
  expect(screen.queryByRole("link", { name: "Issuer calendar" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Company" })).toBeNull();
});

it("keeps the limitations and dates anchors on their tiles", async () => {
  open("#overview/limitations");
  const limits = await screen.findByRole("heading", { name: "What this run could not do" });
  expect(limits).toHaveAttribute("id", "overview-limitations");
  expect(document.activeElement).toBe(limits);
  cleanup();
  open("#overview/dates");
  const dates = await screen.findByRole("heading", { name: "Dates to watch" });
  expect(dates).toHaveAttribute("id", "overview-dates");
  expect(document.activeElement).toBe(dates);
});

it("heads every report page with the breadcrumb, the name, the sector line and quiet fact chips", async () => {
  open("#overview");
  const header = await screen.findByRole("region", { name: "Acme Holdings" });
  const crumbs = within(header).getByRole("navigation", { name: "Breadcrumb" });
  const items = within(crumbs).getAllByRole("listitem");
  expect(items.map((item) => item.textContent)).toEqual([
    "Library",
    "Acme Holdings",
    "Full credit assessment",
  ]);
  expect(within(crumbs).getByRole("link", { name: "Library" })).toHaveAttribute("href", "/");
  expect(within(crumbs).getByRole("link", { name: "Acme Holdings" })).toHaveAttribute(
    "href",
    "#history",
  );
  expect(items[2]).toHaveAttribute("aria-current", "page");
  expect(within(header).getByRole("heading", { level: 1, name: "Acme Holdings" })).toBeVisible();
  // On a phone the name and the crumbs wrap in full: nothing is clamped or cut to a tooltip.
  expect(within(crumbs).getByRole("list")).toHaveClass("flex-wrap");
  const name = within(header).getByRole("heading", { level: 1 });
  expect(name.className).not.toMatch(/line-clamp|truncate/);
  expect(crumbs.innerHTML).not.toMatch(/truncate/);
  expect(within(header).getByText("Industrial machinery")).toBeVisible();
  const facts = within(within(header).getByRole("list", { name: "Run facts" })).getAllByRole(
    "listitem",
  );
  expect(facts.map((fact) => fact.textContent)).toEqual([
    "Full credit assessment",
    expect.stringMatching(/^As of 31 Mar\w* 2026 · FY2025$/u),
    "US$m",
    "Moody's B1 · Negative",
    "Ratings entered at run start",
    "Synthetic test",
  ]);
  expect(within(header).getByRole("link", { name: "Run progress" })).toHaveAttribute(
    "href",
    "/run/acme",
  );
  const order = [
    within(header).getByRole("heading", { level: 1 }),
    within(header).getByRole("navigation", { name: "Report sections" }),
    within(header).getByRole("link", { name: "Run progress" }),
  ];
  for (const [earlier, later] of [
    [order[0], order[1]],
    [order[1], order[2]],
  ] as const)
    expect(
      (earlier?.compareDocumentPosition(later as Node) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  expect(within(header).queryByText(/acme-old|acmeKey|CP-6/)).toBeNull();
});

it("draws the sections as one segmented control, Calendar included and current where open", async () => {
  open("#overview");
  const nav = await screen.findByRole("navigation", { name: "Report sections" });
  const links = within(nav).getAllByRole("link");
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "#overview",
    "#changes",
    "#modules",
    "#forecast",
    "#evidence",
    "#calendar",
  ]);
  expect(within(nav).getByRole("link", { name: "Modules 2" })).toBeVisible();
  expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent("Overview");
  cleanup();
  open("#calendar");
  const calendar = await screen.findByRole("navigation", { name: "Report sections" });
  expect(within(calendar).getByRole("link", { current: "page" })).toHaveTextContent("Calendar");
  cleanup();
  open("#history");
  const history = await screen.findByRole("navigation", { name: "Report sections" });
  expect(within(history).queryByRole("link", { current: "page" })).toBeNull();
});

it("opens this issuer's runs from the issuer crumb, as a timeline", async () => {
  open("#history");
  const runs = await screen.findByRole("region", { name: "Runs of Acme Holdings" });
  const list = within(runs).getByRole("list", { name: "Runs, newest first" });
  const rows = [...list.children];
  expect(rows[0]).toHaveTextContent("31 March 2026");
  // No run's decision is drawn: the opened run says its decision is not shown.
  expect(within(runs).getByText("Committee action and size: Not shown")).toBeVisible();
  expect(within(runs).queryByText("Watchlist")).toBeNull();
  const current = screen.getByRole("navigation", { name: "Breadcrumb" });
  expect(within(current).getAllByRole("listitem").at(-1)).toHaveTextContent("Runs");
});

it("marks a test preview in the header and offers no Run progress for it", async () => {
  open("#overview", snapshot({ preview: true }), "live");
  const header = await screen.findByRole("region", { name: "Acme Holdings" });
  expect(within(header).getByText("Test preview")).toBeVisible();
  expect(within(header).queryByText("Synthetic test")).toBeNull();
  expect(within(header).queryByRole("link", { name: "Run progress" })).toBeNull();
});
