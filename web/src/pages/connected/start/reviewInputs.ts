import { moduleName, type Context } from "../api";
import { ASSUMPTIONS_TITLE, PINS } from "./assumptions";
import {
  ANY_FOCUS,
  ATTACHMENTS,
  choiceLabel,
  CONTEXT_DETAILS,
  ISSUER_DETAILS,
  ISSUER_LIST_BOXES,
  ISSUER_TEXT_BOXES,
  LEGAL_CHOICES,
  LEGAL_DOCUMENTS,
  LISTED_EQUITY,
  TICKER,
} from "./plain";
import { CONTEXT_ROW_KINDS, ROW_SPECS, text, type Row, type RowField, type RowKind } from "./rows";
import {
  BASIS_FIELD,
  CP3_FIELD,
  DEEP_DEBATE,
  MARKET_FIELDS,
  MODULE_OPTIONS_TITLE,
  MULTIPLE_FIELDS,
  PART_TITLES,
  PEER_SOURCE_FIELD,
  peerKind,
  showsPeers,
  showsPrecedents,
  VALUATION_TITLE,
} from "./valuation";

/** How the review words an input that is blank or was not sent: never as 0. */
export const NOT_GIVEN = "Not given";
/** A file box that named a file: the run is told only that the file is among its documents. */
const AMONG_DOCUMENTS = "Among the documents";

type Fact = readonly [label: string, value: string];
/** Inputs as the start page groups them; a group with no facts and no groups reads as not given. */
export type InputGroup = { title: string; facts: readonly Fact[]; groups: readonly InputGroup[] };

function record(raw: unknown): Row | undefined {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) ? (raw as Row) : undefined;
}

/** A sent value in words: text as typed, a list joined by commas; blank or absent is not given. */
export function given(raw: unknown): string {
  const items: unknown[] = Array.isArray(raw) ? raw : [raw];
  const value = items
    .flatMap((item) => (typeof item === "string" || typeof item === "number" ? [String(item)] : []))
    .filter((item) => item.trim())
    .join(", ");
  return value || NOT_GIVEN;
}

const isBlank = (raw: unknown) => given(raw) === NOT_GIVEN;

/** An option's label; blank or absent is not given; a value the screen does not offer has none. */
export function chosen(choices: Readonly<Record<string, string>>, value: string | undefined) {
  return value ? choiceLabel(choices, value) : NOT_GIVEN;
}

/** A box's value: an option by its label, a focus module by its name, anything else as given. */
function boxValue(item: RowField, row: Row): string {
  const value = row[item.key];
  if (item.key === "focus_module")
    return typeof value === "string" && value ? moduleName(value) : ANY_FOCUS;
  return item.options?.find(([option]) => option === value)?.[1] ?? given(value);
}

const factsOf = (fields: readonly RowField[], row: Row): Fact[] =>
  fields.map((item) => [item.label, boxValue(item, row)]);

/** A row section: each row by its title and number, with each box `drawn` keeps. */
function rowSection(
  kind: RowKind,
  raw: unknown,
  drawn: (item: RowField, row: Row) => boolean = () => true,
): InputGroup {
  const spec = ROW_SPECS[kind];
  const rows = Array.isArray(raw) ? raw.map((row) => record(row) ?? {}) : [];
  return {
    title: spec.section,
    facts: [],
    groups: rows.map((row, at) => ({
      title: `${spec.title} ${String(at + 1)}`,
      facts: factsOf(
        spec.fields.filter((item) => drawn(item, row)),
        row,
      ),
      groups: [],
    })),
  };
}

/** The legal documents choice, and whether each other file box named a document. */
export function attachmentFacts(
  { attachments }: Context,
  names: Readonly<Record<string, string | undefined>> = {},
): Fact[] {
  const sent = record(attachments);
  const legal = sent && choiceLabel(LEGAL_CHOICES, text(sent, "legal_documents"));
  return [
    [LEGAL_DOCUMENTS, legal ?? NOT_GIVEN],
    ...Object.entries(ATTACHMENTS).map(([key, title]): Fact => [
      title,
      sent?.[key] === true ? names[key] || AMONG_DOCUMENTS : NOT_GIVEN,
    ]),
  ];
}

function listedWord(listed: boolean | undefined) {
  if (listed === undefined) return NOT_GIVEN;
  return listed ? "Yes" : "No";
}

/** The Issuer details boxes; the ticker only for a listed issuer, as the page draws it. */
export function issuerDetails({ identity }: Context): InputGroup {
  const listed = identity.listed_equity;
  const ticker: Fact[] =
    listed || !isBlank(identity.ticker) ? [[TICKER, given(identity.ticker)]] : [];
  return {
    title: ISSUER_DETAILS,
    facts: [
      ...[...ISSUER_TEXT_BOXES, ...ISSUER_LIST_BOXES].map(([key, title]): Fact => [
        title,
        given(identity[key]),
      ]),
      [LISTED_EQUITY, listedWord(listed)],
      ...ticker,
    ],
    groups: [],
  };
}

