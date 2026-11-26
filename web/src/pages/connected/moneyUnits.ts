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
