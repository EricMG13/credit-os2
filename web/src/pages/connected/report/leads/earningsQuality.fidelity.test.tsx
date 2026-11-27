import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { EarningsQualityLead } from "./earningsQuality";
import { readBridge, readLeverage } from "./earningsQualityData";
import { leadProps } from "./fixtures/load";

afterEach(cleanup);

const bridgeHeaders = ["Step", "Amount", "Reporting unit", "Basis and limitation"];

const legacyBridge = (rows: [label: string, amount: string][]) =>
  entry(
    "CP-1D",
    [],
    [
      section(
        "Chart data: EBITDA bridge",
        20,
        table(
          21,
          bridgeHeaders,
          rows.map(([label, amount]) => [label, amount, "USD millions", ""]),
        ),
      ),
    ],
  );

const mismatchedBridge = () =>
  entry(
    "CP-1D",
    [],
    [
      section(
        "Chart data: EBITDA bridge",
        20,
        table(21, bridgeHeaders, [
          ["Reported EBITDA", "100", "USD millions", ""],
          ["First add-back", "+100", "USD millions", ""],
          ["Second add-back", "+50", "USD millions", ""],
          ["Adjusted EBITDA", "260", "USD millions", ""],
        ]),
      ),
    ],
  );

const debtBridge = () =>
  entry(
    "CP-1D",
    [],
    [
      section(
        "Chart data: debt bridge",
        20,
        table(21, bridgeHeaders, [
          ["Carrying debt", "900", "USD millions", ""],
          ["Lease liability", "+75", "USD millions", ""],
          ["Adjusted debt", "975", "USD millions", ""],
        ]),
      ),
    ],
  );

const leverageBases = () =>
  entry(
    "CP-1D",
    [],
    [
      section(
        "T1D.6 Leverage sensitivity",
        30,
        table(
          31,
          [
            "Metric",
            "On Reported EBITDA",
            "On Management EBITDA",
            "On Quality-Adjusted EBITDA",
            "Delta vs Reported",
          ],
          [["Total leverage", "6.0x", "4.0x", "7.0x", "+1.0x"]],
        ),
      ),
    ],
  );

