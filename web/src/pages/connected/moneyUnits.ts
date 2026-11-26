const moneyUnitSource = "(USD|US\\$|[A-Z]{3})(?: millions?|m)";
const moneyUnit = new RegExp(`^${moneyUnitSource}$`);
const endsInMoneyUnit = new RegExp(`^(.+) (${moneyUnitSource})$`);

/** Splits a text ending in a money unit ("200 US$m") into its amount and that unit. */
export function splitMoneyUnit(text: string) {
  const match = endsInMoneyUnit.exec(text);
  return match ? { amount: match[1] ?? "", unit: match[2] ?? "" } : null;
}

/** The symbol before the figure, a space between only when the symbol ends in a letter ("CHF 5m"). */
const symbolFigure = (sign: string, code: string, figure: string) => {
  const symbol = currencySymbol(code);
  return `${sign}${symbol}${/\p{L}$/u.test(symbol) ? " " : ""}${figure}m`;
};

/** A figure with a unit that is not money: "x" and "%" stay attached, any other unit follows a space. */
const plainUnit = (value: string, unit?: string | null) =>
  unit ? `${value}${/^[x%]$/.test(unit) ? "" : " "}${unit}` : value;
const currencySymbol = (code: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code === "US$" ? "USD" : code,
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? code;

export function unitLabel(unit: string) {
  const code = moneyUnit.exec(unit)?.[1];
  return code ? `${currencySymbol(code)}m` : unit;
}

export function withUnit(value: string | number, unit?: string | null) {
  const code = unit ? moneyUnit.exec(unit)?.[1] : undefined;
  if (code) {
    const text = String(value);
    if (!/^[-−]?(\d+|\d{1,3}(,\d{3})+)(\.\d+)?$/.test(text)) return text;
    const [plain = "", fraction] = text.replace(/^[-−]/, "").split(".");
    const integer = plain.replace(/,/g, "");
    const grouped = integer.replace(/\B(?=(\d{3})+$)/g, ",");
    const sign = /^[-−]/.exec(text)?.[0] ?? "";
    return symbolFigure(sign, code, `${grouped}${fraction === undefined ? "" : `.${fraction}`}`);
  }
  return plainUnit(String(value), unit);
}

/**
 * A figure exactly as the module wrote it, with its unit: a money unit and a bare written number
 * draw the symbol before it ("$1,250m", digits never regrouped); any other text takes the unit
 * after it ("n.m. $m"). Pass the raw unit, never a `unitLabel` result.
 */
export function writtenUnit(text: string, unit?: string | null) {
  const code = unit ? moneyUnit.exec(unit)?.[1] : undefined;
  if (!code) return plainUnit(text, unit);
  const bare = /^([-−]?)(\d+|\d{1,3}(?:,\d{3})+)(\.\d+)?$/.exec(text);
  if (!bare) return `${text} ${unitLabel(unit ?? "")}`;
  const [, sign = "", digits = "", fraction = ""] = bare;
  return symbolFigure(sign, code, `${digits}${fraction}`);
}
