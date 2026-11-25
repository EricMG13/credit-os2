import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot, Table } from "../publishedReport";
import type { ReportView } from "../reportView";
import type { LeadProps } from "./leads/types";
import { Modules } from "./Modules";

const lead = vi.hoisted(() => ({
  current: undefined as undefined | ((props: LeadProps) => unknown),
}));
vi.mock("./leads", () => ({ leadFor: () => lead.current }));

afterEach(cleanup);
beforeEach(() => {
  lead.current = undefined;
});

const table = (line: number, headers: string[], rows: string[][]): Table => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const text = (line: number, value: string) => ({
  type: "text" as const,
  line,
  end: line,
  text: value,
});
const section = (heading: string, level: number, line: number, blocks: Section["blocks"] = []) => ({
  heading,
  level,
  line,
  blocks,
});

function page(
  sections: Section[],
  extra: Partial<OutputEntry["output"]> = {},
  state = "Delivered",
) {
  const entry: OutputEntry = {
    selected: true,
    output: {
      id: "r/CP-2.md",
      module: "CP-2",
      label: "a",
      href: "",
      sha256: "a".repeat(64),
      ...extra,
    },
    sections,
  };
  const view = {
    entries: [entry],
    modules: [
      { id: "CP-1", name: "Financial foundation", state: "Delivered", outputs: [] },
      { id: "CP-2", name: "Fundamental credit", state, outputs: [entry] },
      { id: "CP-6", name: "Committee decision", state: "Delivered", outputs: [] },
    ],
    catalogue: undefined,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = { folder: "r", issuer: "Issuer", asOf: "2026-10-31" } as PublishedRun;
  return render(
    <Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module="CP-2" />,
  );
}

const written: Section[] = [
  section("Findings", 2, 1),
  section("Bottom line", 3, 2, [
    text(3, "The credit is sound but thin."),
    text(4, "Cover is the risk."),
  ]),
  section("Key findings", 3, 5, [text(6, "Cover is 3.1x."), text(7, "Liquidity lasts to 2028.")]),
  section("Contrary evidence and what would change the view", 3, 8, [
    text(9, "A refinancing would."),
  ]),
  section("Metric table", 3, 10, [table(11, ["Metric", "FY2024"], [["Net leverage", "4.2x"]])]),
  section("Chart data: leverage", 3, 20, [
    table(21, ["Period", "Total debt / EBITDA"], [["FY2024", "4.2"]]),
  ]),
  section("Limitations", 3, 30, [text(31, "Only one period was supplied.")]),
];

it("draws the frame in the mockup's order: header, findings beside the counter, records, limitations beside next", () => {
  page(written, { charts: [{ table: 21, title: "Leverage", kind: "line" }] });
  const order = [
    screen.getByRole("heading", { level: 2, name: "Fundamental credit" }),
    screen.getByRole("region", { name: "Key findings" }),
    screen.getByRole("region", { name: "Contrary evidence and what would change the view" }),
    screen.getByRole("heading", { name: "Statements and records" }),
    screen.getByRole("region", { name: "Limitations of this module" }),
    screen.getByRole("link", { name: "Next module: Committee decision" }),
  ];
  // The last row: limitations in eight columns, the next module in four.
  expect(screen.getByRole("region", { name: "Limitations of this module" })).toHaveClass(
    "lg:col-span-8",
  );
  expect(screen.getByRole("link", { name: "Next module: Committee decision" })).toHaveClass(
    "lg:col-span-4",
  );
  for (const [at, item] of order.entries())
    if (at)
      expect(order[at - 1]?.compareDocumentPosition(item)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  const header = screen.getByRole("region", { name: "Fundamental credit" });
  expect(within(header).getByText("The credit is sound but thin.")).toBeVisible();
  expect(within(header).getByText("Cover is the risk.")).toBeVisible();
  expect(within(header).getByText("Credit · stage 3 of 5")).toBeVisible();
});

it("numbers the key findings and puts contrary evidence on the counter surface", () => {
  page(written);
  const findings = screen.getByRole("region", { name: "Key findings" });
  const items = within(findings).getAllByRole("listitem");
  expect(items.map((item) => item.textContent)).toEqual([
    expect.stringMatching(/^01Cover is 3\.1x\./),
    expect.stringMatching(/^02Liquidity lasts to 2028\./),
  ]);
  expect(screen.getByRole("region", { name: /^Contrary evidence/ })).toHaveClass("bg-info-fill");
});

it("draws no generic chart card: a chart's table is reachable in the records region instead", () => {
  page(written, { charts: [{ table: 21, title: "Leverage", kind: "line" }] });
  expect(screen.queryByRole("button", { name: "Chart" })).toBeNull();
  expect(screen.queryByText("4.2")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
  fireEvent.click(screen.getByRole("button", { name: /^Chart tables/ }));
  expect(screen.getByRole("heading", { level: 4, name: "Leverage" })).toBeVisible();
  expect(screen.getByText("4.2")).toBeVisible();
  fireEvent.click(
    within(screen.getByRole("group", { name: "Record kind" })).getByRole("button", {
      name: /^Statements/,
    }),
  );
  expect(screen.getByText("4.2x")).toBeVisible();
});

it("draws the module's lead directly under the header with the lead's props", () => {
  lead.current = vi.fn(({ entry }: LeadProps) => (
    <section aria-label="Lead">{entry.output.id}</section>
  ));
  page(written);
  const header = screen.getByRole("region", { name: "Fundamental credit" });
  const drawn = screen.getByRole("region", { name: "Lead" });
  expect(drawn).toHaveTextContent("r/CP-2.md");
  expect(header.compareDocumentPosition(drawn)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(drawn.compareDocumentPosition(screen.getByRole("region", { name: "Key findings" }))).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  const [props] = vi.mocked(lead.current).mock.calls[0] ?? [];
  expect(props?.entryIndex).toBe(0);
  expect(props?.run.folder).toBe("r");
  expect(props?.entry.output.module).toBe("CP-2");
});

it("draws nothing in the lead's place when a module has neither a lead nor typed figures", () => {
  const { container } = page(written);
  const header = screen.getByRole("region", { name: "Fundamental credit" });
  expect(header.nextElementSibling).toBe(screen.getByRole("region", { name: "Key findings" }));
  expect(container.querySelectorAll("[aria-label='Lead']")).toHaveLength(0);
});

it("draws a blocked module as not assessable with the reason as written", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Bottom line", 3, 2, [
        text(3, "Not assessable: the executed documents were not supplied."),
      ]),
    ],
    {},
    "Not assessable",
  );
  const header = screen.getByRole("region", { name: "Fundamental credit" });
  expect(header).toHaveClass("border-dashed");
  expect(within(header).getByText("Not assessable")).toBeVisible();
  expect(
    within(header).getByText("Not assessable: the executed documents were not supplied."),
  ).toBeVisible();
  expect(screen.queryByRole("region", { name: "Key findings" })).toBeNull();
});

