import { expect, it } from "vitest";
import { checkQuestionFocus, focusChoices } from "./focus";

it("offers Any and only the requested modules the service accepts, in its order", () => {
  expect(focusChoices(["CP-0", "CP-DR", "CP-3", "CP-2"], "custom")).toEqual([
    ["", "Any"],
    ["CP-2", "Fundamental credit"],
    ["CP-DR", "Research questions"],
  ]);
  expect(focusChoices(["CP-3"], "custom")).toEqual([["", "Any"]]);
});

it("refuses a carried question whose focus is not offered, naming it", () => {
  const carried = [
    { text: "Fine?", focus_module: "CP-2" },
    { text: "Peers?", focus_module: "CP-1C" },
  ];
  expect(() => {
    checkQuestionFocus(carried, ["CP-2"], "custom");
  }).toThrow(
    "Choose the focus again for the research question “Peers?”: Peer benchmark is not requested in this run.",
  );
  expect(() => {
    checkQuestionFocus([{ text: "Other?", focus_module: "CP-3" }], ["CP-3"], "custom");
  }).toThrow(/Security selection is not requested/);
});

it("accepts blank focus and offered focus, and a missing list", () => {
  checkQuestionFocus([{ text: "A", focus_module: "" }, { text: "B" }], [], "custom");
  checkQuestionFocus([{ text: "C", focus_module: "CP-DR" }], ["CP-DR"], "custom");
  checkQuestionFocus(undefined, [], "custom");
});
