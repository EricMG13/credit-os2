// A comment's author, on a service: Edit (in place) and Remove (after a question), each offered
// only where the service says it would take it. Over the service's sample, whose first thread holds
// the viewer's own reply ("2", under Ines K's comment) and comment ("4"). Paths, bodies, names and
// sentences are written out by hand.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import fixture from "../../../../fixtures/signal.json";
import { settled, show } from "../test-helpers";
import { currentWith, refusal, serve, showLive, type Snapshot } from "./test-helpers";

type Flags = { canEdit?: boolean; canRemove?: boolean };
const NEITHER = { canEdit: false, canRemove: false };

/** The sample with what the service says may be done to each of the viewer's own two comments. */
function withOwn(
  reply: Flags,
  comment: Flags,
  also: (snapshot: Snapshot) => void = () => undefined,
) {
  return currentWith((snapshot) => {
    const flags: Record<string, Flags> = { "2": reply, "4": comment };
    for (const thread of snapshot.threads) {
      for (const one of thread.comments.flatMap((top) => [top, ...top.replies])) {
        Object.assign(one, NEITHER, flags[one.id] ?? {});
      }
    }
    also(snapshot);
  });
}

async function openThread(slice: unknown) {
  const service = serve(slice);
  showLive("#/signal/main/group/1/thread/1");
  await screen.findByRole("heading", { name: "Thread", hidden: true });
  await screen.findByText("I will pull the dates.");
  return service;
}

const buttons = (name: string) => screen.queryAllByRole("button", { name });
const press = (name: string) => {
  fireEvent.click(screen.getByRole("button", { name }));
};
const box = () => screen.getByRole("textbox", { name: "Edit your comment" });
const writes = (service: { writes: () => string[] }) =>
  service.writes().filter((call) => !call.endsWith("/read"));

describe("which of their own comments a viewer may change", () => {
  it("offers Edit only where the service would take an edit, and Remove only a removal", async () => {
    await openThread(withOwn({ canEdit: true }, { canRemove: true }));
    expect(buttons("Edit your comment")).toHaveLength(1);
    expect(buttons("Remove your comment")).toHaveLength(1);
    // The reply says it can be edited, the comment that it can be removed.
    const reply = screen.getByText("Agreed. Check the test date.").closest("li") as HTMLElement;
    expect(within(reply).getByRole("button", { name: "Edit your comment" })).toHaveTextContent(
      "Edit",
    );
    expect(within(reply).queryByRole("button", { name: "Remove your comment" })).toBeNull();
    const comment = screen.getByText("I will pull the dates.").closest("li") as HTMLElement;
    expect(within(comment).getByRole("button", { name: "Remove your comment" })).toHaveTextContent(
      "Remove",
    );
    expect(within(comment).queryByRole("button", { name: "Edit your comment" })).toBeNull();
  });

  it("offers neither where the service says neither", async () => {
    await openThread(withOwn({}, {}));
    expect(buttons("Edit your comment")).toEqual([]);
    expect(buttons("Remove your comment")).toEqual([]);
    // Reply and the reactions are still there.
    expect(buttons("Reply to Ines K")).toHaveLength(1);
  });

  it("offers neither with no service, whatever a comment says", () => {
    const slice = structuredClone(fixture.slice);
    for (const comment of slice.scenes[0]?.snapshot.threads[0]?.comments ?? []) {
      if (!comment.removed) Object.assign(comment, { canEdit: true, canRemove: true });
    }
    show("/signal/main/group/leveraged-credit/thread/corvane-thread", slice);
    expect(screen.getAllByRole("button", { name: /^Reply to / }).length).toBeGreaterThan(0);
    expect(buttons("Edit your comment")).toEqual([]);
    expect(buttons("Remove your comment")).toEqual([]);
  });
});

