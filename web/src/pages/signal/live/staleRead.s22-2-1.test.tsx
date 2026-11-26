import { expect, it, describe } from "vitest";
// S22-2-1: the fix for S22-1-3 (an accepted write shown reverted when the re-read after it fails)
// covers useChoices only. These sites still revert: a posted comment, an edited comment, a group's
// visibility. Each case: the service accepts the write (empty object), then the
// snapshot read after it answers 500. Answer keys are written by hand from what was sent.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { currentWith, refusal, serve, showLive } from "./test-helpers";

const READ = "GET /signal/api/snapshot?format=2";
const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

describe("an accepted write whose re-read failed", () => {
  it("keeps a posted comment on the thread panel, or says the panel is stale", async () => {
    const service = serve(currentWith());
    showLive("#/signal/main/group/1/thread/1");
    await screen.findByText("I will pull the dates.");
    await waitFor(() => {
      expect(service.calls).toContain(`${READ}&thread=1`);
    });
    service.replies.set(`${READ}&thread=1`, refusal(500, "the store is busy"));
    fireEvent.change(screen.getByRole("textbox", { name: "Write a comment" }), {
      target: { value: "Agreed, with one caveat." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(service.writes()).toContain("POST /signal/api/threads/1/comments");
    });
    await waitFor(() => {
      expect(service.reads()).toBeGreaterThanOrEqual(3);
    });
    await settle();
    // Answer key: the service accepted the comment, so the panel shows it, or an alert says why not.
    const shown = screen.queryByText("Agreed, with one caveat.") !== null;
    const said = within(screen.getByRole("dialog")).queryAllByRole("alert").length > 0;
    expect(shown || said).toBe(true);
  });

  it("keeps an edited comment's new text, or says the panel is stale", async () => {
    const service = serve(
      currentWith((s) => {
        for (const thread of s.threads)
          for (const one of thread.comments.flatMap((c) => [c, ...c.replies]))
            Object.assign(one, { canEdit: one.id === "2", canRemove: false });
      }),
    );
    showLive("#/signal/main/group/1/thread/1");
    await screen.findByText("Agreed. Check the test date.");
    await waitFor(() => {
      expect(service.calls).toContain(`${READ}&thread=1`);
    });
    service.replies.set(`${READ}&thread=1`, refusal(500, "the store is busy"));
    fireEvent.click(screen.getByRole("button", { name: "Edit your comment" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Edit your comment" }), {
      target: { value: "Agreed. Check the covenant test date." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(service.writes()).toContain("POST /signal/api/comments/2/edit");
    });
    await waitFor(() => {
      expect(service.reads()).toBeGreaterThanOrEqual(3);
    });
    await settle();
    const shown = screen.queryByText("Agreed. Check the covenant test date.") !== null;
    const said = within(screen.getByRole("dialog")).queryAllByRole("alert").length > 0;
    expect(shown || said).toBe(true);
  });

  it("keeps a group's visibility as written, or says the page is stale", async () => {
    const service = serve(currentWith());
    showLive("#/signal/main/settings/groups");
    await screen.findByRole("heading", { name: "Settings", hidden: true });
    const trigger = await screen.findByRole("button", { name: /Visibility: Committee prep/ });
    const before = trigger.textContent;
    service.replies.set(READ, refusal(500, "the store is busy"));
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Visible to everyone" }));
    await waitFor(() => {
      expect(service.writes()).toEqual(["POST /signal/api/groups/3/visibility"]);
    });
    await waitFor(() => {
      expect(service.reads()).toBeGreaterThanOrEqual(2);
    });
    await settle();
    const now = screen.getByRole("button", { name: /Visibility: Committee prep/ }).textContent;
    const said = screen.queryAllByRole("alert").length > 0;
    // Answer key: the service accepted "everyone"; the select must not read as before with no message.
    expect(now !== before || said).toBe(true);
  });
});
