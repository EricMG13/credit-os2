import { items, record, word } from "../visuals/visualData";

const DRIVER_NAMES: Record<string, string> = {
  revenue_growth: "Revenue growth",
  ebitda_margin: "EBITDA margin",
  capex_pct_revenue: "Capital expenditure, share of revenue",
  tax_wc_pct_revenue: "Tax and working capital, share of revenue",
  interest_rate: "Interest rate",
  dividends: "Dividends",
  debt_repayment: "Debt repayment",
  ebitda_decline: "Downside EBITDA decline",
  rate_increase: "Downside cash-interest increase",
};
const FRACTIONS = new Set([
  "revenue_growth",
  "ebitda_margin",
  "capex_pct_revenue",
  "tax_wc_pct_revenue",
  "interest_rate",
  "ebitda_decline",
  "rate_increase",
]);
const MONEY = new Set(["dividends", "debt_repayment"]);
const DRIVER_GROUPS = [
  ["base_drivers", "Base case"],
  ["upside_drivers", "Upside case"],
  ["downside_drivers", "Downside drivers"],
] as const;
const SHOCK = "downside_shock";

/** One recorded value as recorded; null where the case states nothing for that year. */
type Recorded = string | null;

/** The recorded values, each exactly as recorded; null when the case states nothing. */
function recordedValues(raw: unknown): Recorded[] | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "string" || typeof raw === "number") return [String(raw)];
  const values = record(raw).values;
  if (!Array.isArray(values)) return null;
  return values.map((item: unknown) =>
    item === null || item === undefined ? null : word(item) || String(item as string | number),
  );
}

