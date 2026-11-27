import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { currentWith, go, lookAgain, refusal, serve, showLive } from "./test-helpers";

function press(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function editName(value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: /^Name/ }), { target: { value } });
}

it("keeps editing the original topic after its row disappears on refresh", async () => {
  const service = serve(currentWith());
  service.replies.set("POST /signal/api/topics/2/edit", refusal(404, "The topic no longer exists"));
  showLive("#/signal/main/settings/topics");
  await screen.findByRole("button", { name: "Edit: Telecoms" });
  press("Edit: Telecoms");
  editName("Tower sales");

  service.snapshot = currentWith(({ settings, channels, feed }) => {
    settings.topics = settings.topics.filter((topic) => topic.id !== "2");
    channels.topics = channels.topics.filter((topic) => topic.id !== "2");
    delete feed.topics["2"];
    for (const group of settings.groups) {
      if (group.topics !== null) group.topics = group.topics.filter((id) => id !== "2");
    }
  });
  await lookAgain();
  expect(screen.queryByRole("button", { name: "Edit: Telecoms", hidden: true })).toBeNull();
  expect(screen.getByRole("dialog")).toHaveAccessibleName("Edit Telecoms");
  expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("Tower sales");

  press("Save topic");
  expect(await screen.findByRole("alert")).toHaveTextContent("The topic no longer exists");
  expect(service.writes()).toEqual(["POST /signal/api/topics/2/edit"]);
});

it("requires the analyst to cancel the missing digest edit before creating another", async () => {
  const service = serve(currentWith());
  showLive("#/signal/main/settings/digests");
  await screen.findByRole("button", { name: "Edit: Weekly packaging" });
  press("Edit: Weekly packaging");
  editName("Paper and packaging");

  service.snapshot = currentWith((snapshot) => {
    snapshot.digests = snapshot.digests.filter((digest) => digest.id !== "2");
    snapshot.channels.digests = snapshot.channels.digests.filter((digest) => digest.id !== "2");
  });
  await lookAgain();
  expect(screen.queryByRole("button", { name: "Edit: Weekly packaging" })).toBeNull();

  const save = screen.getByRole("button", { name: "Save digest" });
  expect(save).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent(
    "This digest no longer exists. Cancel the edit to start a new digest.",
  );
  fireEvent.click(save);
  expect(service.writes()).toEqual([]);
  expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("Paper and packaging");
  press("Cancel edit");
  expect(screen.queryByRole("button", { name: "Cancel edit" })).toBeNull();
  expect(screen.getByRole("button", { name: "Save digest" })).toBeEnabled();
  expect(screen.queryByText(/This digest no longer exists/)).toBeNull();
});

const WEEKLY = "Weekly packaging";
const DAILY = "Daily shipping";
const WEEKLY_SAVE = "POST /signal/api/digests/2/edit";
const DAILY_SAVE = "POST /signal/api/digests/1/edit";
const WEEKLY_DELETE = "DELETE /signal/api/digests/2";

