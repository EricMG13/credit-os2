import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { currentWith, refusal, serve, showLive } from "./test-helpers";

const COMMENT = "POST /signal/api/threads/1/comments";
const REPLY = "POST /signal/api/comments/1/replies";

function press(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function box() {
  return screen.getByRole("textbox", { name: "Write a comment" });
}

function type(value: string) {
  fireEvent.change(box(), { target: { value } });
}

function status() {
  return within(screen.getByRole("dialog")).getByRole("status");
}

async function openThread() {
  showLive("#/signal/main/group/1/thread/1");
  await screen.findByRole("button", { name: "Reply to Ines K" });
}

it.each([
  { target: null, path: COMMENT, posted: "Comment posted" },
  { target: "Ines K", path: REPLY, posted: "Reply to Ines K posted" },
])(
  "retains a refused draft on $path and announces an accepted retry",
  async ({ target, path, posted }) => {
    const service = serve(currentWith());
    service.replies.set(path, refusal(409, "Posting is temporarily unavailable"));
    await openThread();
    if (target !== null) press(`Reply to ${target}`);
    type("  Check this covenant.  ");
    press("Send");

    expect(status()).not.toHaveTextContent(posted);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Posting is temporarily unavailable",
    );
    expect(box()).toHaveValue("  Check this covenant.  ");
    if (target !== null) expect(screen.getByText(`Replying to ${target}`)).toBeInTheDocument();

    service.replies.delete(path);
    press("Send");
    await waitFor(() => {
      expect(status()).toHaveTextContent(posted);
    });
    expect(box()).toHaveValue("");
    expect(screen.queryByText(/^Replying to /)).toBeNull();
    expect(service.writes()).toEqual([path, path]);
    expect(service.bodies).toEqual([
      JSON.stringify({ text: "Check this covenant." }),
      JSON.stringify({ text: "Check this covenant." }),
    ]);
  },
);

it.each([200, 409])(
  "keeps edits and a new reply target while a submit settles with %i",
  async (code) => {
    const service = serve(currentWith());
    let reply!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      reply = resolve;
    });
    service.replies.set(COMMENT, () => pending);
    await openThread();
    type("The first draft");
    press("Send");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(
      within(screen.getByRole("list", { name: "Comments" })).queryByText("The first draft"),
    ).toBeNull();
    expect(status()).not.toHaveTextContent("Comment posted");
    press("Reply to Ines K");
    type("A different draft");

    await act(async () => {
      reply(
        code === 200
          ? Response.json({})
          : Response.json({ error: "First draft refused" }, { status: code }),
      );
      await pending;
    });

    if (code === 200) {
      await waitFor(() => {
        expect(status()).toHaveTextContent("Comment posted");
      });
    } else {
      expect(await screen.findByRole("alert")).toHaveTextContent("First draft refused");
      expect(status()).not.toHaveTextContent("Comment posted");
    }
    expect(box()).toHaveValue("A different draft");
    expect(screen.getByText("Replying to Ines K")).toBeInTheDocument();
  },
);
