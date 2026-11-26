// Verbatim excerpts of a real CP-1D handoff (offline replay of an issuer run, sections T1D.4, T1D.6,
// T1E.3 and the appendix sentence naming the unit). Expected values are typed from that handoff.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { readBridge, readLeverage } from "./earningsQualityData";
import { EarningsQualityLead } from "./earningsQuality";
import { leadProps } from "./fixtures/load";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const EBITDA_HEAD = [
  "Step",
  "Amount",
  "Basis",
  "Supported / Challenged / Rejected",
  "Cumulative EBITDA",
  "Evidence ID",
];
const EBITDA_ROWS = [
  [
    "Issuer EBITDA As Defined starting point",
    "4173",
    "Inherited, unchanged; issuer measure",
    "Starting reference, not analytical endorsement",
    "4173",
    "E5",
  ],
  [
    "Remove acquisition/integration add-back",
    "-70",
    "Recurrent category in both prior years",
    "Rejected for recurring-credit earnings",
    "4103",
    "E1; Q01",
  ],
  [
    "Remove compensation add-back",
    "-217",
    "Recurrent remuneration",
    "Rejected for recurring-credit earnings",
    "3886",
    "E2; Q01",
  ],
  [
    "Remove refinancing add-back",
    "-58",
    "Recurrent financing-model expense",
    "Rejected for recurring-credit earnings",
    "3828",
    "E3; Q01",
  ],
  [
    "Segregate unresolved other net",
    "-15",
    "Excluded only from supported-only case; not a rejection",
    "Challenged; unresolved 15",
    "3813",
    "E4; Q01",
  ],
  [
    "Supported-only analytical EBITDA",
    "3813",
    "Equals inherited reported EBITDA because no incremental category is accepted",
    "Supported-only case, not reported under a new definition or covenant EBITDA",
    "3813",
    "E5; Q01",
  ],
  [
    "Conditional full acceptance of unresolved net amount",
    "+15",
    "Sensitivity only, not the selected supported-only case",
    "Challenged; not evidence-supported acceptance",
    "3828",
    "E4; Q01",
  ],
];
const DEBT_HEAD = ["Step", "Amount", "Basis", "Cumulative Adjusted Debt", "Evidence ID"];
const DEBT_ROWS = [
  ["Inherited carrying financial debt", "24880", "Carrying", "24880", "E5"],
  ["Add operating-lease present value", "+62", "On balance sheet", "24942", "E6; Q04"],
  ["Add net pension deficit", "+6", "Quantified", "24948", "E7; Q04"],
  ["Financing-style adjusted-debt subtotal", "24948", "Alternative", "24948", "Q04"],
  ["Add declared common dividend payable", "+4216", "Committed", "29164", "E8; Q04"],
  ["Quantified obligation-inclusive analytical debt", "29164", "Selected", "29164", "Q04"],
];
const LEVERAGE_HEAD = [
  "Metric",
  "On Reported EBITDA",
  "On Adjusted EBITDA",
  "On Quality-Adjusted EBITDA",
  "Delta (turns)",
  "Credit Implication",
  "Evidence ID",
];
const LEVERAGE_ROWS = [
  [
    "FY2024 inherited carrying debt 24880 / annual EBITDA",
    "6.53x; denominator 3813",
    "5.96x; denominator 4173",
    "6.53x supported-only; denominator 3813",
    "+0.57x supported-only versus issuer-adjusted, using displayed ratios",
    "Recurring costs remove the apparent earnings cushion.",
    "E5; Q05",
  ],
  [
    "Same debt if unresolved other is accepted",
    "6.53x reference",
    "5.96x reference",
    "6.50x; denominator 3828; conditional only",
    "Not selected: unresolved adjustment remains challenged",
    "Residual uncertainty does not overturn the recurring-cost conclusion.",
    "E4; Q05",
  ],
];

function real() {
  return entry(
    "CP-1D",
    [],
    [
      {
        heading: "Analytical appendix — complete canonical registers",
        level: 3,
        line: 80,
        blocks: [
          {
            type: "text",
            line: 82,
            end: 82,
            text: "All register monetary amounts are consolidated USD millions unless explicitly stated. FY2024 and FY2023 bridge amounts are inherited unchanged.",
          },
        ],
      },
      section("T1D.4 Quality-Adjusted EBITDA Bridge", 125, table(127, EBITDA_HEAD, EBITDA_ROWS)),
      section("T1D.6 Leverage Sensitivity", 144, table(146, LEVERAGE_HEAD, LEVERAGE_ROWS)),
      section("T1E.3 Adjusted Debt Bridge", 188, table(190, DEBT_HEAD, DEBT_ROWS)),
    ],
  );
}

