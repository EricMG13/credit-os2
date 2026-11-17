// J3-006: Forecast starting values do not tie to the reported Financial foundation figures and
// nothing near the headline case values says so. Run from the repository root:
// timeout 600 node <this file>
"use strict";
const lib = require("./_j3lib.cjs");

lib.runProbe("006", async ({ page, origin, id }) => {
  const read = async (hash) => {
    await page.goto(`${origin}/report/${id}#${hash}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    return page.locator("main").innerText();
  };
  const num = (text, pattern) => {
    const m = text.match(pattern);
    return m ? Number(m[1].replace(/,/gu, "")) : null;
  };
  const overview = await read("overview");
  const forecast = await read("forecast");
  const foundation = await read("modules/CP-1");
  const downside = await read("modules/CP-2A");
  const reportedRevenue = num(overview, /Revenue\n\$([\d,]+)m/u);
  const forecastRevenue = num(forecast, /\nRevenue\t([\d,]+)\t/u);
  const reportedDebt = num(foundation, /FY2024\t(\d+)\t275/u);
  const forecastOpeningDebt = num(forecast, /Opening debt\t([\d,]+)\t/u);
  const overviewNetLeverage = num(overview, /Net leverage\n([\d.]+)x/u);
  const downsideControlNetLeverage = num(downside, /Net leverage \(x\)\nControl\n([\d.]+)/u);
  const forecastNetLeverage = num(forecast, /Net leverage \(net debt \/ Adj EBITDA\)\t([\d.]+)x/u);
  const head = forecast.slice(0, forecast.indexOf("Cash flow model\nLine item"));
  const flaggedAtTop = /do not name the row and period|not tied|does not tie/u.test(head);
  return {
    reproduced:
      reportedRevenue !== null &&
      forecastRevenue !== null &&
      forecastRevenue < reportedRevenue / 1.5 &&
      !flaggedAtTop,
    summary:
      `Overview/Financial foundation FY2024 revenue ${reportedRevenue} US$m, Forecast FY2025E ` +
      `revenue ${forecastRevenue}; reported gross debt FY2024 ${reportedDebt}, Forecast opening ` +
      `debt ${forecastOpeningDebt}; text above the cash flow model says the inputs are unlinked: ` +
      `${flaggedAtTop}; headline case line reads "Cash proxy · FY2027E · Units not recorded": ` +
      `${/Cash proxy · FY2027E · Units not recorded/u.test(forecast)}. Net leverage: Overview ` +
      `FY2024 ${overviewNetLeverage}x, Downside control (LTM to 2025-03-31) ` +
      `${downsideControlNetLeverage}x, Forecast FY2025E ${forecastNetLeverage}x.`,
  };
});
