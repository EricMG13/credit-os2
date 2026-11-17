// S6-002: confirming the Submit dialog unmounts the Submit button, so focus must be handed to the
// Run started panel that replaces it instead of falling to the document body (D-38).
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { showFixture } from "../test-helpers";

afterEach(() => {
  cleanup();
});

const SUBMIT = "Submit, spend up to USD 25.00";

/** The Submit dialog's Confirm, pressed the way a keyboard user does: Submit is focused first. */
function confirmSubmit() {
  const submit = screen.getByRole("button", { name: SUBMIT });
  act(() => {
    submit.focus();
  });
  fireEvent.click(submit);
  fireEvent.click(screen.getByRole("button", { name: "Start run, up to USD 25.00" }));
}

describe("focus after Submit is confirmed", () => {
  it("lands on the Run started title, not on the document body", async () => {
    showFixture("/run/start/start");
    confirmSubmit();
    const status = await screen.findByRole("status");
    const title = within(status).getByText("Run started");
    await waitFor(() => {
      expect(title).toHaveFocus();
    });
    expect(document.body).not.toHaveFocus();
  });

  it("makes the title focusable by script only, so Tab goes on to the first link", async () => {
    showFixture("/run/start/start");
    confirmSubmit();
    const status = await screen.findByRole("status");
    const title = within(status).getByText("Run started");
    await waitFor(() => {
      expect(title).toHaveFocus();
    });
    expect(title.getAttribute("tabindex")).toBe("-1");
    const links = within(status).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["Watch run activity", "Back to the library"]);
    expect(title.compareDocumentPosition(links[0] as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("is the same when the page is opened at the started address", async () => {
    showFixture("/run/start/started");
    const title = within(await screen.findByRole("status")).getByText("Run started");
    await waitFor(() => {
      expect(title).toHaveFocus();
    });
  });

  it("is not taken on the other steps, which keep the shell's own focus", () => {
    for (const draft of ["documents", "purpose", "confirm", "context", "start"]) {
      cleanup();
      showFixture(`/run/start/${draft}`);
      expect(document.body).toHaveFocus();
    }
  });
});
