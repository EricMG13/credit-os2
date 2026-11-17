import { isAnalystName } from "./analystName";

describe("isAnalystName", () => {
  it.each(["Eric G", "Eric MG", "Jo L", "Anne-Marie D", "D'Arcy OB", "D’Arcy O", "Zoë É"])(
    "takes %s",
    (name) => {
      expect(isAnalystName(name)).toBe(true);
    },
  );

  it.each([
    "",
    "Eric",
    "Eric Garcia",
    "Eric g",
    "Eric MGH",
    "Eric M G",
    "Eric  G",
    " Eric G",
    "Eric G ",
    "Er1c G",
    "-Eric G",
    "Eric G\n",
  ])("refuses %j", (name) => {
    expect(isAnalystName(name)).toBe(false);
  });
});
