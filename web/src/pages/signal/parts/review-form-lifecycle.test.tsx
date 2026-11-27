import { act, fireEvent, render, screen } from "@testing-library/react";
import { FormDialog } from "./FormDialog";

it.each([false, true])(
  "starts fresh and ignores an earlier acceptance when reopened with an active exit animation: %s",
  async (animating) => {
    let settle!: (result: string | null) => void;
    const pending = new Promise<string | null>((resolve) => {
      settle = resolve;
    });
    const onClose = vi.fn();
    const view = (open: boolean) => (
      <FormDialog
        open={open}
        title="Edit group"
        fields={[{ kind: "text", key: "name", label: "Name" }]}
        action="Save"
        onSend={() => pending}
        onClose={onClose}
        onGone={() => undefined}
      />
    );

    const { rerender } = render(view(true));
    const previousField = screen.getByRole("textbox", { name: /^Name/ });
    fireEvent.change(previousField, { target: { value: "The earlier draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    if (animating) {
      const modal = screen.getByRole("dialog").parentElement;
      if (modal === null) throw new Error("The form is inside the modal");
      const animation = { playState: "running", finished: new Promise<never>(() => undefined) };
      Object.defineProperty(modal, "getAnimations", { value: () => [animation] });
    }
    rerender(view(false));
    expect(previousField.isConnected).toBe(animating);
    rerender(view(true));
    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    fireEvent.change(screen.getByRole("textbox", { name: /^Name/ }), {
      target: { value: "A replacement draft" },
    });

    await act(async () => {
      settle(null);
      await pending;
    });
    expect(onClose).toHaveBeenCalledTimes(0);
    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("A replacement draft");
  },
);
