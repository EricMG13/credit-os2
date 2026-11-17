// J3-004: Evidence > Gaps says the run lists no gaps while other pages of the same run state what
// was not supplied or not recorded. Run from the repository root: timeout 600 node <this file>
"use strict";
const lib = require("./_j3lib.cjs");

lib.runProbe("004", async ({ page, origin, id }) => {
  const text = async (hash) => {
    await page.goto(`${origin}/report/${id}#${hash}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    return page.locator("main").innerText();
  };
  const gaps = await text("evidence/gaps");
  const foundation = await text("modules/CP-1");
  const forecast = await text("forecast");
  const downside = await text("modules/CP-2A");
  const claim = /This run lists no gaps\./u.test(gaps);
  const notSupplied = (foundation.match(/Not supplied: [^\n\t]+/gu) ?? []).slice(0, 3);
  const unitsMissing = /Units not recorded/u.test(forecast);
  const unavailable = forecast.match(/\d+ rows have no recorded values in this view/u)?.[0] ?? null;
  const unnamed = (forecast.match(/the forecast inputs do not name the row and period/gu) ?? [])
    .length;
  const documentaryGap = /Documentary gap/u.test(downside);
  return {
    reproduced: claim && notSupplied.length > 0 && unitsMissing,
    summary:
      `Gaps tab says "This run lists no gaps." (${claim}); Financial foundation shows ` +
      `${JSON.stringify(notSupplied)}; Forecast says "Units not recorded" (${unitsMissing}), ` +
      `"${unavailable}", and ${unnamed} lines "the forecast inputs do not name the row and period"; ` +
      `Downside shows "Documentary gap" (${documentaryGap}).`,
  };
});
