import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ReportReader } from "../ReportLibrary";
import type { PublishedRun, Snapshot } from "../publishedReport";

const folder = "exact-fold-43";
const address = `/report/${folder}`;
const sha = "e".repeat(64);
const cp2 = `${folder}/CP-2.md`;
const finding = "The credit view turns on refinancing the secured debt.";
const body = `${finding}\nBasis: https://private.example/filing`;

function fixture({
  scope = folder,
  pathway = "earnings_update",
  verified = true,
  leadBody = body,
  asOf = "2025-02-04",
  isPreview = false,
}: {
  scope?: string | null;
  pathway?: string;
  verified?: boolean;
  leadBody?: string;
  asOf?: string;
  isPreview?: boolean;
} = {}) {
  const run: PublishedRun = {
    folder,
    issuer: "Example Credit",
    asOf,
    title: "",
    period: "FY 2025",
    pathway,
    publicationVerified: verified,
    assessmentScope: "partial",
    methodChanges: ["Internal detail"],
    modules: {
      "CP-2": { outputs: [cp2], default: cp2 },
      "CP-1B": { outputs: [`${folder}/CP-1B.md`], default: `${folder}/CP-1B.md` },
    },
    lead: { module: "CP-2", output: cp2, sha256: sha, line: 10, text: leadBody },
    evidence: {
      sources: [],
      unused: [],
      unrecorded: [],
      noSourcesModules: [],
      handoffs: [],
      zip: null,
      downloads: [],
      record: { hashes: [], instructions: [], calls: [], cap: null },
    },
  };
  return {
    reportFolder: scope ?? undefined,
    catalogue: { real: [] },
    workspace: {
      runs: { [folder]: run },
      outputs: {
        [cp2]: { id: cp2, run: folder, module: "CP-2", sha256: sha, href: cp2, label: "" },
        [`${folder}/CP-1B.md`]: {
          id: `${folder}/CP-1B.md`,
          run: folder,
          module: "CP-1B",
          sha256: sha,
          href: `${folder}/CP-1B.md`,
          label: "",
        },
      },
      handoffs: {
        [sha]: [
          { heading: "Findings", level: 2, line: 3, blocks: [] },
          {
            heading: "Bottom line",
            level: 3,
            line: 8,
            blocks: [{ type: "text", line: 10, end: 11, text: leadBody }],
          },
        ],
      },
      models: [],
    },
    chips: {},
    preview: isPreview ? { reason: "Qualified retained evidence only." } : undefined,
  } satisfies Snapshot;
}

function earningsFixture() {
  const snapshot = fixture({ pathway: "earnings_update" });
  const run = snapshot.workspace.runs[folder];
  const id = `${folder}/CP-1B.md`;
  const digest = "f".repeat(64);
  run.modules["CP-1B"] = { outputs: [id], default: id };
  run.lead = { module: "CP-1B", output: id, sha256: digest, line: 10, text: finding };
  snapshot.workspace.outputs[id] = {
    id,
    run: folder,
    module: "CP-1B",
    sha256: digest,
    href: id,
    label: "",
  };
  snapshot.workspace.handoffs[digest] = [
    { heading: "Findings", level: 2, line: 3, blocks: [] },
    {
      heading: "Bottom line",
      level: 3,
      line: 8,
      blocks: [{ type: "text", line: 10, end: 10, text: finding }],
    },
  ];
  return snapshot;
}

function open(hash: string, data: Snapshot = fixture()) {
  const fetch = vi.fn(() => Promise.resolve(Response.json(data)));
  vi.stubGlobal("fetch", fetch);
  window.history.replaceState(null, "", address + hash);
  render(<ReportReader id={folder} mode="live" />);
  return fetch;
}

beforeEach(() => {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    value: () => Promise.resolve(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLImageElement.prototype, "decode");
  Object.defineProperty(document, "fonts", { configurable: true, value: undefined });
  window.history.replaceState(null, "", "/");
});

