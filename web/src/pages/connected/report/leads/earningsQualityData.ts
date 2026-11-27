import { readerText, type OutputEntry, type Table } from "../../publishedReport";
import { namesSource, reasonText, safeText } from "./kit/reader";
import { difference, group, readCell, signOf, sum } from "./kit/numbers";
import { allTables, normalLabel, tableName, tableWith } from "./kit/tables";

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
const EXPLICIT_BRIDGE_HEADERS = [
  "Step",
  "Amount",
  "Basis",
  "Supported / Challenged / Rejected",
  "Cumulative EBITDA",
  "Evidence ID",
];

/** The accepted and not accepted amounts the assessment states for a step, when they make up the step. */
type Split = { accepted: string; notAccepted: string };

type Step = { label: string; amount: string; value: number; line: number; sign?: "" | "+" | "-" };
type ExcludedStep = Step & {
  stance: string;
  basis: string;
  support: Support | null;
  treatment: "Not credited";
};

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
    /** The bridge table's own support cell for the step ("Rejected for …", "Challenged; …"), "" without it. */
    stance: string;
    /** The module's basis cell for the step, "" without it or where it names a source. */
    basis: string;
  })[];
  /** Explicitly excluded amounts; they remain visible in the table but do not move the waterfall. */
  excluded: ExcludedStep[];
  /** Whether a support word is stated for at least one add-back (assessment table or the bridge's own column). */
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
  const found = allTables(entry).filter(({ table, heading }) => {
    if (!table.headers.includes("Step") || !table.headers.includes("Amount")) return false;
    const name = tableName(heading);
    return (
      /^(?:(?:quality[- ]adjusted |adjusted |reported )?ebitda|earnings(?:[- ]quality)?) bridge\b/i.test(
        name,
      ) ||
      (!/^chart data:/i.test(heading) && table.headers.includes("Cumulative EBITDA"))
    );
  });
  return found.length > 1 ? "several" : (found[0] ?? null);
}

