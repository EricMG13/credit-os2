// The name dialog: wording from the predecessor, focus from the lessons, no write anywhere.
import { render, screen } from "@testing-library/react";
import fixture from "../../../fixtures/signal.json";
import { App } from "../../App";
import type { LoadResult } from "../../data";

function show(scene: string) {
  window.location.hash = `#/signal/${scene}/feed/for-you`;
  const result: LoadResult = {
    kind: "ok",
    data: { schema: "credit-os-data/1", issuers: [], signal: fixture.slice },
  };
  return render(<App result={result} />);
}

describe("the account badge", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("shows the snapshot identity without opening a name dialog", () => {
    show("main");
    expect(screen.getByText("Mara L")).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Your name" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Mara L/ })).toBeNull();
  });

  it("shows a safe account fallback when an older snapshot has no name", () => {
    show("no-name");
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Your name" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Set your name/ })).toBeNull();
    expect(screen.queryByRole("textbox", { name: /Display name/ })).toBeNull();
  });
});
