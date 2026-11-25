/**
 * The More context step's sections and the one line each closed section shows: what the form
 * holds, in plain words, computed from the form alone.
 */
import { drawnModules, moduleName } from "../api";
import { ASSUMPTIONS_TITLE, PINS, type AssumptionsForm } from "./assumptions";
import type { FieldKey } from "./fields";
import type { Attachment, IntakeView } from "./intake";
import {
  ATTACHMENTS,
  choiceLabel,
  copilotEfforts,
  copilotPairVerified,
  EFFORTS,
  ISSUER_DETAILS,
  ISSUER_LIST_BOXES,
  ISSUER_TEXT_BOXES,
  LEGAL_CHOICES,
  LEGAL_DOCUMENTS,
  MODELS,
} from "./plain";
import { sendableRows, type Row, type RowField, type RowKind } from "./rows";
import {
  BASIS_FIELD,
  CP3_FIELD,
  DEEP_DEBATE,
  MODULE_OPTIONS_TITLE,
  PEER_SOURCE_FIELD,
  peerKind,
  showsPeers,
  showsPrecedents,
  VALUATION_TITLE,
  type ModuleOptionsForm,
  type ValuationForm,
} from "./valuation";

/** The sections, in the order they are drawn. */
export const SECTION_TITLES = {
  research: "For the research",
  dates: "Dates and periods",
  legal: LEGAL_DOCUMENTS,
  files: "Files with a role",
  deal: "Ratings, quotes and facilities",
  issuer: ISSUER_DETAILS,
  valuation: VALUATION_TITLE,
  module_options: MODULE_OPTIONS_TITLE,
  assumptions: ASSUMPTIONS_TITLE,
  model: "Model and modules",
} as const;

export type SectionKey = keyof typeof SECTION_TITLES;

const SECTION_OF_FIELD: Partial<Record<FieldKey, SectionKey>> = {
  analyst_note: "research",
  research_questions: "research",
  cutoff: "dates",
  current_period: "dates",
  prior_period: "dates",
  legal_documents: "legal",
  agreement: "legal",
  ratings: "deal",
  quotes: "deal",
  deal_terms: "deal",
  valuation: "valuation",
  module_options: "module_options",
  assumptions: "assumptions",
  turns: "model",
};

/** The section that holds a control a problem can name; undefined for one on another step. */
export function sectionOfField(field: FieldKey | undefined): SectionKey | undefined {
  return field === undefined ? undefined : SECTION_OF_FIELD[field];
}

const NOT_GIVEN = "Not given";

/** "no quotes", "1 quote", "3 quotes". */
export function count(n: number, one: string, many: string) {
  if (n === 0) return `no ${many}`;
  return n === 1 ? `1 ${one}` : `${String(n)} ${many}`;
}

