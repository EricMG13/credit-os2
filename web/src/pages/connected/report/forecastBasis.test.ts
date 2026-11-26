import { expect, it } from "vitest";
import { absentText, COVER_ON_EBITDA, earningsBasis, ON_EBITDA, readMeasure } from "./forecastData";

const value = (exact: string) => ({ status: "value", exact, display: exact });

function model(rows: Record<string, unknown[]>) {
  return {
    cashflow: {
      units: "USD millions",
      columns: [{ label: "FY2025E", group: "Base case" }],
      rows: Object.entries(rows).map(([label, cells]) => ({
        label,
        band: "Credit metrics",
        kind: "multiple",
        total: false,
        cells,
      })),
    },
  };
}

// Both label forms: models published earlier name the basis "Adj EBITDA"; the history path now
// publishes "EBITDA" because the forecast inputs state no adjustment.
const FORMS = [
  {
    name: "published earlier (Adj EBITDA)",
    earnings: "Adj EBITDA (as named in Financial foundation)",
    net: "Net leverage (net debt / Adj EBITDA)",
    cover: "Interest coverage (Adj EBITDA / interest)",
  },
  {
    name: "history path now (EBITDA)",
    earnings: "EBITDA (as named in Financial foundation)",
    net: "Net leverage (net debt / EBITDA)",
    cover: "Interest coverage (EBITDA / interest)",
  },
];

for (const form of FORMS) {
  it(`reads net leverage, cover and the earnings basis as stated: ${form.name}`, () => {
    const published = model({
      "EBITDA (EBIT + D&A)": [value("1")],
      [form.earnings]: [value("4173")],
      [form.net]: [value("3.9")],
      "Net leverage (covenant basis)": [value("5.1")],
      [form.cover]: [value("2.5")],
    });
    expect(earningsBasis(published)).toBe(form.earnings);
    const leverage = readMeasure(published, "net leverage", /^Net leverage\b/u, {
      pattern: ON_EBITDA,
      basis: "net debt over EBITDA",
    });
    expect(leverage.measure?.label).toBe(form.net);
    const cover = readMeasure(published, "interest cover", /^Interest coverage\b/u, {
      pattern: COVER_ON_EBITDA,
      basis: "EBITDA over interest",
    });
    expect(cover.measure?.label).toBe(form.cover);
  });
}

it("names no adjustment in the gap text when several net leverage rows match none", () => {
  const read = readMeasure(
    model({ "Net leverage (one)": [value("1")], "Net leverage (two)": [value("2")] }),
    "net leverage",
    /^Net leverage\b/u,
    { pattern: ON_EBITDA, basis: "net debt over EBITDA" },
  );
  expect(absentText(read)).toBe(
    "The model publishes 2 net leverage rows: Net leverage (one) and Net leverage (two). None is on net debt over EBITDA, so none is drawn.",
  );
});