/** The currency and scale the module states for its monetary amounts ("USD millions"), or "". */
function statedUnit(entry: OutputEntry) {
  const pattern =
    /monetary (?:amounts|quantities) are (?:consolidated )?((?:[A-Z]{3}|US\$)\s+(?:thousands|millions|billions))/i;
  for (const { blocks } of entry.sections)
    for (const block of blocks) {
      const found = block.type === "text" ? pattern.exec(block.text) : null;
      if (found?.[1]) return found[1];
    }
  return "";
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

type ExplicitMoney = {
  amount: string;
  value: number;
  unit: string;
  sign: "" | "+" | "-";
  treatment: "Not credited" | "";
};

/** One explicit currency and scale, optionally signed or explicitly marked not credited. */
function explicitMoney(cell: string): ExplicitMoney | null {
  const match =
    /^\s*([+-])?\s*(USD|US\$|[A-Z]{3})\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(m|millions?)\s*(not credited)?\s*$/i.exec(
      cell,
    );
  if (!match) return null;
  const sign = (match[1] ?? "") as ExplicitMoney["sign"];
  const treatment = match[5] ? "Not credited" : "";
  if (sign && treatment) return null;
  const raw = (match[3] ?? "").replaceAll(",", "");
  const amount = `${sign === "-" ? "-" : ""}${raw}`;
  const reading = readCell(amount);
  if (reading.kind !== "number") return null;
  return {
    amount: reading.text,
    value: reading.value,
    unit: `${(match[2] ?? "").toUpperCase().replace("US$", "USD")} millions`,
    sign,
    treatment,
  };
}

/** An exact CP-1D typed bridge: signed USD changes move the total; explicit not-credited amounts do not. */
function readExplicitBridge(entry: OutputEntry, table: Table, heading: string): Bridge | BridgeGap {
  const amountAt = table.headers.indexOf("Amount");
  const cumulativeAt = table.headers.indexOf("Cumulative EBITDA");
  const statusAt = table.headers.indexOf("Supported / Challenged / Rejected");
  const basisAt = table.headers.indexOf("Basis");
  const stated = table.rows.map((row) => ({
    label: safeText(row.cells[0] ?? ""),
    text: safeText(row.cells[amountAt] ?? ""),
  }));
  if (table.rows.length < 3)
    return gapOf("This page could not read a complete earnings quality bridge.", stated, heading);
  const amounts = table.rows.map((row) => explicitMoney(row.cells[amountAt] ?? ""));
  const cumulatives = table.rows.map((row) => explicitMoney(row.cells[cumulativeAt] ?? ""));
  if (
    amounts.some((amount) => amount === null) ||
    cumulatives.some((total) => total === null || total.sign !== "" || total.treatment !== "")
  )
    return gapOf(
      "This page could not read one explicit currency amount and cumulative total for every bridge row.",
      stated,
      heading,
    );
  const units = new Set([...amounts, ...cumulatives].flatMap((item) => (item ? [item.unit] : [])));
  const [unit = ""] = units;
  if (units.size !== 1)
    return gapOf("This page could not read the bridge in one currency and scale.", stated, heading);
  const firstAmount = amounts[0];
  const lastAmount = amounts.at(-1);
  const firstTotal = cumulatives[0];
  const lastTotal = cumulatives.at(-1);
  if (
    !firstAmount ||
    !lastAmount ||
    !firstTotal ||
    !lastTotal ||
    firstAmount.sign ||
    firstAmount.treatment ||
    lastAmount.sign ||
    lastAmount.treatment ||
    signOf(difference(firstAmount.amount, firstTotal.amount)) !== 0 ||
    signOf(difference(lastAmount.amount, lastTotal.amount)) !== 0
  )
    return gapOf(
      "This page could not identify matching opening and closing bridge amounts.",
      stated,
      heading,
    );

  const openingRow = table.rows[0];
  const closingRow = table.rows.at(-1);
  if (!openingRow || !closingRow)
    return gapOf("This page could not read two steps of the bridge.", stated, heading);
  const opening: Step = {
    label: safeText(openingRow.cells[0] ?? ""),
    amount: firstAmount.amount,
    value: firstAmount.value,
    line: openingRow.line,
  };
  const closing: Step = {
    label: safeText(closingRow.cells[0] ?? ""),
    amount: lastAmount.amount,
    value: lastAmount.value,
    line: closingRow.line,
  };
  let running = opening.amount;
  const names = assessmentByName(entry);
  const changes: Bridge["changes"] = [];
  const excluded: ExcludedStep[] = [];
  for (let at = 1; at < table.rows.length - 1; at += 1) {
    const row = table.rows[at];
    const amount = amounts[at];
    const total = cumulatives[at];
    if (!row || !amount || !total)
      return gapOf("This page could not read one of the bridge rows.", stated, heading);
    const label = safeText(row.cells[0] ?? "");
    const stance = safeText(row.cells[statusAt] ?? "");
    const basisText = row.cells[basisAt] ?? "";
    const basis = namesSource(basisText) ? "" : safeText(basisText);
    const step: Step = { label, amount: amount.amount, value: amount.value, line: row.line };
    if (amount.sign) {
      const next = sum([running, amount.amount]);
      if (next === null)
        return gapOf("This page could not reconcile the signed bridge steps.", stated, heading);
      running = next;
      const support =
        SUPPORT_WORDS.find((word) => norm(word) === norm(row.cells[statusAt] ?? "")) ?? null;
      const matched = names.get(norm(label));
      changes.push({
        ...step,
        sign: amount.sign,
        stance,
        basis,
        support: support ?? matched?.support ?? null,
        split: splitOf(step, matched),
        accepted: matched?.accepted.trim() ? safeText(matched.accepted) : "",
        notAccepted: matched?.notAccepted.trim() ? safeText(matched.notAccepted) : "",
      });
    } else if (amount.treatment === "Not credited") {
      excluded.push({
        ...step,
        sign: amount.sign,
        stance,
        basis,
        support: null,
        treatment: "Not credited",
      });
    } else {
      return gapOf(
        `This page could not determine how ${label} affects the supported bridge.`,
        stated,
        heading,
      );
    }
    if (signOf(difference(total.amount, running)) !== 0)
      return gapOf(
        `This page could not reconcile ${label} to its stated cumulative EBITDA.`,
        stated,
        heading,
      );
  }
  if (signOf(difference(closing.amount, running)) !== 0)
    return gapOf(
      "This page could not reconcile the supported closing EBITDA to its bridge steps.",
      stated,
      heading,
    );
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
    unit,
    heading,
    line: table.line,
    opening,
    closing,
    changes,
    excluded,
    supportStated: changes.some((step) => step.support !== null || step.stance !== ""),
    notes,
  };
}

