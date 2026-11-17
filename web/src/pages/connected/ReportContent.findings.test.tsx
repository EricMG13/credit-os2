import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ReportFindings } from "./ReportContent";
import type { OutputEntry, PublishedRun, Snapshot } from "./publishedReport";

const digest = "a".repeat(64);
function fixture() {
  const entry: OutputEntry = {
    output: { id: "case/output.md", sha256: digest, module: "CP-1B", href: "", label: "" },
    selected: true,
    sections: [
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 10,
        blocks: [
          {
            type: "text",
            line: 11,
            end: 11,
            text: "Judgement retained.\nBasis: Original filing, page 1.",
          },
          {
            type: "text",
            line: 13,
            end: 13,
            text: "Renewal remains **uncertain**.\nBasis: Original filing, page 2.",
          },
          {
            type: "table",
            line: 15,
            headers: ["Measure", "Value"],
            rows: [{ line: 16, cells: ["Unrendered trailing table", "0"] }],
          },
          { type: "equity", line: 17, text: "Unrendered equity block" },
          {
            type: "text",
            line: 19,
            end: 19,
            text: "Downside remains material.\nBasis: Original filing, page 3.",
          },
        ],
      },
    ],
  };
  const run = { folder: "case", evidence: { handoffs: [] } } as unknown as PublishedRun;
  const snapshot = {
    chips: {
      "case/output.md:19": [
        { source: "Original filing", excerpt: "Exact retained page-three excerpt." },
      ],
    },
  } as unknown as Snapshot;
  return { entry, run, snapshot };
}

afterEach(cleanup);

it.each([false, true])(
  "preserves following paragraph order and trace identity in overview=%s",
  async (overview) => {
    const { entry, run, snapshot } = fixture();
    const shown = render(
      <ReportFindings
        snapshot={snapshot}
        run={run}
        entry={entry}
        entryIndex={0}
        overview={overview}
        afterBottomLine={<p>Published figures</p>}
      />,
    );
    const section = shown.container.querySelector("#finding-10");
    if (!section) throw new Error("Missing bottom line section");
    expect([...section.querySelectorAll("p")].map((item) => item.textContent)).toEqual([
      "",
      "Published figures",
      "Renewal remains uncertain.",
      "Downside remains material.",
    ]);
    expect(section.querySelector("strong")).toHaveTextContent("uncertain");
    expect(screen.queryByText("Unrendered trailing table")).toBeNull();
    expect(screen.queryByText("Unrendered equity block")).toBeNull();
    expect(screen.queryByText("Original filing, page 3.")).toBeNull();
    const rationale = section.querySelector("details");
    if (overview) {
      expect(rationale).not.toBeNull();
      fireEvent.click(screen.getByText("Earnings view, continued"));
    } else expect(rationale).toBeNull();
    const controls = screen.getAllByRole("button", { name: "Show sources for this passage" });
    expect(controls).toHaveLength(2);
    const last = controls[1];
    if (!last) throw new Error("Missing final paragraph control");
    fireEvent.click(last);
    const drawer = await screen.findByRole("dialog", { name: "Sources for Bottom line" });
    expect(within(drawer).getByText("Earnings changes · Handoff line 19")).toBeInTheDocument();
    expect(within(drawer).getByText("Downside remains material.")).toBeInTheDocument();
    expect(within(drawer).getByText("Exact retained page-three excerpt.")).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "Open in Evidence" })).toHaveAttribute(
      "href",
      `/report/case#evidence/case%2Foutput.md~${digest}-19`,
    );
  },
);

it.each([undefined, "Unreadable handoff"])(
  "preserves the empty findings notice and trailing content: %s",
  (parseError) => {
    const { entry, run, snapshot } = fixture();
    entry.sections = [];
    entry.output.parseError = parseError;
    render(
      <ReportFindings
        snapshot={snapshot}
        run={run}
        entry={entry}
        entryIndex={0}
        afterBottomLine={<p>Published figures</p>}
      />,
    );
    expect(
      screen.getByText(
        parseError
          ? /This handoff could not be read into sections/
          : /This handoff has no findings in this report format/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Evidence" })).toHaveAttribute(
      "href",
      `/report/case#evidence/case%2Foutput.md~${digest}`,
    );
    expect(screen.getByText("Published figures")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show sources/ })).toBeNull();
  },
);
