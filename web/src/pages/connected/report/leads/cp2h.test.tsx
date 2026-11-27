import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { RatingsLead } from "./cp2h";
import { bottomLine, leadProps, tableSection } from "./lead.fixture";

afterEach(cleanup);

// No CP-2H handoff is retained: both tables are built from the contract (chart-data header and T2R.1 columns).
const TRIGGERS = [
  "Agency",
  "Trigger",
  "Threshold",
  "Current",
  "Direction",
  "Reporting unit",
  "Basis and limitation",
];
const REGISTER = [
  "agency",
  "issuer/instrument",
  "rating",
  "outlook/watch",
  "effective date",
  "source",
  "locator",
  "status",
];

function ratings(options: { triggers?: string[][]; register?: string[][]; gap?: string } = {}) {
  const made = entry(
    "CP-2H",
    options.triggers
      ? [
          {
            title: "Rating triggers",
            table: 5,
            label: [0, 1],
            threshold: 2,
            current: 3,
            direction: 4,
          },
        ]
      : [],
    [
      ...(options.triggers
        ? [tableSection("Chart data: rating triggers", table(5, TRIGGERS, options.triggers))]
        : []),
      ...(options.register
        ? [
            {
              heading: "T2R.1 Rating evidence register",
              level: 4,
              line: 29,
              blocks: [table(30, REGISTER, options.register)],
            },
          ]
        : []),
    ],
  );
  if (options.gap)
    made.output.chartGaps = [{ title: "Rating triggers", table: 5, gap: options.gap }];
  return made;
}

const TRIGGER_ROWS = [
  ["Synthetic Agency A", "Net leverage", "6.5", "6.1", "Passes at or below", "x", "Synthetic."],
  [
    "Synthetic Agency A",
    "Interest cover",
    "Not supplied: cover not split",
    "3.2",
    "Passes at or above",
    "x",
    "Synthetic.",
  ],
  ["Synthetic Agency B", "FFO / debt", "10", "12", "Passes at or above", "%", "Synthetic."],
];
const REGISTER_ROWS = [
  [
    "Synthetic Agency A",
    "Synthetic Issuer",
    "BB-",
    "Negative watch",
    "2025-06-30",
    "Release",
    "p.1",
    "Current",
  ],
  [
    "Synthetic Agency B",
    "Synthetic Notes",
    "Ba3",
    "Stable",
    "2025-05-01",
    "Release",
    "p.2",
    "Current",
  ],
];

it("groups the trigger bullets by agency with each value as written, and gives a table view", () => {
  render(<RatingsLead {...leadProps(ratings({ triggers: TRIGGER_ROWS }))} />);
  const tile = screen.getByRole("region", { name: "Rating triggers" });
  const groupA = within(tile).getByRole("group", { name: "Synthetic Agency A" });
  expect(within(groupA).getByText("Net leverage")).toBeVisible();
  expect(
    within(groupA).getByRole("img", { name: /Net leverage: 6.1x against a threshold of 6.5x/ }),
  ).toBeVisible();
  expect(within(groupA).getByText("Passes at or below")).toBeVisible();
  expect(within(tile).getByRole("group", { name: "Synthetic Agency B" })).toBeVisible();
  expect(within(groupA).getAllByRole("link", { name: /Source for/ })[0]).toHaveAttribute(
    "href",
    expect.stringContaining("#evidence/"),
  );
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getAllByRole("cell", { name: "Passes at or above" })[0]).toBeVisible();
});

// Colour-signal-build ruling R1: CP-2H's bullets stay blue (its file is not part of that build).
it("keeps the trigger bars in the primary blue", () => {
  const { container } = render(<RatingsLead {...leadProps(ratings({ triggers: TRIGGER_ROWS }))} />);
  const bars = container.querySelectorAll("[data-threshold]");
  expect(bars.length).toBeGreaterThan(0);
  for (const bar of bars) expect(bar.previousElementSibling).toHaveClass("bg-chart-1");
});

it("gives the reason, not a bar or a zero, for a trigger the module did not supply", () => {
  render(<RatingsLead {...leadProps(ratings({ triggers: TRIGGER_ROWS }))} />);
  const groupA = within(screen.getByRole("region", { name: "Rating triggers" })).getByRole(
    "group",
    {
      name: "Synthetic Agency A",
    },
  );
  expect(within(groupA).getByText("Interest cover")).toBeVisible();
  expect(within(groupA).getByText("Cover not split")).toBeVisible();
  expect(within(groupA).getAllByRole("img")).toHaveLength(1);
  expect(within(groupA).queryByText("0")).toBeNull();
});