describe("CP-1D real handoff shape", () => {
  it("reads the EBITDA bridge by its own heading although the debt bridge is a second Step | Amount table", () => {
    const bridge = readBridge(real());
    if (bridge.state !== "ready") throw new Error(bridge.reason);
    expect(bridge.opening).toMatchObject({ amount: "4173", value: 4173 });
    expect(bridge.closing).toMatchObject({
      label: "Supported-only analytical EBITDA",
      amount: "3813",
    });
    expect(bridge.changes.map((step) => step.amount)).toEqual(["-70", "-217", "-58", "-15"]);
    expect(bridge.unit).toBe("USD millions");
    expect(bridge.notes.join(" ")).toContain(
      "Conditional full acceptance of unresolved net amount +15",
    );
  });

  it("reads leverage as the module wrote it: reported against quality-adjusted EBITDA", () => {
    const leverage = readLeverage(real());
    if (leverage.state !== "ready") throw new Error(leverage.reason);
    expect(leverage.labels).toEqual({
      reported: "Reported EBITDA",
      restated: "Quality-Adjusted EBITDA",
    });
    expect(leverage.measures.map((item) => item.measure)).toEqual([
      "FY2024 inherited carrying debt 24880 / annual EBITDA",
      "Same debt if unresolved other is accepted",
    ]);
    expect(leverage.measures[0]?.reported).toMatchObject({ value: 6.53 });
    expect(leverage.measures[0]?.restated).toMatchObject({ value: 6.53 });
    expect(leverage.measures[1]?.restated).toMatchObject({ value: 6.5 });
  });

  it("draws both tiles with no could-not-read wording", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 640,
    } as DOMRect);
    render(<EarningsQualityLead {...leadProps(real())} />);
    expect(document.body.textContent).not.toMatch(
      /appears more than once|earnings quality bridge|leverage on the statements/,
    );
    expect(
      screen.getByRole("link", { name: "Source for the earnings-quality bridge" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Source for restated leverage" })).toBeVisible();
  });

  it("reads each step's support in the module's own words from the bridge table", () => {
    const bridge = readBridge(real());
    if (bridge.state !== "ready") throw new Error(bridge.reason);
    expect(bridge.supportStated).toBe(true);
    expect(bridge.changes.map((step) => step.stance)).toEqual([
      "Rejected for recurring-credit earnings",
      "Rejected for recurring-credit earnings",
      "Rejected for recurring-credit earnings",
      "Challenged; unresolved 15",
    ]);
  });

  it("never calls a module-stated step support unread (real T1D.4 bridge)", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 640,
    } as DOMRect);
    const { container } = render(<EarningsQualityLead {...leadProps(real())} />);
    expect(document.body.textContent).not.toContain("support not read");
    const reading = [...container.querySelectorAll("[aria-label], [aria-labelledby]")]
      .map((node) => node.getAttribute("aria-label") ?? "")
      .join(" ");
    expect(reading).not.toContain("support not read");
    expect(container.innerHTML).not.toContain("support not read");
  });

  it("closes a bridge with an intermediate subtotal on its final total row", () => {
    const head = ["Step", "Amount", "Basis", "Supported / Challenged / Rejected"];
    const rows = [
      ["Reported EBITDA", "3813", "Inherited", "Starting reference"],
      ["Add issuer adjustments", "+360", "Issuer bridge", "Issuer presentation"],
      ["Issuer EBITDA subtotal", "4173", "Issuer measure", "Not endorsement"],
      ["Remove rejected add-backs", "-345", "Recurrent", "Rejected"],
      ["Segregate unresolved other net", "-15", "Unresolved", "Challenged"],
      ["Supported-only analytical EBITDA", "3813", "Result", "Supported-only case"],
    ];
    const bridge = readBridge(
      entry(
        "CP-1D",
        [],
        [
          {
            heading: "Analytical appendix — complete canonical registers",
            level: 3,
            line: 1,
            blocks: [
              {
                type: "text",
                line: 2,
                end: 2,
                text: "All register monetary amounts are consolidated USD millions unless explicitly stated.",
              },
            ],
          },
          section("T1D.4 Quality-Adjusted EBITDA Bridge", 5, table(7, head, rows)),
        ],
      ),
    );
    if (bridge.state !== "ready") throw new Error(bridge.reason);
    expect(bridge.closing).toMatchObject({
      label: "Supported-only analytical EBITDA",
      amount: "3813",
    });
    expect(bridge.changes.map((step) => step.amount)).toEqual(["360", "-345", "-15"]);
    expect(bridge.notes.join(" ")).toContain("Issuer EBITDA subtotal 4,173");
  });

  it("shows the support words in the bridge table view and no could-not-read note", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 640,
    } as DOMRect);
    render(<EarningsQualityLead {...leadProps(real())} />);
    fireEvent.click(screen.getByRole("button", { name: /Table view: Earnings quality bridge/ }));
    const tile = screen.getByRole("table", { name: /Earnings quality bridge/ });
    expect(tile.textContent).toContain("Challenged; unresolved 15");
    expect(tile.textContent).toContain("Rejected for recurring-credit earnings");
    const cells = within(
      within(tile)
        .getAllByRole("row")
        .find((row) =>
          row.textContent.startsWith("Remove acquisition/integration add-back"),
        ) as HTMLElement,
    )
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
    expect(cells.slice(0, 4)).toEqual([
      "Remove acquisition/integration add-back",
      "−70",
      "$m",
      "Rejected for recurring-credit earnings",
    ]);
    expect(document.body.textContent).not.toContain("could not read a support word");
  });

  it("reads every basis column of the leverage table and its delta as written", () => {
    const leverage = readLeverage(real());
    if (leverage.state !== "ready") throw new Error(leverage.reason);
    expect(leverage.others?.map((basis) => basis.label)).toEqual(["Adjusted EBITDA"]);
    expect(leverage.measures[0]?.others?.[0]).toMatchObject({ value: 5.96 });
    expect(leverage.measures[0]?.delta).toBe(
      "+0.57x supported-only versus issuer-adjusted, using displayed ratios",
    );
    expect(leverage.measures[1]?.delta).toBe(
      "Not selected: unresolved adjustment remains challenged",
    );
  });

  it("draws the adjusted basis and the delta in the leverage table view", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 640,
    } as DOMRect);
    render(<EarningsQualityLead {...leadProps(real())} />);
    fireEvent.click(screen.getByRole("button", { name: /Table view: Leverage on/ }));
    const tile = screen.getByRole("table", { name: /Leverage on/ });
    expect(tile.textContent).toContain("5.96x; denominator 4173");
    expect(tile.textContent).toContain("Adjusted EBITDA");
    expect(tile.textContent).toContain("+0.57x supported-only versus issuer-adjusted");
  });
});
