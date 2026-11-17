import { emptyRow, FIGURES, group, text, type Row, type RowField } from "./rows";

export const ASSUMPTIONS_TITLE = "Scenario assumptions";

export type PinKey = "cp2a" | "cp2d" | "cp2e" | "cp3c" | "cp3d" | "cp4c";

type Pin = { key: PinKey; module: string; fields: RowField[] };

const rationale = (example: string) =>
  group("", ["rationale", "Rationale", "text", example, "Why you chose these values. Required."]);

/** One pin per module that takes the analyst's own assumption, in the order they are shown. */
export const PINS: readonly Pin[] = [
  {
    key: "cp2a",
    module: "CP-2A",
    fields: rationale("Committee stress cases"),
  },
  {
    key: "cp2d",
    module: "CP-2D",
    fields: [
      ...group(
        "",
        ["horizon_months", "Horizon (months)", "number", "12", "Whole number of months, 1 to 60."],
        ["minimum_cash_m", "Minimum cash (m)", "number", "150", `${FIGURES}. 0 or more.`],
      ),
      ...rationale("Treasury policy minimum"),
    ],
  },
  {
    key: "cp2e",
    module: "CP-2E",
    fields: [
      ...group(
        "",
        [
          "rate_shocks_bps",
          "Rate shocks (bps)",
          "text",
          "100, 200",
          "Basis points: 1 to 3 whole numbers, each 1 to 1000, separated by commas, increasing.",
        ],
        [
          "fx_shocks_pct",
          "FX shocks (%)",
          "text",
          "10, 20",
          "Percent: 1 to 3 whole numbers, each 1 to 50, separated by commas, increasing.",
        ],
        [
          "hedge_ratio_pct",
          "Hedge ratio (%)",
          "number",
          "50",
          "Percent, 0 to 100, at most 2 decimal places. Optional.",
        ],
      ),
      ...rationale("House scenarios"),
    ],
  },
  {
    key: "cp3c",
    module: "CP-3C",
    fields: [
      ...group("", [
        "repricing_bps",
        "Repricing (bps)",
        "number",
        "150",
        "Basis points step-up, a whole number from 0 to 1000.",
      ]),
      ...rationale("Desk view"),
    ],
  },
  {
    key: "cp3d",
    module: "CP-3D",
    fields: [
      ...group("", [
        "recovery_pct",
        "Recovery (%)",
        "number",
        "40",
        "Percent, 0 or more and below 100, at most 2 decimal places.",
      ]),
      ...rationale("Agency study"),
    ],
  },
  {
    key: "cp4c",
    module: "CP-4C",
    fields: [
      ...group("", [
        "ev_multiple",
        "EV multiple",
        "number",
        "6.5",
        "Times EBITDA, above 0 and at most 99.99, at most 2 decimal places.",
      ]),
      ...rationale("Distressed comps"),
    ],
  },
];

/** Shock lists are typed as one comma-separated box. */
const LISTS: ReadonlySet<string> = new Set(["rate_shocks_bps", "fx_shocks_pct"]);

export type PinForm = { values: Record<string, string>; scenarios: Row[] };
export type AssumptionsForm = Record<PinKey, PinForm | null>;

function record(raw: unknown): Row | null {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) ? (raw as Row) : null;
}

function readPin(pin: Pin, raw: unknown): PinForm | null {
  const given = record(raw);
  if (!given) return null;
  const scenarios = Array.isArray(given.scenarios) ? given.scenarios : [];
  return {
    values: Object.fromEntries(
      pin.fields.map(({ key }) => {
        const value = given[key];
        return [key, LISTS.has(key) && Array.isArray(value) ? value.join(", ") : text(given, key)];
      }),
    ),
    scenarios: pin.key === "cp2a" ? scenarios.map((row) => record(row) ?? {}) : [],
  };
}

/** The loaded assumptions as form values; a group that holds nothing is unticked. */
export function readAssumptions(raw: unknown): AssumptionsForm {
  const given = record(raw) ?? {};
  return Object.fromEntries(PINS.map((pin) => [pin.key, readPin(pin, given[pin.key])])) as Record<
    PinKey,
    PinForm | null
  >;
}

/** What ticking a group starts from: blank boxes, and one scenario to fill for the downside. */
export function blankPin(pin: Pin): PinForm {
  return {
    values: Object.fromEntries(pin.fields.map(({ key }) => [key, ""])),
    scenarios: pin.key === "cp2a" ? [emptyRow("scenarios")] : [],
  };
}

function listOf(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sendablePin(pin: Pin, form: PinForm) {
  const values = Object.fromEntries(
    pin.fields.map(({ key }) => {
      const value = (form.values[key] ?? "").trim();
      return [key, LISTS.has(key) ? listOf(value) : value];
    }),
  );
  if (pin.key !== "cp2a") return values;
  return {
    scenarios: form.scenarios.map((row) => ({
      ebitda_decline_pct: text(row, "ebitda_decline_pct").trim(),
      interest_increase_pct: text(row, "interest_increase_pct").trim(),
    })),
    ...values,
  };
}

/**
 * What is sent once the groups were edited: each shown group as its boxes hold it (null when
 * unticked); a group whose module the pathway does not run, as the loaded context held it.
 */
export function sendableAssumptions(
  form: AssumptionsForm,
  loaded: unknown,
  modules: readonly string[],
) {
  const kept = record(loaded) ?? {};
  return Object.fromEntries(
    PINS.map((pin) => {
      if (!modules.includes(pin.module)) return [pin.key, kept[pin.key] ?? null];
      const edited = form[pin.key];
      return [pin.key, edited && sendablePin(pin, edited)];
    }),
  );
}
