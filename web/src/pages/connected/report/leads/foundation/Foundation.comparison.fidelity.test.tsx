import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, section, table } from "../../overview/rows.fixture";
import { leadProps } from "../fixtures/load";
import { FoundationLead } from "./Foundation";

afterEach(cleanup);

const coverInput = (rows: string[][]) =>
  entry(
    "CP-1",
    [],
    [
      section(
        "Chart data: interest cover",
        10,
        table(
          11,
          ["Period", "EBITDA / cash interest", "Reporting unit", "Basis and limitation"],
          rows,
        ),
      ),
    ],
  );

it.each([
  ["Reported EBITDA / gross cash interest paid.", "Reported EBITDA / net cash interest paid."],
  ["Unadjusted EBITDA / net cash interest paid.", "Reported EBITDA / net cash interest paid."],
  [
    "Issuer unadjusted EBITDA divided by cash interest paid, net, 1160 US$m; C3; annual filing pages 71 and 123.",
    "Adjusted EBITDA divided by cash interest paid, net.",
  ],
])("keeps separate cover definitions when the earlier basis is %s", (earlier, later) => {
  const input = coverInput([
    ["FY2024 / 2024-09-30", "3", "x", earlier],
    ["FY2025 / 2025-09-30", "5", "x", later],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect([...tile.querySelectorAll('[data-part="value"]')].map((part) => part.textContent)).toEqual(
    ["3x", "5x"],
  );
  expect(tile.querySelector('[data-part="change"]')).toBeNull();
  expect(tile.querySelector('[data-part="link"]')).toBeNull();
});

it("compares equivalent basis wording and retains zero", () => {
  const input = coverInput([
    ["FY2024 / 2024-09-30", "0", "x", "Unadjusted EBITDA / cash interest paid, net."],
    ["FY2025 / 2025-09-30", "5", "x", "EBITDA (Unadjusted) / net cash interest paid."],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect(tile.querySelector('[data-part="change"]')).toHaveTextContent(
    "FY2024 to FY2025: +5x, up, better",
  );
  expect(tile.querySelector('[data-part="link"]')).toBeVisible();
});

it("shows coverage without marking periods compared when no segment measure has two numbers", () => {
  const input = entry(
    "CP-1",
    [],
    [
      section(
        "Segment schedule",
        10,
        table(
          11,
          ["Segment", "FY2023", "FY2024", "FY2025", "Unit"],
          [
            [
              "Division A Net sales",
              "Not supplied: no FY2023 sales",
              "0",
              "Not supplied: sales unavailable",
              "USD millions",
            ],
            [
              "Division A EBITDA As Defined",
              "Not supplied: no FY2023 EBITDA",
              "Not supplied: EBITDA unavailable",
              "20",
              "USD millions",
            ],
          ],
        ),
      ),
    ],
  );
  render(<FoundationLead {...leadProps(input)} />);
  const periods = screen.getByRole("region", { name: "Periods" });
  expect(within(periods).getByText("Figures show FY2024 and FY2025.")).toBeVisible();
  expect(periods.querySelector("[data-comparison]")).toBeNull();
});

it("retains dates while keeping appended filing locators in Evidence", () => {
  const input = coverInput([
    [
      "FY2024 / 2024-09-30 (filing_2024.jsonl, page 71)",
      "3",
      "x",
      "Reported EBITDA / cash interest paid.",
    ],
    ["FY2025 / 2025-09-30", "5", "x", "Adjusted EBITDA / cash interest paid."],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect(
    within(tile).getByText("FY2024 / 2024-09-30 · Reported EBITDA / cash interest paid."),
  ).toBeVisible();
  expect(tile).not.toHaveTextContent(/filing_2024\.jsonl|page 71/);
  expect(within(tile).getByRole("link", { name: /Source for interest cover/ })).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  expect(
    within(tile).getByRole("row", {
      name: "FY2024 / 2024-09-30 3 Reported EBITDA / cash interest paid.",
    }),
  ).toBeVisible();
});

it("uses the date before a source locator when checking year-on-year cover", () => {
  const basis = "Reported EBITDA / cash interest paid.";
  const input = coverInput([
    ["FY2024 / 2024-09-30", "3", "x", basis],
    ["FY2025 / 2025-12-31 (filing_2025.jsonl, page 71)", "5", "x", basis],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect(tile.querySelector('[data-part="change"]')).toBeNull();
  expect(within(tile).getByText(`FY2025 / 2025-12-31 · ${basis}`)).toBeVisible();
});

it.each([
  { unit: "US$m", compared: true },
  { unit: "EUR millions", compared: false },
  { unit: "", compared: false },
])(
  "requires one known unit for the liquidity pair with later unit '$unit'",
  ({ unit, compared }) => {
    const gap = "Not supplied: no balance for this row";
    const input = entry(
      "CP-1",
      [],
      [
        section(
          "Net debt data",
          10,
          table(
            11,
            ["Period", "Gross debt", "Cash", "Net debt", "Reporting unit"],
            [
              ["FY2023", gap, gap, gap, "USD millions"],
              ["FY2024", gap, gap, gap, "USD millions"],
              ["FY2025", gap, gap, gap, "USD millions"],
            ],
          ),
        ),
        section(
          "Chart data: liquidity",
          20,
          table(
            21,
            ["Period", "Cash", "Undrawn committed facilities", "Reporting unit"],
            [
              ["FY2024", "0", gap, "USD millions"],
              ["FY2025", "5", gap, unit],
            ],
          ),
        ),
      ],
    );
    render(<FoundationLead {...leadProps(input)} />);
    const periods = screen.getByRole("region", { name: "Periods" });
    expect(within(periods).getByText("Figures show FY2024 and FY2025.")).toBeVisible();
    expect(Boolean(periods.querySelector("[data-comparison]"))).toBe(compared);
  },
);

it.each(["restated; filing_2024.jsonl, page 71", "restated per filing_2024.jsonl, page 71"])(
  "keeps the date and restatement beside its cover figure when written as %s",
  (qualification) => {
    const basis = "Reported EBITDA / cash interest paid.";
    const input = coverInput([
      [`FY2024 / 2024-09-30 (${qualification})`, "3", "x", basis],
      ["FY2025 / 2025-09-30", "5", "x", basis],
    ]);
    render(<FoundationLead {...leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(tile.querySelector('[data-part="change"]')).toBeNull();
    expect(within(tile).getByText(`FY2024 / 2024-09-30 (restated) · ${basis}`)).toBeVisible();
    expect(tile.querySelector('[data-part="link"]')).toBeNull();
    expect(tile).not.toHaveTextContent(/filing_2024\.jsonl|page 71|Not placed in time order/);
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    expect(
      within(tile).getByRole("row", { name: `FY2024 / 2024-09-30 (restated) 3 ${basis}` }),
    ).toBeVisible();
  },
);

it.each([
  ["restated; filing_2024.jsonl, page 71; unaudited", "restated; unaudited"],
  ["restated per filing_2024.jsonl, page 71", "restated"],
])("compares the same period qualification with and without attribution", (earlier, visible) => {
  const basis = "Reported EBITDA / cash interest paid.";
  const input = coverInput([
    [`FY2025 / 2025-09-30 (${visible})`, "5", "x", basis],
    [`FY2024 / 2024-09-30 (${earlier})`, "3", "x", basis],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect(tile.querySelector('[data-part="change"]')).toHaveTextContent(
    "FY2024 to FY2025: +2x, up, better",
  );
  expect(tile.querySelector('[data-part="link"]')).toBeVisible();
  for (const period of ["FY2024 / 2024-09-30", "FY2025 / 2025-09-30"])
    expect(within(tile).getByText(`${period} (${visible}) · ${basis}`)).toBeVisible();
  expect(tile).not.toHaveTextContent(/filing_2024\.jsonl|page 71/);
});

it.each(["filing_2024.jsonl, page 71", "C3", "C07"])(
  "can compare cover when the period annotation is only %s",
  (locator) => {
    const basis = "Reported EBITDA / cash interest paid.";
    const input = coverInput([
      [`FY2024 / 2024-09-30 (${locator})`, "3", "x", basis],
      ["FY2025 / 2025-09-30", "5", "x", basis],
    ]);
    render(<FoundationLead {...leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(tile.querySelector('[data-part="change"]')).toHaveTextContent(
      "FY2024 to FY2025: +2x, up, better",
    );
    expect(tile.querySelector('[data-part="link"]')).toBeVisible();
    expect(tile).not.toHaveTextContent(locator);
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    expect(within(tile).getByRole("row", { name: `FY2024 3 ${basis}` })).toBeVisible();
  },
);

it.each([
  [0, "restated filing_2024.jsonl, page 71"],
  [1, "restated per filing_2025.jsonl, page 71, unaudited"],
  [1, "restated C3"],
] as const)("keeps uncertain cover periods in Evidence on either side", (index, mixed) => {
  const basis = "Reported EBITDA / cash interest paid.";
  const dates = ["FY2024 / 2024-09-30", "FY2025 / 2025-09-30"] as const;
  const input = coverInput(
    dates.map((date, at) => [
      at === index ? `${date} (${mixed})` : date,
      at === 0 ? "3" : "5",
      "x",
      basis,
    ]),
  );
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect(tile.querySelector('[data-part="change"]')).toBeNull();
  expect(tile.querySelector('[data-part="link"]')).toBeNull();
  const period = `${dates[index]} · Detail is in Evidence.`;
  expect(within(tile).getByText(`${period} · ${basis}`)).toBeVisible();
  expect(tile).not.toHaveTextContent(/filing_202[45]\.jsonl|page 71|C3|Not placed in time order/);
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  expect(
    within(tile).getByRole("row", { name: `${period} ${index === 0 ? "3" : "5"} ${basis}` }),
  ).toBeVisible();
});

it("does not compare an invalid explicit cover date that matches the earlier month and day", () => {
  const basis = "Reported EBITDA / cash interest paid.";
  const input = coverInput([
    ["FY2024 / 2024-02-29", "3", "x", basis],
    ["FY2025 / 2025-02-29", "5", "x", basis],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect([...tile.querySelectorAll('[data-part="value"]')].map((part) => part.textContent)).toEqual(
    ["3x", "5x"],
  );
  expect(tile.querySelector('[data-part="change"]')).toBeNull();
  expect(tile.querySelector('[data-part="link"]')).toBeNull();
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  expect(within(tile).getByRole("row", { name: `FY2025 / 2025-02-29 5 ${basis}` })).toBeVisible();
});

it.each([
  ["before swaps", "after swaps", false],
  ["before swaps", "before swaps", true],
  ["after swaps", "after swaps", true],
  ["excluding interest-rate swap settlements", "including interest-rate swap settlements", false],
  ["before the effect of interest rate swaps", "after the effect of interest rate swaps", false],
  ["before swaps", "excluding interest-rate swap settlements", true],
  ["after swaps", "including interest-rate swap settlements", true],
  ["excluding interest-rate swap settlements", "after the effect of interest rate swaps", false],
] as const)("compares cover only on like swap scope (%s and %s)", (prior, latest, compared) => {
  const basis = (scope: string) => `Reported EBITDA / net cash interest paid ${scope}.`;
  const input = coverInput([
    ["FY2023", "Not supplied: ratio unavailable", "x", ""],
    ["FY2024 / 2024-09-30", "3", "x", basis(prior)],
    ["FY2025 / 2025-09-30", "5", "x", basis(latest)],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect([...tile.querySelectorAll('[data-part="value"]')].map((part) => part.textContent)).toEqual(
    ["3x", "5x"],
  );
  expect(tile.querySelector('[data-part="change"]')?.textContent ?? null).toBe(
    compared ? "FY2024 to FY2025: +2x, up, better" : null,
  );
  expect(Boolean(tile.querySelector('[data-part="link"]'))).toBe(compared);
  const periods = screen.getByRole("region", { name: "Periods" });
  expect(Boolean(periods.querySelector("[data-comparison]"))).toBe(compared);
});

it.each([
  ["pre-swap cash interest paid", "post-swap cash interest paid", false],
  ["cash interest paid with swaps", "cash interest paid without swaps", false],
  ["cash interest paid", "post-swap cash interest paid", false],
  ["pre-swap cash interest paid", "cash interest paid before swaps", false],
  ["cash interest paid before swaps", "post-swap cash interest paid", false],
  [
    "cash interest paid including swap fees",
    "cash interest paid including swap settlements",
    false,
  ],
  [
    "cash interest paid before swaps",
    "cash interest paid before swaps; post-swap cash interest paid",
    false,
  ],
  [
    "cash interest paid after swaps",
    "pre-swap cash interest paid; cash interest paid after swaps",
    false,
  ],
  ["cash interest paid before swaps", "cash interest paid", true],
  ["cash interest paid", "cash interest paid; swaptions omitted", true],
] as const)(
  "checks swap wording and generic cover bases (%s and %s)",
  (prior, latest, compared) => {
    const input = coverInput([
      ["FY2023", "Not supplied: ratio unavailable", "x", ""],
      ["FY2024 / 2024-09-30", "3", "x", `Reported EBITDA / ${prior}.`],
      ["FY2025 / 2025-09-30", "5", "x", `Reported EBITDA / ${latest}.`],
    ]);
    render(<FoundationLead {...leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(
      [...tile.querySelectorAll('[data-part="value"]')].map((part) => part.textContent),
    ).toEqual(["3x", "5x"]);
    expect(tile.querySelector('[data-part="change"]')?.textContent ?? null).toBe(
      compared ? "FY2024 to FY2025: +2x, up, better" : null,
    );
    expect(Boolean(tile.querySelector('[data-part="link"]'))).toBe(compared);
    const periods = screen.getByRole("region", { name: "Periods" });
    expect(Boolean(periods.querySelector("[data-comparison]"))).toBe(compared);
  },
);

it.each(["10K", "10K filing", "Source S7", "filing_2024.jsonl, pages 71 and 123"])(
  "keeps a source-only annotation (%s) in Evidence without blocking a comparison",
  (locator) => {
    const basis = "Reported EBITDA / cash interest paid.";
    const input = coverInput([
      ["FY2023", "Not supplied: ratio unavailable", "x", ""],
      [`FY2024 / 2024-09-30 (${locator})`, "3", "x", basis],
      ["FY2025 / 2025-09-30", "5", "x", basis],
    ]);
    render(<FoundationLead {...leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(tile.querySelector('[data-part="change"]')).toHaveTextContent(
      "FY2024 to FY2025: +2x, up, better",
    );
    expect(tile.querySelector('[data-part="link"]')).toBeVisible();
    expect(tile).not.toHaveTextContent(locator);
    const periods = screen.getByRole("region", { name: "Periods" });
    expect(periods.querySelector("[data-comparison]")).toBeVisible();
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    expect(within(tile).getByRole("row", { name: `FY2024 3 ${basis}` })).toBeVisible();
    expect(tile).not.toHaveTextContent(locator);
  },
);

it.each([true, false])(
  "checks segment sales independently of mixed EBITDA (sales: %s)",
  (sales) => {
    const gap = "Not supplied: value unavailable";
    const input = entry(
      "CP-1",
      [],
      [
        section(
          "Segment schedule",
          10,
          table(
            11,
            ["Segment", "FY2023", "FY2024", "FY2025", "Unit"],
            [
              ...(sales ? [["Division A Net sales", gap, "0", "40", "USD millions"]] : []),
              ["Division A EBITDA As Defined", gap, "5", "6", "USD millions"],
              ["Division A Reported EBITDA", gap, "4", gap, "USD millions"],
            ],
          ),
        ),
      ],
    );
    render(<FoundationLead {...leadProps(input)} />);
    const periods = screen.getByRole("region", { name: "Periods" });
    expect(within(periods).getByText("Figures show FY2024 and FY2025.")).toBeVisible();
    expect(Boolean(periods.querySelector("[data-comparison]"))).toBe(sales);
    const segments = screen.getByRole("region", { name: "Segments" });
    expect(
      within(segments).getByText("EBITDA definitions differ across the schedule."),
    ).toBeVisible();
    expect(within(segments).queryByRole("img")).toBeNull();
    fireEvent.click(within(segments).getByRole("button", { name: /Table view/ }));
    expect(
      within(segments).getByRole("row", { name: `Division A EBITDA As Defined ${gap} 5 6` }),
    ).toBeVisible();
  },
);

it.each(["10K", "Source S7", "filing_2024.jsonl, pp. 70–72, 91, and 123"])(
  "retains restatement when followed by the source-only attribution %s",
  (locator) => {
    const basis = "Reported EBITDA / cash interest paid.";
    const input = coverInput([
      [`FY2024 / 2024-09-30 (restated per ${locator})`, "3", "x", basis],
      ["FY2025 / 2025-09-30 (restated)", "5", "x", basis],
    ]);
    render(<FoundationLead {...leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(tile.querySelector('[data-part="change"]')).toHaveTextContent(
      "FY2024 to FY2025: +2x, up, better",
    );
    expect(within(tile).getByText(`FY2024 / 2024-09-30 (restated) · ${basis}`)).toBeVisible();
    expect(tile).not.toHaveTextContent(locator);
  },
);

it("keeps an inseparable source ID and ambiguous wording in Evidence", () => {
  const basis = "Reported EBITDA / cash interest paid.";
  const input = coverInput([
    ["FY2024 / 2024-09-30 (restated per Source S7, unaudited)", "3", "x", basis],
    ["FY2025 / 2025-09-30 (restated)", "5", "x", basis],
  ]);
  render(<FoundationLead {...leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect(tile.querySelector('[data-part="change"]')).toBeNull();
  expect(
    within(tile).getByText(`FY2024 / 2024-09-30 · Detail is in Evidence. · ${basis}`),
  ).toBeVisible();
  expect(tile).not.toHaveTextContent("Source S7");
});

it.each([
  {
    prior: "10K, restated",
    latest: "restated",
    visible: " · Detail is in Evidence.",
    compared: false,
  },
  {
    prior: "10K restated",
    latest: "restated",
    visible: " · Detail is in Evidence.",
    compared: false,
  },
  { prior: "10K; restated", latest: "restated", visible: " (restated)", compared: true },
  {
    prior: "10K increase, restated",
    latest: "10K increase, restated",
    visible: " (10K increase, restated)",
    compared: true,
  },
])(
  "distinguishes a filing locator from a period qualifier ($prior)",
  ({ prior, latest, visible, compared }) => {
    const basis = "Reported EBITDA / cash interest paid.";
    const input = coverInput([
      [`FY2024 / 2024-09-30 (${prior})`, "3", "x", basis],
      [`FY2025 / 2025-09-30 (${latest})`, "5", "x", basis],
    ]);
    render(<FoundationLead {...leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(tile.querySelector('[data-part="change"]')?.textContent ?? null).toBe(
      compared ? "FY2024 to FY2025: +2x, up, better" : null,
    );
    expect(Boolean(tile.querySelector('[data-part="link"]'))).toBe(compared);
    const qualifier = `FY2024 / 2024-09-30${visible}`;
    expect(within(tile).getByText(`${qualifier} · ${basis}`)).toBeVisible();
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    expect(within(tile).getByRole("row", { name: `${qualifier} 3 ${basis}` })).toBeVisible();
    if (!visible.includes("10K")) expect(tile).not.toHaveTextContent("10K");
  },
);
