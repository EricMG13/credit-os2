// J4-002: the finished synthetic run shows different values for the same measure on different
// screens, and nothing on the screen says why or flags the difference.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-002-screens-disagree.mjs
// Exit 0 = defect reproduced. Expected values are read from the screens and from the handoffs the
// screen lets the person download; none comes from the code that draws them.
import { bodyText, moduleText, runProbe } from "./_lib.mjs";

const grab = (text, re, label) => {
  const m = text.match(re);
  return m ? m[1] : `NOT FOUND (${label})`;
};

await runProbe("p002", async ({ page, run, endpoint }) => {
  const notes = [];
  await page.goto(`${endpoint}report/${run}#overview`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.waitForTimeout(800);
  const overview = await bodyText(page);
  const tileCover = grab(overview, /Interest coverage\s+([\d.]+x)/, "overview cover tile");
  const tileLeverage = grab(overview, /Net leverage\s+([\d.]+x)/, "overview leverage tile");
  const claimCover = grab(overview, /cover is thin at ([\d.]+x)/, "key finding");
  const covenant = await moduleText(page, endpoint, run, "CP-4", false);
  const covCover = grab(covenant, /Interest cover\s+Passes at or above [\d.]+ x\s+([\d.]+)/, "covenant cover");
  const covLeverage = grab(covenant, /Net leverage\s+Passes at or below [\d.]+ x\s+([\d.]+)/, "covenant leverage");
  const downside = await moduleText(page, endpoint, run, "CP-2A", false);
  const dsCover = grab(downside, /All-in cover \(x\)\s+Control\s+([\d.]+)/, "downside cover");
  const dsLeverage = grab(downside, /Net leverage \(x\)\s+Control\s+([\d.]+)/, "downside leverage");
  await page.goto(`${endpoint}report/${run}#forecast`);
  await page.getByRole("heading", { name: "Forecast", exact: true }).first().waitFor();
  await page.waitForTimeout(900);
  const forecast = await bodyText(page);
  const fcLeverage = grab(forecast, /Net leverage \(net debt \/ Adj EBITDA\)\s+([\d.]+x)/, "forecast leverage");
  notes.push(`interest cover: Overview tile ${tileCover}; Key findings claim ${claimCover}; Legal & covenants current ${covCover}x; Downside control all-in cover ${dsCover}x`);
  notes.push(`net leverage: Overview tile ${tileLeverage} (FY2024); Legal & covenants current ${covLeverage}x; Downside control ${dsLeverage}x; Forecast FY2025E ${fcLeverage}`);

  const debt = await moduleText(page, endpoint, run, "CP-1", true);
  const refi = await moduleText(page, endpoint, run, "CP-3C", true);
  const maturity = (text, head, rows) => {
    const i = text.indexOf(head);
    const part = i < 0 ? "" : text.slice(i, i + 400);
    return [...part.matchAll(/(FY20\d\d)\t([^\t\n]+)/g)]
      .slice(0, rows)
      .map((m) => `${m[1]}=${m[2]}`)
      .join(", ");
  };
  const stack = debt.match(/Debt stack[\s\S]{0,500}?Senior notes\t[^\n]*/)?.[0].replace(/\s+/g, " ");
  notes.push(`Financial foundation Debt stack (table view): ${JSON.stringify(stack)}; Net debt data FY2024 gross debt 1400 -> 2.80x`);
  const cp1 = maturity(debt, "Debt maturities\nPeriod", 3);
  const cp3c = maturity(refi, "Refinancing need\nPeriod", 2);
  notes.push(`USD 1,250m maturity: Financial foundation Debt maturities [${cp1}]; Refinancing & LME Refinancing need [${cp3c}]`);

  // Source readiness against what the run holds.
  const readiness = await moduleText(page, endpoint, run, "CP-0", false);
  const onlyFiling = /Only the synthetic filing is available/.test(readiness);
  const absentTerms = /Financing terms are absent/.test(readiness);
  await page.goto(`${endpoint}report/${run}#evidence/sources`);
  await page.waitForTimeout(900);
  const heldFiles = [...(await bodyText(page)).matchAll(/^(northbridge[\w.-]+)$/gm)].map((m) => m[1]);
  notes.push(`Source readiness says "Only the synthetic filing is available": ${onlyFiling}, "Financing terms are absent": ${absentTerms}; the run holds ${JSON.stringify(heldFiles)} (agreement chosen as executed)`);

  // The sources the person is shown for the 3.1x claim on the Overview.
  await page.goto(`${endpoint}report/${run}#overview`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.getByRole("button", { name: "Show sources for this passage" }).first().click();
  await page.getByRole("dialog").waitFor();
  const drawer = (await page.getByRole("dialog").innerText()).replace(/\s+/g, " ");
  notes.push(`drawer for the 3.1x claim: ${drawer.slice(0, 260)}`);

  const distinct = (xs) => new Set(xs.map((x) => String(x).replace(/x$/, "")).map(Number)).size;
  const coverDisagree = distinct([tileCover, claimCover, covCover, dsCover]) >= 3;
  const levDisagree = distinct([tileLeverage, covLeverage, dsLeverage, fcLeverage]) >= 3;
  const maturityDisagree = /FY2028=1,250/.test(cp1) && /FY2027=1,250/.test(cp3c);
  notes.push(`cover values differ: ${coverDisagree}; net leverage values differ: ${levDisagree}; 1,250 maturity in different years: ${maturityDisagree}`);
  return { reproduced: coverDisagree && levDisagree && maturityDisagree && onlyFiling && heldFiles.length === 3, notes };
});
