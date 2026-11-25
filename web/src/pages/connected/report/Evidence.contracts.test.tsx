import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { ReportEvidence } from "./Evidence";
import { ArtifactDownloads } from "./ArtifactDownloads";

const annualInput =
  "The annual model handoff is the Financial foundation handoff used as the model input.";
const entry: OutputEntry = {
  selected: true,
  output: {
    id: "case/CP-1.md",
    module: "CP-1",
    label: "CP-1",
    href: "CP-1.md",
    sha256: "a".repeat(64),
  },
  sections: [],
};
const run: PublishedRun = {
  folder: "case",
  issuer: "Issuer",
  title: "Issuer credit view",
  period: "2026",
  asOf: "2026-11-17",
  pathway: "credit_snapshot",
  modules: {},
  record: { steps: [] },
  evidence: {
    sources: [],
    unused: [],
    unrecorded: [],
    noSourcesModules: [],
    handoffs: [{ module: "CP-1", name: "CP-1.md", href: "downloads/case/CP-1.md" }],
    zip: "downloads/case/handoffs.zip",
    downloads: [{ label: "HTML Model", href: "downloads/case/model.html" }],
    record: { hashes: [], instructions: [], calls: [], cap: null },
  },
};
const snapshot = {
  workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
  chips: {},
} as unknown as Snapshot;

function show(target: string, selected = run) {
  return render(
    <ReportEvidence
      snapshot={snapshot}
      run={selected}
      entries={[entry]}
      target={target}
      mode="synthetic"
    />,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", (url: string) =>
    Promise.resolve(
      Response.json(
        url.startsWith("/connected/artifacts/")
          ? {
              files: [
                { label: "HTML Model", href: "/saved/model.html" },
                { label: "Calculation JSON", href: "/saved/calculation.json" },
                { label: "Annual model handoff", href: "/saved/annual.md" },
              ],
            }
          : { id: "case", status: "finished", events: [] },
      ),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it.each(["summary", "trace", "record"])(
  "keeps the same handoff offers on %s, including Record",
  (target) => {
    show(target);
    expect(screen.getByRole("link", { name: "Download all handoffs" })).toHaveAttribute(
      "href",
      "/library/downloads/case/handoffs.zip",
    );
    expect(screen.getByRole("link", { name: "Download Financial foundation" })).toHaveAttribute(
      "href",
      "/library/downloads/case/CP-1.md",
    );
  },
);

it("shows existing original model and calculation offers after the run record", async () => {
  show("record/CP-1");
  expect(await screen.findByRole("link", { name: "HTML Model" })).toHaveAttribute(
    "href",
    "/saved/model.html",
  );
  expect(screen.getByRole("link", { name: "Calculation JSON" })).toHaveAttribute(
    "href",
    "/saved/calculation.json",
  );
  const headings = screen.getAllByRole("heading").map((node) => node.textContent);
  // The run record comes first on the Record tab, as in the base; it is closed unless a comparison note opens it.
  expect(headings.indexOf("Run record")).toBeLessThan(headings.indexOf("Handoffs"));
  expect(headings.indexOf("Handoffs")).toBeLessThan(
    headings.indexOf("Model and calculation files"),
  );
  expect(
    screen.getByText("Show the run record", { selector: "summary" }).closest("details"),
  ).not.toHaveAttribute("open");
  expect(screen.getByText(annualInput)).toBeVisible();
});

it("states unavailable handoff and model groups on Record without inventing offers", () => {
  show("record", {
    ...run,
    evidence: { ...run.evidence, zip: null, handoffs: [], downloads: [] },
  });
  expect(screen.getByText("No handoff ZIP was delivered for this run.")).toBeVisible();
  expect(screen.getByText("No handoff files were delivered for this run.")).toBeVisible();
  expect(
    screen.getByText("No model or calculation downloads are listed for this run."),
  ).toBeVisible();
  expect(screen.queryByRole("link", { name: "Download all handoffs" })).toBeNull();
});

it("identifies the existing annual handoff as model input without relabelling its download", async () => {
  render(<ArtifactDownloads folder="case" />);
  expect(await screen.findByRole("link", { name: "Annual model handoff" })).toHaveAttribute(
    "href",
    "/saved/annual.md",
  );
  expect(screen.getByText(annualInput)).toBeVisible();
});

it("does not present the annual input as an available original HTML Model", async () => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(
      Response.json({
        files: [{ label: "Annual model handoff", href: "/saved/annual.md" }],
      }),
    ),
  );
  render(<ArtifactDownloads folder="case" />);
  expect(await screen.findByText(annualInput)).toBeVisible();
  expect(screen.getByText("The original HTML Model is unavailable for this run.")).toBeVisible();
  expect(screen.queryByRole("link", { name: "HTML Model" })).toBeNull();
  expect(screen.getByRole("link", { name: "Annual model handoff" })).toHaveAttribute(
    "href",
    "/saved/annual.md",
  );
});
