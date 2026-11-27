import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { readSlice } from "../slice";
import { currentWith, lookAgain, serve, showLive } from "./test-helpers";

it("preserves the note and requires a new selection when the story to attach disappears", async () => {
  const service = serve(currentWith());
  showLive("#/signal/main/group/2");
  fireEvent.click(await screen.findByRole("button", { name: "Attach story" }));
  const dialog = within(screen.getByRole("dialog", { name: "Attach a story" }));
  fireEvent.click(dialog.getByRole("button", { name: /Story/ }));
  fireEvent.click(
    screen.getByRole("option", { name: "Lenmark Shipping refinances its fleet loan" }),
  );
  const note = dialog.getByRole("textbox", { name: /Note/ });
  fireEvent.change(note, { target: { value: "Useful for the watchlist" } });

  service.snapshot = currentWith(({ feed, groups, settings }) => {
    feed.stories = feed.stories.filter((story) => story.id !== "6");
    for (const view of [...Object.values(feed.views), ...Object.values(feed.topics)]) {
      view.top = view.top.filter((id) => id !== "6");
      view.latest = view.latest.filter((id) => id !== "6");
      view.older = view.older.filter((id) => id !== "6");
    }
    for (const group of [...groups, ...settings.groups]) {
      if (group.id === "2") group.memberSummary = "Membership refreshed";
    }
  });
  expect(readSlice(service.snapshot)).toMatchObject({ kind: "ok" });
  await lookAgain();
  expect(screen.getByText("Membership refreshed")).toBeInTheDocument();

  fireEvent.click(dialog.getByRole("button", { name: "Attach story" }));
  expect(await dialog.findByRole("alert")).toHaveTextContent(
    "Choose a story that is still in the feed.",
  );
  expect(service.writes()).toEqual([]);
  expect(note).toHaveValue("Useful for the watchlist");

  fireEvent.click(dialog.getByRole("button", { name: /Story/ }));
  fireEvent.click(
    screen.getByRole("option", { name: "Tessaly Telecom agrees the sale of its towers" }),
  );
  fireEvent.click(dialog.getByRole("button", { name: "Attach story" }));
  await waitFor(() => {
    expect(service.writes()).toEqual(["POST /signal/api/groups/2/threads"]);
  });
  expect(service.bodies).toEqual([
    JSON.stringify({ story: "2", note: "Useful for the watchlist" }),
  ]);
});
