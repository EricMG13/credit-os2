import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { showFixture } from "../test-helpers";
import { SubmitConfirmation } from "./Start";

afterEach(() => {
  cleanup();
});

const SUBMIT = "Submit, spend up to USD 25.00";

// OQ-01 (README R10): the Submit dialog and Run started name the saved example, because nothing is
// sent, started or spent on this page.
describe("the static Submit dialog", () => {
  it("names the saved example and says confirming starts nothing, after the paid text", () => {
    showFixture("/run/start/start");
    fireEvent.click(screen.getByRole("button", { name: SUBMIT }));
    const dialog = screen.getByRole("dialog", { name: "Start a paid run?" });
    const text = within(dialog).getByText(/saved example/i);
    expect(text).toHaveTextContent(
      "This page shows a saved example: confirming starts no run and spends nothing.",
    );
    expect(dialog).toHaveTextContent("what it has spent cannot be taken back");
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeEnabled();
  });
});

describe("the connected Submit dialog", () => {
  it("draws no saved-example line when its caller gives none", () => {
    render(
      <SubmitConfirmation
        label="Submit"
        confirm={{ title: "Start a paid run?", text: "It can cost up to USD 25.", action: "Start" }}
        isDisabled={false}
        onConfirm={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByRole("dialog")).not.toHaveTextContent(/saved example/i);
  });
});

describe("Run started on the static page", () => {
  it("says in the status panel that it is a saved example and that nothing started or was spent", () => {
    showFixture("/run/start/started");
    const panel = screen.getByRole("status");
    expect(within(panel).getByText("Run started")).toBeVisible();
    expect(panel).toHaveTextContent(
      "This page shows a saved example, so no run was started and nothing was spent.",
    );
  });

  it("no longer claims the run carries on or that a library will appear", () => {
    showFixture("/run/start/started");
    const main = screen.getByRole("main");
    expect(main).not.toHaveTextContent("The run carries on, and its library appears");
    expect(main).toHaveTextContent(
      "In a live run you can close this page: the run carries on, and its library appears under TransDigm Group when it finishes.",
    );
  });
});
