// Coordinator review, part 1, items A3–A6, B10, B17, C20–C21: the call row draws only the
// modules' words, groups nothing into good or bad, and states every missing side.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { CallRow } from "./CallRow";
import { measuredAt } from "./resize.fixture";

afterEach(cleanup);

let line = 0;
const text = (heading: string, ...paragraphs: string[]): Section => ({
  heading,
  level: 3,
  line: (line += 1),
  blocks: paragraphs.map((paragraph) => ({
    type: "text" as const,
    line: (line += 1),
    end: line,
    text: paragraph,
  })),
});

function entry(
  module: string,
  sections: Section[],
  extra: Partial<OutputEntry["output"]> = {},
): OutputEntry {
  return {
    output: {
      id: `${module}-1`,
      module,
      label: module,
      href: `${module}.md`,
      sha256: "a".repeat(64),
      ...extra,
    },
    sections: [
      { heading: module, level: 1, line: (line += 1), blocks: [] },
      { heading: "Findings", level: 2, line: (line += 1), blocks: [] },
      ...sections,
    ],
    selected: true,
  };
}

const run = {
  folder: "run-1",
  issuer: "Northbridge",
  title: "Full credit assessment",
  period: "FY2025",
  asOf: "2026-03-31",
  pathway: null,
  modules: {},
  changes: { first_run: true },
} as unknown as PublishedRun;
const snapshot = { workspace: { runs: {} } } as unknown as Snapshot;

function view(entries: OutputEntry[], lead?: OutputEntry): ReportView {
  return {
    folder: run.folder,
    entries,
    lead,
    modules: entries.map(({ output }) => ({
      id: output.module,
      name: output.module,
      state: "Delivered",
      outputs: [],
    })),
    models: [],
    catalogue: undefined,
  } as unknown as ReportView;
}

const decision = (bias: string) => text("Decision", `Final Action Bias: ${bias}. Reason.`);

/** The run as a verified publication whose published lead is the entry's first bottom-line paragraph. */
function on(lead: OutputEntry, base: PublishedRun = run): PublishedRun {
  const block = lead.sections
    .find((section) => section.heading === "Bottom line")
    ?.blocks.find((item) => item.type === "text");
  if (block?.type !== "text") throw new Error("fixture: the lead has no bottom-line paragraph");
  return {
    ...base,
    publicationVerified: true,
    lead: {
      module: lead.output.module,
      output: lead.output.id,
      sha256: lead.output.sha256,
      line: block.line,
      text: block.text,
    },
  };
}

it("shows no stance in the call, whatever the committee decides", () => {
  for (const bias of ["Avoid", "Add Exposure", "Watchlist"]) {
    const lead = entry("CP-2", [text("Bottom line", "The view.")]);
    const committee = entry("CP-6", [text("Bottom line", "Sized."), decision(bias)]);
    const { unmount } = render(
      <CallRow snapshot={snapshot} run={on(lead)} view={view([lead, committee], lead)} />,
    );
    const call = screen.getByRole("region", { name: "The call" });
    expect(within(call).queryByText(new RegExp(bias))).toBeNull();
    expect(within(call).queryByText("Sized.")).toBeNull();
    expect(within(call).getByText("Committee action and size")).toBeVisible();
    unmount();
  }
});

it("draws the confidence band in its own word, neutral, whatever the band", () => {
  for (const band of ["Low", "High", "Moderate"]) {
    const lead = entry("CP-2", [text("Bottom line", "The view.")], {
      confidence: { value: 120, band },
    });
    const { unmount } = render(
      <CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />,
    );
    const tile = screen.getByRole("region", { name: "Confidence" });
    const word = within(tile).getByText(band);
    expect(word.className).not.toMatch(/warning|success|error/);
    expect(tile.querySelector(".fill-warning-mark")).toBeNull();
    unmount();
  }
});

it("labels the run's own timing as the run states it, never as the financials' date", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const call = screen.getByRole("region", { name: "The call" });
  expect(within(call).queryByText("Financials as of")).toBeNull();
  expect(within(call).getByText("Timing")).toBeVisible();
});

