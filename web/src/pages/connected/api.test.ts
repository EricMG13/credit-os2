import { afterEach, describe, expect, it, vi } from "vitest";
import {
  changesSentence,
  getContext,
  moduleName,
  PATHWAYS,
  serviceText,
  UNNAMED_MODULE,
} from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("connected pathway caps", () => {
  it("extracts signed run access without adding it to the issuer context", async () => {
    const template = {
      run: { as_of: "", pathway: "credit_snapshot", case_kind: "synthetic" },
      identity: { issuer_name: "", issuer_id: "" },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          ...template,
          run_access: { can_prepare: true, analyst_name: "Eric G" },
          role: "analyst",
          account: { id: 7, display_name: "Eric G" },
          account_id: 7,
          profile_type: "analyst",
          submission_caps_usd: { credit_snapshot: "30" },
        }),
      ),
    );

    const result = await getContext(new AbortController().signal, true);

    expect(result.template).toEqual(template);
    expect(result).toHaveProperty("runAccess", { can_prepare: true, analyst_name: "Eric G" });
  });

  it("keeps only known pathway ids with finite positive decimal string values", async () => {
    const template = {
      run: {
        as_of: "",
        pathway: "credit_snapshot",
        case_kind: "synthetic",
        reporting_currency: "USD",
      },
      identity: { issuer_name: "", issuer_id: "" },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          ...template,
          copilot_models: { gpt: ["fast", "balanced"], luna: ["xhigh"] },
          submission_caps_usd: {
            credit_snapshot: "30",
            lite_credit_assessment: "20.00",
            deep_credit_assessment: "Infinity",
            earnings_update: "0",
            relative_value: "-20",
            covenant_refinancing: 20,
            unknown_pathway: "50",
          },
        }),
      ),
    );

    const result = await getContext(new AbortController().signal);

    expect(result).toEqual({
      template,
      copilotModels: { gpt: ["fast", "balanced"], luna: ["xhigh"] },
      caps: { credit_snapshot: "30", lite_credit_assessment: "20.00" },
    });
  });

  it("does not invent a cap when the pathway-cap map is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          run: {
            as_of: "",
            pathway: "credit_snapshot",
            case_kind: "synthetic",
            reporting_currency: "USD",
          },
          identity: { issuer_name: "", issuer_id: "" },
        }),
      ),
    );

    const result = await getContext(new AbortController().signal);

    expect(result.caps).toEqual({});
  });
});

describe("connected module names", () => {
  it("names a module without its code", () => {
    expect(moduleName("CP-2D")).toBe("Liquidity");
    expect(moduleName("CP-1")).toBe("Financial foundation");
    // A module field holding a code the page cannot name is a stated gap, never the code.
    expect(moduleName("CP-99")).toBe(UNNAMED_MODULE);
    expect(moduleName("CP-OS")).toBe(UNNAMED_MODULE);
    expect(moduleName("")).toBe(UNNAMED_MODULE);
    // An id that is no code stays as written.
    expect(moduleName("Report")).toBe("Report");
  });
  it("renames only exact module codes and leaves every other CP- word as written", () => {
    expect(
      serviceText("CP-backed commercial paper funds the CP-10 case; CP-2D reads CP-BACKSTOP."),
    ).toBe("CP-backed commercial paper funds the CP-10 case; Liquidity reads CP-BACKSTOP.");
    expect(serviceText("CP-99 and CP-OS")).toBe(`CP-99 and ${UNNAMED_MODULE}`);
  });
  it("runs every layer 1 module in the lite, full and deep assessments (owner, 2026-11-25)", () => {
    const layer1 = ["CP-1", "CP-1A", "CP-1B", "CP-1C", "CP-1D"];
    for (const id of ["lite_credit_assessment", "credit_snapshot", "deep_credit_assessment"])
      expect(PATHWAYS[id]?.modules).toEqual(expect.arrayContaining(layer1));
    expect(PATHWAYS.lite_credit_assessment?.modules).toEqual(
      "CP-0 CP-1 CP-1A CP-1B CP-DR CP-1C CP-1D CP-2 CP-2A".split(" "),
    );
    expect(PATHWAYS.credit_snapshot?.modules).toEqual(
      (
        "CP-0 CP-1 CP-MODEL CP-1A CP-1B CP-DR CP-1C CP-1D CP-2 CP-2A CP-2D CP-2E CP-2G CP-4 " +
        "CP-3C CP-3 CP-5 CP-6"
      ).split(" "),
    );
    // Lite runs research too, so its peer benchmark has public peers as in Full and Deep.
    for (const id of ["lite_credit_assessment", "credit_snapshot", "deep_credit_assessment"]) {
      const modules = PATHWAYS[id]?.modules ?? [];
      expect(modules.indexOf("CP-DR")).toBeGreaterThan(-1);
      expect(modules.indexOf("CP-DR")).toBeLessThan(modules.indexOf("CP-1C"));
    }
    expect(
      Object.entries(PATHWAYS)
        .filter(([, p]) => p.modules.includes("CP-L10"))
        .map(([id]) => id),
    ).toEqual(["credit_screening"]);
  });
  it("has a plain name for every module the run start can schedule", () => {
    for (const { modules } of Object.values(PATHWAYS))
      for (const id of modules) expect(moduleName(id)).not.toMatch(/^CP-/);
  });
});

it("drops an unused earlier run from the changes line and says so", () => {
  expect(changesSentence("first run (not used: 20261116-083145-01: different pathway)")).toBe(
    "first run. An earlier run exists but could not be used for comparison.",
  );
  expect(changesSentence("first run")).toBe("first run");
});

it("drops the whole skip note when the reason quotes an issuer name with brackets", () => {
  expect(
    changesSentence(
      "first run of this pathway (not used: 20261116-083145-01: its issuer name is 'Northbridge (UK) Ltd', not 'Northbridge Ltd')",
    ),
  ).toBe("first run of this pathway. An earlier run exists but could not be used for comparison.");
});
it("keeps one full stop when the kept text already ends with one", () => {
  expect(
    changesSentence(
      "first run. (not used: 20261116-083145-01: it was launched with an explicit module subset)",
    ),
  ).toBe("first run. An earlier run exists but could not be used for comparison.");
});
it("drops the launcher's changes label and names the modules in plain words", () => {
  expect(
    changesSentence("changes: not produced \u2014 CP-8 was planned and CP-2A was blocked"),
  ).toBe("not produced \u2014 Changes since the last run was planned and Downside was blocked");
});
