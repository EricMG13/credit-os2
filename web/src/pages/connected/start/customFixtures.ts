/**
 * The synthetic service's answers for the Start run page's custom selection tests: the run options
 * with the custom cap (the table's ceiling, `contracts.PATHWAY_CAP_USD`), and a summary as T3's
 * service issues one for a custom run (`estimate` and the launcher's cap). Shared by
 * `CustomRun.test.tsx`; `goldenFixtures.ts` is not edited.
 */
import { DOCUMENTS, ITEMS, TEMPLATE } from "./goldenFixtures";

export const CUSTOM_TEMPLATE = {
  ...TEMPLATE,
  submission_caps_usd: { ...TEMPLATE.submission_caps_usd, custom: "50" },
};

export type ServerRow = {
  module: string;
  name: string;
  usd: string;
  measured: boolean;
  added: string | null;
  modules_page_only: boolean;
  phases?: { name: string; added: string | null }[];
};

/** A summary's `estimate`: the rows, then the sum, the hold and the launcher's cap. */
export function serverEstimate(
  rows: readonly ServerRow[],
  sum: string,
  cap: string,
  hold = "7.17",
) {
  return { rows, sum, hold, cap, label: "Estimated from earlier runs" };
}

/** The summary the service issues for a custom run, with its own estimate and issued cap. */
export function customSummary(
  modules: readonly string[],
  estimate: ReturnType<typeof serverEstimate> | undefined,
  extra: Record<string, unknown> = {},
) {
  return {
    digest: `digest-custom-${estimate?.cap ?? "none"}`,
    cap: estimate?.cap ?? "13",
    error: "",
    documents: DOCUMENTS,
    ignored: [],
    modules,
    items: ITEMS,
    omitted: [],
    omitted_titles: [],
    changes: "first run",
    lookup: [],
    web_lookup: false,
    web_search: false,
    model: "gpt",
    effort: "balanced",
    copilot_verified: true,
    prior: null,
    ...(estimate ? { estimate } : {}),
    ...extra,
  };
}

/** The Portfolio Fit selection at balanced effort, as the service prices it (the answer key). */
export const PORTFOLIO_FIT_ROWS: readonly ServerRow[] = [
  [
    "CP-0",
    "Source readiness",
    "0.29",
    "Every run needs the source register and the financial base.",
    true,
  ],
  [
    "CP-1",
    "Financial foundation",
    "0.42",
    "Every run needs the source register and the financial base.",
    false,
  ],
  ["CP-1A", "Business & governance", "0.66", "Needed by Fundamental credit.", false],
  [
    "CP-2",
    "Fundamental credit",
    "0.61",
    "Needed by Security selection and Committee decision.",
    false,
  ],
  ["CP-3", "Security selection", "0.97", "Needed by Committee decision.", false],
  ["CP-5", "Evidence validation", "1.13", "Needed by Committee decision.", true],
  ["CP-6", "Committee decision", "0.99", null, false],
].map(([module, name, usd, added, pageOnly]) => ({
  module: String(module),
  name: String(name),
  usd: String(usd),
  measured: true,
  added: added === null ? null : String(added),
  modules_page_only: pageOnly === true,
}));
