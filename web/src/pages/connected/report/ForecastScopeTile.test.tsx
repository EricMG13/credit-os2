import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PublishedModelTile, ScopeTile } from "./ForecastScopeTile";

const MODEL = "d5c93ecb";

afterEach(() => {
  vi.unstubAllGlobals();
});

function tiles(files: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(files) })),
  );
  const model = {
    id: MODEL,
    cashflow: { notes: ["Base case is a conditional illustration."] },
  } as never;
  render(
    <>
      <ScopeTile model={model} register={false} />
      <PublishedModelTile model={model} folder="run-1" />
    </>,
  );
}

it("offers the selected model's calculation JSON as listed for the run", async () => {
  tiles({
    files: [
      { label: "Calculation JSON", href: "/connected/artifacts/run-1/other/calculation.json" },
      { label: "Calculation JSON", href: `/connected/artifacts/run-1/${MODEL}/calculation.json` },
    ],
  });
  expect(await screen.findByRole("link", { name: "Download calculation" })).toHaveAttribute(
    "href",
    `/connected/artifacts/run-1/${MODEL}/calculation.json`,
  );
  expect(screen.getByRole("region", { name: "Scope and limits" })).toHaveTextContent(
    "Base case is a conditional illustration.",
  );
});

it("says so when no calculation file is listed for this model", async () => {
  tiles({ files: [{ label: "Annual model handoff", href: `/x/${MODEL}/annual.md` }] });
  expect(
    await screen.findByText("No calculation file is listed for this model."),
  ).toBeInTheDocument();
});

it("words a failed listing without the failure's detail", async () => {
  tiles({}, false);
  expect(await screen.findByText("The calculation file could not be listed.")).toBeInTheDocument();
});

const limited = (limits: string[]) =>
  render(
    <ScopeTile model={{ id: MODEL, cashflow: { notes: [], limits } } as never} register={false} />,
  );

it("lists every limit the model records, in its order, choosing none", () => {
  limited([
    "Acquisitions after FY2024 are excluded from the forecast.",
    "The base period is FY2024.",
    "Leases are treated as operating costs.",
  ]);
  const items = within(screen.getByRole("region", { name: "Scope and limits" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);
  expect(items).toEqual([
    "Acquisitions after FY2024 are excluded from the forecast.",
    "The base period is FY2024.",
    "Leases are treated as operating costs.",
  ]);
});

it("shows eight limits and the rest one press away", () => {
  limited(Array.from({ length: 10 }, (_, at) => `Limit number ${String(at + 1)} as recorded.`));
  const tile = within(screen.getByRole("region", { name: "Scope and limits" }));
  expect(tile.getAllByText(/^Limit number/)).toHaveLength(8);
  const more = tile.getByRole("button", { name: "All 10 limits" });
  expect(more).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(more);
  expect(tile.getAllByText(/^Limit number/)).toHaveLength(10);
});

it("says a limit that carries a reference is in Evidence, in words true for what was checked", () => {
  limited(["See the model.xlsx tab Assumptions for the perimeter."]);
  expect(
    screen.getByText("This limit carries a reference; read it in Evidence."),
  ).toBeInTheDocument();
});
