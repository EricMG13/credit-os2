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
const SHA2 = "b".repeat(64);
const SHA6 = "d".repeat(64);
const SHA1 = "a".repeat(64);
const SHA3 = "c".repeat(64);
const LEAD = "Leverage is high but liquidity covers two years.";
const CP2_LIMIT = "Covenant headroom was not established.";
const CP6_LIMIT = "The committee size rests on one unaudited quarter.";

function snapshot() {
  const run = {
    folder: "acme",
    issuer: "Acme",
    issuerKey: "acme",
    asOf: "2026-03-31",
    period: "FY2025",
    pathway: "earnings_update",
    publicationVerified: true,
    assessmentScope: "standard",
    modules: {
      "CP-2": { outputs: ["acme/cp2"], default: "acme/cp2" },
      "CP-6": { outputs: ["acme/cp6"], default: "acme/cp6" },
    },
    evidence: { sources: [], unused: [], unrecorded: [], handoffs: [], downloads: [], zip: null },
  };
  const output = (module: string, sha256: string, extra = {}) => ({
    id: `acme/${module.toLowerCase().replace("-", "")}`,
    run: "acme",
    module,
    sha256,
    label: module,
    href: "",
    ...extra,
  });
  return {
    catalogue: {
      real: [
        {
          id: "acme",
          name: "Acme",
          issuer: "Acme",
          title: "",
          date: "",
          period: "FY2025",
          sector: "",
          metrics: {},
        },
      ],
    },
    workspace: {
      runs: { acme: run },
      outputs: {
        "acme/cp2": output("CP-2", SHA2, {
          maps: [{ title: "credit-risk transmission", table: 12 }],
        }),
        "acme/cp6": output("CP-6", SHA6),
      },
      handoffs: {
        [SHA2]: [
          h("Findings", 2, 1),
          h("Bottom line", 3, 3, [text(4, "Leverage is high but liquidity covers two years.")]),
          h("Map: credit-risk transmission", 3, 10, [
            {
              type: "table",
              line: 12,
              headers: ["From", "Relationship", "Edge type", "To", "Evidence"],
              rows: [
                {
                  line: 14,
                  cells: ["Rates", "raise", "Analyst Interpretation", "Interest", "Note 4"],
                },
              ],
            },
          ]),
        ],
        [SHA6]: [
          h("Findings", 2, 1),
          h("Bottom line", 3, 3, [text(4, "Add one percent of NAV.")]),
          h("Limitations", 3, 6, [text(7, CP6_LIMIT)]),
        ],
      },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

it("keeps a decision module's limitations on the Overview and none of its bottom line", async () => {
  vi.stubGlobal("fetch", () => Promise.resolve(Response.json(snapshot())));
  window.history.replaceState(null, "", "/#overview");
  render(<ReportReader id="acme" mode="synthetic" />);
  const limits = await screen.findByRole("region", { name: "What this run could not do" });
  expect(within(limits).getByText(CP6_LIMIT)).toBeInTheDocument();
  expect(screen.queryByText("Add one percent of NAV.")).toBeNull();
  // The redesigned Overview has no Key charts section: a module's charts are on its own page.
  expect(screen.queryByRole("heading", { name: "Key charts" })).toBeNull();
});

type Options = {
  pathway: string;
  foundation?: boolean;
  maps?: boolean;
  lead?: boolean;
  cp3?: string;
  hold?: string;
  cp6Limit?: string;
};

/** A verified run; the handoffs are written to the shapes the Overview reads. */
function fullSnapshot({ pathway, foundation, maps, lead, cp3, hold, cp6Limit }: Options) {
  const base = snapshot() as unknown as {
    workspace: {
      runs: Record<string, Record<string, unknown>>;
      outputs: Record<string, Record<string, unknown>>;
      handoffs: Record<string, Section[]>;
    };
  };
  const { runs, outputs, handoffs } = base.workspace;
  const run = runs.acme as { modules: Record<string, unknown> };
  runs.acme = {
    ...run,
    pathway,
    ...(lead
      ? { lead: { module: "CP-2", output: "acme/cp2", sha256: SHA2, line: 4, text: LEAD } }
      : {}),
    ...(hold
      ? {
          actionTreatment: {
            "CP-6": {
              output: "acme/cp6",
              sha256: SHA6,
              scope: "committee",
              state: "withheld",
              reason: hold,
            },
          },
        }
      : {}),
  };
  if (cp6Limit)
    handoffs[SHA6] = [
      h("Findings", 2, 1),
      h("Bottom line", 3, 3, [text(4, "Add one percent of NAV.")]),
      h("Limitations", 3, 6, [text(7, cp6Limit)]),
    ];
  if (!maps) outputs["acme/cp2"] = { ...outputs["acme/cp2"], maps: [] };
  handoffs[SHA2] = [
    h("Findings", 2, 1),
    h("Bottom line", 3, 3, [text(4, LEAD)]),
    h("Limitations", 3, 6, [text(7, CP2_LIMIT)]),
    ...(maps ? (handoffs[SHA2] ?? []).filter(({ heading }) => heading.startsWith("Map:")) : []),
  ];
  if (foundation) {
    run.modules["CP-1"] = { outputs: ["acme/cp1"], default: "acme/cp1" };
    outputs["acme/cp1"] = {
      id: "acme/cp1",
      run: "acme",
      module: "CP-1",
      sha256: SHA1,
      label: "CP-1",
      href: "",
      charts: [{ title: "Leverage", table: 11, columns: [1], unit: "x" }],
    };
    handoffs[SHA1] = [
      h("Findings", 2, 1),
      h("Chart data: leverage", 3, 10, [
        {
          type: "table",
          line: 11,
          headers: ["Period", "Net debt / EBITDA", "Reporting unit", "Basis and limitation"],
          rows: [{ line: 13, cells: ["FY 2025", "3.40", "x", "Published balance"] }],
        },
      ]),
    ];
  }
  if (cp3) {
    run.modules["CP-3"] = { outputs: ["acme/cp3"], default: "acme/cp3" };
    outputs["acme/cp3"] = {
      id: "acme/cp3",
      run: "acme",
      module: "CP-3",
      sha256: SHA3,
      label: "CP-3",
      href: "",
    };
    handoffs[SHA3] = [h("Findings", 2, 1), h("Limitations", 3, 6, [text(7, cp3)])];
  }
  return base as unknown as Snapshot;
}

async function overview(options: Options) {
  vi.stubGlobal("fetch", () => Promise.resolve(Response.json(fullSnapshot(options))));
  window.history.replaceState(null, "", "/#overview");
  render(<ReportReader id="acme" mode="synthetic" />);
  await screen.findByRole("heading", { name: "Overview" });
  await screen.findByText(LEAD);
}

it("shows a limitation once when the lead and an action module both state it", async () => {
  await overview({
    pathway: "credit_snapshot",
    foundation: true,
    maps: true,
    lead: true,
    cp3: CP2_LIMIT,
  });
  expect(screen.getAllByText(CP2_LIMIT)).toHaveLength(1);
  expect(screen.getByText(CP6_LIMIT)).toBeInTheDocument();
});

const HOLD = "The owner restricted this output and field-specific clearance is unavailable.";
const SIZED_LIMIT = "The recommended add of 1.00% NAV at 98.5 is sized on one unaudited quarter.";
const CP3_LIMIT = "Quote depth was not observed.";
const ELSEWHERE =
  "Limitations recorded by Committee decision are not in this list. That module's page shows what it recorded.";

it("leaves a held decision's limitations out of the Overview list and says where they are", async () => {
  await overview({
    pathway: "credit_snapshot",
    lead: true,
    cp3: CP3_LIMIT,
    hold: HOLD,
    cp6Limit: SIZED_LIMIT,
  });
  expect(screen.getByText(`Withheld: ${HOLD}`)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/1\.00% NAV|98\.5/);
  expect(screen.getAllByText(ELSEWHERE)).toHaveLength(1);
  expect(screen.getByText(CP3_LIMIT)).toBeInTheDocument();
});

it("lists the committee limitation when no hold is recorded, with no pointer line", async () => {
  await overview({ pathway: "credit_snapshot", lead: true, cp3: CP3_LIMIT, cp6Limit: SIZED_LIMIT });
  expect(screen.getByText(SIZED_LIMIT)).toBeInTheDocument();
  expect(screen.getByText(CP3_LIMIT)).toBeInTheDocument();
  expect(screen.queryByText(ELSEWHERE)).toBeNull();
});

it("leaves the limitations out when the recorded hold's reason cannot be shown", async () => {
  await overview({
    pathway: "credit_snapshot",
    lead: true,
    hold: "The hold is set out in committee.pdf.",
    cp6Limit: SIZED_LIMIT,
  });
  expect(screen.getByText("A published decision is unavailable for this run.")).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/1\.00% NAV|98\.5|committee\.pdf/);
  expect(screen.getAllByText(ELSEWHERE)).toHaveLength(1);
});

const BOTTOM_LINE_NOT_ON_PAGE =
  "This page does not show a bottom line for the Committee decision module, because no clearance for it is recorded. Other passages of that module, such as its limitations, may be shown on this page. The Committee decision page under Modules shows that module's findings.";

it("says on Overview that an unheld module's bottom line is not shown on this page, and shows it on the module page it names", async () => {
  const data = fullSnapshot({ pathway: "credit_snapshot", lead: true });
  vi.stubGlobal("fetch", () => Promise.resolve(Response.json(data)));
  window.history.replaceState(null, "", "/#overview");
  const first = render(<ReportReader id="acme" mode="synthetic" />);
  await screen.findByText(LEAD);
  expect(screen.getByText(BOTTOM_LINE_NOT_ON_PAGE)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/in this report|Add one percent of NAV/);
  first.unmount();
  window.history.replaceState(null, "", "/#modules/CP-6");
  render(<ReportReader id="acme" mode="synthetic" />);
  expect(await screen.findByRole("heading", { name: "Committee decision" })).toBeInTheDocument();
  expect(screen.getByText("Add one percent of NAV.")).toBeInTheDocument();
});

it("does not say a decision is not shown on the page that lists the module's limitation stating it", async () => {
  await overview({ pathway: "credit_snapshot", lead: true, cp6Limit: SIZED_LIMIT });
  // The owner keeps an unheld module's limitations listed, and this one states the action and size.
  expect(screen.getByText(SIZED_LIMIT)).toBeInTheDocument();
  const limits = screen.getByRole("region", { name: "What this run could not do" });
  expect(within(limits).getByRole("link", { name: "Committee decision" })).toBeInTheDocument();
  // So the page claims only what it leaves out: the module's bottom line.
  expect(document.body.textContent).not.toMatch(/decision is not shown/i);
  expect(screen.getByText(BOTTOM_LINE_NOT_ON_PAGE)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain("Add one percent of NAV.");
});

it("keeps another module's limitation that a held module also states", async () => {
  await overview({
    pathway: "credit_snapshot",
    lead: true,
    cp3: CP3_LIMIT,
    hold: HOLD,
    cp6Limit: CP3_LIMIT,
  });
  expect(screen.getAllByText(CP3_LIMIT)).toHaveLength(1);
  const limits = screen.getByRole("region", { name: "What this run could not do" });
  expect(within(limits).getByRole("link", { name: "Security selection" })).toBeInTheDocument();
  expect(within(limits).queryByRole("link", { name: "Committee decision" })).toBeNull();
  // Nothing the held module recorded is missing from the list, so no line says so.
  expect(screen.queryByText(ELSEWHERE)).toBeNull();
});
