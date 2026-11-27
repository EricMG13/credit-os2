import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { currentWith, go, refusal, serve, showLive } from "./test-helpers";

const DIGESTS = "#/signal/main/settings/digests";
const CREATE = "POST /signal/api/digests";
const NAME = "Credit overview";

const nameBox = () => screen.getByRole("textbox", { name: /^Name/ });

function typeName(value: string) {
  fireEvent.change(nameBox(), { target: { value } });
}

function holdReply(service: ReturnType<typeof serve>, write: string) {
  let reply!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    reply = resolve;
  });
  service.replies.set(write, () => pending);
  return (response: Response) =>
    act(async () => {
      reply(response);
      await pending;
    });
}

async function pendingCreate() {
  const service = serve(currentWith());
  const settle = holdReply(service, CREATE);
  showLive(DIGESTS);
  const save = await screen.findByRole("button", { name: "Save digest" });
  typeName(NAME);
  fireEvent.click(save);
  await waitFor(() => {
    expect(service.writes()).toEqual([CREATE]);
  });
  service.snapshot = currentWith(({ digests, channels }) => {
    const [digest] = digests;
    const [channel] = channels.digests;
    if (digest === undefined || channel === undefined) throw new Error("The sample has a digest");
    digests.push({ ...digest, id: "3", name: NAME, issues: [] });
    channels.digests.push({ ...channel, id: "3", name: NAME, unread: false });
  });
  return { service, settle };
}

it.each(["on Topics", "back on Digests"])(
  "clears the unchanged submitted draft when an accepted create settles %s",
  async (when) => {
    const { service, settle } = await pendingCreate();

    await go("#/signal/main/settings/topics");
    await screen.findByRole("button", { name: "New topic" });
    if (when === "back on Digests") {
      await go(DIGESTS);
      await screen.findByRole("button", { name: "Save digest" });
      expect(nameBox()).toHaveValue(NAME);
    }
    await settle(Response.json({ id: 3 }));
    if (when === "on Topics") await go(DIGESTS);
    await screen.findByRole("button", { name: "Edit: Credit overview" });
    expect(nameBox()).toHaveValue("New digest");
    expect(service.writes()).toEqual([CREATE]);
  },
);

