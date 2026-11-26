// S22-1-2: a thread delivered without its comments (a summary: "2 comments, shown when the thread
// is opened") is drawn as "No comments yet" while its comments are being fetched, and stays so,
// with no error and the thread marked read, when that fetch fails.
import { screen, waitFor, within } from "@testing-library/react";
import { currentWith, refusal, serve, showLive } from "./test-helpers";

const READ = "GET /signal/api/snapshot?format=2";

it("does not say a thread with 2 comments has none when the comments could not be fetched", async () => {
  const service = serve(
    currentWith((s) => {
      const two = s.threads.find((t) => t.id === "2");
      if (two === undefined) throw new Error("sample has thread 2");
      // As group_view._summary_thread writes it: no comments, the count in the subline.
      two.comments = [];
      two.subline = "Leveraged credit, 2 comments, shown when the thread is opened";
    }),
  );
  // The fetch that carries the thread's comments fails.
  service.replies.set(`${READ}&thread=2`, refusal(500, "the store is busy"));
  showLive("#/signal/main/group/1/thread/2");
  const panel = within(await screen.findByRole("dialog"));
  await waitFor(() => {
    expect(service.calls).toContain(`${READ}&thread=2`);
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Answer key: the subline says the thread holds 2 comments, so the panel must not claim "No
  // comments yet" (it may show a loading line or an error instead).
  expect(panel.getByText(/2 comments, shown when the thread is opened/)).toBeInTheDocument();
  expect(panel.queryByText("No comments yet")).toBeNull();
  expect(service.writes()).not.toContain("POST /signal/api/threads/2/read");
});