it("keeps the submitted draft when a queued Save is refused after Delete succeeds", async () => {
  const service = serve(currentWith());
  let acceptDelete!: (response: Response) => void;
  const pendingDelete = new Promise<Response>((resolve) => {
    acceptDelete = resolve;
  });
  service.replies.set(WEEKLY_DELETE, () => pendingDelete);
  service.replies.set(WEEKLY_SAVE, refusal(404, "no digest with id 2"));

  showLive("#/signal/main/settings/digests");
  await screen.findByRole("button", { name: `Edit: ${WEEKLY}` });
  press(`Edit: ${WEEKLY}`);
  editName("Unsaved weekly digest");
  press(`Delete: ${WEEKLY}`);
  await waitFor(() => {
    expect(service.writes()).toEqual([WEEKLY_DELETE]);
  });

  press("Save digest");
  expect(service.writes()).toEqual([WEEKLY_DELETE]);
  service.snapshot = currentWith((snapshot) => {
    snapshot.digests = snapshot.digests.filter((digest) => digest.id !== "2");
    snapshot.channels.digests = snapshot.channels.digests.filter((digest) => digest.id !== "2");
  });
  await act(async () => {
    acceptDelete(Response.json({ deleted: true }));
    await pendingDelete;
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("no digest with id 2");
  expect(service.writes()).toEqual([WEEKLY_DELETE, WEEKLY_SAVE]);
  expect(JSON.parse(service.bodies.at(-1) as string)).toMatchObject({
    name: "Unsaved weekly digest",
  });
  expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("Unsaved weekly digest");
  expect(screen.getByRole("button", { name: "Cancel edit" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save digest" })).toBeDisabled();
});

describe.each([
  { action: "Save digest", path: WEEKLY_SAVE },
  { action: `Delete: ${WEEKLY}`, path: WEEKLY_DELETE },
])("$action with an accepted response", ({ action, path }) => {
  async function pendingEdit() {
    const service = serve(currentWith());
    let accept!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      accept = resolve;
    });
    service.replies.set(path, () => pending);
    showLive("#/signal/main/settings/digests");
    await screen.findByRole("button", { name: `Edit: ${WEEKLY}` });
    press(`Edit: ${WEEKLY}`);
    editName("Submitted digest A");
    press(action);
    await waitFor(() => {
      expect(service.writes()).toEqual([path]);
    });

    return {
      service,
      settle: async () => {
        if (path === WEEKLY_DELETE) {
          service.snapshot = currentWith((snapshot) => {
            snapshot.digests = snapshot.digests.filter((digest) => digest.id !== "2");
            snapshot.channels.digests = snapshot.channels.digests.filter(
              (digest) => digest.id !== "2",
            );
          });
        }
        await act(async () => {
          accept(Response.json({}));
          await pending;
        });
      },
    };
  }

  it("preserves a different digest's draft and sends its next Save to its original edit endpoint", async () => {
    const { service, settle } = await pendingEdit();
    press(`Edit: ${DAILY}`);
    editName("Unsent digest B");
    await settle();

    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("Unsent digest B");
    expect(screen.getByRole("button", { name: "Cancel edit" })).toBeInTheDocument();
    press("Save digest");
    await waitFor(() => {
      expect(service.writes()).toEqual([path, DAILY_SAVE]);
    });
    expect(JSON.parse(service.bodies.at(-1) as string)).toMatchObject({ name: "Unsent digest B" });
  });

  it.each(["reopens", "changes"] as const)(
    "preserves a draft that %s the same digest",
    async (change) => {
      const { service, settle } = await pendingEdit();
      if (change === "reopens") {
        press("Cancel edit");
        press(`Edit: ${WEEKLY}`);
      }
      editName(change === "reopens" ? "Submitted digest A" : "New field value");
      await settle();

      expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue(
        change === "reopens" ? "Submitted digest A" : "New field value",
      );
      expect(screen.getByRole("button", { name: "Cancel edit" })).toBeInTheDocument();
      if (path === WEEKLY_DELETE) {
        expect(screen.getByRole("button", { name: "Save digest" })).toBeDisabled();
        expect(screen.getByRole("status")).toHaveTextContent("This digest no longer exists.");
      }
      expect(service.writes()).toEqual([path]);
    },
  );

  it("keeps a newer draft when the service accepts but the reread fails", async () => {
    const { service, settle } = await pendingEdit();
    editName("Draft while offline");
    service.replies.set("GET /signal/api/snapshot?format=2", refusal(500, "The store is busy"));
    await settle();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Saved, but this page could not be refreshed to show it.",
    );
    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("Draft while offline");
    expect(service.writes()).toEqual([path]);
  });

  it("keeps a newer draft after leaving and reopening the digest settings", async () => {
    const { service, settle } = await pendingEdit();
    await go("#/signal/main/settings/topics");
    await screen.findByRole("button", { name: "New topic" });
    await go("#/signal/main/settings/digests");
    await screen.findByRole("button", { name: `Edit: ${DAILY}` });
    press(`Edit: ${DAILY}`);
    editName("Draft after navigation");
    await settle();

    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue("Draft after navigation");
    expect(screen.getByRole("button", { name: "Cancel edit" })).toBeInTheDocument();
    expect(service.writes()).toEqual([path]);
  });

  it("clears the initiating draft when it remains current", async () => {
    const { service, settle } = await pendingEdit();
    await settle();

    expect(screen.queryByRole("button", { name: "Cancel edit" })).toBeNull();
    expect(screen.getByRole("textbox", { name: /^Name/ })).not.toHaveValue("Submitted digest A");
    expect(service.writes()).toEqual([path]);
  });
});
