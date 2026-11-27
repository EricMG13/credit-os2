import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
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

const RATE_HEADS = [
  "Shock",
  "Rate shock",
  "Added annual interest before hedges",
  "Added annual interest after hedges",
  "Cash interest after the shock",
  "Interest coverage after the shock",
  "Change in interest coverage",
  "Free cash flow after the shock",
  "Added interest as share of EBITDA",
];

function ladder(rows: string[][]): OutputEntry {
  return {
    output: { module: "CP-2E", id: "test", label: "Rates", sha256: "hash", href: "rates.md" },
    selected: true,
    sections: [
      table(
        "Sourced operands",
        ["Operand", "Value", "Basis"],
        [["Reporting currency", "USD", "Filing p.1"]],
        1,
      ),
      table(
        "Interest rate shock",
        RATE_HEADS,
        rows.map((cells) => [...cells, "", "", "", "", ""]),
        10,
      ),
    ],
  };
}

function drawLadder(rows: string[][]) {
  const data = macroView(ladder(rows));
  if (!data) throw new Error("scenario was rejected");
  render(<MacroSensitivity data={data} href={() => "#evidence/1"} />);
  return screen.getByRole("region", { name: "Added annual interest" });
}

const names = ["first", "second", "third"];
const shocks = (gross: string[], net: string[]) =>
  gross.map((value, at) => [
    `Reference rate up, ${names[at] ?? ""} shock`,
    String((at + 1) * 100),
    value,
    net[at] ?? "",
  ]);

it("C8-3: a ladder whose cells write USD 8.00m is labelled $m, not the bare currency", () => {
  const tile = drawLadder(
    shocks(["USD 8.00m", "USD 16.00m", "USD 24.00m"], ["USD 0.00m", "USD 4.00m", "USD 8.00m"]),
  );
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/in \$m: /);
  expect(within(tile).getByText("$m")).toBeVisible();
});

it("C8-3: USD 8.00 million is recognised too", () => {
  const tile = drawLadder(
    shocks(
      ["USD 8.00 million", "USD 16.00 million", "USD 24.00 million"],
      ["USD 0.00 million", "USD 4.00 million", "USD 8.00 million"],
    ),
  );
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/in \$m: /);
});

it("C8-3: cells with no magnitude keep the currency", () => {
  const tile = drawLadder(shocks(["8.00", "16.00", "24.00"], ["0.00", "4.00", "8.00"]));
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/in USD: /);
});

it("C8-4: the ladder's accessible name carries the drawn text of a source-citing cell", () => {
  const tile = drawLadder(
    shocks(
      ["8.00", "16.00", "24.00"],
      ["Not supplied: see funding-agreement.pdf p.12", "4.00", "8.00"],
    ),
  );
  const name = within(tile).getByRole("img").getAttribute("aria-label") ?? "";
  expect(name).not.toMatch(/funding-agreement\.pdf|p\.12/);
  expect(name).toMatch(/\+100 bp: before hedges 8\.00, after hedges /);
});

it("C8-3: FX measure labels read $m when every cell writes USD 12.00m", () => {
  const base = ladder([]);
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
      ["first", "second"].map((word, at) => [
        `Foreign currency strengthens, ${word} move`,
        `${String((at + 1) * 5)}%`,
        "USD 1.00m",
        `USD ${String(800 + at)}.00m`,
        `USD ${String(2 + at)}.00m`,
        `${String(3 + at / 100)}x`,
      ]),
      20,
    ),
  ];
  const data = macroView(base);
  if (!data) throw new Error("scenario was rejected");
  render(<MacroSensitivity data={data} href={() => "#evidence/1"} />);
  const tile = screen.getByRole("region", { name: "Foreign-currency strengthening" });
  expect(tile.textContent).toContain("Total debt after the move ($m)");
});