function namesBridgeLevel(label: string) {
  const name = normalLabel(label);
  return (
    /(?:^| )subtotal$/.test(name) ||
    /^(?:conditional )?(?:(?:management(?: financing case)?|issuer) )?(?:(?:reported|(?:quality )?adjusted|supported(?: only)?(?: analytical)?|analytical) )?ebitda(?: as defined)?$/.test(
      name,
    )
  );
}

function isBridgeSensitivity(step: Step | undefined) {
  if (!step) return false;
  return (
    /^sensitivity\b/i.test(step.label) ||
    ((step.sign === "+" || step.amount.startsWith("-")) &&
      /^conditional\b/i.test(step.label) &&
      !namesBridgeLevel(step.label))
  );
}

/** The add-back bridge, reconciled; or the gap, with the stated steps to list as words. */
export function readBridge(entry: OutputEntry): Bridge | BridgeGap {
  const found = stepTable(entry);
  const table = found === "several" || found === null ? found : found.table;
  const heading = found === "several" || found === null ? "" : found.heading;
  if (table === "several")
    return gapOf(
      "This page could not tell which of the bridges the module wrote is the earnings quality bridge.",
    );
  if (!table) return gapOf("This page could not read the earnings quality bridge.");
  const monetaryColumns = table.headers.flatMap((header, at) =>
    header === "Amount" || header === "Cumulative EBITDA" ? [at] : [],
  );
  const hasExplicitCurrency = table.rows.some((row) =>
    monetaryColumns.some((at) => /^\s*[+-]?\s*(?:[A-Z]{3}|US\$)\s+/.test(row.cells[at] ?? "")),
  );
  if (
    /quality-adjusted EBITDA bridge/i.test(heading) &&
    table.headers.includes("Cumulative EBITDA") &&
    hasExplicitCurrency
  ) {
    if (table.headers.join("|") !== EXPLICIT_BRIDGE_HEADERS.join("|"))
      return gapOf(
        "This page could not read an unambiguous T1D.4 earnings quality bridge table.",
        table.rows.map((row) => ({
          label: safeText(row.cells[0] ?? ""),
          text: safeText(row.cells[table.headers.indexOf("Amount")] ?? ""),
        })),
        heading,
      );
    return readExplicitBridge(entry, table, heading);
  }
  const unitAt = table.headers.indexOf("Reporting unit");
  const amountAt = table.headers.indexOf("Amount");
  const basisAt = table.headers.indexOf("Basis and limitation");
  const basisOf = (cells: string[]) => safeText(cells[table.headers.indexOf("Basis")] ?? "");
  const stated = table.rows.map((row) => {
    const cell = safeText(row.cells[amountAt] ?? "");
    const unit = unitAt < 0 ? "" : safeText(row.cells[unitAt] ?? "");
    return { label: safeText(row.cells[0] ?? ""), text: unit ? `${cell} ${unit}` : cell };
  });
  if (table.rows.length < 2)
    return gapOf("This page could not read two steps of the bridge.", stated, heading);
  // Without a unit column the module's own statement of its monetary unit is the unit.
  const units = new Set(
    table.rows.map((row) => (unitAt < 0 ? statedUnit(entry) : (row.cells[unitAt] ?? "").trim())),
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
  const steps = table.rows.map((row) => {
    const cell = (row.cells[amountAt] ?? "").trim();
    const plus = /^\+(?=\s*\d)/.test(cell);
    return {
      label: safeText(row.cells[0] ?? ""),
      reading: readCell(plus ? cell.slice(1) : cell),
      sign: plus ? ("+" as const) : ("" as const),
      line: row.line,
    };
  });
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
      sign: step.sign,
      value: step.reading.value,
      line: step.line,
    };
  });
  const [opening, ...tail] = read;
  if (!opening || tail.length === 0)
    return gapOf("This page could not read two steps of the bridge.", stated, heading);
  // In the legacy bridge, only a stated sensitivity can follow the closing level.
  let closingAt = tail.length - 1;
  while (closingAt > 0 && isBridgeSensitivity(tail[closingAt])) closingAt -= 1;
  const closing = tail[closingAt];
  if (
    !closing ||
    isBridgeSensitivity(closing) ||
    (closingAt < tail.length - 1 && closing.sign === "+" && !namesBridgeLevel(closing.label))
  )
    return gapOf("This page could not identify the stated closing bridge amount.", stated, heading);
  const rest: Step[] = [];
  const subtotalNotes: string[] = [];
  for (const step of tail.slice(0, closingAt)) {
    if (!step.sign && namesBridgeLevel(step.label)) {
      const before = sum([opening.amount, ...rest.map((change) => change.amount)]);
      if (before === null || signOf(difference(step.amount, before)) !== 0)
        return gapOf(
          `This page could not reconcile ${step.label} (${group(step.amount)}) to the preceding bridge steps.`,
          stated,
          heading,
        );
      subtotalNotes.push(`${step.label} ${group(step.amount)}`);
    } else {
      rest.push(step);
    }
  }
  const rebuilt = sum([opening.amount, ...rest.map((step) => step.amount)]);
  if (rebuilt === null || signOf(difference(closing.amount, rebuilt)) !== 0)
    return gapOf(
      `This page did not draw the bridge because the steps between ${opening.label} (${group(opening.amount)}) and ${closing.label} (${group(closing.amount)}) do not add up.`,
      stated,
      heading,
    );
  const after = tail.slice(closingAt + 1).map((step, at) => {
    const cells = table.rows[closingAt + 2 + at]?.cells ?? [];
    const basis = basisOf(cells);
    const amount = safeText(cells[amountAt] ?? step.amount);
    return { label: step.label, text: basis ? `${amount} (${basis})` : amount };
  });
  const names = assessmentByName(entry);
  const stanceAt = table.headers.findIndex(
    (header) => /support|reject|challeng/i.test(header) && !/evidence|cumulative/i.test(header),
  );
  const changes = rest.map((step) => {
    const found = names.get(norm(step.label));
    const cells = table.rows.find((row) => row.line === step.line)?.cells ?? [];
    const stance = stanceAt < 0 ? "" : safeText(cells[stanceAt] ?? "");
    const basis = basisOf(cells);
    return {
      stance,
      basis: namesSource(basis) ? "" : basis,
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
    ...subtotalNotes,
    // A step stated after the closing amount (a sensitivity) is not drawn; it is written as the module wrote it.
    ...after.map((step) => `${step.label} ${step.text}`),
  ];
  return {
    state: "ready",
    unit: safeText(unit),
    heading,
    line: table.line,
    opening,
    closing,
    changes,
    excluded: [],
    supportStated: changes.some((step) => step.support !== null || step.stance !== ""),
    notes,
  };
}

/** One basis of a leverage measure: the stated multiple, or the words / reason the table states instead. */
export type Side =
  { value: number; text: string; written?: string } | { gap: string; written: string };

type LeverageMeasure = {
  measure: string;
  reported: Side;
  restated: Side;
  /** The other EBITDA bases the table states, in its column order (see `others` of the lead). */
  others?: Side[];
  /** The table's delta cell as the module wrote it. */
  delta?: string;
};

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

/** A cell that opens with a multiple and goes on in words ("6.53x; denominator 3813"): the multiple, the words kept. */
function leadingMultiple(cell: string): Side {
  const found = /^(\d+(?:\.\d+)?)x(?![\w.])/i.exec(cell.trim());
  if (!found?.[1]) return sideOf(cell);
  return { value: Number(found[1]), text: `${found[1]}x`, written: safeText(cell) };
}

const BASIS_ROWS = { reported: "statements", restated: "supported" } as const;
const MEASURES = ["Total leverage", "Net leverage"] as const;

export type Leverage =
  | {
      state: "ready";
      line: number;
      measures: LeverageMeasure[];
      /** What the two sides are, in the table's words. */
      labels: { reported: string; restated: string };
      /** The further basis columns the table states ("On Adjusted EBITDA" as "Adjusted EBITDA"). */
      others?: { label: string }[];
      /** The delta column's header as written. */
      deltaLabel?: string;
    }
  | { state: "gap"; reason: string };

/** The leverage table in its other shape: one row per metric, a column per EBITDA basis. */
function readMetricLeverage(entry: OutputEntry): Leverage | null {
  const table = tableWith(entry, ["Metric", "On Reported EBITDA", "On Quality-Adjusted EBITDA"]);
  if (!table) return null;
  const from = table.headers.indexOf("On Reported EBITDA");
  const to = table.headers.indexOf("On Quality-Adjusted EBITDA");
  const otherAts = table.headers.flatMap((header, at) =>
    /^on /i.test(header) && at !== from && at !== to ? [at] : [],
  );
  const deltaAt = table.headers.findIndex((header) => /^delta/i.test(header));
  return {
    state: "ready",
    line: table.line,
    labels: { reported: "Reported EBITDA", restated: "Quality-Adjusted EBITDA" },
    ...(otherAts.length > 0
      ? {
          others: otherAts.map((at) => ({ label: (table.headers[at] ?? "").replace(/^on /i, "") })),
        }
      : {}),
    ...(deltaAt >= 0 ? { deltaLabel: table.headers[deltaAt] ?? "" } : {}),
    measures: table.rows.map((row) => ({
      measure: safeText(row.cells[0] ?? ""),
      reported: leadingMultiple(row.cells[from] ?? ""),
      restated: leadingMultiple(row.cells[to] ?? ""),
      ...(otherAts.length > 0
        ? { others: otherAts.map((at) => leadingMultiple(row.cells[at] ?? "")) }
        : {}),
      ...(deltaAt >= 0 ? { delta: safeText(row.cells[deltaAt] ?? "") } : {}),
    })),
  };
}

/** Leverage on the statements and on supported earnings, each side as the table states it. */
export function readLeverage(entry: OutputEntry): Leverage {
  const table = tableWith(entry, ["Total leverage", "Net leverage"]);
  if (!table)
    return (
      readMetricLeverage(entry) ?? {
        state: "gap",
        reason:
          "This page could not read the leverage on the statements and on supported earnings.",
      }
    );
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
  return {
    state: "ready",
    line: table.line,
    measures,
    labels: { reported: "Statements", restated: "Supported earnings" },
  };
}

/** The chart title the store publishes for a `Chart data:` heading ("Add-back share"), or null. */
export function chartTitleOf(heading: string) {
  if (!heading.startsWith("Chart data: ")) return null;
  const name = heading.slice("Chart data: ".length).trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