/** The Context details sections; a new issue's boxes only for a new issue, or when filled. */
export function contextDetails(context: Context): InputGroup {
  const primary = context.run.run_type === "primary";
  return {
    title: CONTEXT_DETAILS,
    facts: [],
    groups: CONTEXT_ROW_KINDS.map((kind) =>
      rowSection(
        kind,
        context[kind],
        (item, row) => primary || !item.primaryOnly || !isBlank(row[item.key]),
      ),
    ),
  };
}

const partGroup = (title: string, fields: readonly RowField[], raw: unknown): InputGroup => ({
  title,
  facts: factsOf(fields, record(raw) ?? {}),
  groups: [],
});

/**
 * The parts of the valuation the chosen basis does not use, with only the values they still
 * carry (the form sends their defaults, such as an EBITDA basis of LTM, whatever the basis).
 */
function unusedParts(sent: Row, basis: string): InputGroup[] {
  const parts = [
    basis !== "issuer_trading" &&
      partGroup(PART_TITLES.issuer_market, MARKET_FIELDS, sent.issuer_market),
    basis !== "user_multiple" &&
      partGroup(PART_TITLES.user_multiple, MULTIPLE_FIELDS, sent.user_multiple),
  ].filter((group) => group !== false);
  return parts
    .map((group) => ({ ...group, facts: group.facts.filter(([, value]) => value !== NOT_GIVEN) }))
    .filter((group) => group.facts.length > 0);
}

/**
 * Valuation and peers as sent: its two choices, then each part they use (the service refuses a
 * filled part they do not use), then what the parts it does not use still carry, so every value
 * sent is drawn. Not sent, it reads as not given where the page offers it.
 */
export function valuationInputs({ valuation }: Context, offered: boolean): InputGroup | undefined {
  const sent = record(valuation);
  if (!sent) return offered ? { title: VALUATION_TITLE, facts: [], groups: [] } : undefined;
  const source = text(sent, "peer_source");
  const basis = text(sent, "basis");
  const groups = [
    showsPeers(source) && rowSection(peerKind(source), sent.peers),
    showsPrecedents(basis) && rowSection("precedents", sent.precedents),
    basis === "issuer_trading" &&
      partGroup(PART_TITLES.issuer_market, MARKET_FIELDS, sent.issuer_market),
    basis === "user_multiple" &&
      partGroup(PART_TITLES.user_multiple, MULTIPLE_FIELDS, sent.user_multiple),
  ].filter((group) => group !== false);
  const unused = unusedParts(sent, basis);
  if (unused.length)
    groups.push({ title: "Also sent, not used by this basis", facts: [], groups: unused });
  return { title: VALUATION_TITLE, facts: factsOf([PEER_SOURCE_FIELD, BASIS_FIELD], sent), groups };
}

/**
 * Module options for the modules the pathway runs, and a choice sent for one it does not. Not
 * sent, they read as not given where the page offers them.
 */
export function moduleOptionInputs(
  { module_options }: Context,
  modules: readonly string[],
  offered: boolean,
): InputGroup | undefined {
  const sent = record(module_options);
  const mode = modules.includes("CP-3") || !isBlank(sent?.cp3_mode);
  const debate = modules.includes("CP-6") || sent?.cp6_deep_debate === true;
  if (!(mode || debate) || !(sent || offered)) return undefined;
  const facts: Fact[] = [];
  if (sent && mode) facts.push([CP3_FIELD.label, boxValue(CP3_FIELD, sent)]);
  if (sent && debate) facts.push([DEEP_DEBATE, sent.cp6_deep_debate === true ? "On" : "Off"]);
  return { title: MODULE_OPTIONS_TITLE, facts, groups: [] };
}

function pinGroup(pin: (typeof PINS)[number], values: Row | undefined): InputGroup {
  return {
    title: moduleName(pin.module),
    facts: values ? factsOf(pin.fields, values) : [],
    groups: values && pin.key === "cp2a" ? [rowSection("scenarios", values.scenarios)] : [],
  };
}

/**
 * Scenario assumptions: a group per module the pathway runs, unpinned as not given, and any pin
 * sent for a module it does not run. Not sent, they read as not given where the page offers them.
 */
export function assumptionInputs(
  { assumptions }: Context,
  modules: readonly string[],
  offered: boolean,
): InputGroup | undefined {
  const sent = record(assumptions);
  const pins = PINS.filter(
    (pin) => modules.includes(pin.module) || record(sent?.[pin.key]) !== undefined,
  );
  if (!pins.length || !(sent || offered)) return undefined;
  return {
    title: ASSUMPTIONS_TITLE,
    facts: [],
    groups: sent ? pins.map((pin) => pinGroup(pin, record(sent[pin.key]))) : [],
  };
}
