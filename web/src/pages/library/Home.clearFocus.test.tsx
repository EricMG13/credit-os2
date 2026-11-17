// S1-006 (with S2-014): "Clear filters" is removed with the no-match state, and the focus it held
// must go to the search field, not fall to the document body. Both layouts draw the same control.
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { routes } from "./routes";

type Json = Record<string, unknown>;

const fixture = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "..", "..", "..", "fixtures", "library.json"),
    "utf8",
  ),
) as { issuers: LibraryData["issuers"]; slice: Json };

function renderHome() {
  const data: LibraryData = {
    schema: "credit-os-data/1",
    issuers: fixture.issuers,
    library: fixture.slice,
  };
  const route = routes.find((r) => r.path === "/library/home");
  if (route === undefined) throw new Error("no /library route");
  return render(<SourceContext.Provider value={data}>{route.render({})}</SourceContext.Provider>);
}

afterEach(cleanup);

const search = () => screen.getByRole("textbox", { name: "Search issuers" });

/** Presses "Clear filters" as a keyboard reader does: focused first, then activated. */
function pressClear() {
  const clear = screen.getByRole("button", { name: "Clear filters" });
  clear.focus();
  expect(clear).toHaveFocus();
  fireEvent.click(clear);
}

describe("Library home, focus after Clear filters", () => {
  it("moves focus to the search field when the cards have no match", () => {
    renderHome();
    fireEvent.change(search(), { target: { value: "zzz" } });
    expect(screen.getByText("No issuer matches")).toBeInTheDocument();
    pressClear();
    expect(screen.queryByText("No issuer matches")).toBeNull();
    expect(search()).toHaveValue("");
    expect(search()).toHaveFocus();
  });

  it("moves focus to the search field when the list has no match", () => {
    renderHome();
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    fireEvent.change(search(), { target: { value: "zzz" } });
    expect(screen.getByText("No issuer matches")).toBeInTheDocument();
    pressClear();
    expect(screen.queryByText("No issuer matches")).toBeNull();
    expect(search()).toHaveFocus();
  });
});

// S2-020 persists choices in a browser history entry; every independent test starts a fresh entry.
beforeEach(() => {
  window.history.replaceState({}, "");
});
