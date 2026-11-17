import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PublishedTable } from "./ReportContent";
const table = {
  type: "table" as const,
  line: 1,
  headers: ["Attempt", "Error class"],
  rows: [{ line: 2, cells: ["1", ""] }],
};
afterEach(cleanup);
it("names an empty run-record field without describing it as handoff text", () => {
  render(<PublishedTable table={table} evidence emptyLabel="Not recorded for this call" />);
  expect(screen.getByLabelText("Not recorded for this call")).toHaveTextContent("—");
  expect(screen.queryByLabelText("Empty in the handoff")).toBeNull();
});
it("preserves the existing handoff empty-field label by default", () => {
  render(<PublishedTable table={table} evidence />);
  expect(screen.getByLabelText("Empty in the handoff")).toHaveTextContent("—");
});