it("counts the modules as the pipeline does and names each state that is not delivered in its own words", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")]);
  const gaps = entry("CP-1", [text("Bottom line", "Figures.")], { chartGaps: ["x"] } as never);
  const broken = entry("CP-2A", [text("Bottom line", "Stress.")], { parseError: "bad" });
  const changes = entry("CP-8", [text("Bottom line", "About the same.")]);
  const v = view([lead, gaps, broken, changes], lead);
  const ran = (id: string) => ({ outputs: [`${id}-1`], default: `${id}-1` });
  const withModules = {
    ...run,
    modules: {
      "CP-1": ran("CP-1"),
      "CP-2": ran("CP-2"),
      "CP-2A": ran("CP-2A"),
      "CP-8": ran("CP-8"),
    },
  } as unknown as PublishedRun;
  render(<CallRow snapshot={snapshot} run={withModules} view={v} />);
  expect(
    screen.getByText(
      "3 · 1 delivered; delivered with gaps: Financial foundation; could not be read: Downside",
    ),
  ).toBeVisible();
});

it("draws none of CP-8's words on the Overview, whatever they say, and no verdict word of its own", () => {
  const prior = { ...run, folder: "run-0", asOf: "2025-03-31", issuerKey: "nb", pathway: "full" };
  const current = {
    ...run,
    issuerKey: "nb",
    pathway: "full",
    changes: {
      pack: {
        prior: { run: "run-0", as_of: "2025-03-31", pathway: "full" },
        current: { as_of: "2026-03-31", pathway: "full" },
      },
    },
  } as unknown as PublishedRun;
  const snap = {
    catalogue: { real: [] },
    workspace: { runs: { k0: prior, k1: current }, outputs: {}, handoffs: {}, models: [] },
    chips: {},
  } as unknown as Snapshot;
  const lead = entry("CP-2", [text("Bottom line", "The view."), decision("Watchlist")]);
  for (const sentence of [
    "Better — or worse — cannot be judged, the bases differ.",
    "Better; but leverage is worse and the stance moved to Avoid.",
    "Better: no. Worse: yes.",
  ]) {
    const changes = entry("CP-8", [text("Bottom line", sentence)]);
    const { unmount } = render(
      <CallRow snapshot={snap} run={current} view={view([lead, changes], lead)} />,
    );
    const tile = screen.getByRole("region", { name: "Since the earlier run" });
    // The changes module can restate the stance, so its words stay on the Changes page.
    expect(within(tile).queryByText(sentence)).toBeNull();
    expect(tile).not.toHaveTextContent(/Better|Worse|stance|Avoid/i);
    expect(
      within(tile).getByText("A comparison with the earlier run is on the Changes page."),
    ).toBeVisible();
    unmount();
  }
});

it("shows or links every bottom-line paragraph, each with its own trace", () => {
  const lead = entry("CP-2", [
    text(
      "Bottom line",
      "Leverage rose.",
      "The view follows annual_report.pdf page 4.",
      "Cover held at 2.1x.",
    ),
  ]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const call = screen.getByRole("region", { name: "The call" });
  expect(call).not.toHaveTextContent(/annual_report/);
  // The desktop copy of the continuation (the phone copy behind Read on holds the same).
  const desktop = call.querySelector<HTMLElement>(".hidden.md\\:flex");
  if (!desktop) throw new Error("no desktop continuation");
  expect(within(desktop).getByText("Cover held at 2.1x.")).toBeInTheDocument();
  expect(
    within(desktop).getByRole("link", { name: "Read this passage in Evidence" }),
  ).toBeInTheDocument();
  expect(within(desktop).getAllByRole("link", { name: /^Source for / })).toHaveLength(2);
  expect(within(call).getAllByRole("link", { name: "Source for the bottom line" })).toHaveLength(1);
});

it("names the second score's band, and says when the second module recorded no score", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")], {
    confidence: { value: 53, band: "Low" },
  });
  const scored = entry("CP-3", [text("Bottom line", "Pick.")], {
    confidence: { value: 56, band: "Moderate" },
  });
  const { unmount } = render(
    <CallRow snapshot={snapshot} run={on(lead)} view={view([lead, scored], lead)} />,
  );
  expect(
    within(screen.getByRole("region", { name: "Confidence" })).getByText(
      "Security selection 56 · Moderate",
    ),
  ).toBeVisible();
  unmount();
  const unscored = entry("CP-3", [text("Bottom line", "Pick.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead, unscored], lead)} />);
  expect(
    within(screen.getByRole("region", { name: "Confidence" })).getByText(
      "Security selection: no score recorded",
    ),
  ).toBeVisible();
});

it("links from the run facts to the limitations and dates on this page", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const nav = screen.getByRole("navigation", { name: "On this page" });
  expect(within(nav).getByRole("link", { name: "What this run could not do" })).toHaveAttribute(
    "href",
    "#overview/limitations",
  );
  expect(within(nav).getByRole("link", { name: "Dates to watch" })).toHaveAttribute(
    "href",
    "#overview/dates",
  );
});

