// S22-1-3: a switch the service accepted goes back to its old value, with no message, when the
// re-read after the write fails (Settings draws no feed alert).
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { currentWith, refusal, serve, showLive } from "./test-helpers";

const READ = "GET /signal/api/snapshot?format=2";

it("keeps a notification switch the service accepted off, or says the page is stale", async () => {
  const service = serve(currentWith());
  showLive("#/signal/main/settings/notifications");
  const sw = await screen.findByRole("switch", {
    name: "A reply to one of my comments, In Signal",
  });
  expect(sw).toBeChecked(); // the sample delivers it on
  // The service accepts the write (default reply {}), then cannot answer the snapshot re-read.
  service.replies.set(READ, refusal(500, "the store is busy"));
  fireEvent.click(sw);
  await waitFor(() => {
    expect(service.writes()).toEqual(["POST /signal/api/notifications"]);
  });
  await waitFor(() => {
    expect(service.reads()).toBeGreaterThanOrEqual(2);
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Answer key: the service accepted "off". The reader must not be shown "on" with no message.
  const now = screen.getByRole("switch", { name: "A reply to one of my comments, In Signal" });
  const stillOn = (now as HTMLInputElement).checked || now.getAttribute("aria-checked") === "true";
  const said = screen.queryAllByRole("alert").length > 0;
  expect(stillOn && !said).toBe(false);
});
