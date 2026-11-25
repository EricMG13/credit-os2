// Source logos on the live page: each source's logo is asked of the service once, drawn in the
// source's tile when it comes, and the letters stay whenever it does not. The stand-in service
// answers `GET /signal/api/logos/<id>`; the images' bytes are three made-up bytes, not a picture.
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { LOGO_BYTES } from "../logo-data";
import { LiveLogos, LOGOS_AT_ONCE } from "./logos";
import {
  content,
  format2With,
  go,
  lookAgain,
  refusal,
  serve,
  showLive,
  type Snapshot,
} from "./test-helpers";

const READ = "GET /signal/api/snapshot?format=2";
const LOGO = "GET /signal/api/logos/";
const PNG = { type: "image/png", data: "YWJj" };
const PNG_URL = "data:image/png;base64,YWJj";
const TOWERS = "Tessaly Telecom agrees the sale of its towers";
const CORVANE = "Corvane Packaging to close two plants as volumes fall";
const FILING = "Tessaly Telecom: 8-K, current report";

/** The service's source ids in the format-2 sample, by the name each story carries. */
const IDS: Record<string, string> = {
  "Harbour Wire": "1",
  "Regulatory Gazette": "3",
  "Northgate Ratings": "4",
  "The Meridian Post": "5",
  "Tessaly Telecom filings (SEC)": "7",
  "Market backdrop (FRED)": "9",
};
/** The sample as the service will deliver it once it holds logos: every story's source named by id, those in `have` with a logo. */
const withLogos =
  (have: string[]) =>
  (snapshot: Snapshot): void => {
    for (const story of snapshot.feed.stories) {
      const id = IDS[story.source.name];
      if (id === undefined) throw new Error(`no id for ${story.source.name}`);
      story.source = { ...story.source, id, logo: have.includes(id) };
    }
    for (const source of snapshot.settings.sources) source.logo = have.includes(source.id);
  };

const title = (name: string) => screen.findByRole("heading", { level: 1, name });
const card = (headline: string) =>
  content().getByRole("heading", { level: 2, name: headline }).closest("article") as HTMLElement;
const tile = (headline: string) =>
  card(headline).querySelector("[aria-hidden='true']") as HTMLElement;
const images = () => Array.from(document.querySelectorAll("img"));
const logoCalls = (calls: string[]) => calls.filter((call) => call.startsWith(LOGO));
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("a source with no logo", () => {
  it("asks only for the one logo the sample says the service holds", async () => {
    // The sample's store holds a logo for source 1 (Harbour Wire) and for no other.
    const service = serve(format2With());
    service.replies.set(`${LOGO}1`, () => Response.json(PNG));
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await waitFor(() => {
      expect(tile(TOWERS).querySelector("img")).toHaveAttribute("src", PNG_URL);
    });
    expect(tile(FILING)).toHaveTextContent("TT");
    expect(service.calls).toEqual([READ, `${LOGO}1`]);
  });

  it("draws letters only and asks for nothing where a snapshot says nothing of logos", async () => {
    const service = serve(
      format2With((snapshot) => {
        for (const story of snapshot.feed.stories) {
          Reflect.deleteProperty(story.source, "id");
          Reflect.deleteProperty(story.source, "logo");
          if (story.alsoIn !== null) Reflect.deleteProperty(story.alsoIn, "sources");
        }
        for (const source of snapshot.settings.sources) Reflect.deleteProperty(source, "logo");
      }),
    );
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await settle();
    expect(tile(TOWERS)).toHaveTextContent("HW");
    expect(images()).toEqual([]);
    expect(service.calls).toEqual([READ]);
  });

  it("draws its letters and asks for nothing where the service says it holds none", async () => {
    const service = serve(format2With(withLogos([])));
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await settle();
    expect(tile(TOWERS)).toHaveTextContent("HW");
    expect(images()).toEqual([]);
    expect(logoCalls(service.calls)).toEqual([]);
  });

  it("asks for nothing for a source said to have a logo and given no id", async () => {
    const service = serve(
      format2With((snapshot) => {
        for (const story of snapshot.feed.stories)
          Object.assign(story.source, { id: null, logo: true });
      }),
    );
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await settle();
    expect(logoCalls(service.calls)).toEqual([]);
    expect(images()).toEqual([]);
  });
});