it("draws the rating register as written, with outlook as a word", () => {
  render(
    <RatingsLead {...leadProps(ratings({ triggers: TRIGGER_ROWS, register: REGISTER_ROWS }))} />,
  );
  const tile = screen.getByRole("region", { name: "Rating register" });
  expect(within(tile).getByText("BB-")).toBeVisible();
  expect(within(tile).getByText("Negative watch")).toBeVisible();
  expect(within(tile).getByText("Synthetic Issuer")).toBeVisible();
  expect(within(tile).getByText("Ba3")).toBeVisible();
  // One trace per register row, and the figure's own.
  expect(within(tile).getAllByRole("link", { name: /Source for Synthetic/ })).toHaveLength(2);
  expect(within(tile).getByRole("link", { name: "Source for Rating register" })).toBeVisible();
});

it("says why when the triggers are a stated gap or the tables are absent", () => {
  render(<RatingsLead {...leadProps(ratings({ gap: "no agency trigger stated" }))} />);
  // A chart the module declared undrawn is stated once, with its reason, in the module's limitations
  // (the frame; see cp2hReal.test.tsx): the lead does not state it again.
  expect(screen.queryByRole("region", { name: "Rating triggers" })).toBeNull();
  const register = screen.getByRole("region", { name: "Rating register" });
  expect(within(register).getByText("This page could not read the rating history.")).toBeVisible();
  expect(register.textContent).not.toMatch(/Built from the module's contract/);
  cleanup();
  render(<RatingsLead {...leadProps(ratings())} />);
  expect(
    within(screen.getByRole("region", { name: "Rating triggers" })).getByText(
      "This page could not read rating triggers.",
    ),
  ).toBeVisible();
});

it("draws nothing for a blocked module", () => {
  const { container } = render(
    <RatingsLead
      {...leadProps(
        entry("CP-2H", [], bottomLine("Not assessable: no agency rating was supplied.")),
      )}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("shows an empty trigger cell as missing in the table view, not a crash", () => {
  render(
    <RatingsLead
      {...leadProps(
        ratings({
          triggers: [["Synthetic Agency A", "Net leverage", "6.5", "6.1", "", "x", "Synthetic."]],
        }),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Rating triggers" });
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("row", { name: /^Net leverage/ })).toBeVisible();
});

it("draws a trigger's texts without source references and names a register row without an agency", () => {
  render(
    <RatingsLead
      {...leadProps(
        ratings({
          triggers: [
            [
              "Synthetic Agency A",
              "Leverage per rating_report.pdf p. 2",
              "6.5",
              "6.1",
              "Per CP-2 view",
              "x",
              "Synthetic.",
            ],
          ],
          register: [
            ["", "Synthetic Issuer", "BB-", "Stable", "2025-06-30", "Release", "p.1", "Current"],
          ],
        }),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Rating triggers" });
  expect(tile.textContent).not.toMatch(/rating_report|CP-2/);
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(tile.textContent).not.toMatch(/rating_report|CP-2/);
  const register = screen.getByRole("region", { name: "Rating register" });
  expect(within(register).getByRole("link", { name: "Source for Row 1" })).toBeVisible();
});

it("keeps each trigger's unit and basis in the table view, and one shared basis under the figure", () => {
  render(<RatingsLead {...leadProps(ratings({ triggers: TRIGGER_ROWS }))} />);
  const tile = screen.getByRole("region", { name: "Rating triggers" });
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(/^Rating triggers$/);
  expect(within(tile).getByText("Synthetic.")).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  const row = within(tile).getByRole("row", { name: /^FFO \/ debt/ });
  expect(
    within(row)
      .getAllByRole("cell")
      .map((item) => item.textContent)
      .slice(0, 6),
  ).toEqual(["Synthetic Agency B", "10%", "12%", "Passes at or above", "%", "Synthetic."]);
});

// Review 3, P4: a cell that already carries its unit prints as written; a bare number takes it.
it("prints a trigger cell with its unit once: 12%, (12.3x), 5.0x", () => {
  render(
    <RatingsLead
      {...leadProps(
        ratings({
          triggers: [
            [
              "Synthetic Agency A",
              "Net leverage",
              "5.0x",
              "(12.3)",
              "Passes at or below",
              "x",
              "S.",
            ],
            ["Synthetic Agency B", "FFO / debt", "12%", "15", "Passes at or above", "%", "S."],
          ],
        }),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Rating triggers" });
  expect(
    within(tile).getByRole("img", {
      name: /Net leverage: \(12\.3x\) against a threshold of 5\.0x\./,
    }),
  ).toBeVisible();
  expect(
    within(tile).getByRole("img", { name: /FFO \/ debt: 15% against a threshold of 12%\./ }),
  ).toBeVisible();
  expect(tile.textContent).not.toMatch(/%%|\)x|xx/);
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  const leverage = within(tile).getByRole("row", { name: /^Net leverage/ });
  expect(
    within(leverage)
      .getAllByRole("cell")
      .map((item) => item.textContent)
      .slice(0, 3),
  ).toEqual(["Synthetic Agency A", "5.0x", "(12.3x)"]);
  const ffo = within(tile).getByRole("row", { name: /^FFO/ });
  expect(within(ffo).getAllByRole("cell")[1]).toHaveTextContent(/^12%$/);
});

// Review 3, P1: a superseded rating must not read as in force: every column of the register is drawn.
it("draws each rating's effective date and status beside it, and every column in the table view", () => {
  render(
    <RatingsLead
      {...leadProps(
        ratings({
          register: [
            [
              "Fitch",
              "Senior notes",
              "B+",
              "Rating Watch Positive",
              "2025-01-15",
              "Release",
              "p.1",
              "Superseded",
            ],
            ...REGISTER_ROWS,
          ],
        }),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Rating register" });
  const [fitch] = within(within(tile).getByRole("list", { name: "Rating register" })).getAllByRole(
    "listitem",
  );
  if (!fitch) throw new Error("register row missing");
  expect(within(fitch).getByText("B+")).toBeVisible();
  expect(within(fitch).getByText("Superseded")).toBeVisible();
  expect(within(fitch).getByText("2025-01-15")).toBeVisible();
  expect(within(fitch).getByText("Rating Watch Positive")).toBeVisible();
  expect(within(fitch).getByText("Senior notes")).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  const row = within(tile).getByRole("row", { name: /^Fitch/ });
  expect(
    within(row)
      .getAllByRole("cell")
      .map((item) => item.textContent)
      .slice(0, 5),
  ).toEqual(["Senior notes", "B+", "Rating Watch Positive", "2025-01-15", "Superseded"]);
  expect(tile.textContent).not.toMatch(/p\.1|Release/);
});

// Review 4, Q3(b): agency groups read as headings, with the agency's rating and outlook beside them.
it("heads each agency's triggers with a heading and its rating and outlook from the register", () => {
  render(
    <RatingsLead {...leadProps(ratings({ triggers: TRIGGER_ROWS, register: REGISTER_ROWS }))} />,
  );
  const tile = screen.getByRole("region", { name: "Rating triggers" });
  const groupA = within(tile).getByRole("group", { name: "Synthetic Agency A" });
  const heading = within(groupA).getByRole("heading", { level: 4, name: "Synthetic Agency A" });
  // A heading style distinct from the test names, a hairline above the group.
  expect(heading).toHaveClass("text-h4");
  expect(within(groupA).getByText("Net leverage")).not.toHaveClass("text-h4");
  expect(groupA).toHaveClass("border-t", "border-border-hairline");
  const chip = within(groupA).getByText("BB- · Negative watch");
  expect(heading.parentElement).toContainElement(chip);
  // The bullets sit beneath the heading.
  expect(within(groupA).getByRole("list", { name: "Synthetic Agency A triggers" })).toBeVisible();
  const groupB = within(tile).getByRole("group", { name: "Synthetic Agency B" });
  expect(within(groupB).getByText("Ba3 · Stable")).toBeVisible();
  // Review 4, Q5: the ratings stack in the column beside the triggers.
  const register = screen.getByRole("region", { name: "Rating register" });
  expect(register.parentElement).toHaveClass("lg:col-span-4", "flex-col");
});

it("draws no rating chip where the register states none for the agency, nor a superseded one", () => {
  render(
    <RatingsLead
      {...leadProps(
        ratings({
          triggers: TRIGGER_ROWS,
          register: [
            [
              "Synthetic Agency A",
              "Synthetic Issuer",
              "B+",
              "Stable",
              "2024-01-15",
              "Release",
              "p.1",
              "Superseded",
            ],
            [
              "Synthetic Agency A",
              "Synthetic Issuer",
              "BB-",
              "",
              "2025-06-30",
              "Release",
              "p.2",
              "Current",
            ],
          ],
        }),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Rating triggers" });
  const groupA = within(tile).getByRole("group", { name: "Synthetic Agency A" });
  expect(within(groupA).getByText("BB-")).toBeVisible();
  expect(within(groupA).queryByText(/B\+/)).toBeNull();
  const groupB = within(tile).getByRole("group", { name: "Synthetic Agency B" });
  expect(groupB.querySelectorAll("[data-rating]")).toHaveLength(0);
});