// Coordinator review, part 2, items 3–5.

it("makes a short bottom line the display size at desktop and a step smaller on a phone", () => {
  const lead = entry("CP-2", [
    text("Bottom line", "Leverage rose.", "Cover held at 2.1x.", "Liquidity covers two years."),
  ]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const call = screen.getByRole("region", { name: "The call" });
  expect(within(call).getByText("Leverage rose.")).toHaveClass("text-h2", "lg:text-display");
  const more = within(call).getByText("Read on");
  expect(more.tagName).toBe("SUMMARY");
  expect(more.closest("details")).not.toHaveAttribute("open");
});

it("does not repeat the lead module's name as a link in the call tile", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const call = screen.getByRole("region", { name: "The call" });
  expect(within(call).queryByRole("link", { name: "Committee decision" })).toBeNull();
  expect(
    within(call).getByRole("heading", { name: "The call · Fundamental credit" }),
  ).toBeVisible();
});

it("names the validation module and links its page, showing none of its bottom line", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")]);
  const validation = entry("CP-5", [
    text("Bottom line", "Pass with Remediation.", "Four material issues remain."),
  ]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead, validation], lead)} />);
  const tile = screen.getByRole("region", { name: "Evidence clearance" });
  expect(tile).not.toHaveTextContent(/Pass with Remediation|Four material issues/);
  expect(
    within(tile).getByText(
      "This page does not show Evidence validation's bottom line: no clearance for it is recorded.",
    ),
  ).toBeVisible();
  expect(within(tile).getByRole("link", { name: "Open Evidence validation" })).toHaveAttribute(
    "href",
    "#modules/CP-5",
  );
  expect(tile.querySelector(".min-h-24")).toBeNull();
});

