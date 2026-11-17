import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChartTable } from "./ChartTable";
afterEach(() => vi.restoreAllMocks());
it("shows a visible scroll cue exactly when the source columns exceed the available desktop width", async () => {
  let width = 604;
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(749);
  render(
    <ChartTable
      caption="Covenants"
      head={["Test", "Threshold", "Basis and limitation"]}
      rows={[{ label: "Leverage", cells: ["4.00x", "As defined in the executed agreement."] }]}
    />,
  );
  expect(await screen.findByText("Scroll horizontally to see every column.")).toBeVisible();
  width = 900;
  await act(() => {
    window.dispatchEvent(new Event("resize"));
  });
  expect(screen.queryByText("Scroll horizontally to see every column.")).toBeNull();
});
