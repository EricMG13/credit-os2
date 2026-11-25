import { render, screen } from "@testing-library/react";
import { SlideoutMenu } from "./slideout-menu";

function open(side?: "left" | "right") {
  render(
    <SlideoutMenu.Trigger isOpen>
      <button type="button">Open</button>
      <SlideoutMenu aria-label="Panel" side={side}>
        <p>Content</p>
      </SlideoutMenu>
    </SlideoutMenu.Trigger>,
  );
  const modal = screen.getByRole("dialog", { name: "Panel" }).closest("[class*='inset-y-0']");
  const overlay = modal?.parentElement?.closest("[class*='fixed']");
  return { modal: modal as HTMLElement, overlay: overlay as HTMLElement };
}

describe("SlideoutMenu side", () => {
  it("opens from the right unless told otherwise", () => {
    const { modal, overlay } = open();
    expect(modal.className).toContain("right-0");
    expect(modal.className).not.toContain("left-0");
    expect(overlay.className).toContain("justify-end");
  });

  it("opens from the left when asked", () => {
    const { modal, overlay } = open("left");
    expect(modal.className).toContain("left-0");
    expect(modal.className).not.toContain("right-0");
    expect(overlay.className).toContain("justify-start");
  });
});
