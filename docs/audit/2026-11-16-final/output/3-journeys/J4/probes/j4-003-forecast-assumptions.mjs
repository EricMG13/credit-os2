// J4-003: the Forecast page's "Forecast assumptions" section shows "Not supplied: nothing to
// report" and the page never states the downside shock or the drivers behind the numbers; they
// exist only in the handoff's machine-readable block (Evidence, line 93 of the Forward credit model).
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-003-forecast-assumptions.mjs
// Exit 0 = defect reproduced.
import { bodyText, moduleText, runProbe } from "./_lib.mjs";

await runProbe("p003", async ({ page, run, endpoint }) => {
  const notes = [];
  await page.goto(`${endpoint}report/${run}#forecast`);
  await page.getByRole("heading", { name: "Forecast", exact: true }).first().waitFor();
  await page.waitForTimeout(900);
  const summary = page.locator("summary", { hasText: "Forecast assumptions" });
  await summary.scrollIntoViewIfNeeded();
  await summary.click();
  await page.waitForTimeout(500);
  const section = await summary.locator("xpath=..").innerText();
  notes.push(`"Forecast assumptions" section text: ${JSON.stringify(section.replace(/\s+/g, " ").trim())}`);
  const text = await bodyText(page);
  const mentionsShock = /\b20\s?%|0\.20|EBITDA decline|rate increase/i.test(text);
  notes.push(`Forecast page states the downside shock size (20% EBITDA decline, 10% rate rise): ${mentionsShock}`);
  const mentionsDrivers = /tax_wc|capex_pct|interest_rate|6\.00%|10\.00%/i.test(text);
  notes.push(`Forecast page states the tax/working-capital (10% of revenue) or interest-rate (6%) drivers: ${mentionsDrivers}`);

  // What the downloaded handoff holds (the person downloads it from Evidence).
  const handoff = await (await page.request.get(`${endpoint}library/downloads/${run}/CP-2G.md`)).text();
  const shock = handoff.match(/"downside_shock": \{[^}]*\}/)?.[0];
  const drivers = [...handoff.matchAll(/"(\w+)": \{"values": \[([^\]]*)\]/g)].map((m) => `${m[1]}=[${m[2].replace(/"/g, "")}]`);
  notes.push(`handoff CP-2G.md: ${shock}`);
  notes.push(`handoff CP-2G.md drivers: ${drivers.join("; ")}`);

  // The Downside module uses a different shock.
  const downside = await moduleText(page, endpoint, run, "CP-2A", false);
  const ds = downside.match(/EBITDA decline\s+([^\n]+)\nCash-interest increase\s+([^\n]+)/);
  notes.push(`Downside module shock: EBITDA decline ${ds?.[1]}, cash-interest increase ${ds?.[2]}`);

  const reproduced =
    /Not supplied: nothing to report/.test(section) && !mentionsShock && !mentionsDrivers && Boolean(shock);
  return { reproduced, notes };
});