describe("Earnings Quality handoff fidelity", () => {
  it("keeps the stated adjusted EBITDA and every step when an add-back equals the opening", () => {
    const bridge = readBridge(mismatchedBridge());
    if (bridge.state !== "gap") throw new Error("Expected the mismatch to prevent a waterfall");
    expect(bridge.reason).toMatch(/260.*do not add up.*250/);
    expect(bridge.stated).toEqual([
      { label: "Reported EBITDA", text: "100 USD millions" },
      { label: "First add-back", text: "+100 USD millions" },
      { label: "Second add-back", text: "+50 USD millions" },
      { label: "Adjusted EBITDA", text: "260 USD millions" },
    ]);
    render(<EarningsQualityLead {...leadProps(mismatchedBridge())} />);
    const tile = within(screen.getByRole("region", { name: "Earnings quality" }));
    for (const text of [
      "Reported EBITDA $100m",
      "First add-back +$100m",
      "Second add-back +$50m",
      "Adjusted EBITDA $260m",
      "do not add up",
      "250",
    ]) {
      expect(
        tile.getByText(new RegExp(text.replaceAll("$", "\\$").replaceAll("+", "\\+"))),
      ).toBeVisible();
    }
    expect(tile.queryByRole("img")).toBeNull();
  });

  it("keeps a qualified closing EBITDA distinct from a trailing signed sensitivity", () => {
    const source = entry(
      "CP-1D",
      [],
      [
        section(
          "Chart data: EBITDA bridge",
          20,
          table(21, bridgeHeaders, [
            ["Reported EBITDA", "100", "USD millions", ""],
            ["First add-back", "+100", "USD millions", ""],
            ["Conditional adjusted EBITDA", "200", "USD millions", ""],
            ["Conditional further acceptance", "+20", "USD millions", ""],
          ]),
        ),
      ],
    );
    expect(readBridge(source)).toMatchObject({
      state: "ready",
      closing: { label: "Conditional adjusted EBITDA", amount: "200" },
      changes: [{ label: "First add-back", amount: "100", sign: "+" }],
      notes: ["Conditional further acceptance +20"],
    });
  });

  it("keeps the stated adjusted EBITDA when a conditional downside follows it", () => {
    const source = legacyBridge([
      ["Reported EBITDA", "100"],
      ["Add-back", "+50"],
      ["Adjusted EBITDA", "150"],
      ["Conditional downside", "-20"],
    ]);
    expect(readBridge(source)).toMatchObject({
      state: "ready",
      unit: "USD millions",
      opening: { label: "Reported EBITDA", amount: "100" },
      closing: { label: "Adjusted EBITDA", amount: "150" },
      changes: [{ label: "Add-back", amount: "50", sign: "+" }],
      notes: ["Conditional downside -20"],
    });

    render(<EarningsQualityLead {...leadProps(source)} />);
    const tile = within(screen.getByRole("region", { name: "Earnings quality" }));
    expect(tile.getByText("Conditional downside -20")).toBeVisible();
    expect(tile.getByRole("img")).toHaveAccessibleName(/Adjusted EBITDA.*150/);
    expect(tile.getByRole("img")).not.toHaveAccessibleName(/Conditional downside/);
  });

  it("keeps a stated management EBITDA level separate from the quality adjustment", () => {
    const source = legacyBridge([
      ["Reported EBITDA", "100"],
      ["Add-back", "+50"],
      ["Management EBITDA", "150"],
      ["Quality adjustment", "-20"],
      ["Quality-adjusted EBITDA", "130"],
    ]);
    expect(readBridge(source)).toMatchObject({
      state: "ready",
      unit: "USD millions",
      opening: { label: "Reported EBITDA", amount: "100" },
      closing: { label: "Quality-adjusted EBITDA", amount: "130" },
      changes: [
        { label: "Add-back", amount: "50", sign: "+" },
        { label: "Quality adjustment", amount: "-20" },
      ],
      notes: ["Management EBITDA 150"],
    });

    render(<EarningsQualityLead {...leadProps(source)} />);
    const tile = within(screen.getByRole("region", { name: "Earnings quality" }));
    expect(tile.getByText("Management EBITDA 150")).toBeVisible();
    fireEvent.click(tile.getByRole("button", { name: "Table view: Earnings quality bridge" }));
    expect(
      within(tile.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) =>
          within(row)
            .getAllByRole("cell")
            .slice(0, 2)
            .map((cell) => cell.textContent),
        ),
    ).toEqual([
      ["Reported EBITDA", "100"],
      ["Add-back", "+50"],
      ["Quality adjustment", "−20"],
      ["Quality-adjusted EBITDA", "130"],
    ]);
  });

  it.each(["Management EBITDA adjustment", "EBITDA subtotal adjustment"])(
    "keeps the named %s when its amount equals the running balance",
    (label) => {
      const source = legacyBridge([
        ["Reported EBITDA", "100"],
        ["Add-back", "+50"],
        [label, "150"],
        ["Adjusted EBITDA", "300"],
      ]);
      expect(readBridge(source)).toMatchObject({
        state: "ready",
        closing: { label: "Adjusted EBITDA", amount: "300" },
        changes: [
          { label: "Add-back", amount: "50" },
          { label, amount: "150" },
        ],
        notes: [],
      });
    },
  );

  it("keeps a negative qualified EBITDA level as the closing before a signed sensitivity", () => {
    const source = legacyBridge([
      ["Reported EBITDA", "10"],
      ["Quality adjustment", "-30"],
      ["Conditional adjusted EBITDA", "-20"],
      ["Conditional downside", "-5"],
    ]);
    expect(readBridge(source)).toMatchObject({
      state: "ready",
      closing: { label: "Conditional adjusted EBITDA", amount: "-20" },
      changes: [{ label: "Quality adjustment", amount: "-30" }],
      notes: ["Conditional downside -5"],
    });
  });

  it("keeps an explicitly signed conditional EBITDA closing before a downside", () => {
    const source = legacyBridge([
      ["Reported EBITDA", "100"],
      ["Add-back", "+50"],
      ["Conditional adjusted EBITDA", "+150"],
      ["Conditional downside", "-20"],
    ]);
    expect(readBridge(source)).toMatchObject({
      state: "ready",
      unit: "USD millions",
      opening: { label: "Reported EBITDA", amount: "100" },
      closing: { label: "Conditional adjusted EBITDA", amount: "150", value: 150 },
      changes: [{ label: "Add-back", amount: "50" }],
      notes: ["Conditional downside -20"],
    });

    render(<EarningsQualityLead {...leadProps(source)} />);
    const tile = within(screen.getByRole("region", { name: "Earnings quality" }));
    expect(tile.getByRole("img")).toHaveAccessibleName(/Conditional adjusted EBITDA.*150/);
    expect(tile.getByText("Conditional downside -20")).toBeVisible();
  });

  it("still checks the arithmetic for an explicitly signed named closing", () => {
    const bridge = readBridge(
      legacyBridge([
        ["Reported EBITDA", "100"],
        ["Add-back", "+50"],
        ["Conditional adjusted EBITDA", "+151"],
        ["Conditional downside", "-20"],
      ]),
    );
    if (bridge.state !== "gap") throw new Error("Expected the mismatch to prevent a waterfall");
    expect(bridge.reason).toMatch(/\(151\).*do not add up.*to 150 in/);
  });

  it("does not turn a signed add-back before a downside into the closing", () => {
    const source = legacyBridge([
      ["Reported EBITDA", "100"],
      ["Add-back", "+100"],
      ["Conditional downside", "-20"],
    ]);
    expect(readBridge(source)).toMatchObject({
      state: "gap",
      reason: "This page could not identify the stated closing bridge amount.",
    });
  });

  it("leaves a sole debt bridge under its own title and with each amount unchanged", () => {
    expect(readBridge(debtBridge())).toMatchObject({ state: "gap", heading: "", stated: [] });
    render(<EarningsQualityLead {...leadProps(debtBridge())} />);
    const quality = within(screen.getByRole("region", { name: "Earnings quality" }));
    expect(quality.queryByRole("img")).toBeNull();
    expect(quality.queryByText(/Carrying debt|900|\+75|975/)).toBeNull();
    const debt = within(screen.getByRole("region", { name: "Debt bridge" }));
    expect(debt.getAllByRole("listitem").map((row) => row.textContent)).toEqual([
      "Carrying debtAmount900",
      "Lease liabilityAmount+75",
      "Adjusted debtAmount975",
    ]);
  });

  it("keeps the stated delta versus reported in its table and off the management comparison", () => {
    expect(readLeverage(leverageBases())).toMatchObject({
      state: "ready",
      labels: { reported: "Reported EBITDA", restated: "Quality-Adjusted EBITDA" },
      deltaLabel: "Delta vs Reported",
      others: [{ label: "Management EBITDA" }],
      measures: [
        {
          measure: "Total leverage",
          reported: { text: "6.0x" },
          others: [{ text: "4.0x" }],
          restated: { text: "7.0x" },
          delta: "+1.0x",
        },
      ],
    });
    render(<EarningsQualityLead {...leadProps(leverageBases())} />);
    const leverage = within(screen.getByRole("region", { name: "Restated leverage" }));
    const reported = leverage.getByRole("img", { name: /Reported EBITDA.*6\.0x/ });
    const management = leverage.getByRole("img", { name: /Management EBITDA.*4\.0x/ });
    expect(reported).toHaveAccessibleName(/Quality-Adjusted EBITDA.*7\.0x/);
    expect(management).toHaveAccessibleName(/Quality-Adjusted EBITDA.*7\.0x/);
    expect(management).not.toHaveAccessibleName(/\+1\.0x/);
    expect(management).not.toHaveTextContent("+1.0x");
    fireEvent.click(leverage.getByRole("button", { name: /Table view: Leverage on/ }));
    const shown = within(leverage.getByRole("table"));
    expect(shown.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Measure",
      "Reported EBITDA",
      "Management EBITDA",
      "Quality-Adjusted EBITDA",
      "Delta vs Reported",
    ]);
    expect(shown.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "Total leverage",
      "6.0x",
      "4.0x",
      "7.0x",
      "+1.0x",
    ]);
  });
});
