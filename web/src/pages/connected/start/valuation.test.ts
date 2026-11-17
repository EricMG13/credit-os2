import { expect, it } from "vitest";
import {
  readModuleOptions,
  readValuation,
  sendableModuleOptions,
  sendableValuation,
} from "./valuation";

it("reads a missing valuation as the service's default", () => {
  expect(sendableValuation(readValuation(undefined))).toEqual({
    peer_source: "cp_dr_public",
    basis: "auto",
    issuer_market: {
      market_cap_m: "",
      net_debt_m: "",
      ev_m: "",
      ebitda_basis: "LTM",
      as_of: "",
      source: "",
    },
    peers: [],
    precedents: [],
    user_multiple: { value: "", basis: "LTM", rationale: "" },
  });
});

it("sends a list of named peers without figures typed before the switch", () => {
  const form = {
    ...readValuation({ peer_source: "user_list" }),
    peers: [
      { name: " A ", ticker: "A", ev_m: "5" },
      { name: "", ticker: "" },
    ],
  };
  expect(sendableValuation(form).peers).toEqual([
    { name: "A", ticker: "A", ev_m: "", ebitda_m: "", as_of: "", source: "" },
  ]);
});

it("sends no choice for a module the pathway does not run", () => {
  const form = readModuleOptions({ cp3_mode: "clo_screening", cp6_deep_debate: true });
  expect(sendableModuleOptions(form, { cp3: false, cp6: false })).toEqual({
    cp3_mode: "",
    cp6_deep_debate: false,
  });
  expect(sendableModuleOptions(form, { cp3: true, cp6: true })).toEqual({
    cp3_mode: "clo_screening",
    cp6_deep_debate: true,
  });
});
