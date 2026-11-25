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
  pathway = "credit_snapshot",
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
    modules: { "CP-2": { outputs: [cp2], default: cp2 } },
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
  const fetch = open("#export/credit-snapshot", fixture({ isPreview: true }));
  const button = await screen.findByRole("button", { name: "Print / Save PDF" });
  expect(button).toBeDisabled();
  expect(screen.getByText("Preparing print layout…")).toBeInTheDocument();
  expect(document.querySelector("[data-print-ready]")).toBeNull();
  expect(screen.getByText(finding)).toBeInTheDocument();
  expect(screen.getByText("Qualified retained evidence only.")).toBeInTheDocument();
  expect(screen.getByText(/Partial assessment.*Earlier methods.*Test preview/)).toBeInTheDocument();
  expect(screen.getByText(/Turn off/)).toHaveTextContent("Headers and footers");
  await waitFor(() => {
    expect(document.title).toBe("Credit Snapshot — Example Credit — Credit OS");
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

it("opens from the menu and returns to the same evidence tab on the same run", async () => {
  const fetch = open("#evidence/sources");
  const button = await screen.findByRole("button", { name: "Export PDF" });
  fireEvent.keyDown(button, { key: "ArrowDown" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Credit Snapshot" }));
  await screen.findByRole("button", { name: "Print / Save PDF" });
  expect(window.location.hash).toBe("#export/credit-snapshot");
  fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
  await waitFor(() => {
    expect(window.location.hash).toBe("#evidence/sources");
  });
  expect(window.location.pathname).toBe(address);
  expect(fetch).toHaveBeenCalledOnce();
  // Closing hands focus back to the control that opened the preview, not to the page body.
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Export PDF" })).toHaveFocus();
  });
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
    "no verified credit view",
  ],
  [
    "local Windows path in finding",
    fixture({ leadBody: "See C:\\broker\\secret for analysis." }),
    "no verified credit view",
  ],
  ["invalid chronology", fixture({ asOf: "2025-02-30" }), "no verified credit view"],
  [
    "tilde path in finding",
    fixture({ leadBody: "The work is stored in ~/private/ledger." }),
    "no verified credit view",
  ],
  [
    "actual folder in finding",
    fixture({ leadBody: `Reviewed ${folder}.` }),
    "no verified credit view",
  ],
])("rejects direct entry with %s", async (_case, snapshot, reason) => {
  open("#export/credit-snapshot", snapshot);
  expect(await screen.findByText(new RegExp(reason))).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Print / Save PDF" })).toBeNull();
  expect(document.querySelector("[data-print-ready]")).toBeNull();
});

it("withholds the template and title for an issuer heading that exposes the actual run key", async () => {
  const snapshot = fixture();
  snapshot.workspace.runs[folder].issuer = `Example Credit (${folder})`;
  open("#export/credit-snapshot", snapshot);
  expect(await screen.findByText(/no verified credit view/)).toBeVisible();
  expect(document.title).not.toContain(folder);
});

it("does not call a generically unavailable decision an owner-recorded hold", async () => {
  const snapshot: Snapshot = fixture();
  const run = snapshot.workspace.runs[folder];
  if (!run) throw new Error("Expected the fixture run");
  const id = "committee";
  run.modules["CP-6"] = { outputs: [id], default: id };
  snapshot.workspace.outputs[id] = {
    id,
    run: folder,
    module: "CP-6",
    sha256: "d".repeat(64),
    href: "",
    label: "",
  };
  open("#export/credit-snapshot", snapshot);
  await screen.findByText("A published decision is unavailable for this run.");
  const footer = document.documentElement.style.getPropertyValue("--report-export-scope");
  expect(footer).toContain("Committee action and size unavailable");
  expect(footer).not.toContain("Committee action and size withheld");
  expect(screen.queryByText(/clearance/)).toBeNull();
});

it("prints a readable decision with no recorded hold as not shown, in the body and the footer", async () => {
  const snapshot: Snapshot = fixture();
  const run = snapshot.workspace.runs[folder];
  if (!run) throw new Error("Expected the fixture run");
  const id = "committee";
  const committeeSha = "d".repeat(64);
  run.modules["CP-6"] = { outputs: [id], default: id };
  snapshot.workspace.outputs[id] = {
    id,
    run: folder,
    module: "CP-6",
    sha256: committeeSha,
    href: "",
    label: "",
  };
  snapshot.workspace.handoffs[committeeSha] = [
    { heading: "Findings", level: 2, line: 3, blocks: [] },
    {
      heading: "Bottom line",
      level: 3,
      line: 8,
      blocks: [{ type: "text", line: 10, end: 10, text: "Add 1.00% NAV." }],
    },
  ];
  open("#export/credit-snapshot", snapshot);
  const paper = await screen.findByText(
    "This decision is not shown in this report because no clearance for it is recorded.",
  );
  expect(paper.closest(".report-export-paper")).not.toBeNull();
  await waitFor(() => {
    expect(document.documentElement.style.getPropertyValue("--report-export-scope")).toContain(
      "Committee action and size not shown",
    );
  });
  const footer = document.documentElement.style.getPropertyValue("--report-export-scope");
  expect(footer).not.toMatch(/Committee action and size (?:unavailable|withheld)/);
  expect(document.querySelector(".report-export-paper")?.textContent).not.toMatch(
    /Overview|holds|Add 1\.00% NAV/,
  );
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
  open("#export/credit-snapshot");
  await screen.findByText("Preparing print layout…");
  act(() => {
    window.location.hash = "#export/credit-snapshot/extra";
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
  open("#export/credit-snapshot");
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
  open("#export/credit-snapshot", snapshot);
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
  open("#export/credit-snapshot");
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
  open("#export/credit-snapshot");
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
  open("#export/credit-snapshot");
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
