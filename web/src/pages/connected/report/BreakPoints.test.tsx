import { fireEvent, render, screen, within } from "@testing-library/react";
import type { OutputEntry } from "../publishedReport";
import { BreakPoints, breakPointView } from "./BreakPoints";

function entry(heading: string, headers: string[], rows: string[][]): OutputEntry {
  return {
    output: { module: "CP-2A", id: "output", sha256: "hash", href: "output.md", label: "Downside" },
    selected: true,
    sections: [
      {
        heading,
        line: 1,
        level: 3,
        blocks: [
          {
            type: "table",
            line: 3,
            headers,
            rows: rows.map((cells, i) => ({ line: 5 + i, cells })),
          },
        ],
      },
    ],
  };
}

it("J3-016 gives the break-point decline one percentage form", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [["Cash flow reaches zero", "0.10 (10%)"]],
    ),
  );
  if (!data) throw new Error("Missing break-point fixture");
  render(<BreakPoints data={data} href={(line) => `#evidence/${String(line)}`} />);
  expect(screen.getByText("10%", { exact: true })).toBeInTheDocument();
  expect(screen.queryByText("0.10 (10%)", { exact: true })).toBeNull();
});

it("reads the canonical ranking's shares, drawing zero and keeping the original exact values", () => {
  const data = breakPointView(
    entry(
      "First-break ranking",
      ["Break point", "Required EBITDA decline"],
      [
        ["Cash flow reaches zero", "0.125000"],
        ["Cover already below watch level", "0"],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  const { container } = render(
    <BreakPoints data={data} href={(line) => `#evidence/0-${String(line)}`} />,
  );
  const chart = screen.getByRole("figure", { name: "EBITDA break points" });
  expect(within(chart).getAllByRole("listitem")[0]).toHaveTextContent(
    "Cover already below watch level",
  );
  expect(container.querySelector('[data-decline="0"]')).toHaveStyle({ width: "100%" });
  fireEvent.click(within(chart).getByRole("radio", { name: "Table" }));
  expect(within(chart).getByRole("cell", { name: "12.5%" })).toBeInTheDocument();
  expect(within(chart).getByRole("cell", { name: "0%" })).toBeInTheDocument();
  expect(within(chart).getAllByRole("link", { name: "Break point source" }).at(-1)).toHaveAttribute(
    "href",
    "#evidence/0-5",
  );
});

it("keeps incompatible spellings visible without plotting them", () => {
  const data = breakPointView(
    entry(
      "T2B.7 First-break ranking",
      ["Rank", "Break point", "Required EBITDA decline"],
      [
        ["Rank 1", "Cover falls to 1.25x", "0.10 (90%)"],
        ["Rank 2", "FCF reaches zero", "12.50%"],
        ["Rank 3", "Liquidity dries up", "Not calculated: facility terms missing"],
      ],
    ),
  );
  if (!data) throw new Error("ranking was rejected");
  const { container } = render(<BreakPoints data={data} href={() => "#evidence"} />);
  expect(container.querySelectorAll("[data-decline]")).toHaveLength(1);
  expect(screen.getByText("0.10 (90%)")).toBeInTheDocument();
  expect(screen.getByText("Not calculated: facility terms missing")).toBeInTheDocument();
});
