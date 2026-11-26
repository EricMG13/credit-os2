// S22-1-4: after the reader has visited a topic page (its snapshot asked for the topic's older
// stories), the next plain re-read is not held against the feed view they are back on: the list
// moves under them and a new story is drawn at once, with no "new stories" pill.
import { screen } from "@testing-library/react";
import { arrival, content, go, lookAgain, sampleWith, serve, showLive } from "./test-helpers";

const READ = "GET /signal/api/snapshot?format=2";
const title = (name: string) => screen.findByRole("heading", { level: 1, name });
const headlines = () =>
  content()
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);

it("holds the Latest list and shows the pill after a visit to a topic page", async () => {
  const service = serve();
  showLive("#/signal/main/feed/latest");
  await title("Latest");
  const before = headlines();
  await go("#/signal/main/topic/2");
  await title("Telecoms");
  // the topic page asked for its own snapshot (hand-written key: the topic's id is 2)
  expect(service.calls).toContain(`${READ}&topic=2`);
  await go("#/signal/main/feed/latest");
  await title("Latest");
  expect(headlines()).toEqual(before);
  // a story arrives; the next read is the plain one
  service.snapshot = sampleWith(arrival("7", "Tessaly Telecom names a new finance chief"));
  await lookAgain();
  // Answer key (docs in hold.ts and the "keeps the list as drawn" test): the list on screen is
  // unchanged and the new story waits behind a "1 new story" pill.
  expect(headlines()).toEqual(before);
  expect(content().getByText("1 new story")).toBeInTheDocument();
});
