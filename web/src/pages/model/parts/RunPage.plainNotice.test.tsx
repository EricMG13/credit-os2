import { render, screen } from "@testing-library/react";
import { App } from "@/App";
import type { LoadResult } from "@/data";
import { fixtureSlice, must } from "../slice/test-fixture";

const REASON = "runs[1].header.asOf: expected a string";
const SENTENCE =
  "The financial model for this run could not be shown. Open All financial models to see the available records.";

function openUnreadable(page: string) {
  const slice = fixtureSlice() as { runs: { run: string; header: Record<string, unknown> }[] };
  const bad = structuredClone(must(slice.runs[0]));
  bad.run = "2024-12-31";
  bad.header["asOf"] = 5;
  slice.runs.push(bad);
  window.location.hash = `#/model/transdigm/2024-12-31/${page}`;
  const result: LoadResult = {
    kind: "ok",
    data: { schema: "credit-os-data/1", issuers: [], model: slice },
  };
  return render(<App result={result} />);
}

describe("An unreadable run is explained in plain words (S5-002)", () => {
  it("offers available records without promising that other unreadable models are unaffected", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const slice = fixtureSlice() as { runs: { run: string; header: Record<string, unknown> }[] };
    for (const date of ["2024-12-31", "2024-09-30"]) {
      const bad = structuredClone(must(slice.runs[0]));
      bad.run = date;
      bad.header["asOf"] = 5;
      slice.runs.push(bad);
    }
    window.location.hash = "#/model/transdigm/2024-12-31/front";
    render(
      <App
        result={{ kind: "ok", data: { schema: "credit-os-data/1", issuers: [], model: slice } }}
      />,
    );
    expect(
      screen.getByText(
        "The financial model for this run could not be shown. Open All financial models to see the available records.",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/other financial models.*not affected/)).toBeNull();
    expect(screen.getByRole("link", { name: "All financial models" })).toHaveAttribute(
      "href",
      "#/model/runs",
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(REASON));
    warn.mockRestore();
  });

  it.each(["front", "analysis", "statements", "portfolio-fit", "limitations", "forecast"])(
    "draws one fixed sentence on the %s page and none of the reader's field path",
    (page) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      openUnreadable(page);
      const main = screen.getByRole("main");
      expect(screen.getByText("This part of the library could not be read")).toBeInTheDocument();
      expect(screen.getByText(SENTENCE)).toBeInTheDocument();
      expect(main).not.toHaveTextContent("runs[");
      expect(main).not.toHaveTextContent("expected a string");
      warn.mockRestore();
    },
  );

  it("keeps the reader's reason in the console for the analyst", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    openUnreadable("front");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(REASON));
    warn.mockRestore();
  });
});