describe("a source with a logo", () => {
  it("draws the letters until the logo comes, then the image in the same tile", async () => {
    const service = serve(format2With(withLogos(["1"])));
    let answer: (reply: Response) => void = () => undefined;
    service.replies.set(
      `${LOGO}1`,
      () =>
        new Promise<Response>((resolve) => {
          answer = resolve;
        }),
    );
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await waitFor(() => {
      expect(logoCalls(service.calls)).toEqual([`${LOGO}1`]);
    });
    // Waiting: the page is drawn whole, with the letters.
    expect(tile(TOWERS)).toHaveTextContent("HW");
    const before = tile(TOWERS).className;
    await act(async () => {
      answer(Response.json(PNG));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const image = tile(TOWERS).querySelector("img");
    expect(image).toHaveAttribute("src", PNG_URL);
    expect(image).toHaveAttribute("alt", "");
    expect(tile(TOWERS)).not.toHaveTextContent("HW");
    expect(tile(TOWERS).className).toBe(before);
    // Every story of that source has it, and no other source's tile changed.
    expect(tile(CORVANE).querySelector("img")).toHaveAttribute("src", PNG_URL);
    expect(tile(FILING)).toHaveTextContent("TT");
    expect(images().map((one) => one.getAttribute("src"))).toEqual(images().map(() => PNG_URL));
  });

  it("is asked for once, however often the snapshot is read again and wherever the page goes", async () => {
    const service = serve(format2With(withLogos(["1", "7"])));
    service.replies.set(`${LOGO}1`, () => Response.json(PNG));
    service.replies.set(`${LOGO}7`, refusal(404, "no logo for this source"));
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await waitFor(() => {
      expect(tile(TOWERS).querySelector("img")).not.toBeNull();
    });
    await lookAgain();
    await lookAgain();
    await go("#/signal/main/issuer/1");
    await title("Tessaly Telecom");
    await go("#/signal/main/settings/sources");
    await title("Settings");
    await go("#/signal/main/feed/latest");
    await title("Latest");
    await lookAgain();
    expect(service.reads()).toBeGreaterThan(3);
    // One request each: the logo that came, and the one the service does not hold.
    expect(logoCalls(service.calls).sort()).toEqual([`${LOGO}1`, `${LOGO}7`]);
    expect(tile(TOWERS).querySelector("img")).toHaveAttribute("src", PNG_URL);
    expect(tile(FILING)).toHaveTextContent("TT");
  });

  it.each<[string, (init: RequestInit | undefined) => Response | Promise<Response>]>([
    ["the service holds none (404)", refusal(404, "no logo for this source")],
    ["the service fails", refusal(500, "the service failed; see its log")],
    ["the request fails", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["the answer is not JSON", () => new Response("<html>", { status: 200 })],
    ["the answer is a list", () => Response.json([PNG])],
    ["the answer is null", () => Response.json(null)],
    ["the type is an SVG", () => Response.json({ type: "image/svg+xml", data: "YWJj" })],
    ["the type is a page", () => Response.json({ type: "text/html", data: "YWJj" })],
    ["there is no type", () => Response.json({ data: "YWJj" })],
    ["the data is no base64", () => Response.json({ type: "image/png", data: "<svg onload=x>" })],
    [
      "the data is an address",
      () => Response.json({ type: "image/png", data: "https://evil.example/x.png" }),
    ],
    ["the data is empty", () => Response.json({ type: "image/png", data: "" })],
    [
      "the image is over 32 KiB",
      () =>
        Response.json({ type: "image/png", data: "A".repeat((LOGO_BYTES / 4 + 1) * 4 + 16384) }),
    ],
  ])("keeps the letters when %s, and does not ask again", async (_, reply) => {
    const service = serve(format2With(withLogos(["1"])));
    service.replies.set(`${LOGO}1`, reply);
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await waitFor(() => {
      expect(logoCalls(service.calls)).toEqual([`${LOGO}1`]);
    });
    await settle();
    await lookAgain();
    await settle();
    expect(tile(TOWERS)).toHaveTextContent("HW");
    expect(images()).toEqual([]);
    expect(logoCalls(service.calls)).toEqual([`${LOGO}1`]);
    // The feed itself is untouched: no alert, the stories as they were.
    expect(content().queryByRole("alert")).toBeNull();
  });

  it("goes back to the letters when the image itself cannot be drawn", async () => {
    const service = serve(format2With(withLogos(["1"])));
    service.replies.set(`${LOGO}1`, () => Response.json(PNG));
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await waitFor(() => {
      expect(tile(TOWERS).querySelector("img")).not.toBeNull();
    });
    fireEvent.error(tile(TOWERS).querySelector("img") as HTMLImageElement);
    expect(tile(TOWERS).querySelector("img")).toBeNull();
    expect(tile(TOWERS)).toHaveTextContent("HW");
    // What the browser cannot draw once it cannot draw again: every tile of that source has its
    // letters, none tries the image, and the service is not asked a second time.
    expect(tile(CORVANE).querySelector("img")).toBeNull();
    expect(tile(CORVANE)).toHaveTextContent("HW");
    await lookAgain();
    expect(images()).toEqual([]);
    expect(logoCalls(service.calls)).toEqual([`${LOGO}1`]);
  });

  it("is drawn in the Sources table and in a thread's story too, from the one request", async () => {
    const service = serve(format2With(withLogos(["1", "4"])));
    service.replies.set(`${LOGO}1`, () => Response.json(PNG));
    service.replies.set(`${LOGO}4`, () => Response.json({ type: "image/x-icon", data: "YWI=" }));
    showLive("#/signal/main/settings/sources");
    await title("Settings");
    const tileOf = (name: string) =>
      content().getByText(name, { selector: "b" }).previousElementSibling as HTMLElement;
    await waitFor(() => {
      expect(tileOf("Harbour Wire").querySelector("img")).toHaveAttribute("src", PNG_URL);
    });
    expect(tileOf("Northgate Ratings").querySelector("img")).toHaveAttribute(
      "src",
      "data:image/x-icon;base64,YWI=",
    );
    expect(tileOf("Regulatory Gazette").querySelector("img")).toBeNull();
    expect(tileOf("Regulatory Gazette").querySelector("svg")).not.toBeNull();
    await go("#/signal/main/group/1/thread/1");
    const panel = await screen.findByRole("dialog", { name: "Thread" });
    await waitFor(() => {
      expect(panel.querySelector("article img")).toHaveAttribute("src", PNG_URL);
    });
    expect(logoCalls(service.calls).sort()).toEqual([`${LOGO}1`, `${LOGO}4`]);
  });

  it("never gives an image an address that is not a data: URL, whatever the service sends", async () => {
    const service = serve(format2With(withLogos(["1", "3", "4", "5", "7", "9"])));
    service.replies.set(`${LOGO}1`, () => Response.json(PNG));
    service.replies.set(`${LOGO}3`, () =>
      Response.json({ type: "image/png", data: "YWJj", url: "https://evil.example/logo.png" }),
    );
    service.replies.set(`${LOGO}4`, () =>
      Response.json({ type: "https://evil.example/x.png", data: "YWJj" }),
    );
    service.replies.set(`${LOGO}5`, () => Response.json("https://evil.example/logo.png"));
    service.replies.set(`${LOGO}7`, () =>
      Response.json({ type: 'image/png" onerror="alert(1)', data: "YWJj" }),
    );
    showLive("#/signal/main/feed/latest");
    await title("Latest");
    await waitFor(() => {
      expect(logoCalls(service.calls)).toHaveLength(6);
    });
    await settle();
    const sources = images().map((image) => image.getAttribute("src") ?? "");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.filter((src) => !src.startsWith("data:image/"))).toEqual([]);
    expect(new Set(sources)).toEqual(new Set([PNG_URL]));
    expect(document.body.innerHTML).not.toContain("evil.example");
  });
});

describe("the logo store", () => {
  /** A stand-in service whose logo requests wait until answered, recording each request's signal. */
  function waiting() {
    const out: { id: string; signal: AbortSignal; answer: (reply: Response) => void }[] = [];
    const fetch = vi.fn((path: string, init?: RequestInit) => {
      const signal = init?.signal ?? new AbortController().signal;
      return new Promise<Response>((resolve, reject) => {
        out.push({ id: path.replace("/signal/api/logos/", ""), signal, answer: resolve });
        signal.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetch);
    return out;
  }
  const turn = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("has at most four requests out at a time, and sends the next as each is answered", async () => {
    const out = waiting();
    const logos = new LiveLogos();
    logos.open();
    for (const id of ["1", "2", "3", "4", "5", "6"]) logos.want(id);
    expect(LOGOS_AT_ONCE).toBe(4);
    expect(out.map((one) => one.id)).toEqual(["1", "2", "3", "4"]);
    out[1]?.answer(Response.json(PNG));
    await turn();
    expect(out.map((one) => one.id)).toEqual(["1", "2", "3", "4", "5"]);
    expect(logos.read("2")).toBe(PNG_URL);
    expect(logos.read("1")).toBeNull();
    out[0]?.answer(Response.json({}, { status: 404 }));
    await turn();
    expect(out.map((one) => one.id)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("asks once for an id, whoever wants it and whatever came", async () => {
    const out = waiting();
    const logos = new LiveLogos();
    logos.open();
    logos.want("1");
    logos.want("1");
    out[0]?.answer(Response.json({}, { status: 404 }));
    await turn();
    logos.want("1");
    await turn();
    expect(out).toHaveLength(1);
    expect(logos.read("1")).toBeNull();
  });

  it("tells only the tiles of the source whose logo came, and none when there is none", async () => {
    const out = waiting();
    const logos = new LiveLogos();
    logos.open();
    const heard: string[] = [];
    const stop = logos.subscribe("1", () => heard.push("1"));
    logos.subscribe("2", () => heard.push("2"));
    logos.subscribe("3", () => heard.push("3"));
    for (const id of ["1", "2", "3"]) logos.want(id);
    out[1]?.answer(Response.json(PNG));
    out[2]?.answer(Response.json({ type: "text/html", data: "YWJj" }));
    await turn();
    expect(heard).toEqual(["2"]);
    stop();
    out[0]?.answer(Response.json(PNG));
    await turn();
    expect(heard).toEqual(["2"]);
    expect(logos.read("1")).toBe(PNG_URL);
  });

  it("forgets a logo the browser could not draw, and tells its tiles", async () => {
    const out = waiting();
    const logos = new LiveLogos();
    logos.open();
    let heard = 0;
    logos.subscribe("1", () => {
      heard += 1;
    });
    logos.want("1");
    logos.broken("1");
    expect(heard).toBe(0);
    out[0]?.answer(Response.json(PNG));
    await turn();
    expect([logos.read("1"), heard]).toEqual([PNG_URL, 1]);
    logos.broken("1");
    logos.broken("1");
    expect([logos.read("1"), heard]).toEqual([null, 2]);
    logos.want("1");
    await turn();
    expect(out).toHaveLength(1);
  });

  it("gives up what is out when the page goes, sends nothing more, and asks again when it is back", async () => {
    const out = waiting();
    const logos = new LiveLogos();
    logos.open();
    for (const id of ["1", "2", "3", "4", "5"]) logos.want(id);
    expect(out).toHaveLength(4);
    logos.close();
    await turn();
    expect(out.map((one) => one.signal.aborted)).toEqual([true, true, true, true]);
    logos.want("6");
    await turn();
    expect(out).toHaveLength(4);
    // Given up is not "none": back on the page, what was out or waiting is asked, four at a time
    // (the one that waited first, then those given up), and the rest as those are answered.
    logos.open();
    await turn();
    expect(out.slice(4).map((one) => one.id)).toEqual(["5", "1", "2", "3"]);
    expect(out.slice(4).every((one) => !one.signal.aborted)).toBe(true);
    for (const one of out.slice(4)) one.answer(Response.json(PNG));
    await turn();
    expect(out.slice(8).map((one) => one.id)).toEqual(["4", "6"]);
  });
});

describe("leaving the page", () => {
  it("gives up the logo requests still out", async () => {
    const service = serve(format2With(withLogos(["1"])));
    let signal: AbortSignal | undefined;
    service.replies.set(`${LOGO}1`, (init) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>(() => undefined);
    });
    const view = showLive("#/signal/main/feed/latest");
    await title("Latest");
    await waitFor(() => {
      expect(signal).toBeDefined();
    });
    expect(signal?.aborted).toBe(false);
    view.unmount();
    expect(signal?.aborted).toBe(true);
  });
});
