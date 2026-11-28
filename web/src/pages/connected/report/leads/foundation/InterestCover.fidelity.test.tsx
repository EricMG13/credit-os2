// Synthetic CP-1 cover and coverage-period tables. Expected values are written in the fixtures.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, section, table } from "../../overview/rows.fixture";
import { leadProps } from "../fixtures/load";
import { interestCover } from "./foundationData";
import { InterestCoverTile } from "./InterestCover";
import { PeriodsTile } from "./Periods";
import { periodStrip } from "./periodsData";

afterEach(cleanup);

const handoff = (rows: string[][]) =>
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

const cases = [
  {
    name: "the explicit reporting dates are fifteen months apart",
    later: "FY2025 / 2025-12-31",
    basis: "Reported EBITDA / net cash interest paid.",
  },
  {
    name: "the stated EBITDA definitions differ",
    later: "FY2025 / 2025-09-30",
    basis: "Adjusted EBITDA / net cash interest paid.",
  },
];

it.each(cases)("preserves cover without comparing when $name", ({ later, basis }) => {
  const earlier = "FY2024 / 2024-09-30";
  const earlierBasis = "Reported EBITDA / net cash interest paid.";
  const input = handoff([
    [earlier, "3", "x", earlierBasis],
    [later, "5", "x", basis],
  ]);
  render(<InterestCoverTile lead={leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  expect([...tile.querySelectorAll('[data-part="value"]')].map((node) => node.textContent)).toEqual(
    ["3x", "5x"],
  );
  expect(tile.querySelector('[data-part="change"]')).toBeNull();
  expect(tile.querySelector('[data-part="link"]')).toBeNull();
  expect(interestCover(input)?.change).toBeNull();
  expect(periodStrip(input).comparison).toBeNull();

  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  const coverTable = within(tile).getByRole("table");
  expect(
    within(coverTable).getByRole("row", { name: `${earlier} 3 ${earlierBasis}` }),
  ).toBeVisible();
  expect(within(coverTable).getByRole("row", { name: `${later} 5 ${basis}` })).toBeVisible();
});

it("recognizes the three cover figures, including explicitly suffixed multiples", () => {
  const input = handoff([
    ["FY2023", "3.1x", "x", "Reported EBITDA"],
    ["FY2024", "3.2", "x", "Reported EBITDA"],
    ["FY2025", "3.3x", "x", "Reported EBITDA"],
  ]);
  render(
    <>
      <InterestCoverTile lead={leadProps(input)} />
      <PeriodsTile lead={leadProps(input)} />
    </>,
  );
  const cover = screen.getByRole("region", { name: "Interest cover" });
  expect(
    [...cover.querySelectorAll('[data-part="value"]')].map((node) => node.textContent),
  ).toEqual(["3.1x", "3.2x", "3.3x"]);
  const tile = screen.getByRole("region", { name: "Periods" });
  expect(within(tile).getByText("Figures show FY2023, FY2024 and FY2025.")).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  expect(
    within(within(tile).getByRole("table")).getByRole("row", {
      name: "Interest cover Stated Stated Stated",
    }),
  ).toBeVisible();
});

it("does not label a pair compared when only one period has a stated cover number", () => {
  const input = handoff([
    ["FY2024", "3.2", "x", "Reported EBITDA"],
    ["FY2025", "Not supplied: cash interest absent", "x", "Reported EBITDA"],
  ]);
  render(<PeriodsTile lead={leadProps(input)} />);
  const tile = screen.getByRole("region", { name: "Periods" });
  expect(tile.querySelector("[data-comparison]")).toBeNull();
  expect(within(tile).getByText("Figures show FY2024.")).toBeVisible();
  expect(tile).toHaveTextContent("Not supplied: cash interest absent");
});

it.each([
  { laterDefinition: "Adjusted EBITDA", compared: false },
  { laterDefinition: "Reported EBITDA", compared: true },
])(
  "compares the stated basis before redaction for $laterDefinition",
  ({ laterDefinition, compared }) => {
    const input = handoff([
      ["FY2024", "3", "x", "Reported EBITDA per the annual report"],
      ["FY2025", "5", "x", `${laterDefinition} per the annual report`],
    ]);
    render(<InterestCoverTile lead={leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(
      [...tile.querySelectorAll('[data-part="value"]')].map((node) => node.textContent),
    ).toEqual(["3x", "5x"]);
    expect(interestCover(input)?.change?.text ?? null).toBe(compared ? "2" : null);
    expect(tile.querySelector('[data-part="change"]')?.textContent ?? null).toBe(
      compared ? "FY2024 to FY2025: +2x, up, better" : null,
    );
    expect(tile.querySelectorAll('[data-part="link"]')).toHaveLength(compared ? 1 : 0);
    expect(within(tile).getByRole("link", { name: /Source for interest cover/ })).toBeVisible();

    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const coverTable = within(tile).getByRole("table");
    expect(
      within(coverTable).getByRole("row", { name: "FY2024 3 Detail is in Evidence." }),
    ).toBeVisible();
    expect(
      within(coverTable).getByRole("row", { name: "FY2025 5 Detail is in Evidence." }),
    ).toBeVisible();
    expect(tile).not.toHaveTextContent("per the annual report");
  },
);

it.each([
  {
    name: "a generic source clause precedes different explicit bases",
    prior: "Annual report EBITDA reconciliation; Reported EBITDA / cash interest.",
    latest: "Annual report EBITDA reconciliation; Adjusted EBITDA / cash interest.",
    shownPrior: "Reported EBITDA / cash interest.",
    shownLatest: "Adjusted EBITDA / cash interest.",
    compared: false,
  },
  {
    name: "the same definition follows the generic source clause in both forms",
    prior: "Annual report EBITDA reconciliation; Reported EBITDA / cash interest.",
    latest: "Annual report EBITDA reconciliation; EBITDA (Reported) / cash interest.",
    shownPrior: "Reported EBITDA / cash interest.",
    shownLatest: "EBITDA (Reported) / cash interest.",
    compared: true,
  },
  {
    name: "the earlier cell names conflicting definitions",
    prior: "Reported EBITDA or Adjusted EBITDA / cash interest.",
    latest: "Reported EBITDA / cash interest.",
    shownPrior: "Reported EBITDA or Adjusted EBITDA / cash interest.",
    shownLatest: "Reported EBITDA / cash interest.",
    compared: false,
  },
  {
    name: "the later cell names conflicting definitions",
    prior: "Reported EBITDA / cash interest.",
    latest: "Reported EBITDA or EBITDA As Defined / cash interest.",
    shownPrior: "Reported EBITDA / cash interest.",
    shownLatest: "Reported EBITDA or EBITDA As Defined / cash interest.",
    compared: false,
  },
  {
    name: "a cell repeats the same explicit basis in different forms",
    prior: "Reported EBITDA / cash interest. EBITDA (Reported) is the numerator.",
    latest: "Reported EBITDA / cash interest.",
    shownPrior: "Reported EBITDA / cash interest. EBITDA (Reported) is the numerator.",
    shownLatest: "Reported EBITDA / cash interest.",
    compared: true,
  },
  {
    name: "one basis names only generic EBITDA",
    prior: "EBITDA / cash interest.",
    latest: "Reported EBITDA / cash interest.",
    shownPrior: "EBITDA / cash interest.",
    shownLatest: "Reported EBITDA / cash interest.",
    compared: true,
  },
])(
  "uses the actual cover basis when $name",
  ({ prior, latest, shownPrior, shownLatest, compared }) => {
    const earlierPeriod = "FY2024 / 2024-09-30";
    const laterPeriod = "FY2025 / 2025-09-30";
    const input = handoff([
      [earlierPeriod, "3", "x", prior],
      [laterPeriod, "5", "x", latest],
    ]);
    render(
      <>
        <InterestCoverTile lead={leadProps(input)} />
        <PeriodsTile lead={leadProps(input)} />
      </>,
    );
    const cover = screen.getByRole("region", { name: "Interest cover" });
    expect(
      [...cover.querySelectorAll('[data-part="value"]')].map((node) => node.textContent),
    ).toEqual(["3x", "5x"]);
    expect(cover.querySelector('[data-part="change"]')?.textContent ?? null).toBe(
      compared ? "FY2024 to FY2025: +2x, up, better" : null,
    );
    expect(cover.querySelectorAll('[data-part="link"]')).toHaveLength(compared ? 1 : 0);
    const periods = screen.getByRole("region", { name: "Periods" });
    expect(Boolean(periods.querySelector("[data-comparison]"))).toBe(compared);
    expect(within(periods).getByText("Figures show FY2024 and FY2025.")).toBeVisible();
    expect(within(cover).getByRole("link", { name: /Source for interest cover/ })).toBeVisible();

    fireEvent.click(within(cover).getByRole("button", { name: /Table view/ }));
    const coverTable = within(cover).getByRole("table");
    const priorLabel = compared ? "FY2024" : earlierPeriod;
    const latestLabel = compared ? "FY2025" : laterPeriod;
    expect(
      within(coverTable).getByRole("row", { name: `${priorLabel} 3 ${shownPrior}` }),
    ).toBeVisible();
    expect(
      within(coverTable).getByRole("row", { name: `${latestLabel} 5 ${shownLatest}` }),
    ).toBeVisible();
    expect(cover).not.toHaveTextContent("Annual report EBITDA reconciliation");
  },
);
