// J4-008 to J4-011 (Low findings), reproduced in one run:
//  008 the entered rating's as-of date exists only in a hover title, on a non-focusable element;
//  009 Forecast prose names module codes (CP-1, CP-2G) and "Python";
//  010 trace controls share one accessible name (two "FY2024", three "Cash proxy by scenario", two "this passage");
//  011 the Evidence "Script checks" tab shows 215 although 205 of them did not run;
//  013 the same measure carries different names on different screens (Gross leverage / Total debt / EBITDA / Total leverage);
//  014 the modules are listed in a different order on the Overview, the Modules navigator and the Evidence filter.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-low-checks.mjs
// Exit 0 = every one of the six reproduced.
import { bodyText, moduleText, runProbe } from "./_lib.mjs";

const duplicates = async (page) => {
  const names = await page.getByRole("button", { name: /^Show sources for/ }).evaluateAll((xs) => xs.map((x) => x.getAttribute("aria-label")));
  const count = {};
  for (const n of names) count[n] = (count[n] ?? 0) + 1;
  return Object.entries(count).filter(([, c]) => c > 1).map(([n, c]) => `${n} x${c}`);
};

await runProbe("plow", async ({ page, run, endpoint }) => {
  const notes = [];
  await page.goto(`${endpoint}report/${run}#overview`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.waitForTimeout(900);
  const rating = await page.evaluate(() => {
    const li = document.querySelector("li[title^='as of']");
    return li ? { title: li.getAttribute("title"), tabindex: li.getAttribute("tabindex"), focusable: li.matches("a,button,[tabindex]") } : null;
  });
  const overview = await bodyText(page);
  const visible = /2025-02-28|28 February 2025|Feb(ruary)? 28/.test(overview);
  notes.push(`008 rating card: ${JSON.stringify(rating)}; date visible in the page text: ${visible}`);
  const overviewDup = await duplicates(page);

  await page.goto(`${endpoint}report/${run}#forecast`);
  await page.getByRole("heading", { name: "Forecast", exact: true }).first().waitFor();
  await page.waitForTimeout(900);
  const ftext = await bodyText(page);
  const codes = [...new Set(ftext.match(/CP-[0-9][A-Z]?\b/g) ?? [])];
  notes.push(`009 Forecast page prose names module codes ${JSON.stringify(codes)} and says "Python": ${/Python/.test(ftext)}`);
  const forecastDup = await duplicates(page);

  await page.goto(`${endpoint}report/${run}#modules/CP-1`);
  await page.waitForTimeout(900);
  const cp1Dup = await duplicates(page);
  notes.push(`010 duplicated trace-control names: Overview ${JSON.stringify(overviewDup)}; Forecast ${JSON.stringify(forecastDup)}; Financial foundation ${JSON.stringify(cp1Dup)}`);

  await page.goto(`${endpoint}report/${run}#evidence/checks`);
  await page.waitForTimeout(1000);
  const checks = await bodyText(page);
  const badge = Number(checks.match(/Script checks\s*\n?\s*(\d+)/)?.[1]);
  const sum = (re) => [...checks.matchAll(re)].reduce((a, m) => a + Number(m[1]), 0);
  const notChecked = sum(/(\d+) not checked/g);
  const agreed = sum(/(\d+) agreed/g);
  const noted = sum(/(\d+) noted/g);
  notes.push(`011 Script checks tab badge ${badge}; not checked ${notChecked}, agreed ${agreed}, noted ${noted}`);

  // 013: names of the same measures on four screens.
  const cp1Text = await moduleText(page, endpoint, run, "CP-1", true);
  const cov = await moduleText(page, endpoint, run, "CP-4", false);
  const ds = await moduleText(page, endpoint, run, "CP-2A", false);
  const names = {
    "Overview tiles": ["Net leverage", "Gross leverage", "Interest coverage"].filter((n) => new RegExp(`^${n}$`, "m").test(overview)),
    "Financial foundation charts": ["Total debt / EBITDA", "Net debt / EBITDA", "Interest cover"].filter((n) => cp1Text.includes(n)),
    "Forecast rows": ["Total leverage (debt / Adj EBITDA)", "Net leverage (net debt / Adj EBITDA)", "Interest coverage (Adj EBITDA / interest)"].filter((n) => ftext.includes(n)),
    "Legal & covenants": ["Net leverage", "Interest cover"].filter((n) => cov.includes(n)),
    "Downside": ["Net leverage (x)", "All-in cover (x)"].filter((n) => ds.includes(n)),
  };
  notes.push(`013 names by screen: ${JSON.stringify(names)}`);
  const r013 = names["Overview tiles"].includes("Gross leverage") && names["Financial foundation charts"].includes("Total debt / EBITDA") && names["Forecast rows"].includes("Total leverage (debt / Adj EBITDA)");

  // 014: module order on three screens.
  const known = ["Source readiness", "Financial foundation", "Business & governance", "Research questions", "Legal & covenants", "Fundamental credit", "Downside", "Rates, FX & hedging", "Liquidity", "Forward credit model", "Refinancing & LME", "Security selection", "Evidence validation", "Committee decision"];
  const section = overview.slice(overview.indexOf("Bottom line by module"), overview.indexOf("\nLimitations"));
  const overviewOrder = section.split("\n").map((l) => l.trim()).filter((l) => known.includes(l));
  await page.goto(`${endpoint}report/${run}#modules/CP-1`);
  await page.waitForTimeout(900);
  const modulesOrder = await page.$$eval("a[href^='#modules/CP-']", (xs) => [...new Set(xs.map((x) => x.textContent.trim()))]);
  await page.goto(`${endpoint}report/${run}#evidence/summary`);
  await page.waitForTimeout(900);
  const evidenceOrder = (await page.locator("main select").first().locator("option").allInnerTexts()).filter((o) => known.includes(o));
  notes.push(`014 Overview order (${overviewOrder.length}): ${overviewOrder.join(" > ")}`);
  notes.push(`014 Modules navigator order (${modulesOrder.length}): ${modulesOrder.join(" > ")}`);
  notes.push(`014 Evidence filter order (${evidenceOrder.length}): ${evidenceOrder.join(" > ")}`);
  const r014 = overviewOrder.join() !== modulesOrder.join() && modulesOrder.join() === evidenceOrder.join();

  const r007 = rating && !visible && !rating.focusable;
  const r008 = codes.length > 0 && /Python/.test(ftext);
  const r009 = overviewDup.length > 0 && forecastDup.length > 0 && cp1Dup.length > 0;
  const r010 = badge === notChecked + agreed + noted && notChecked / badge > 0.9;
  notes.push(`reproduced: 008 ${r007}, 009 ${r008}, 010 ${r009}, 011 ${r010}, 013 ${r013}, 014 ${r014}`);
  return { reproduced: r007 && r008 && r009 && r010 && r013 && r014, notes };
});
