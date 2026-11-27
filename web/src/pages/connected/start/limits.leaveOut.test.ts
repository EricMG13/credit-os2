import { groupLimits, leaveOut } from "./limits";

const FIX = "Add the executed agreement and declare it.";

describe("leaveOut with a limited cause sharing a refusing cause's fix", () => {
  const list = [
    { id: "CP-4:x", scope: "CP-4", outcome: "will_refuse", reason: "r", fix: FIX },
    { id: "CP-3:y", scope: "CP-3", outcome: "limited", reason: "r", fix: FIX },
    {
      id: "CP-6:from:CP-3",
      scope: "CP-6",
      outcome: "will_refuse",
      reason: "r",
      inherited_from: ["CP-3"],
    },
  ];

  it("drops only the modules that would refuse", () => {
    const [group] = groupLimits(list).groups;
    if (!group) throw new Error("no group");
    expect(group.outcome).toBe("will_refuse");
    expect(leaveOut(group, ["CP-0", "CP-1", "CP-3", "CP-4", "CP-6"], [])).toEqual([
      "CP-0",
      "CP-1",
      "CP-3",
    ]);
  });

  it("still offers the leave-out when a limited run-scope cause shares the fix", () => {
    const [group] = groupLimits([
      { id: "CP-4:x", scope: "CP-4", outcome: "will_refuse", reason: "r", fix: FIX },
      { id: "run:y", scope: "run", outcome: "limited", reason: "r", fix: FIX },
    ]).groups;
    if (!group) throw new Error("no group");
    expect(leaveOut(group, ["CP-0", "CP-4"], [])).toEqual(["CP-0"]);
  });
});