it("retains a refused draft after changing Settings tabs", async () => {
  const { service, settle } = await pendingCreate();
  await go("#/signal/main/settings/topics");
  await screen.findByRole("button", { name: "New topic" });
  await go(DIGESTS);
  await screen.findByRole("button", { name: "Save digest" });

  await settle(Response.json({ error: "Digest could not be saved" }, { status: 409 }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Digest could not be saved");
  expect(nameBox()).toHaveValue(NAME);
  expect(service.writes()).toEqual([CREATE]);
});

it("preserves a draft opened after leaving Settings while a write settles", async () => {
  const { settle } = await pendingCreate();
  await go("#/signal/main/feed/latest");
  await screen.findByRole("heading", { name: "Latest", level: 1 });
  await go(DIGESTS);
  await screen.findByRole("button", { name: "Save digest" });
  typeName("A later draft");

  await settle(Response.json({ id: 3 }));

  expect(nameBox()).toHaveValue("A later draft");
});

it("discards the old account's draft when the write reread changes the viewer", async () => {
  const { service, settle } = await pendingCreate();
  typeName("An unsaved draft for the original account");
  service.snapshot = currentWith((snapshot) => {
    snapshot.viewer = { ...snapshot.viewer, name: "Tobias O", initials: "TO" };
  });

  await settle(Response.json({ id: 3 }));

  expect(await screen.findByText("Tobias O")).toBeVisible();
  expect(nameBox()).toHaveValue("New digest");
});

it.each(["fresh", "stale"])(
  "retains a newer draft after returning to Digests when an accepted create's read is %s",
  async (read) => {
    const { service, settle } = await pendingCreate();
    await go("#/signal/main/settings/topics");
    await screen.findByRole("button", { name: "New topic" });
    await go(DIGESTS);
    await screen.findByRole("button", { name: "Save digest" });
    typeName("A later draft");

    if (read === "stale") {
      service.replies.set("GET /signal/api/snapshot?format=2", refusal(500, "Read failed"));
    }
    await settle(Response.json({ id: 3 }));

    if (read === "stale") {
      expect(await screen.findByText(/Saved, but this page could not be refreshed/)).toBeVisible();
    } else {
      await screen.findByRole("button", { name: `Edit: ${NAME}` });
    }
    expect(nameBox()).toHaveValue("A later draft");
    expect(service.writes()).toEqual([CREATE]);
  },
);

it("clears an unchanged submitted draft after an accepted write with a stale read", async () => {
  const { service, settle } = await pendingCreate();
  service.replies.set("GET /signal/api/snapshot?format=2", refusal(500, "Read failed"));

  await settle(Response.json({ id: 3 }));

  expect(await screen.findByText(/Saved, but this page could not be refreshed/)).toBeVisible();
  expect(nameBox()).toHaveValue("New digest");
  expect(service.writes()).toEqual([CREATE]);
});

const DELETE = "DELETE /signal/api/digests/2";
const DELETED = "Weekly packaging";
const OTHER = "Daily shipping";

async function pendingDelete(edit: string) {
  const service = serve(currentWith());
  const settle = holdReply(service, DELETE);
  showLive(DIGESTS);
  fireEvent.click(await screen.findByRole("button", { name: `Edit: ${edit}` }));
  fireEvent.click(screen.getByRole("button", { name: `Delete: ${DELETED}` }));
  await waitFor(() => {
    expect(service.writes()).toEqual([DELETE]);
  });
  service.snapshot = currentWith((snapshot) => {
    snapshot.digests = snapshot.digests.filter((digest) => digest.id !== "2");
    snapshot.channels.digests = snapshot.channels.digests.filter((digest) => digest.id !== "2");
  });
  return settle;
}

it("clears an unchanged edit when deletion of that digest settles on a different tab", async () => {
  const settle = await pendingDelete(DELETED);
  await go("#/signal/main/settings/topics");
  await screen.findByRole("button", { name: "New topic" });

  await settle(Response.json({}));

  await go(DIGESTS);
  await screen.findByRole("button", { name: "Save digest" });
  expect(screen.queryByRole("button", { name: `Edit: ${DELETED}` })).toBeNull();
  expect(nameBox()).toHaveValue("New digest");
});

it.each(["was editing the other row", "switched edits", "canceled and typed"])(
  "preserves the current draft when another digest's deletion settles after the user %s",
  async (draft) => {
    const settle = await pendingDelete(draft === "was editing the other row" ? OTHER : DELETED);
    if (draft === "switched edits") {
      fireEvent.click(screen.getByRole("button", { name: `Edit: ${OTHER}` }));
    }
    if (draft === "canceled and typed") {
      fireEvent.click(screen.getByRole("button", { name: "Cancel edit" }));
    }
    typeName("Current draft");

    await settle(Response.json({}));

    expect(screen.queryByRole("button", { name: `Edit: ${DELETED}` })).toBeNull();
    expect(nameBox()).toHaveValue("Current draft");
    if (draft === "canceled and typed") {
      expect(screen.queryByRole("button", { name: "Cancel edit" })).toBeNull();
    } else {
      expect(screen.getByRole("button", { name: "Cancel edit" })).toBeVisible();
    }
  },
);

it("does not let an earlier accepted submission clear a newer refused submission of the same draft", async () => {
  const { service, settle } = await pendingCreate();
  fireEvent.click(screen.getByRole("button", { name: "Save digest" }));
  service.replies.set(CREATE, refusal(409, "Second save refused"));

  await settle(Response.json({ id: 3 }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Second save refused");
  expect(nameBox()).toHaveValue(NAME);
  expect(service.writes()).toEqual([CREATE, CREATE]);
});
