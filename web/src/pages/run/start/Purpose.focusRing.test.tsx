import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { fixture, show } from "../test-helpers";

afterEach(() => {
  cleanup();
});

// S6-001: Tailwind's `outline-2` sets a width only, so the keyboard-focus outline of a Purpose card
// was never painted (outline-style stayed none). jsdom reads no stylesheet, so the class list is
// what a test can check: the focused card must carry a solid outline and no `outline-none`.
const cardOf = (name: string) =>
  screen.getByRole("radio", { name }).closest("label") as HTMLElement;

function tabTo(name: string) {
  fireEvent.keyDown(document.body, { key: "Tab" });
  act(() => {
    screen.getByRole("radio", { name }).focus();
  });
}

describe("Purpose cards, keyboard focus", () => {
  beforeEach(() => {
    show("/run/start/purpose", fixture.slice);
  });

  it("paints a solid outline, offset from the card, on the card focused from the keyboard", () => {
    tabTo("Full credit review");
    const card = cardOf("Full credit review");
    expect(card).toHaveAttribute("data-focus-visible", "true");
    expect(card).toHaveClass("outline-2", "outline-solid", "outline-offset-2", "outline-focus");
    expect(card).not.toHaveClass("outline-none");
  });

  it("keeps the focus outline apart from the selected ring: an unselected focused card has only the outline", () => {
    tabTo("Event review");
    const card = cardOf("Event review");
    expect(card).toHaveClass("outline-solid");
    expect(card).not.toHaveClass("ring-brand");
  });

  it("draws no outline on a card that is not focused", () => {
    tabTo("Full credit review");
    const other = cardOf("Event review");
    expect(other).not.toHaveClass("outline-solid");
    expect(other).toHaveClass("outline-none");
  });
});