/** The parts of one line, joined by middots, the first letter capitalised. */
function line(parts: readonly (string | false)[]) {
  const text = parts.filter(Boolean).join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "a", "a and b", "a, b and c". */
function wordList(words: readonly string[]) {
  return words.length < 2
    ? (words[0] ?? "")
    : `${words.slice(0, -1).join(", ")} and ${words.at(-1) ?? ""}`;
}

type RowsView = Pick<IntakeView, "rowsOf" | "run">;

/** The rows of a kind that would be sent: a row nothing was typed into is not counted. */
function sentRows(view: RowsView, kind: RowKind) {
  return sendableRows(kind, view.rowsOf(kind), view.run.run_type === "primary").length;
}

export function researchSummary(view: RowsView & Pick<IntakeView, "analystNote">) {
  const note = view.analystNote.trim() !== "";
  if (!note && !view.rowsOf("research_questions").length) return NOT_GIVEN;
  return line([
    note ? "note given" : "no note",
    rowsPart(view, "research_questions", "question", "questions"),
  ]);
}

function periodsPhrase(current: string, prior: string, required: boolean) {
  if (!current && !prior) return required ? "periods required, not given" : "periods not given";
  const given = `current ${current || "not given"}, prior ${prior || "not given"}`;
  return required ? `periods required: ${given}` : given;
}

/** For an Earnings Update the periods come first and are said to be required. */
export function datesSummary(view: Pick<IntakeView, "run" | "newest" | "earnings">) {
  const cutoff = view.run.cutoff || view.run.as_of;
  const dated = cutoff ? `cutoff ${cutoff}` : "cutoff not given";
  const periods = periodsPhrase(
    view.run.current_period ?? "",
    view.run.prior_period ?? "",
    view.earnings,
  );
  return line([
    ...(view.earnings ? [periods, dated] : [dated, periods]),
    view.newest !== "" && `newest file ${view.newest}`,
  ]);
}

type FilesView = Pick<IntakeView, "attachments" | "fileChoices">;

/** The file chosen for a box, when it is one of the inspected files the box offers. */
function chosenFile(view: FilesView, key: Attachment) {
  const name = view.attachments[key] ?? "";
  return name !== "" && Object.hasOwn(view.fileChoices, name) ? name : "";
}

export function legalSummary(view: FilesView & Pick<IntakeView, "legal">) {
  const choice = choiceLabel(LEGAL_CHOICES, view.legal);
  if (choice === undefined) return NOT_GIVEN;
  if (view.legal === "none") return choice;
  return line([choice, chosenFile(view, "agreement") || "agreement file not chosen"]);
}

export type FileRole = Exclude<Attachment, "agreement">;

/** The file boxes the pathway and form level draw, in order; none for most Basic pathways. */
export function fileRoles(view: Pick<IntakeView, "earnings" | "level" | "run">): FileRole[] {
  const advanced = view.level === "advanced";
  const { pathway } = view.run;
  const others = (["portfolio_workbook", "prior_case"] as const).filter(
    (key) =>
      advanced ||
      pathway === "portfolio_decision" ||
      (key === "portfolio_workbook" &&
        ["credit_snapshot", "deep_credit_assessment"].includes(pathway)),
  );
  return [...(view.earnings || advanced ? (["management_bridge"] as const) : []), ...others];
}

export function filesSummary(view: FilesView, roles: readonly FileRole[]) {
  const chosen = roles
    .map((key) => [ATTACHMENTS[key], chosenFile(view, key)] as const)
    .filter(([, name]) => name !== "")
    .map(([title, name]) => `${title}: ${name}`);
  return chosen.length ? chosen.join(" · ") : "None chosen";
}

/**
 * Rows drawn but not sent: those nothing was typed into, and those holding only new-issue terms
 * on a run that is not a new issue. The line says each, so a drawn row never reads as nothing.
 */
function unsentRows(view: RowsView, kind: RowKind) {
  const rows = view.rowsOf(kind);
  const blank = rows.filter((row) => sendableRows(kind, [row], true).length === 0).length;
  return { blank, newIssueOnly: rows.length - sentRows(view, kind) - blank };
}

const rowWord = (n: number) => (n === 1 ? "row" : "rows");

/** "1 facility"; rows not sent are said after it: "1 facility row, not filled". */
function rowsPart(view: RowsView, kind: RowKind, one: string, many: string) {
  const sent = sentRows(view, kind);
  const { blank, newIssueOnly } = unsentRows(view, kind);
  const unsent = [
    blank > 0 && `${String(blank)} ${one} ${rowWord(blank)}, not filled`,
    newIssueOnly > 0 &&
      `${String(newIssueOnly)} ${one} ${rowWord(newIssueOnly)} with new-issue terms only, not sent`,
  ].filter((part) => part !== false);
  return [...(sent || !unsent.length ? [count(sent, one, many)] : []), ...unsent].join(" · ");
}

export function dealSummary(view: RowsView) {
  const kinds = ["ratings", "quotes", "deal_terms"] as const;
  const facilities = sentRows(view, "deal_terms");
  const required = view.run.run_type === "primary" && facilities === 0;
  const drawn = kinds.some((kind) => view.rowsOf(kind).length > 0);
  if (!drawn && !required) return NOT_GIVEN;
  return line([
    rowsPart(view, "ratings", "rating", "ratings"),
    rowsPart(view, "quotes", "quote", "quotes"),
    required && view.rowsOf("deal_terms").length === 0
      ? "no facilities, at least one required"
      : rowsPart(view, "deal_terms", "facility", "facilities"),
  ]);
}

const LIST_WORDS: Record<(typeof ISSUER_LIST_BOXES)[number][0], [string, string]> = {
  aliases: ["other name", "other names"],
  guarantors: ["guarantor", "guarantors"],
};

export function issuerSummary(view: Pick<IntakeView, "identity">) {
  const { identity } = view;
  const named = ISSUER_TEXT_BOXES.filter(([key]) => (identity[key] ?? "").trim() !== "").map(
    ([, title]) => title.replace(/\s*\(.*\)$/, "").toLowerCase(),
  );
  const lists = ISSUER_LIST_BOXES.map(([key]) => [key, identity[key]?.length ?? 0] as const)
    .filter(([, n]) => n > 0)
    .map(([key, n]) => count(n, ...LIST_WORDS[key]));
  const ticker = (identity.ticker ?? "").trim();
  const listedEquity =
    identity.listed_equity === true &&
    (ticker ? `listed equity, ticker ${ticker}` : "listed equity, no ticker");
  if (!named.length && !lists.length && !listedEquity) return NOT_GIVEN;
  return line([named.length > 0 && `${wordList(named)} given`, ...lists, listedEquity]);
}

function optionLabel(item: RowField, value: string) {
  return item.options?.find(([option]) => option === value)?.[1] ?? value;
}

/** "valuation basis: Precedents, 2 precedents": a choice by its control's label, and what it adds. */
function choice(item: RowField, value: string, rows: string | false = false) {
  return [`${item.label.toLowerCase()}: ${optionLabel(item, value)}`, rows]
    .filter(Boolean)
    .join(", ");
}

const typedRows = (kind: RowKind, rows: readonly Row[]) => sendableRows(kind, rows, true).length;

export function valuationSummary(form: ValuationForm) {
  const { peer_source: source, basis } = form;
  const peers = typedRows(peerKind(source), form.peers);
  const precedents = typedRows("precedents", form.precedents);
  return line([
    choice(PEER_SOURCE_FIELD, source, showsPeers(source) && count(peers, "peer", "peers")),
    choice(
      BASIS_FIELD,
      basis,
      showsPrecedents(basis) && count(precedents, "precedent", "precedents"),
    ),
  ]);
}

export function moduleOptionsSummary(
  form: ModuleOptionsForm,
  runs: { cp3: boolean; cp6: boolean },
) {
  return line([
    runs.cp3 && choice(CP3_FIELD, form.cp3_mode),
    runs.cp6 && `${DEEP_DEBATE} ${form.cp6_deep_debate ? "on" : "off"}`,
  ]);
}

export function assumptionsSummary(form: AssumptionsForm, modules: readonly string[]) {
  const shown = PINS.filter((pin) => modules.includes(pin.module));
  if (!shown.length) return "No module in this run takes a pinned value";
  const pinned = shown.filter((pin) => form[pin.key] !== null).map((pin) => moduleName(pin.module));
  return pinned.length ? `${String(pinned.length)} pinned: ${pinned.join(", ")}` : "None pinned";
}

type ModelView = Pick<IntakeView, "copilotModels" | "model" | "effort">;

/** The models and efforts offered for the seat, and the effort the picker shows. */
export function modelChoices(view: ModelView) {
  const efforts = copilotEfforts(view.copilotModels, view.model);
  const models: Record<string, string> = copilotPairVerified(view.copilotModels, "luna", "xhigh")
    ? MODELS
    : { gpt: MODELS.gpt, claude: MODELS.claude };
  const effortChoices: Record<string, string> = Object.fromEntries(
    Object.entries(EFFORTS).filter(([key]) => efforts.includes(key)),
  );
  if (!Object.keys(effortChoices).length) effortChoices.none = "No verified effort available";
  const effort = effortChoices[view.effort] ? view.effort : (Object.keys(effortChoices)[0] ?? "");
  return { efforts, models, effortChoices, effort };
}

export function modelSummary(
  view: ModelView & Pick<IntakeView, "turns" | "requested" | "modules">,
) {
  const { effortChoices, effort } = modelChoices(view);
  const drawn = drawnModules(view.requested);
  const on = drawn.filter((code) => !view.modules.length || view.modules.includes(code)).length;
  const total = String(drawn.length);
  return line([
    choiceLabel(MODELS, view.model) ?? view.model,
    effortChoices[effort] ?? "",
    view.turns.trim() ? `${view.turns.trim()} turns per module` : "turns not given",
    on === drawn.length ? `all ${total} modules` : `${String(on)} of ${total} modules`,
  ]);
}
