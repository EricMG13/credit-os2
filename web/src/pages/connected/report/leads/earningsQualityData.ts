import { readerText, type OutputEntry, type Table } from "../../publishedReport";
import { namesSource, reasonText, safeText } from "./kit/reader";
import { difference, group, readCell, signOf, sum } from "./kit/numbers";
import { allTables, tableWith } from "./kit/tables";

/*
 * Reads what the CP-1D contract names (src/deploy_vii/bindings/cp1d.py, src/deploy_workflow/owners/cp1d.py):
 * the bridge as a `Step | Amount | Reporting unit | Basis and limitation` table (opening, add-backs,
 * closing; apps/issuer-library handoff_fields.py), the add-back assessment (T1D.2: the add-back's
 * name in its first column and an `Achievability` column) and the cash conversion and leverage
 * table (T1D.6: `Total leverage`, `Net leverage`; rows Statements, Management financing case, Supported).
 * Nothing else is read; whatever is not recognised is a gap in words.
 */

/** The text closed by one full stop; one the module already wrote is not doubled. */
const end = (text: string) => (text.endsWith(".") ? text : `${text}.`);

const norm = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();

type Support = "Supported" | "Partly supported" | "Not supported" | "Insufficient evidence";
const SUPPORT_WORDS: Support[] = [
  "Supported",
  "Partly supported",
  "Not supported",
  "Insufficient evidence",
];

/** The accepted and not accepted amounts the assessment states for a step, when they make up the step. */
type Split = { accepted: string; notAccepted: string };

type Step = { label: string; amount: string; value: number; line: number };

export type Bridge = {
  state: "ready";
  unit: string;
  /** The heading of the section the bridge is in, to say which chart this lead draws. */
  heading: string;
  line: number;
  opening: Step;
  closing: Step;
  /** The add-backs, in the order the handoff states them. */
  changes: (Step & {
    support: Support | null;
    split: Split | null;
    /** The assessment's accepted and not accepted cells as written ("" without the column). */
    accepted: string;
    notAccepted: string;
  })[];
  /** Whether the assessment table is there and states a word for at least one add-back. */
  supportStated: boolean;
  notes: string[];
};
export type BridgeGap = {
  state: "gap";
  /** The heading of the section the bridge was looked for in, "" when there is none. */
  heading: string;
  reason: string;
  /** The steps the handoff states, to list as text when they cannot be drawn. */
  stated: { label: string; text: string }[];
};

function stepTable(entry: OutputEntry): { table: Table; heading: string } | null | "several" {
  const found = allTables(entry).filter(
    ({ table }) => table.headers.includes("Step") && table.headers.includes("Amount"),
  );
  if (found.length <= 1) return found[0] ?? null;
  const bridges = found.filter(({ heading }) => /bridge/i.test(heading));
  return bridges.length === 1 ? (bridges[0] ?? null) : "several";
}

/**
 * What the assessment table states per add-back name: the support word and, where it states both
 * accepted and not accepted amounts, those amounts. A name that appears twice cannot be matched.
 */
function assessmentByName(entry: OutputEntry) {
  const table = tableWith(entry, ["Achievability"]);
  const names = new Map<
    string,
    { support: Support | null; accepted: string; notAccepted: string }
  >();
  const at = table?.headers.indexOf("Achievability") ?? -1;
  const acceptedAt = table?.headers.indexOf("Accepted amount") ?? -1;
  const notAcceptedAt = table?.headers.indexOf("Not accepted") ?? -1;
  const none = { support: null, accepted: "", notAccepted: "" };
  for (const row of table?.rows ?? []) {
    const name = norm(row.cells[0] ?? "");
    const word = SUPPORT_WORDS.find((item) => norm(item) === norm(row.cells[at] ?? "")) ?? null;
    names.set(
      name,
      names.has(name)
        ? none
        : {
            support: word,
            accepted: acceptedAt < 0 ? "" : (row.cells[acceptedAt] ?? ""),
            notAccepted: notAcceptedAt < 0 ? "" : (row.cells[notAcceptedAt] ?? ""),
          },
    );
  }
  return names;
}

/** Both amounts plain numbers that make up the step exactly: only then is the step drawn as two parts. */
function splitOf(step: Step, stated: { accepted: string; notAccepted: string } | undefined) {
  const accepted = readCell(stated?.accepted ?? "");
  const notAccepted = readCell(stated?.notAccepted ?? "");
  if (accepted.kind !== "number" || notAccepted.kind !== "number") return null;
  // A stated zero is a value: 217 accepted and 0 not accepted is a split.
  if (accepted.value < 0 || notAccepted.value < 0) return null;
  const made = sum([accepted.text, notAccepted.text]);
  return made !== null && signOf(difference(step.amount, made)) === 0
    ? { accepted: accepted.text, notAccepted: notAccepted.text }
    : null;
}

const gapOf = (reason: string, stated: BridgeGap["stated"] = [], heading = ""): BridgeGap => ({
  state: "gap",
  heading,
  reason,
  stated,
});