it("prints the exact qualified scoped read after fonts and layout, without adding a save result", async () => {
  let fontsReady: () => void = () => {};
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        fontsReady = resolve;
      }),
    },
  });
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const fetch = open("#export/earnings-update", fixture({ isPreview: true }));
  const button = await screen.findByRole("button", { name: "Print / Save PDF" });
  expect(button).toBeDisabled();
  expect(screen.getByText("Preparing print layout…")).toBeInTheDocument();
  expect(document.querySelector("[data-print-ready]")).toBeNull();
  expect(screen.getByText(finding)).toBeInTheDocument();
  expect(screen.getByText("Qualified retained evidence only.")).toBeInTheDocument();
  expect(screen.getByText(/Partial assessment.*Earlier methods.*Test preview/)).toBeInTheDocument();
  expect(screen.getByText(/Turn off/)).toHaveTextContent("Headers and footers");
  await waitFor(() => {
    expect(document.title).toBe("Earnings Update — Example Credit — Credit OS");
  });
  expect(document.querySelector(".report-export-paper")?.textContent).not.toContain(
    "private.example",
  );

  fontsReady();
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  fireEvent.click(button);
  expect(print).toHaveBeenCalledOnce();
  expect(button).toBeEnabled();
  expect(screen.queryByText(/PDF saved/i)).toBeNull();
  expect(fetch).toHaveBeenCalledExactlyOnceWith(
    `/connected/snapshot?run=${folder}`,
    expect.anything(),
  );

  fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
  expect(window.location.pathname).toBe(address);
  expect(window.location.hash).toBe("#overview");
});

it("synthetic Example Credit as of 2025-02-04 opens the applicable purpose tile in print", async () => {
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const fetch = open("#deliverables", earningsFixture());
  expect(await screen.findByRole("heading", { name: "Deliverables" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Earnings Update.*Open print dialog/ }));
  await waitFor(() => {
    expect(print).toHaveBeenCalledOnce();
  });
  expect(window.location.hash).toBe("#export/earnings-update");
  expect(window.history.state).not.toHaveProperty("reportPrintOnReady");
  fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
  await waitFor(() => {
    expect(window.location.hash).toBe("#deliverables");
  });
  expect(screen.getByRole("button", { name: /Earnings Update.*Open print dialog/ })).toHaveFocus();
  expect(window.location.pathname).toBe(address);
  expect(fetch).toHaveBeenCalledOnce();
  window.history.forward();
  await waitFor(() => {
    expect(window.location.hash).toBe("#export/earnings-update");
  });
  const printButton = await screen.findByRole("button", { name: "Print / Save PDF" });
  await waitFor(() => expect(printButton).toBeEnabled());
  expect(print).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
  await waitFor(() => {
    expect(window.location.hash).toBe("#deliverables");
  });
  expect(screen.getByRole("button", { name: /Earnings Update.*Open print dialog/ })).toHaveFocus();
});

it("synthetic Example Credit as of 2025-02-04 shows a workbook tile with no report contents", async () => {
  open("#deliverables");
  expect(await screen.findByRole("heading", { name: "Deliverables" })).toBeInTheDocument();
  const download = screen.getByRole("link", { name: /Credit Snapshot.*Excel workbook/i });
  expect(download).toHaveAttribute(
    "href",
    `/connected/deliverables/${encodeURIComponent(folder)}/credit-snapshot.xlsx`,
  );
  expect(screen.queryByRole("button", { name: "Export PDF" })).toBeNull();
  expect(screen.queryByRole("switch", { name: "Highlight source icons" })).toBeNull();
  expect(screen.queryByText(finding)).toBeNull();
  expect(screen.queryByText(/private\.example/)).toBeNull();
  expect(screen.queryByText(/CP-2/)).toBeNull();
});

