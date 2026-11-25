// Which parts of a story card a model wrote, and how the card says so: one "AI" label over the group
// of lines, a dashed edge and an accessible name on a tag or kind label the pass chose.
import { screen, within } from "@testing-library/react";
import { readSlice } from "./slice";
import fixture from "../../../fixtures/signal.json";
import { show, type Json, type Members } from "./test-helpers";

const CORVANE = "Corvane Packaging to close two plants as volumes fall";
const LINE = "The charge lands in the quarter its leverage covenant steps down.";

/** The ai-on scene's first story (Corvane: News, tags Packaging and Restructuring) with `ai` and `extra` set. */
function withAi(ai: Json | undefined, extra: Members = { strength: null }) {
  const copy = structuredClone(fixture.slice);
  const first = copy.scenes[2]?.snapshot.feed.stories[0] as unknown as Members | undefined;
  if (first === undefined) throw new Error("the ai-on scene has a story");
  Object.assign(first, extra);
  if (ai === undefined) Reflect.deleteProperty(first, "ai");
  else first["ai"] = ai;
  return copy;
}

function corvane() {
  const article = screen.getByRole("heading", { level: 2, name: CORVANE }).closest("article");
  if (article === null) throw new Error("a headline sits in an article");
  return within(article);
}

describe("marks on what the AI pass wrote", () => {
  it("names a tag and the kind label the pass chose, and marks the line once", () => {
    show("/signal/ai-on/feed/for-you", withAi({ line: LINE, kind: true, tags: ["Restructuring"] }));
    const card = corvane();
    expect(card.getByRole("img", { name: "Kind chosen by AI: News" })).toHaveTextContent("News");
    expect(card.getByRole("img", { name: "Tag written by AI: Restructuring" })).toHaveTextContent(
      "Restructuring",
    );
    expect(card.queryByRole("img", { name: /Tag written by AI: Packaging/ })).toBeNull();
    expect(card.getByText("Packaging")).toBeInTheDocument();
    expect(card.getAllByText("AI")).toHaveLength(1);
    // The dashed edge is a shape, not a colour: the plain tag has none.
    expect(card.getByRole("img", { name: /Tag written/ }).closest("li")).toHaveClass(
      "border-dashed",
    );
    expect(card.getByText("Packaging").closest("li")).not.toHaveClass("border-dashed");
  });

  it("with kind false and no AI tags adds no further mark", () => {
    show("/signal/ai-on/feed/for-you", withAi({ line: LINE, kind: false, tags: [] }));
    const card = corvane();
    expect(card.queryByRole("img")).toBeNull();
    expect(card.getAllByText("AI")).toHaveLength(1);
    expect(card.queryByRole("group", { name: "Written by AI" })).toBeNull();
  });

  it("puts the strength, stage, rating moves and line under one AI label", () => {
    show(
      "/signal/ai-on/feed/for-you",
      withAi({ line: LINE }, { strength: { marks: 3, word: "Strong" } }),
    );
    const group = corvane().getByRole("group", { name: "Written by AI" });
    expect(within(group).getAllByText("AI")).toHaveLength(1);
    expect(within(group).getByRole("img", { name: "Strong signal" })).toBeInTheDocument();
    expect(within(group).getByText(LINE)).toBeInTheDocument();
  });

  it("draws a story with no ai object as before", () => {
    show("/signal/ai-on/feed/for-you", withAi(null, { strength: null }));
    const card = corvane();
    expect(card.queryByText("AI")).toBeNull();
    expect(card.queryByRole("img")).toBeNull();
    expect(card.queryByRole("group")).toBeNull();
  });
});

describe("reading what the pass wrote", () => {
  const first = (source: unknown) => {
    const got = readSlice(source);
    if (got.kind !== "ok") return got.kind === "invalid" ? got.reason : got.kind;
    return got.data.scenes[2]?.snapshot.feed.stories[0]?.ai;
  };

  it("reads a line alone as kind false and no tags", () => {
    expect(first(withAi({ line: LINE }))).toEqual({ line: LINE, kind: false, tags: [] });
  });

  it("reads kind and tags as delivered", () => {
    expect(first(withAi({ line: LINE, kind: true, tags: ["Packaging"] }))).toEqual({
      line: LINE,
      kind: true,
      tags: ["Packaging"],
    });
  });

  it("refuses a tag the story does not carry, and a kind that is not true or false", () => {
    expect(first(withAi({ line: LINE, tags: ["Ghost"] }))).toBe(
      "scenes[2].snapshot.feed.stories[0].ai.tags[0]: expected one of the story's tags",
    );
    expect(first(withAi({ line: LINE, kind: "yes" }))).toBe(
      "scenes[2].snapshot.feed.stories[0].ai.kind: expected true or false",
    );
  });
});
