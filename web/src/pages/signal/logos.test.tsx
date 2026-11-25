// Source logos: what counts as a logo, how the reader takes the optional keys, and the tiles in
// the design fixture's "issuers" scene. The scene says which of its sources have a logo and holds
// none itself (the design-reference build's content policy refuses data: images), so these tests
// give it three through the fixture's optional `logos` key: a few made-up bytes each, not a picture
// and not any publisher's. With no service nothing is asked of anyone.
import { fireEvent, within } from "@testing-library/react";
import fixture from "../../../fixtures/signal.json";
import { LOGO_BYTES, logoUrl, readLogoUrl } from "./logo-data";
import { readSlice } from "./slice";
import { change, page, show } from "./test-helpers";

const SCENE = 11;
const TOWERS = "Tessaly Telecom agrees the sale of its towers";
const FILING = "Tessaly Telecom: 8-K, current report";
const MARKET = "Market backdrop: 25 November 2026";
/** Three bytes, "abc", and the same with one and two bytes of padding. */
const ABC = "YWJj";

const card = (headline: string) =>
  page().getByRole("heading", { level: 2, name: headline }).closest("article") as HTMLElement;
/** The story's own tile: the first hidden box of its card. */
const tile = (headline: string) =>
  card(headline).querySelector("[aria-hidden='true']") as HTMLElement;
/** Every image the Signal screens draw; the shell's own symbol in the top bar is the app's file. */
const images = () =>
  Array.from(document.querySelectorAll("img")).filter(
    (image) => image.getAttribute("src") !== "./symbol.svg",
  );
const sampleLogos: Record<string, string> = {
  "harbour-wire": "data:image/png;base64,YWJj",
  "regulatory-gazette": "data:image/gif;base64,YWI=",
  "credit-ledger": "data:image/x-icon;base64,YQ==",
};
/** The fixture with the scene holding the sample logos, as its optional key carries them. */
const withLogos = (): unknown => change(SCENE, ["snapshot", "logos"], sampleLogos);

describe("what a logo is", () => {
  it.each(["image/png", "image/jpeg", "image/gif", "image/webp", "image/x-icon"])(
    "takes %s as a data: URL of that type",
    (type) => {
      expect(logoUrl(type, ABC)).toBe(`data:${type};base64,YWJj`);
    },
  );

  it.each([
    ["an SVG", "image/svg+xml", ABC],
    ["a page", "text/html", ABC],
    ["a type with a parameter", "image/png; charset=utf-8", ABC],
    ["a type in capitals", "IMAGE/PNG", ABC],
    ["no type", undefined, ABC],
    ["no data", "image/png", undefined],
    ["empty data", "image/png", ""],
    ["data that is no base64", "image/png", "not base64!"],
    ["base64 with a line break", "image/png", "YWJj\nYWJj"],
    ["base64 of a wrong length", "image/png", "YWJ"],
    ["base64 padded in the middle", "image/png", "YW==YWJj"],
    ["the URL-safe alphabet", "image/png", "YW-_"],
    ["a data: URL in place of the data", "image/png", "data:image/png;base64,YWJj"],
    ["data that is a number", "image/png", 7],
  ])("takes %s as no logo", (_, type, data) => {
    expect(logoUrl(type, data)).toBeNull();
  });

  it("takes 32 KiB and not one byte more", () => {
    // 32,768 bytes are 10,922 groups of three and two bytes over: "…AAA=" in base64.
    const full = `${"A".repeat(10922 * 4)}AAA=`;
    expect(LOGO_BYTES).toBe(32768);
    expect(logoUrl("image/png", full)).toBe(`data:image/png;base64,${full}`);
    expect(logoUrl("image/png", "A".repeat(10923 * 4))).toBeNull();
    expect(logoUrl("image/png", "A".repeat(4_000_000))).toBeNull();
  });

  it("reads back only what it writes", () => {
    expect(readLogoUrl("data:image/png;base64,YWJj")).toBe("data:image/png;base64,YWJj");
    expect(readLogoUrl("data:image/png;base64,YWI=")).toBe("data:image/png;base64,YWI=");
    for (const other of [
      "https://example.com/logo.png",
      "/signal/api/logos/1",
      "data:image/svg+xml;base64,YWJj",
      "data:image/png,YWJj",
      "data:text/html;base64,YWJj",
      "javascript:alert(1)",
      " data:image/png;base64,YWJj",
      "",
      null,
      7,
    ]) {
      expect(readLogoUrl(other)).toBeNull();
    }
  });
});