it.each(["Scoped check of CP-1B.", "CP-1B-only review", "CP-1B/earnings review"])(
  "synthetic Example Credit as of 2025-02-04 withholds a purpose print for module-coded qualification %s",
  async (reason) => {
    const snapshot = fixture({ isPreview: true });
    if (snapshot.preview) snapshot.preview.reason = reason;
    open("#deliverables", snapshot);
    expect(await screen.findByRole("heading", { name: "Deliverables" })).toBeInTheDocument();
    expect(screen.queryByText(/CP-1B|Scoped check/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Earnings Update.*Open print dialog/ })).toBeNull();
  },
);

it.each([
  ["unverified", fixture({ verified: false })],
  ["preview-only", fixture({ isPreview: true })],
  ["wrong-scope", fixture({ scope: "another-run" })],
  ["unscoped", fixture({ scope: null })],
])(
  "synthetic Example Credit as of 2025-02-04 does not offer a workbook for a %s report",
  async (_case, snapshot) => {
    open("#deliverables", snapshot);
    expect(await screen.findByRole("heading", { name: "Deliverables" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Excel workbook/i })).toBeNull();
  },
);

it("synthetic Example Credit as of 2025-02-04 has retired the Credit Snapshot PDF route", async () => {
  open("#export/credit-snapshot");
  expect(await screen.findByText("This PDF format is unavailable.")).toBeInTheDocument();
  expect(document.querySelector(".report-export-paper")).toBeNull();
});

it.each([
  ["wrong response scope", fixture({ scope: "other" }), "A verified report for this run"],
  ["unscoped response", fixture({ scope: null }), "A verified report for this run"],
  ["unverified publication", fixture({ verified: false }), "A verified report for this run"],
  ["historical Short pathway", fixture({ pathway: "short_snapshot" }), "no released PDF format"],
  ["specialist pathway", fixture({ pathway: "relative_value" }), "no released PDF format"],
  [
    "private URL in finding",
    fixture({ leadBody: "See file:///private/ledger for analysis." }),
    "no assessable comparative earnings finding",
  ],
  [
    "local Windows path in finding",
    fixture({ leadBody: "See C:\\broker\\secret for analysis." }),
    "no assessable comparative earnings finding",
  ],
  [
    "invalid chronology",
    fixture({ asOf: "2025-02-30" }),
    "no assessable comparative earnings finding",
  ],
  [
    "tilde path in finding",
    fixture({ leadBody: "The work is stored in ~/private/ledger." }),
    "no assessable comparative earnings finding",
  ],
  [
    "actual folder in finding",
    fixture({ leadBody: `Reviewed ${folder}.` }),
    "no assessable comparative earnings finding",
  ],
])("rejects direct entry with %s", async (_case, snapshot, reason) => {
  open("#export/earnings-update", snapshot);
  expect(await screen.findByText(new RegExp(reason))).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Print / Save PDF" })).toBeNull();
  expect(document.querySelector("[data-print-ready]")).toBeNull();
});

it("withholds the template and title for an issuer heading that exposes the actual run key", async () => {
  const snapshot = fixture();
  snapshot.workspace.runs[folder].issuer = `Example Credit (${folder})`;
  open("#export/earnings-update", snapshot);
  expect(await screen.findByText(/no assessable comparative earnings finding/)).toBeVisible();
  expect(document.title).not.toContain(folder);
});

it("keeps an obsolete font completion from unlocking an unsupported route", async () => {
  let fontsReady: () => void = () => {};
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        fontsReady = resolve;
      }),
    },
  });
  open("#export/earnings-update");
  await screen.findByText("Preparing print layout…");
  act(() => {
    window.location.hash = "#export/earnings-update/extra";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(screen.getByText("This PDF format is unavailable.")).toBeInTheDocument();
  await act(async () => {
    fontsReady();
    await Promise.resolve();
  });
  expect(document.querySelector(".report-export-paper")).toBeNull();
});

