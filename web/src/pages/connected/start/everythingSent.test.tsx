/**
 * "Everything Submit sends" must hold every input Submit sends. This walks the submit body that
 * two recorded drives sent (the request goldens) and checks that each value it carries is drawn
 * in the disclosure: as typed, or for a code by the reader's name for it. The names are written
 * out here, not read from the page's own tables, so a wrong label is caught too.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Answers, Summary } from "../api";
import { setUpConnectedPage, type Recorded } from "./connectedTesting";
import { summaryFor } from "./goldenFixtures";
import { ReviewSheet } from "./ReviewSheet";

setUpConnectedPage();

function submitted(drive: string): { answers: Answers; digest: string } {
  const file = path.join(import.meta.dirname, "requests.golden", `${drive}.golden`);
  const log = JSON.parse(readFileSync(file, "utf8")) as Recorded[];
  const sent = log.filter(({ path: at }) => at.endsWith("/submit")).at(-1);
  if (typeof sent?.body !== "string") throw new Error(`${drive} sent no Submit`);
  return JSON.parse(sent.body) as { answers: Answers; digest: string };
}

const MODULES: Readonly<Record<string, string>> = {
  "CP-0": "Source readiness",
  "CP-1": "Financial foundation",
  "CP-1A": "Business & governance",
  "CP-1B": "Earnings changes",
  "CP-1D": "Earnings quality",
  "CP-DR": "Research questions",
  "CP-2": "Fundamental credit",
  "CP-2A": "Downside",
  "CP-2D": "Liquidity",
  "CP-2E": "Rates, FX & hedging",
  "CP-2G": "Forward credit model",
  "CP-2H": "Ratings & triggers",
  "CP-3": "Security selection",
  "CP-3C": "Refinancing & LME",
  "CP-3D": "Market-implied risk",
  "CP-4": "Legal & covenants",
  "CP-4C": "Recovery & fulcrum",
  "CP-5": "Evidence validation",
  "CP-6": "Committee decision",
};

/** The reader's name for each code these bodies carry, by the place it is sent. */
const READER: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "context.run.run_type": {
    research: "No market view (research)",
    secondary: "Trading (secondary)",
  },
  "context.run.pathway": {
    credit_snapshot: "Full credit assessment",
    deep_credit_assessment: "Deep credit assessment",
  },
  "context.run.case_kind": { synthetic: "Synthetic test case", private: "Private" },
  "context.attachments.legal_documents": {
    executed: "Executed agreement",
    draft: "Draft agreement",
  },
  "context.valuation.peer_source": { cp_dr_public: "Research finds public peers (default)" },
  "context.valuation.basis": { auto: "Automatic" },
  level: { basic: "Basic", advanced: "Advanced" },
  model: { gpt: "GPT Sol", claude: "Claude Opus" },
  effort: { balanced: "Balanced", high: "High" },
  modules: MODULES,
};

/** File boxes the run is told are filled: the disclosure names the box and its file. */
const FILE_BOXES: Readonly<Record<string, readonly [string, string]>> = {
  "context.attachments.portfolio_workbook": ["Portfolio workbook", "northbridge-portfolio.xlsx"],
};

/**
 * Values sent that are not an analyst's input, each with its reason: the context's format tag;
 * and the cash-flow model, which every pathway sends and the page never draws as a module (it is
 * a forecast, not a module; see ConnectedApp "S8 the review sheet counts and lists the service's
 * plan without CP-MODEL").
 */
const NOT_AN_INPUT = (place: string, value: unknown) =>
  place === "context.schema" || (place === "modules" && value === "CP-MODEL");

/** Every scalar the answers carry, with its place (array items share their array's place). */
function leaves(value: unknown, place = ""): [string, unknown][] {
  if (Array.isArray(value)) return value.flatMap((item) => leaves(item, place));
  if (value !== null && typeof value === "object")
    return Object.entries(value).flatMap(([key, item]) =>
      leaves(item, place ? `${place}.${key}` : key),
    );
  return [[place, value]];
}

/** How the disclosure shows a value, or undefined when it says the input was not given. */
function shown(place: string, value: unknown): string[] | undefined {
  if (value === null || value === "" || value === false) return undefined;
  const box = FILE_BOXES[place];
  if (value === true && box) return [...box];
  const reader = READER[place];
  if (reader && typeof value === "string") return [reader[value] ?? `no reader name for ${value}`];
  return typeof value === "string" || typeof value === "number"
    ? [String(value)]
    : [`a value with no words: ${JSON.stringify(value)}`];
}

function disclosed(answers: Answers) {
  const modules = answers.modules.length ? answers.modules : ["CP-0", "CP-1", "CP-4", "CP-6"];
  render(
    <ReviewSheet
      review={{
        answers,
        // The service's summary echoes the model and effort it was sent; the sheet shows those.
        summary: {
          ...summaryFor("30", modules),
          model: answers.model,
          effort: answers.effort,
        } as unknown as Summary,
        attachmentNames: {
          portfolio_workbook: "northbridge-portfolio.xlsx",
          agreement: "northbridge-credit-agreement.txt",
        },
      }}
      accepted={new Set()}
      onAccept={vi.fn()}
      onEdit={vi.fn()}
      onModules={vi.fn()}
      disabled={false}
      synthetic
    />,
  );
  const text = screen.getByRole("region", { name: "What will run" }).textContent;
  const missing = leaves(answers)
    .filter(([place, value]) => !NOT_AN_INPUT(place, value))
    .flatMap(([place, value]) =>
      (shown(place, value) ?? [])
        .filter((words) => !text.includes(words))
        .map((words) => `${place}: ${words}`),
    );
  return missing;
}

describe("Everything Submit sends", () => {
  it.each(["northbridge-synthetic", "deep-advanced-live"])(
    "draws every value the %s drive's Submit sent",
    (drive) => {
      expect(disclosed(submitted(drive).answers)).toEqual([]);
    },
  );

  it("draws the date of the newest file when the analyst set it", () => {
    const { answers } = submitted("northbridge-synthetic");
    expect(disclosed({ ...answers, newest_document_date: "2025-03-15" })).toEqual([]);
    expect(screen.getByRole("region", { name: "What will run" })).toHaveTextContent(
      "Date of your newest file2025-03-15",
    );
  });
});
