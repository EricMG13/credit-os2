import { fireEvent, render, screen, within } from "@testing-library/react";
import type { OutputEntry, Section } from "../publishedReport";
import { MacroSensitivity, macroView } from "./MacroSensitivity";

function table(heading: string, headers: string[], rows: string[][], line: number): Section {
  return {
    heading,
    level: 3,
    line,
    blocks: [
      {
        type: "table",
        line: line + 1,
        headers,
        rows: rows.map((cells, i) => ({ line: line + 3 + i, cells })),
      },
    ],
  };
}

function dataset(currency: string, net: string): OutputEntry {
  return {
    output: { module: "CP-2E", id: "test", label: "Rates", sha256: "hash", href: "rates.md" },
    selected: true,
    sections: [
      table(
        "Sourced operands",
        ["Operand", "Value", "Basis"],
        [["Reporting currency", currency, "Filing p.1"]],
        1,
      ),
      table(
        "Interest rate shock",
        [
          "Shock",
          "Rate shock",
          "Added annual interest before hedges",
          "Added annual interest after hedges",
          "Cash interest after the shock",
          "Interest coverage after the shock",
          "Change in interest coverage",
          "Free cash flow after the shock",
          "Added interest as share of EBITDA",
        ],
        [["Reference rate up, first shock", "100", "USD 8.00m", net, "", "", "", "", ""]],
        10,
      ),
    ],
  };
}

// Review 3, P9: fewer than three steps is a figure, not a chart: the stated figures in words.
it("draws one step as stated figures, its verified zero after hedging kept", () => {
  const data = macroView(dataset("USD", "0.00"));
  if (!data) throw new Error("scenario was rejected");
  render(<MacroSensitivity data={data} href={(line) => `#evidence/1-${String(line)}`} />);
  const tile = screen.getByRole("region", { name: "Added annual interest" });
  expect(within(tile).queryByRole("img")).toBeNull();
  const steps = within(tile).getByRole("list", { name: "Added annual interest by rate shock" });
  const [step] = within(steps).getAllByRole("listitem");
  if (!step) throw new Error("step missing");
  expect(within(step).getByText("+100 bp")).toBeVisible();
  expect(within(step).getByText("USD 8.00m")).toBeVisible();
  // A stated zero is a figure, never a gap.
  expect(within(step).getByText("0.00")).toBeVisible();
  expect(within(step).queryByText(/Not supplied|Not stated/)).toBeNull();
  expect(within(step).getByRole("link", { name: "Source for +100 bp" })).toHaveAttribute(
    "href",
    "#evidence/1-13",
  );
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "0.00" })).toBeInTheDocument();
  expect(
    within(tile)
      .getAllByRole("link", { name: /^Source for / })
      .at(-1),
  ).toHaveAttribute("href", "#evidence/1-13");
});

const steps = (rows: string[][]) => {
  const made = dataset("USD", "0.00");
  const rate = made.sections[1]?.blocks[0];
  if (rate?.type !== "table") throw new Error("rate table missing");
  rate.rows = rows.map((cells, at) => ({ line: 13 + at, cells: [...cells, "", "", "", "", ""] }));
  return made;
};

it("draws three or more steps as the ladder, a stated zero after hedges marked", () => {
  const data = macroView(
    steps([
      ["Reference rate up, first shock", "100", "8.00", "0.00"],
      ["Reference rate up, second shock", "200", "16.00", "4.00"],
      ["Reference rate up, third shock", "300", "24.00", "8.00"],
    ]),
  );
  if (!data) throw new Error("scenario was rejected");
  const { container } = render(<MacroSensitivity data={data} href={() => "#evidence/1"} />);
  expect(container.querySelector('[data-zero][data-case="After hedges"]')).toBeInTheDocument();
  const tile = screen.getByRole("region", { name: "Added annual interest" });
  expect(within(tile).getByRole("img")).toHaveAccessibleName(
    /\+100 bp: before hedges 8\.00, after hedges 0\.00; \+200 bp: before hedges 16\.00/,
  );
  // The table states the currency and no magnitude: the unit is printed as stated.
  expect(within(tile).getByText("USD")).toBeVisible();
  expect(tile.textContent).not.toMatch(/US\$m|\$m|million/);
});

it.each([
  ["USD", "EUR 5.00m"],
  ["Unspecified", "5.00"],
])(
  "keeps mismatched or unsupported currency data in the source table (%s, %s)",
  (currency, net) => {
    const data = macroView(dataset(currency, net));
    if (!data) throw new Error("scenario was rejected");
    render(<MacroSensitivity data={data} href={() => "#evidence"} />);
    const tile = screen.getByRole("region", { name: "Added annual interest" });
    expect(within(tile).queryByRole("img")).toBeNull();
    expect(
      within(tile).getByText(
        "This page could not read comparable added annual interest for each rate shock.",
      ),
    ).toBeVisible();
    fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
    expect(within(tile).getByRole("cell", { name: net })).toBeInTheDocument();
  },
);

