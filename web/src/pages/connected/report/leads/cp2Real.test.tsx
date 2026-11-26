// Verbatim excerpts of a real CP-1 leverage table and a real CP-4 covenant table (offline replay of
// an issuer run). Expected text is typed from that handoff.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { CreditLead } from "./cp2";
import { leadProps, tableSection } from "./lead.fixture";

afterEach(cleanup);

const cp1 = () =>
  entry(
    "CP-1",
    [],
    [
      tableSection(
        "Chart data: leverage",
        table(
          377,
          [
            "Period",
            "Total debt / EBITDA",
            "Net debt / EBITDA",
            "Reporting unit",
            "Basis and limitation",
          ],
          [
            [
              "FY2024 / 2024-09-30",
              "6.53",
              "4.88",
              "x",
              "Carrying-value debt over reported EBITDA; net figure before the 2024-10-18 dividend payment (pro forma 6.02)",
            ],
            [
              "FY2023 / 2023-09-30",
              "6.27",
              "5.17",
              "x",
              "Carrying-value debt over reported EBITDA",
            ],
          ],
        ),
      ),
    ],
  );

it("shows the total and net leverage together with the note the module wrote for that row", () => {
  render(<CreditLead {...leadProps(entry("CP-2", [], []), [cp1()])} />);
  const tile = screen.getByRole("region", { name: "Leverage, cover and headroom" });
  const stat = within(tile).getByText("Total debt / EBITDA").closest("div") as HTMLElement;
  expect(within(stat).getAllByText("6.53x")[0]).toBeVisible();
  // The note speaks of the net figure, so the net figure it describes is on the card.
  expect(stat).toHaveTextContent("Net debt / EBITDA 4.88x");
  expect(
    within(stat).getByText(
      "Carrying-value debt over reported EBITDA; net figure before the 2024-10-18 dividend payment (pro forma 6.02)",
    ),
  ).toBeVisible();
});

it("prints the covenant condition once, not under the bullet and again as a caption", () => {
  const cp4 = entry(
    "CP-4",
    [
      {
        title: "Covenant headroom",
        table: 80,
        label: 0,
        threshold: 1,
        current: 2,
        headroom: 3,
        direction: 4,
      },
    ],
    [
      tableSection(
        "Chart data: covenant headroom",
        table(
          80,
          [
            "Test",
            "Threshold",
            "Current",
            "Headroom",
            "Direction",
            "Reporting unit",
            "Basis and limitation",
          ],
          [
            [
              "Ordinary springing maintenance",
              "7.50",
              "Not supplied: certified maintenance ratio",
              "Not calculable: current tested ratio missing",
              "Passes at or below",
              "x",
              "d887611dex101.htm.jsonl, page 188; exposure must exceed 40%; acquisition alternative not assumed",
            ],
            [
              "Acquisition-quarter maintenance alternative",
              "8.00",
              "Not supplied: acquisition qualification and tested ratio",
              "Not calculable: current tested ratio missing",
              "Passes at or below",
              "x",
              "d887611dex101.htm.jsonl, page 188; first four fiscal quarters after Material Acquisition only",
            ],
          ],
        ),
      ),
    ],
  );
  render(<CreditLead {...leadProps(entry("CP-2", [], []), [cp4])} />);
  // The bullet's screen-reader reading carries the condition inside a longer sentence; the visible
  // text is one element that is exactly the condition.
  expect(
    screen.getAllByText("exposure must exceed 40%; acquisition alternative not assumed"),
  ).toHaveLength(1);
});

// The whole replayed TDG CP-2 handoff (fixtures/cp2_tdg_replay.md): it writes a "Strengths and
// weaknesses" passage, which the module frame draws under that title; the lead's ranked ledger of the
// same drivers carries its own title, so the page does not show the heading twice.
it("does not title the ranked ledger like the module's own written passage", async () => {
  const { fixtureEntry } = await import("./markdown.fixture");
  const path = await import("node:path");
  const read = fixtureEntry(
    "CP-2",
    path.resolve(import.meta.dirname, "fixtures", "cp2_tdg_replay.md"),
  );
  render(<CreditLead {...leadProps(read)} />);
  expect(screen.queryByRole("region", { name: "Strengths and weaknesses" })).toBeNull();
  expect(screen.getByRole("region", { name: "Ranked strengths and weaknesses" })).toBeVisible();
});