describe("the reader and the logo keys", () => {
  const first = (source: unknown) => {
    const got = readSlice(source);
    if (got.kind !== "ok") throw new Error(got.kind === "invalid" ? got.reason : "no slice");
    return got.data.scenes;
  };

  it("reads a snapshot that says nothing of logos as none: no id, no logo, no sample", () => {
    const main = first(fixture.slice)[0].snapshot;
    expect(main.logos).toBeNull();
    expect(main.feed.stories[0]?.source).toEqual({
      name: "Harbour Wire",
      monogram: "HW",
      id: null,
      logo: false,
    });
    expect(main.feed.stories[0]?.alsoIn?.sources).toBeNull();
    expect(main.settings.sources.every((source) => !source.logo)).toBe(true);
  });

  it("reads the keys where they are delivered", () => {
    const scene = first(withLogos())[SCENE]?.snapshot;
    expect(scene?.feed.stories[2]?.source).toEqual({
      name: "Harbour Wire",
      monogram: "HW",
      id: "harbour-wire",
      logo: true,
    });
    expect(scene?.feed.stories[2]?.alsoIn?.sources).toEqual([
      { id: "credit-ledger", name: "Credit Ledger Daily", logo: true },
      { id: "regulatory-gazette", name: "Regulatory Gazette", logo: true },
    ]);
    expect(scene?.settings.sources.map((source) => [source.id, source.logo])).toEqual([
      ["harbour-wire", true],
      ["regulatory-gazette", true],
      ["tessaly-filings", true],
      ["halvorsen-filings", false],
      ["market-sample", false],
    ]);
    expect(Object.keys(scene?.logos ?? {})).toEqual([
      "harbour-wire",
      "regulatory-gazette",
      "credit-ledger",
    ]);
  });

  it.each([
    ["an address on another site", "https://example.com/logo.png"],
    ["an address on this site", "/signal/api/logos/1"],
    ["an SVG", "data:image/svg+xml;base64,YWJj"],
    ["a script address", "javascript:alert(1)"],
    ["an image too large to be a logo", `data:image/png;base64,${"A".repeat(10923 * 4)}`],
  ])("refuses a sample logo that is %s", (_, url) => {
    expect(readSlice(change(SCENE, ["snapshot", "logos"], { "harbour-wire": url }))).toEqual({
      kind: "invalid",
      reason: `scenes[${String(SCENE)}].snapshot.logos.harbour-wire: expected a data: URL of a PNG, JPEG, GIF, WebP or ICO image of at most 32 KiB`,
    });
  });

  it.each([
    [
      "a source id that is no id",
      ["snapshot", "feed", "stories", 2, "source", "id"],
      "",
      "source.id: expected a non-empty id that an address can hold",
    ],
    [
      "a logo that is a word",
      ["snapshot", "feed", "stories", 2, "source", "logo"],
      "yes",
      "source.logo: expected true or false",
    ],
    [
      "an also-in source with no logo said",
      ["snapshot", "feed", "stories", 2, "alsoIn", "sources", 0, "logo"],
      undefined,
      "alsoIn.sources[0].logo: expected true or false",
    ],
  ])("refuses %s", (_, path, value, reason) => {
    expect(readSlice(change(SCENE, path, value))).toEqual({
      kind: "invalid",
      reason: `scenes[${String(SCENE)}].snapshot.feed.stories[2].${reason}`,
    });
  });
});

