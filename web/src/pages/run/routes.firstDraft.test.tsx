// S1-001: the run group has an address of its own for starting a run, #/run/start, so that a
// "Start a run" link needs no draft id. It draws the slice's first draft, where a new run begins.
import { screen } from "@testing-library/react";
import { routes } from "./routes";
import { fixture, show, showFixture } from "./test-helpers";

type Drafts = { drafts: { id: string; step: string }[] };

describe("#/run/start", () => {
  it("is a route of its own, beside the one that names a draft", () => {
    expect(routes.map((r) => r.path)).toContain("/run/start");
    expect(routes.find((r) => r.path === "/run/start")?.home).toBeUndefined();
  });

  it("draws the first draft under the title Start a run, not Run activity", () => {
    showFixture("/run/start");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Start a run");
    expect(screen.getByRole("heading", { level: 2, name: "Documents" })).toBeVisible();
    expect(screen.getByText("Step 1 of 5")).toBeVisible();
    expect(
      screen.getByText(
        "Add at least one document to continue. This page is a saved example, so nothing can be added here.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Stop run" })).toBeNull();
  });

  it("draws whichever draft the slice lists first, whatever its id", () => {
    const slice = structuredClone(fixture.slice) as Drafts;
    const [first, second] = slice.drafts;
    if (first === undefined || second === undefined) throw new Error("the fixture lacks drafts");
    expect([first.id, second.id]).toEqual(["no-documents", "documents"]);
    slice.drafts[0] = second;
    slice.drafts[1] = first;
    show("/run/start", slice);
    expect(screen.getByRole("heading", { level: 2, name: "Documents" })).toBeVisible();
    expect(screen.queryByText("Add at least one document to continue.")).toBeNull();
  });

  it("says so, under the same title, when the library holds no run data", () => {
    show("/run/start", undefined);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Start a run");
    expect(screen.getByText("No run data in this library")).toBeVisible();
    expect(screen.getByText("This library holds no saved run forms.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to the Library" })).toHaveAttribute("href", "#/");
  });
});
