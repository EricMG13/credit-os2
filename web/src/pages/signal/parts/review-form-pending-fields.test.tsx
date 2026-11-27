import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { FormDialog, type FormValues } from "./FormDialog";

const refusal = "The topic could not be saved.";

it.each([
  { action: "Add topic", submission: "Add topic", result: null },
  { action: "Save topic", submission: "Save topic", result: refusal },
  { action: "Save topic", submission: "Delete topic", result: null },
])(
  "locks the draft during $submission and handles the response",
  async ({ action, submission, result }) => {
    let settle!: (response: string | null) => void;
    const pending = new Promise<string | null>((resolve) => {
      settle = resolve;
    });
    const onSend = vi.fn<(values: FormValues) => Promise<string | null>>(() => pending);
    const onDelete = vi.fn(() => pending);
    const onClose = vi.fn();
    const deleting = submission === "Delete topic";

    function TestDialog() {
      const [open, setOpen] = useState(true);
      return (
        <FormDialog
          open={open}
          title="Topic settings"
          fields={[
            { kind: "text", key: "name", label: "Name" },
            { kind: "area", key: "keywords", label: "Keywords" },
            {
              kind: "choice",
              key: "visibility",
              label: "Visibility",
              options: ["Private", "Public"],
              value: "Private",
            },
            { kind: "switches", key: "kinds", label: "Story kinds", options: ["News"], value: [] },
          ]}
          action={action}
          onSend={onSend}
          other={deleting ? { label: submission, onSend: onDelete } : undefined}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          onGone={() => undefined}
        />
      );
    }

    render(<TestDialog />);
    const form = within(screen.getByRole("dialog"));
    const name = form.getByRole("textbox", { name: /^Name/ });
    const keywords = form.getByRole("textbox", { name: /^Keywords/ });
    const visibility = form.getByRole("button", { name: /Visibility/ });
    const news = form.getByRole("switch", { name: "News" });
    const save = form.getByRole("button", { name: action });
    const write = form.getByRole("button", { name: submission });
    const cancel = form.getByRole("button", { name: "Cancel" });
    const fields = [name, keywords, visibility, news];
    fireEvent.change(name, { target: { value: "Tower sales" } });
    fireEvent.change(keywords, { target: { value: "Telecoms" } });
    fireEvent.click(visibility);
    fireEvent.click(screen.getByRole("option", { name: "Public" }));
    fireEvent.click(news);
    fireEvent.click(write);

    const submitted = {
      text: { name: "Tower sales", keywords: "Telecoms", visibility: "Public" },
      chosen: { kinds: ["News"] },
    };
    for (const field of [...fields, save, write]) {
      expect(field).toBeDisabled();
    }
    fireEvent.click(write);
    expect(onSend.mock.calls).toEqual(deleting ? [] : [[submitted]]);
    expect(onDelete).toHaveBeenCalledTimes(deleting ? 1 : 0);
    expect(cancel).toBeEnabled();
    expect(onClose).toHaveBeenCalledTimes(0);

    await act(async () => {
      settle(result);
      await pending;
    });

    if (result === null) {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).toBeNull();
    } else {
      expect(onClose).toHaveBeenCalledTimes(0);
      expect(form.getByRole("alert")).toHaveTextContent(result);
      for (const field of [...fields, save]) {
        expect(field).toBeEnabled();
      }
      expect(name).toHaveValue(submitted.text.name);
      expect(keywords).toHaveValue(submitted.text.keywords);
      expect(visibility).toHaveTextContent(submitted.text.visibility);
      expect(news).toBeChecked();
      fireEvent.change(name, { target: { value: "Updated tower sales" } });
      expect(name).toHaveValue("Updated tower sales");
      expect(onSend.mock.calls).toEqual([[submitted]]);
    }
  },
);
