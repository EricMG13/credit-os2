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
            credit_snapshot: "25",
            lite_credit_assessment: "15.00",
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
      caps: { credit_snapshot: "25", lite_credit_assessment: "15.00" },
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
