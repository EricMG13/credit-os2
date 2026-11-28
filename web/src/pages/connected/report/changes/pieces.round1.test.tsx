import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublishedChanges } from "../../publishedReport";
import { ModuleMatrix } from "./ModuleMatrix";

describe("ModuleMatrix round 1", () => {
  it("names CP-L10 by the run's pathway (C2-4)", () => {
    const change: PublishedChanges = {
      pack: {
        modules: [
          {
            module: "CP-L10",
            title: "",
            ran_prior: true,
            ran_current: true,
            prior_bottom_line: "Before.",
            current_bottom_line: "Now.",
          },
        ],
      },
      verdicts: { modules: { "CP-L10": { status: "Unchanged", cause: "None", why: "" } } },
    };
    render(<ModuleMatrix change={change} source={() => undefined} pathway="credit_screening" />);
    const table = screen.getByRole("table", { name: "Module conclusions against the earlier run" });
    expect(within(table).getByText("Credit screening")).toBeVisible();
    expect(within(table).queryByText("Short credit snapshot")).toBeNull();
  });
});