it("draws the gap of each owed passage in place and lists a declared chart gap among the limitations", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Bottom line", 3, 2, [text(3, "Thin.")]),
      section("Metric", 3, 4, [table(5, ["A", "B"], [["x", "1"]])]),
    ],
    {
      chartGaps: [
        { table: 5, title: "interest cover", gap: "Not supplied: cash interest is not stated" },
      ],
    },
  );
  for (const name of ["Key findings", "Contrary evidence and what would change the view"])
    expect(
      within(screen.getByRole("region", { name })).getByText(/The module wrote no such passage/),
    ).toBeVisible();
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getByText("interest cover: not drawn")).toBeVisible();
  expect(within(limits).getByText("Not supplied: cash interest is not stated")).toBeVisible();
  expect(within(limits).getByText(/The module wrote no such passage/)).toBeVisible();
  // Wording ruling: a gap sentence never says "handoff" to the reader.
  expect(screen.queryByText(/handoff/i)).toBeNull();
});

it("names the next module in stage order and links to it", () => {
  page(written);
  expect(screen.getByRole("link", { name: "Next module: Committee decision" })).toHaveAttribute(
    "href",
    "#modules/CP-6",
  );
});

it.each([
  ["holds only its Basis line", [text(3, "Basis: annual report, page 4")]],
  ["holds only a table", [table(3, ["Metric", "FY2024"], [["Cover", "3.1x"]])]],
])("says what is true when the Bottom line passage %s, and keeps what it holds", (_, blocks) => {
  page([section("Findings", 2, 1), section("Bottom line", 3, 2, blocks)]);
  const header = screen.getByRole("region", { name: "Fundamental credit" });
  expect(within(header).getByText("This passage holds no text.")).toBeVisible();
  expect(within(header).queryByText(/no such passage/)).toBeNull();
  const block = blocks[0];
  if (block?.type === "table") expect(within(header).getByText("3.1x")).toBeVisible();
  else
    expect(
      within(header).getByRole("button", { name: "Show sources for Bottom line" }),
    ).toBeVisible();
});

it("states an unreadable handoff once, with its reason, and no passage gaps", () => {
  page([], { parseError: "the front matter is not valid YAML" });
  expect(
    screen.getAllByText(
      /This module's output could not be read into sections: the front matter is not valid YAML/,
    ),
  ).toHaveLength(1);
  expect(screen.queryByText(/no such passage/)).toBeNull();
});

it("draws a rowless table in a passage as its stated gap, not an empty tile", () => {
  page([
    section("Findings", 2, 1),
    section("Bottom line", 3, 2, [text(3, "Thin.")]),
    section("Key findings", 3, 4, [table(5, ["Metric", "FY2024"], [])]),
  ]);
  const findings = screen.getByRole("region", { name: "Key findings" });
  expect(within(findings).getByText("This table has no rows.")).toBeVisible();
});

it("draws no empty well for a limitation that holds only its Basis line", () => {
  page([
    ...written.filter(({ heading }) => heading !== "Limitations"),
    section("Limitations", 3, 30, [
      text(31, "Basis: annual report, page 9"),
      text(32, "One period only."),
    ]),
  ]);
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getAllByRole("listitem")).toHaveLength(1);
  expect(within(limits).getByText("One period only.")).toBeVisible();
});
