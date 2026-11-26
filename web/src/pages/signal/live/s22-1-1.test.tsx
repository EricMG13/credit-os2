// S22-1-1: Attach story picks a story by its headline, so a second story with the same headline
// can never be attached: the first one with that headline is sent instead.
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { currentWith, serve, showLive } from "./test-helpers";

const drawn = (name: string) => screen.findByRole("heading", { name, hidden: true });

it("attaches the story the writer chose when two stories share a headline", async () => {
  // Answer key: stories "2" and "6" both read "Same headline". The writer picks the LAST option
  // in the Story list, which is story "6" (the list is in the feed's order: "2" first, "6" last).
  const service = serve(
    currentWith((s) => {
      const two = s.feed.stories.find((x) => x.id === "2");
      const six = s.feed.stories.find((x) => x.id === "6");
      if (two === undefined || six === undefined) throw new Error("sample has stories 2 and 6");
      two.headline = "Same headline";
      six.headline = "Same headline";
    }),
  );
  showLive("#/signal/main/group/2");
  await drawn("Shipping desk");
  fireEvent.click(screen.getByRole("button", { name: "Attach story" }));
  fireEvent.click(await screen.findByRole("button", { name: /Story/ }));
  const options = screen.getAllByRole("option", { name: "Same headline" });
  fireEvent.click(options[options.length - 1] as HTMLElement);
  const send = screen.getAllByRole("button", { name: "Attach story" }).at(-1) as HTMLElement;
  fireEvent.click(send);
  await waitFor(() => {
    expect(service.writes()).toEqual(["POST /signal/api/groups/2/threads"]);
  });
  expect(JSON.parse(service.bodies[0] as string)).toEqual({ story: "6" });
});