describe("Edit", () => {
  const EDITABLE = () => withOwn({ canEdit: true }, {});

  it("puts the comment's text in a box in its place, with focus in it, Save and Cancel", async () => {
    await openThread(EDITABLE());
    press("Edit your comment");
    expect(box()).toHaveValue("Agreed. Check the test date.");
    expect(box()).toHaveFocus();
    expect(box().tagName).toBe("TEXTAREA");
    const reply = box().closest("li") as HTMLElement;
    expect(
      within(reply)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Cancel", "Save"]);
    // The text is in the box only; the comment it answers is still drawn.
    expect(screen.queryByText("Agreed. Check the test date.", { selector: "div" })).toBeNull();
    expect(screen.getByText("Sharing for Thursday.", { selector: "div" })).toBeInTheDocument();
  });

  it.each([
    [
      "Cancel",
      () => {
        press("Cancel");
      },
    ],
    ["Escape in the box", () => fireEvent.keyDown(box(), { key: "Escape" })],
  ])(
    "%s leaves the edit with nothing sent, the thread open and focus on Edit",
    async (_, leave) => {
      const service = await openThread(EDITABLE());
      press("Edit your comment");
      fireEvent.change(box(), { target: { value: "Something else" } });
      leave();
      await settled();
      expect(screen.queryByRole("textbox", { name: "Edit your comment" })).toBeNull();
      expect(screen.getByText("Agreed. Check the test date.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Thread" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit your comment" })).toHaveFocus();
      expect(writes(service)).toEqual([]);
      expect(window.location.hash).toBe("#/signal/main/group/1/thread/1");
    },
  );

  it("sends nothing for an empty edit and says what the reply box says", async () => {
    const service = await openThread(EDITABLE());
    press("Edit your comment");
    fireEvent.change(box(), { target: { value: "   " } });
    press("Save");
    expect(box()).toHaveAccessibleDescription("Error: Write something first.");
    expect(box()).toHaveFocus();
    expect(writes(service)).toEqual([]);
  });

  it("sends nothing for an edit that changes nothing, and closes the box", async () => {
    const service = await openThread(EDITABLE());
    press("Edit your comment");
    fireEvent.change(box(), { target: { value: " Agreed. Check the test date. " } });
    press("Save");
    expect(screen.queryByRole("textbox", { name: "Edit your comment" })).toBeNull();
    expect(writes(service)).toEqual([]);
  });

  it("refused, says the service's sentence in the panel and keeps the box with what was typed", async () => {
    const service = await openThread(EDITABLE());
    service.replies.set(
      "POST /signal/api/comments/2/edit",
      refusal(409, "a comment can be edited for 15 minutes only"),
    );
    press("Edit your comment");
    fireEvent.change(box(), { target: { value: "Agreed. Check the covenant test date." } });
    press("Save");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Error: a comment can be edited for 15 minutes only",
    );
    expect(box()).toHaveValue("Agreed. Check the covenant test date.");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    expect(writes(service)).toEqual(["POST /signal/api/comments/2/edit"]);
  });

  it("accepted, draws the comment as the service now holds it and says so to a screen reader", async () => {
    const service = await openThread(EDITABLE());
    press("Edit your comment");
    fireEvent.change(box(), { target: { value: "Agreed. Check the covenant test date." } });
    service.snapshot = withOwn({ canEdit: true }, {}, (snapshot) => {
      const reply = snapshot.threads[0]?.comments[0]?.replies[0];
      if (reply === undefined) throw new Error("the sample's first comment has a reply");
      Object.assign(reply, { text: "Agreed. Check the covenant test date.", edited: true });
    });
    press("Save");
    await waitFor(() => {
      expect(screen.queryByRole("textbox", { name: "Edit your comment" })).toBeNull();
    });
    expect(screen.getByText("Agreed. Check the covenant test date.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Comment changed");
    expect(screen.queryByRole("alert")).toBeNull();
    await settled();
    expect(screen.getByRole("button", { name: "Edit your comment" })).toHaveFocus();
  });
});

describe("Remove", () => {
  const REMOVABLE = () => withOwn({}, { canRemove: true });
  const question = () => screen.getByRole("dialog", { name: "Remove this comment?" });

  it("asks first, saying the replies stay; Cancel sends nothing and gives focus back", async () => {
    const service = await openThread(REMOVABLE());
    const remove = screen.getByRole("button", { name: "Remove your comment" });
    remove.focus();
    fireEvent.click(remove);
    expect(question()).toHaveTextContent("Its replies stay.");
    expect(
      within(question())
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Cancel", "Remove"]);
    fireEvent.click(within(question()).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Remove this comment?" })).toBeNull();
    });
    await settled();
    expect(writes(service)).toEqual([]);
    expect(screen.getByRole("button", { name: "Remove your comment" })).toHaveFocus();
    expect(screen.getByText("I will pull the dates.")).toBeInTheDocument();
  });

  it("refused, closes the question and says the service's sentence in the panel", async () => {
    const service = await openThread(REMOVABLE());
    service.replies.set(
      "DELETE /signal/api/comments/4",
      refusal(403, "comments cannot be removed in this group"),
    );
    press("Remove your comment");
    fireEvent.click(within(question()).getByRole("button", { name: "Remove" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Remove this comment?" })).toBeNull();
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Error: comments cannot be removed in this group",
    );
    expect(screen.getByText("I will pull the dates.")).toBeInTheDocument();
    expect(writes(service)).toEqual(["DELETE /signal/api/comments/4"]);
  });

  it("accepted, draws the removed line the service delivers and keeps focus in the thread", async () => {
    const service = await openThread(REMOVABLE());
    service.snapshot = withOwn({}, {}, (snapshot) => {
      const comment = snapshot.threads[0]?.comments.find((one) => one.id === "4");
      if (comment === undefined) throw new Error("the sample's first thread holds comment 4");
      Object.assign(comment, { removed: true, text: null, reactions: [] });
    });
    press("Remove your comment");
    fireEvent.click(within(question()).getByRole("button", { name: "Remove" }));
    await waitFor(() => {
      expect(screen.queryByText("I will pull the dates.")).toBeNull();
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Remove this comment?" })).toBeNull();
    });
    expect(screen.getAllByText("This comment was removed by its author.")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("Comment removed");
    expect(screen.queryByRole("button", { name: "Remove your comment" })).toBeNull();
    await settled();
    // Remove has gone with the comment, so focus stays in the thread: on the panel or its reply box.
    const thread = screen.getByRole("dialog", { name: "Thread" });
    expect(thread.contains(document.activeElement)).toBe(true);
  });
});