/** A number written with an exponent as the same number in plain decimals, digit for digit. */
function plainDecimal(text: string) {
  const parts = /^(-?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/u.exec(text.trim());
  if (!parts) return text;
  const digits = `${parts[2] ?? ""}${parts[3] ?? ""}`;
  const point = (parts[2] ?? "").length + Number(parts[4]);
  const body =
    point <= 0
      ? `0.${"0".repeat(-point)}${digits}`
      : point >= digits.length
        ? `${digits}${"0".repeat(point - digits.length)}`
        : `${digits.slice(0, point)}.${digits.slice(point)}`;
  const whole = body.replace(/^0+(?=\d)/u, "");
  return `${parts[1] ?? ""}${whole}`;
}

const PLAIN = /^-?\d+(?:\.\d+)?$/u;
const PERCENT = /^-?\d+(?:\.\d+)?\s*%$/u;

/** The form a recorded value is written in: a plain decimal, a percent, or other text. */
function formOf(text: Recorded) {
  if (text === null) return "gap";
  const plain = plainDecimal(text.trim());
  if (PLAIN.test(plain)) return "plain";
  return PERCENT.test(text.trim()) ? "percent" : "text";
}

/** Two recorded values: equal, different, or written in forms that cannot be compared. */
function compareOne(a: Recorded, b: Recorded): "same" | "differs" | "unlike" {
  const forms = [formOf(a), formOf(b)];
  if (a === null || b === null) return a === b ? "same" : "differs";
  if (forms[0] !== forms[1]) return "unlike";
  const key = forms[0] === "percent" ? (t: string) => t.replace(/\s*%$/u, "") : plainDecimal;
  return forms[0] === "text"
    ? a === b
      ? "same"
      : "differs"
    : canonical(key(a)) === canonical(key(b))
      ? "same"
      : "differs";
}

/** A recorded number in one canonical spelling (0.40 and 0.4 agree); anything else exactly. */
function canonical(text: string) {
  const parts = /^(-?)(\d+)(?:\.(\d+))?$/u.exec(text.trim());
  if (!parts) return `s:${text}`;
  const whole = (parts[2] ?? "0").replace(/^0+(?=\d)/u, "");
  const fraction = (parts[3] ?? "").replace(/0+$/u, "");
  const negative = parts[1] === "-" && (whole !== "0" || fraction !== "");
  return `n:${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

/** One recorded value is a scalar and stands for every year. */
function compareValues(a: Recorded[], b: Recorded[]) {
  const pairs: [Recorded, Recorded][] =
    a.length === 1 && b.length >= 1
      ? b.map((text) => [a[0] ?? null, text])
      : b.length === 1
        ? a.map((text) => [text, b[0] ?? null])
        : a.length === b.length
          ? a.map((text, at) => [text, b[at] ?? null])
          : [];
  if (!pairs.length) return "differs";
  const results = pairs.map(([x, y]) => compareOne(x, y));
  return results.includes("differs") ? "differs" : results.includes("unlike") ? "unlike" : "same";
}

function amountUnit(document: Record<string, unknown>) {
  const currency = word(document.currency);
  if (!currency) return "currency not recorded";
  const scale = document.scale;
  if (scale === 1 || scale === "1") return `${currency} millions`;
  if (scale === 1000 || scale === "1000") return `${currency} thousands`;
  const text = typeof scale === "number" || typeof scale === "string" ? String(scale) : "";
  return `${currency}; scale ${text || "not recorded"}`;
}

export type DriverCell = {
  text: string;
  /** The text year by year; null is a year the case states nothing for. */
  parts: Recorded[];
  /** The values exactly as recorded (a number with an exponent is drawn as plain decimals). */
  title: string;
  /** Both base and this case state the driver, in forms that cannot be compared as numbers. */
  unlike: boolean;
  stated: boolean;
  /** Both base and this case state the driver and the recorded numbers differ. */
  differs: boolean;
  /** This case states the driver and base does not. */
  only: boolean;
};

const NOT_STATED: DriverCell = {
  text: "Not stated",
  parts: [],
  title: "",
  unlike: false,
  stated: false,
  differs: false,
  only: false,
};

/**
 * The forecast inputs' drivers as a table: one row per driver any case states and one column per
 * case that states something: base, upside and downside drivers when they state a driver, and the
 * downside shock as its own column, named `shockName`. Values are shown as recorded. A driver a
 * case does not state reads "Not stated": nothing is inherited from base. A cell differs only
 * when base and the case both state the driver and the recorded numbers differ.
 */
export function driverTable(document: Record<string, unknown>, shockName = "Downside case") {
  const years = items(document.years).map((entry) => {
    const year = record(entry).year;
    return typeof year === "number" ? String(year) : word(year);
  });
  const shock = record(document[SHOCK]);
  const states = (group: string) =>
    Object.values(record(document[group])).some((raw) => recordedValues(raw) !== null);
  const groups = DRIVER_GROUPS.filter(([key], at) => at === 0 || states(key)).map(
    ([key, name]) => ({ key, name, shock: false }),
  );
  const shockKeys = Object.keys(shock).filter((key) => recordedValues(shock[key]) !== null);
  const cases = shockKeys.length
    ? [...groups, { key: SHOCK, name: shockName, shock: true }]
    : groups;
  const unit = amountUnit(document);
  const driverKeys = [
    ...new Set(groups.flatMap(({ key }) => Object.keys(record(document[key])))),
  ].filter((key) => groups.some(({ key: group }) => recordedValues(record(document[group])[key])));
  const rows = [
    ...driverKeys.map((key) => ({ key, isShock: false })),
    ...shockKeys.map((key) => ({ key, isShock: true })),
  ].map(({ key, isShock }) => {
    const values = cases.map(({ key: group, shock: inShock }) =>
      inShock === isShock ? recordedValues(record(document[group])[key]) : null,
    );
    const base = isShock ? null : (values[0] ?? null);
    const cells = values.map((recorded, at): DriverCell => {
      if (!recorded) return NOT_STATED;
      const first = recorded[0] ?? null;
      const every =
        recorded.length > 1 &&
        first !== null &&
        recorded.every((text) => text !== null && compareOne(text, first) === "same");
      const shown = recorded.map((text) => (text === null ? null : plainDecimal(text)));
      const parts = every ? [`${plainDecimal(first)} each year`] : shown;
      const counted = at > 0 && !isShock;
      const compared = counted && base !== null ? compareValues(base, recorded) : "same";
      return {
        text: parts.map((part) => part ?? "Not stated").join(" · "),
        parts,
        title: recorded.map((text) => text ?? "Not stated").join(" · "),
        unlike: compared === "unlike",
        stated: true,
        differs: compared === "differs",
        only: counted && base === null,
      };
    });
    const firstStating = cases.find((_, at) => values[at] !== null)?.key ?? "";
    return {
      id: `${isShock ? SHOCK : firstStating}.${key}`,
      key,
      name: DRIVER_NAMES[key] ?? key.replaceAll("_", " "),
      shock: isShock,
      unit: FRACTIONS.has(key) ? "Fraction" : MONEY.has(key) ? unit : "unit not recorded",
      cells,
    };
  });
  return { years, cases, rows };
}