it("gives the confidence score the same trace control as every other tile", () => {
  const lead = entry(
    "CP-2",
    [text("Bottom line", "The view."), text("Confidence inputs", "Inputs.")],
    {
      confidence: { value: 53, band: "Low" },
    },
  );
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const tile = screen.getByRole("region", { name: "Confidence" });
  expect(
    within(tile).getByRole("link", { name: "Source for the confidence score" }),
  ).toHaveAttribute("href", expect.stringMatching(/#evidence\//));
});

// Coordinator review, round 2, part 2: D2, D4, D8, D9, D10.

it("sizes the bottom line by its length on the ramp, never below the headline figures", () => {
  const short = entry("CP-2", [text("Bottom line", "Leverage rose.")]);
  const { unmount } = render(
    <CallRow snapshot={snapshot} run={on(short)} view={view([short], short)} />,
  );
  expect(screen.getByText("Leverage rose.")).toHaveClass("text-h2", "lg:text-display");
  unmount();
  const words =
    "Gross leverage rose to 6.53x despite stronger earnings, and the declared dividend paid in October reverses the apparent year-end net deleveraging.";
  const long = entry("CP-2", [text("Bottom line", words)]);
  render(<CallRow snapshot={snapshot} run={on(long)} view={view([long], long)} />);
  const shown = screen.getByText(words);
  expect(shown).toHaveClass("text-h3", "lg:text-metric");
  expect(shown.className).not.toMatch(/text-display/);
});

it("shows the bottom line's continuation in full from md and behind Read on only below md", () => {
  const lead = entry("CP-2", [text("Bottom line", "Leverage rose.", "Cover held at 2.1x.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const call = screen.getByRole("region", { name: "The call" });
  const copies = within(call).getAllByText("Cover held at 2.1x.");
  expect(copies).toHaveLength(2);
  expect(copies.some((copy) => copy.closest(".hidden.md\\:flex"))).toBe(true);
  expect(within(call).getByText("Read on").closest("details")).toHaveClass("md:hidden");
});

it("draws no trace in the clearance tile: it shows no passage to trace", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")]);
  const validation = entry("CP-5", [text("Bottom line", "Pass with Remediation.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead, validation], lead)} />);
  const tile = screen.getByRole("region", { name: "Evidence clearance" });
  expect(within(tile).queryByRole("link", { name: /^Source for / })).toBeNull();
});

it("lets no tile in the call row stretch past its content", () => {
  const lead = entry("CP-2", [text("Bottom line", "The view.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  for (const name of ["The call", "Since the earlier run"]) {
    const tile = screen.getByRole("region", { name });
    expect(tile.className).not.toMatch(/\bflex-1\b|justify-between/);
  }
  expect(document.body.innerHTML).not.toMatch(/text-\[\d+px\]/);
});

it("keeps the meter's scale labels at least 12 px on screen when the meter is drawn small", () => {
  const restore = measuredAt(204);
  const lead = entry("CP-2", [text("Bottom line", "The view.")], {
    confidence: { value: 53, band: "Low" },
  });
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const meter = within(screen.getByRole("region", { name: "Confidence" })).getByRole("img");
  for (const label of meter.querySelectorAll("text"))
    expect(Number(label.getAttribute("font-size")) * (204 / 408)).toBeGreaterThanOrEqual(12);
  restore();
});

it("removes inline source markers from the bottom line and links a passage carrying an unnamed id", () => {
  const lead = entry("CP-2", [
    text(
      "Bottom line",
      "Cover is thin [E3].",
      "Leverage of 4.2x [E3] per T4.18 and CP-1 supports Watchlist.",
    ),
  ]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const call = screen.getByRole("region", { name: "The call" });
  expect(within(call).getByText("Cover is thin.")).toBeVisible();
  expect(call).not.toHaveTextContent(/\[E3\]|T4\.18/);
  expect(
    within(call).getAllByRole("link", { name: "Read this passage in Evidence" }).length,
  ).toBeGreaterThan(0);
});

it("keeps the published paragraph and the way to the table after it, and names no lead for a table alone", () => {
  const tableSection = (heading: string, paragraph?: string): Section => ({
    heading,
    level: 3,
    line: (line += 1),
    blocks: [
      ...(paragraph
        ? [{ type: "text" as const, line: (line += 1), end: line, text: paragraph }]
        : []),
      {
        type: "table" as const,
        line: (line += 1),
        headers: ["Measure", "View"],
        rows: [{ line: (line += 1), cells: ["Leverage", "High"] }],
      },
    ],
  });
  // A bottom line that is only a table has no paragraph a publication can name as its lead.
  const onlyTable = entry("CP-2", [tableSection("Bottom line")]);
  const { unmount } = render(
    <CallRow snapshot={snapshot} run={run} view={view([onlyTable], onlyTable)} />,
  );
  const call = screen.getByRole("region", { name: "The call" });
  expect(within(call).getByText(/A verified credit view is unavailable/)).toBeVisible();
  expect(within(call).queryByText(/has no bottom line/)).toBeNull();
  unmount();
  const both = entry("CP-2", [tableSection("Bottom line", "Leverage is high.")]);
  render(<CallRow snapshot={snapshot} run={on(both)} view={view([both], both)} />);
  const second = screen.getByRole("region", { name: "The call" });
  expect(within(second).getByText("Leverage is high.")).toBeVisible();
  expect(
    within(second).getAllByRole("link", { name: "Read this table in Evidence" }).length,
  ).toBeGreaterThan(0);
});

it("says why beside the link when a bottom line is sent to Evidence for a source reference", () => {
  const lead = entry("CP-2", [text("Bottom line", "Leverage per T4.18 is 4.2x.")]);
  render(<CallRow snapshot={snapshot} run={on(lead)} view={view([lead], lead)} />);
  const call = screen.getByRole("region", { name: "The call" });
  expect(
    within(call).getByText("The bottom line cites a source reference; read it in Evidence."),
  ).toBeVisible();
  expect(
    within(call).getAllByRole("link", { name: "Read this passage in Evidence" }).length,
  ).toBeGreaterThan(0);
  expect(call).not.toHaveTextContent(/T4\.18/);
});
