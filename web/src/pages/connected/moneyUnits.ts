const moneyUnit = /^(USD|US\$|[A-Z]{3})(?: millions|m)$/;
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
    if (!/^-?(\d+|\d{1,3}(,\d{3})+)(\.\d+)?$/.test(text)) return text;
    const [plain = "", fraction] = text.replace(/^-/, "").split(".");
    const integer = plain.replace(/,/g, "");
    const grouped = integer.replace(/\B(?=(\d{3})+$)/g, ",");
    const sign = text.startsWith("-") ? "-" : "";
    const symbol = currencySymbol(code);
    const gap = /\p{L}$/u.test(symbol) ? " " : "";
    return `${sign}${symbol}${gap}${grouped}${fraction === undefined ? "" : `.${fraction}`}m`;
  }
  return unit ? `${String(value)}${/^[x%]$/.test(unit) ? "" : " "}${unit}` : String(value);
}

/**
 * A figure exactly as the module wrote it, with its unit: a money unit and a bare written number
 * draw the symbol before it ("$1,250m", digits never regrouped); any other text takes the unit
 * after it ("n.m. $m"). Pass the raw unit, never a `unitLabel` result.
 */
export function writtenUnit(text: string, unit?: string | null) {
  const code = unit ? moneyUnit.exec(unit)?.[1] : undefined;
  if (!code) return unit ? `${text}${/^[x%]$/.test(unit) ? "" : " "}${unit}` : text;
  const bare = /^([-−]?)(\d+|\d{1,3}(?:,\d{3})+)(\.\d+)?$/.exec(text);
  if (!bare) return `${text} ${unitLabel(unit ?? "")}`;
  const [, sign = "", digits = "", fraction = ""] = bare;
  const symbol = currencySymbol(code);
  const gap = /\p{L}$/u.test(symbol) ? " " : "";
  return `${sign}${symbol}${gap}${digits}${fraction}m`;
}