/** The add-back bridge, reconciled; or the gap, with the stated steps to list as words. */
export function readBridge(entry: OutputEntry): Bridge | BridgeGap {
  const found = stepTable(entry);
  const table = found === "several" || found === null ? found : found.table;
  const heading = found === "several" || found === null ? "" : found.heading;
  if (table === "several")
    return gapOf(
      "This page could not read the earnings quality bridge because it appears more than once.",
    );
  if (!table) return gapOf("This page could not read the earnings quality bridge.");
  const unitAt = table.headers.indexOf("Reporting unit");
  const amountAt = table.headers.indexOf("Amount");
  const basisAt = table.headers.indexOf("Basis and limitation");
  const stated = table.rows.map((row) => {
    const cell = safeText(row.cells[amountAt] ?? "");
    const unit = unitAt < 0 ? "" : safeText(row.cells[unitAt] ?? "");
    return { label: safeText(row.cells[0] ?? ""), text: unit ? `${cell} ${unit}` : cell };
  });
  if (table.rows.length < 2)
    return gapOf("This page could not read two steps of the bridge.", stated, heading);
  const units = new Set(
    table.rows.map((row) => (unitAt < 0 ? "" : (row.cells[unitAt] ?? "").trim())),
  );
  const [unit = ""] = units;
  if (units.size !== 1 || !unit)
    return gapOf(
      unitAt < 0
        ? "This page could not read the reporting unit of the bridge."
        : "This page could not read the bridge steps in one reporting unit.",
      stated,
      heading,
    );
  const steps = table.rows.map((row) => ({
    label: safeText(row.cells[0] ?? ""),
    reading: readCell(row.cells[amountAt] ?? ""),
    line: row.line,
  }));
  const bad = steps.find((step) => step.reading.kind !== "number");
  if (bad)
    return gapOf(
      bad.reading.kind === "gap"
        ? `This page could not read the bridge because ${bad.label} is not supplied: ${end(reasonText(bad.reading.reason))}`
        : `This page could not read “${safeText(bad.reading.text)}” as an amount for ${bad.label}, so the bridge is not drawn.`,
      stated,
      heading,
    );
  const read: Step[] = steps.map((step) => {
    if (step.reading.kind !== "number") throw new Error("unreachable: steps are numbers here");
    return {
      label: step.label,
      amount: step.reading.text,
      value: step.reading.value,
      line: step.line,
    };
  });
  const [opening, ...rest] = read;
  const closing = rest.pop();
  if (!opening || !closing)
    return gapOf("This page could not read two steps of the bridge.", stated, heading);
  const rebuilt = sum([opening.amount, ...rest.map((step) => step.amount)]);
  if (rebuilt === null || signOf(difference(closing.amount, rebuilt)) !== 0)
    return gapOf(
      `This page did not draw the bridge because the steps between ${opening.label} (${group(opening.amount)}) and ${closing.label} (${group(closing.amount)}) do not add up.`,
      stated,
      heading,
    );
  const names = assessmentByName(entry);
  const changes = rest.map((step) => {
    const found = names.get(norm(step.label));
    return {
      ...step,
      support: found?.support ?? null,
      split: splitOf(step, found),
      accepted: found?.accepted.trim() ? safeText(found.accepted) : "",
      notAccepted: found?.notAccepted.trim() ? safeText(found.notAccepted) : "",
    };
  });
  const notes = [
    ...new Set(
      table.rows.flatMap((row) => {
        const text = basisAt < 0 ? "" : (row.cells[basisAt] ?? "").trim();
        return text && !namesSource(text) ? [readerText(text)] : [];
      }),
    ),
  ];
  return {
    state: "ready",
    unit: safeText(unit),
    heading,
    line: table.line,
    opening,
    closing,
    changes,
    supportStated: changes.some((step) => step.support !== null),
    notes,
  };
}

/** One basis of a leverage measure: the stated multiple, or the words / reason the table states instead. */
export type Side = { value: number; text: string } | { gap: string; written: string };

type LeverageMeasure = { measure: string; reported: Side; restated: Side };

/** A multiple as the table writes it: a number with or without a trailing `x`, else words or a gap as written. */
function sideOf(cell: string): Side {
  const reading = readCell(cell.trim().replace(/x$/i, ""));
  if (reading.kind === "number")
    return { value: reading.value, text: `${reading.written ?? group(reading.text)}x` };
  const written = safeText(cell);
  return reading.kind === "gap"
    ? { gap: reasonText(reading.reason), written }
    : { gap: written, written };
}

const BASIS_ROWS = { reported: "statements", restated: "supported" } as const;
const MEASURES = ["Total leverage", "Net leverage"] as const;

export type Leverage =
  { state: "ready"; line: number; measures: LeverageMeasure[] } | { state: "gap"; reason: string };

/** Leverage on the statements and on supported earnings, each side as the table states it. */
export function readLeverage(entry: OutputEntry): Leverage {
  const table = tableWith(entry, ["Total leverage", "Net leverage"]);
  if (!table)
    return {
      state: "gap",
      reason: "This page could not read the leverage on the statements and on supported earnings.",
    };
  const rowOf = (basis: string) =>
    table.rows.filter((row) => norm(row.cells[0] ?? "").replace(/\s*\(cp-1\)$/, "") === basis);
  const reported = rowOf(BASIS_ROWS.reported);
  const restated = rowOf(BASIS_ROWS.restated);
  const [from] = reported;
  const [to] = restated;
  if (reported.length !== 1 || restated.length !== 1 || !from || !to)
    return {
      state: "gap",
      reason:
        "This page could not read one row each for the statements and for supported earnings.",
    };
  const measures = MEASURES.map((header): LeverageMeasure => {
    const at = table.headers.indexOf(header);
    return {
      measure: header,
      reported: sideOf(from.cells[at] ?? ""),
      restated: sideOf(to.cells[at] ?? ""),
    };
  });
  return { state: "ready", line: table.line, measures };
}

/** The chart title the store publishes for a `Chart data:` heading ("Add-back share"), or null. */
export function chartTitleOf(heading: string) {
  if (!heading.startsWith("Chart data: ")) return null;
  const name = heading.slice("Chart data: ".length).trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