function fxDataset(moves: string[]): OutputEntry {
  const ordinal = ["first", "second", "third"];
  const base = dataset("USD", "5.00");
  base.sections = [
    base.sections[0] as Section,
    table(
      "Currency shock",
      [
        "Shock",
        "Currency move",
        "Change in debt",
        "Total debt after the move",
        "Change in EBITDA",
        "Total leverage after the move",
      ],
      moves.map((move, i) => [
        `Foreign currency strengthens, ${ordinal[i] ?? ""} move`,
        move,
        "0.00",
        String(800 + i),
        String(2 + i),
        `${String(3 + i / 100)}x`,
      ]),
      20,
    ),
  ];
  return base;
}

function drawFx(moves: string[]) {
  const data = macroView(fxDataset(moves));
  if (!data) throw new Error("scenario was rejected");
  render(<MacroSensitivity data={data} href={(line) => `#evidence/1-${String(line)}`} />);
}

const moveHeads = (figure: HTMLElement) =>
  [...figure.querySelectorAll("thead th")].map((item) => item.textContent);

it("draws every stated move in one compact table, each measure's cells as written", () => {
  drawFx(["5%", "10%"]);
  const tile = screen.getByRole("region", { name: "Foreign-currency strengthening" });
  // No selector with one option: both moves are columns of the one table.
  expect(within(tile).queryByRole("group", { name: /Compare with/ })).toBeNull();
  const figure = within(tile).getByRole("table", {
    name: "Foreign-currency strengthening, by currency move",
  });
  expect(moveHeads(figure)).toEqual(["5%", "10%"]);
  const debt = within(figure)
    .getByText(/^Total debt after the move/)
    .closest("tbody") as HTMLElement;
  expect(within(debt).getByText("800")).toBeInTheDocument();
  expect(within(debt).getByText("801")).toBeInTheDocument();
  expect(within(figure).getByText("Total leverage after the move (x)")).toBeInTheDocument();
  // The cells state no magnitude: the currency alone, as the handoff states it.
  expect(within(figure).getByText("Total debt after the move (USD)")).toBeInTheDocument();
  expect(tile.textContent).not.toMatch(/US\$m|\$m|million/);
  expect(within(figure).getAllByText("0.00")).toHaveLength(2);
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "3.01x" })).toBeVisible();
});

// Review 4, Q7: a measure whose moves differ by under a tenth of its scale is figures only.
it("draws no bars for a measure whose range across moves is under a tenth of its scale", () => {
  drawFx(["5%", "10%"]);
  const figure = within(
    screen.getByRole("region", { name: "Foreign-currency strengthening" }),
  ).getByRole("table");
  const measure = (name: RegExp) => within(figure).getByText(name).closest("tbody") as HTMLElement;
  // 800 and 801: range 1 against a scale of 801, so no bars, the figures as written.
  const debt = measure(/^Total debt after the move/);
  expect(debt.querySelectorAll("[data-bar-cell]")).toHaveLength(0);
  expect(within(debt).getByText("801")).toBeInTheDocument();
  // 3.00x and 3.01x: no bars either.
  const leverage = measure(/^Total leverage after the move/);
  expect(leverage.querySelectorAll("[data-bar-cell]")).toHaveLength(0);
  expect(within(leverage).getByText("3.01x")).toBeInTheDocument();
  // 2 and 3: range 1 against a scale of 3, so each figure keeps its bar.
  const ebitda = measure(/^Change in EBITDA/);
  expect(ebitda.querySelectorAll("[data-bar-cell]")).toHaveLength(2);
});

it("keeps the after-hedges word on the same line as its gap chip", () => {
  const data = macroView(
    steps([
      ["Reference rate up, first shock", "100", "8.00", "0.00"],
      [
        "Reference rate up, second shock",
        "200",
        "16.00",
        "Not supplied: no hedge sensitivity retained",
      ],
      ["Reference rate up, third shock", "300", "24.00", "8.00"],
    ]),
  );
  if (!data) throw new Error("scenario was rejected");
  render(<MacroSensitivity data={data} href={() => "#evidence/1"} />);
  const tile = screen.getByRole("region", { name: "Added annual interest" });
  const chip = within(tile).getByText("Not supplied");
  // The word and the chip share one unbreakable group; the reason may wrap after them.
  const group = chip.closest("[data-after]") as HTMLElement;
  expect(group).toHaveClass("whitespace-nowrap");
  expect(within(group).getByText("after")).toBeInTheDocument();
  expect(within(tile).getByText("No hedge sensitivity retained")).toBeInTheDocument();
  expect(group).not.toHaveTextContent("No hedge sensitivity retained");
});

it("draws a third move as a third column, never behind a selector", () => {
  drawFx(["5%", "10%", "15%"]);
  const tile = screen.getByRole("region", { name: "Foreign-currency strengthening" });
  expect(within(tile).queryByRole("group", { name: /Compare with/ })).toBeNull();
  const figure = within(tile).getByRole("table");
  expect(moveHeads(figure)).toEqual(["5%", "10%", "15%"]);
  expect(within(figure).getByText("802")).toBeInTheDocument();
});

it("says it could not read the moves when two read alike, and keeps the table", () => {
  drawFx(["5%", "5%"]);
  const tile = screen.getByRole("region", { name: "Foreign-currency strengthening" });
  expect(
    within(tile).getByText("This page could not read two or more distinct currency moves."),
  ).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getAllByRole("cell", { name: "5%" })).toHaveLength(2);
});
