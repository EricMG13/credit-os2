import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { currentWith, serve, showLive } from "./test-helpers";

const RENAME = "POST /signal/api/groups/2/rename";

function press(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function typeName(value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: /^Name/ }), { target: { value } });
}

it.each([
  { replacement: "New group", button: "Add group" },
  { replacement: "Rename: Shipping desk", button: "Rename group" },
])(
  "keeps $replacement open with its own input when the dismissed rename succeeds",
  async ({ replacement, button }) => {
    const service = serve(currentWith());
    let reply!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      reply = resolve;
    });
    service.replies.set(RENAME, () => pending);
    showLive("#/signal/main/settings/groups");
    await screen.findByRole("button", { name: "Rename: Shipping desk" });
    press("Rename: Shipping desk");
    typeName("First name");
    press("Rename group");
    await waitFor(() => {
      expect(service.writes()).toEqual([RENAME]);
    });

    press("Cancel");
    await screen.findByRole("button", { name: replacement });
    press(replacement);
    typeName("A fresh draft");

    const priorReads = service.reads();
    await act(async () => {
      reply(Response.json({}));
      await pending;
    });
    await waitFor(() => {
      expect(service.reads()).toBe(priorReads + 1);
    });
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("textbox", { name: /^Name/ })).toHaveValue("A fresh draft");
    expect(dialog.getByRole("button", { name: button })).toBeEnabled();
    expect(service.writes()).toEqual([RENAME]);
  },
);