describe("the tiles in the design-reference app", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("draws a source's sample logo inside its tile, the tile's size and shape unchanged", () => {
    show("/signal/issuers/feed/latest", withLogos());
    const box = tile(TOWERS);
    const image = within(box).getByRole("presentation", { hidden: true });
    expect(image.tagName).toBe("IMG");
    expect(image).toHaveAttribute("src", sampleLogos["harbour-wire"]);
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image.className.split(" ")).toEqual(
      expect.arrayContaining(["size-full", "bg-surface-card", "object-contain"]),
    );
    expect(box).not.toHaveTextContent("HW");
    // The same tile as the letters have: 48px (80px from 768px), the 8px radius, clipped to it.
    expect(box.className.split(" ")).toEqual(
      expect.arrayContaining([
        "size-12",
        "md:size-20",
        "shrink-0",
        "rounded-ds-sm",
        "overflow-hidden",
      ]),
    );
    expect(tile(MARKET).className).toBe(box.className);
  });

  it("draws letters only, and no image, in the scene as the fixture holds it: its sources say which have a logo, and it holds none", () => {
    const scene = fixture.slice.scenes[SCENE]?.snapshot as { logos?: unknown } | undefined;
    expect(scene).toBeDefined();
    expect(scene?.logos).toBeUndefined();
    show("/signal/issuers/feed/latest");
    expect(images()).toEqual([]);
    expect(tile(TOWERS)).toHaveTextContent("HW");
  });

  it("draws the letters where the source has no logo, and where the scene holds none for it", () => {
    show("/signal/issuers/feed/latest", withLogos());
    // The market source says it has no logo; the filing source says it has one and the scene holds none.
    expect(tile(MARKET)).toHaveTextContent("MB");
    expect(tile(MARKET).querySelector("img")).toBeNull();
    expect(tile(FILING)).toHaveTextContent("TT");
    expect(tile(FILING).querySelector("img")).toBeNull();
  });

  it("goes back to the letters when the image itself cannot be drawn", () => {
    show("/signal/issuers/feed/latest", withLogos());
    const image = tile(TOWERS).querySelector("img") as HTMLImageElement;
    fireEvent.error(image);
    expect(tile(TOWERS).querySelector("img")).toBeNull();
    expect(tile(TOWERS)).toHaveTextContent("HW");
  });

  it("draws the other sources' logos in the also-in stack, each in its round avatar", () => {
    show("/signal/issuers/feed/latest", withLogos());
    const stack = within(card(TOWERS)).getByText("Also in 2 other sources")
      .previousElementSibling as HTMLElement;
    const drawn = Array.from(stack.querySelectorAll("img"));
    expect(drawn.map((image) => image.getAttribute("src"))).toEqual([
      sampleLogos["credit-ledger"],
      sampleLogos["regulatory-gazette"],
    ]);
    for (const image of drawn) {
      expect(image.parentElement?.className.split(" ")).toEqual(
        expect.arrayContaining(["size-6", "rounded-ds-full", "overflow-hidden"]),
      );
    }
    expect(stack).not.toHaveTextContent("CL");
  });

  it("keeps the also-in letters where the sources are not named", () => {
    show("/signal/main/feed/for-you");
    expect(images()).toEqual([]);
    expect(page().getAllByText("CL").length).toBeGreaterThan(0);
  });

  it("gives every row of the Sources table a tile once a listed source has a logo: the logo, or a plain mark", () => {
    show("/signal/issuers/settings/sources", withLogos());
    const table = within(page().getByRole("region", { name: "Sources table" }));
    const tileOf = (name: string) =>
      table.getByText(name, { selector: "b" }).previousElementSibling as HTMLElement;
    expect(tileOf("Harbour Wire").querySelector("img")).toHaveAttribute(
      "src",
      sampleLogos["harbour-wire"],
    );
    expect(tileOf("Regulatory Gazette").querySelector("img")).not.toBeNull();
    for (const name of ["Tessaly Telecom filings (SEC)", "Market backdrop (sample)"]) {
      expect(tileOf(name)).toHaveAttribute("aria-hidden", "true");
      expect(tileOf(name).querySelector("img")).toBeNull();
      expect(tileOf(name).querySelector("svg")).not.toBeNull();
      expect(tileOf(name).className).toBe(tileOf("Harbour Wire").className);
    }
    expect(tileOf("Harbour Wire").className.split(" ")).toEqual(
      expect.arrayContaining(["size-6", "shrink-0", "rounded-ds-xs", "overflow-hidden"]),
    );
  });

  it("draws no tile in a Sources table that says nothing of logos", () => {
    show("/signal/main/settings/sources");
    expect(document.querySelector("[data-source-tile]")).toBeNull();
    expect(images()).toEqual([]);
  });

  it.each([
    "/signal/issuers/feed/latest",
    "/signal/issuers/issuer/tessaly-telecom",
    "/signal/issuers/settings/sources",
    "/signal/main/feed/for-you",
    "/signal/main/group/leveraged-credit/thread/corvane-thread",
  ])("asks nobody for anything at %s, and gives no image an address that is not data", (hash) => {
    show(hash, withLogos());
    expect(fetch).not.toHaveBeenCalled();
    const sources = images().map((image) => image.getAttribute("src") ?? "");
    expect(sources.filter((src) => !src.startsWith("data:image/"))).toEqual([]);
  });
});
