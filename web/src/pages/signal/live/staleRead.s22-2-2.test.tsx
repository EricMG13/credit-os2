import { expect, it } from "vitest";
// S22-2-2: the thread panel draws the feed's error for a thread whose comments are being fetched
// right now, because the last failure on the page (an earlier poll) is still set.
import { act, screen, waitFor, within } from "@testing-library/react";
import { currentWith, go, lookAgain, refusal, serve, showLive } from "./test-helpers";

const READ = "GET /signal/api/snapshot?format=2";

it("says the comments are loading, not an old poll's error, while they are fetched", async () => {
  const summary = currentWith((s) => {
    const two = s.threads.find((t) => t.id === "2");
    if (two === undefined) throw new Error("thread 2");
    two.comments = [];
  });
  const service = serve(summary);
  showLive("#/signal/main/group/1");
  await screen.findByRole("heading", { level: 1, name: "Leveraged credit" });
  // A poll fails: the page keeps its stories and sets the feed's error.
  service.replies.set(READ, refusal(500, "busy"));
  await lookAgain();
  await waitFor(() => {
    expect(service.reads()).toBe(2);
  });
  // The reader opens thread 2 (a summary); its comments are asked for and the answer is slow.
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  service.replies.set(`${READ}&thread=2`, async () => {
    await gate;
    return Response.json(currentWith());
  });
  await go("#/signal/main/group/1/thread/2");
  await waitFor(() => {
    expect(service.calls).toContain(`${READ}&thread=2`);
  });
  const panel = within(await screen.findByRole("dialog"));
  // Answer key: a read of this thread's comments is in flight, so the panel says they are loading;
  // it must not draw the earlier poll's error alert (with Retry) as if this fetch had failed.
  const claimsFailure = panel.queryAllByRole("alert").length > 0;
  const loading = panel.queryByText("Loading the comments") !== null;
  act(() => {
    release();
  });
  expect(loading && !claimsFailure).toBe(true);
});