it("unlocks print only once every chart has a laid-out SVG", async () => {
  let fontsReady: () => void = () => {};
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        fontsReady = resolve;
      }),
    },
  });
  open("#export/earnings-update");
  const button = await screen.findByRole("button", { name: "Print / Save PDF" });
  const chart = document.createElement("div");
  chart.className = "recharts-responsive-container";
  document.querySelector(".report-export-paper")?.append(chart);
  fontsReady();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 70));
  expect(button).toBeDisabled();
  const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  surface.classList.add("recharts-surface");
  vi.spyOn(surface, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ width: 250, height: 100 }),
  );
  chart.append(surface);
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
});

it("keeps an unsafe preview qualification out of the document", async () => {
  const snapshot = fixture({ isPreview: true });
  if (snapshot.preview) snapshot.preview.reason = "Uses material under /private/tmp/sources.";
  open("#export/earnings-update", snapshot);
  expect(
    await screen.findByText("The test preview qualification could not be included in the PDF."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Print / Save PDF" })).toBeNull();
});

it("withholds print when a figure supplies unsafe visible text", async () => {
  let fontsReady: () => void = () => {};
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        fontsReady = resolve;
      }),
    },
  });
  open("#export/earnings-update");
  const button = await screen.findByRole("button", { name: "Print / Save PDF" });
  const label = document.createElement("p");
  label.textContent = "https://internal.example/chart-data";
  document.querySelector(".report-export-paper")?.append(label);
  fontsReady();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This PDF cannot be printed because its text contains a link, a reference or a run identifier.",
  );
  expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  expect(button).toBeDisabled();
  expect(document.querySelector("[data-print-ready]")).toBeNull();
});

it("keeps the layout message and a retry when the print layout does not become ready", async () => {
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    value: () => Promise.reject(new Error("decode failed")),
  });
  open("#export/earnings-update");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The print layout could not be prepared.",
  );
  expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
});

async function previewWith(build: (paper: Element) => void) {
  let fontsReady: () => void = () => {};
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        fontsReady = resolve;
      }),
    },
  });
  open("#export/earnings-update");
  const button = await screen.findByRole("button", { name: "Print / Save PDF" });
  const paper = document.querySelector(".report-export-paper");
  if (!paper) throw new Error("Expected the paper");
  build(paper);
  fontsReady();
  return button;
}

it("does not read a reference across two cells or two paragraphs", async () => {
  const button = await previewWith((paper) => {
    const table = document.createElement("table");
    const row = table.createTBody().insertRow();
    row.insertCell().textContent = "EBITDA margin change, pp";
    row.insertCell().textContent = "1.2";
    const first = document.createElement("p");
    first.textContent = "The filing runs to 300 pages.";
    const second = document.createElement("p");
    second.textContent = "2025 guidance is unchanged.";
    paper.append(table, first, second);
  });
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  expect(screen.queryByRole("alert")).toBeNull();
});

const svg = (name: string) => document.createElementNS("http://www.w3.org/2000/svg", name);

it.each([
  [
    "one table cell",
    (paper: Element) => {
      const table = document.createElement("table");
      const row = table.createTBody().insertRow();
      row.insertCell().textContent = "Leverage";
      row.insertCell().textContent = "3.2x, see p. 12";
      paper.append(table);
    },
  ],
  [
    "one paragraph split by inline emphasis",
    (paper: Element) => {
      const paragraph = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = "12";
      paragraph.append("The covenant is on page ", strong, ".");
      paper.append(paragraph);
    },
  ],
  [
    "one chart label split into spans",
    (paper: Element) => {
      const label = svg("text");
      const [first, second] = [svg("tspan"), svg("tspan")];
      first.textContent = "see annual-";
      second.textContent = "report.pdf";
      label.append(first, second);
      const chart = svg("svg");
      chart.append(label);
      paper.append(chart);
    },
  ],
])("still withholds print for a reference inside %s", async (_case, build) => {
  const button = await previewWith(build);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This PDF cannot be printed because its text contains a link, a reference or a run identifier.",
  );
  expect(button).toBeDisabled();
});
