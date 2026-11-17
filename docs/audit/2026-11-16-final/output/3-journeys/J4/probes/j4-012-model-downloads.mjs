// J4-012 (Info): the model and calculation downloads give a committee member nothing to recompute
// the reported ratios. "Annual model handoff" is the Financial foundation handoff under another
// name, the Calculation JSON holds no historical value, and the HTML Model is unavailable.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-012-model-downloads.mjs
// Exit 0 = reproduced.
import { createHash } from "node:crypto";
import { bodyText, runProbe } from "./_lib.mjs";

const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);

await runProbe("p012", async ({ page, run, endpoint }) => {
  const notes = [];
  await page.goto(`${endpoint}report/${run}#evidence/summary`);
  await page.waitForTimeout(900);
  const links = await page.$$eval("a[href*='/connected/artifacts/']", (xs) => xs.map((x) => [x.textContent.trim(), x.getAttribute("href")]));
  const get = async (href) => (await page.request.get(new URL(href, endpoint).href)).body();
  const files = {};
  for (const [label, href] of links) {
    files[label] = await get(href);
    notes.push(`${label}: ${href.split("/").pop()} ${files[label].length} bytes sha256 ${sha(files[label])}`);
  }
  const handoff = await (await page.request.get(`${endpoint}library/downloads/${run}/CP-1.md`)).body();
  notes.push(`Financial foundation handoff CP-1.md: ${handoff.length} bytes sha256 ${sha(handoff)}`);
  const calc = JSON.parse(files["Calculation JSON"].toString("utf8"));
  const everyNull = calc.history.columns.every((c) => Object.values(c.values).every((v) => v.amount === null));
  notes.push(`Calculation JSON: annual_periods=${JSON.stringify(calc.annual_periods)} values=${JSON.stringify(calc.values)} history amounts all null: ${everyNull}`);
  const text = await bodyText(page);
  const modelGone = /The original HTML Model is unavailable for this run/.test(text);
  notes.push(`page says the HTML Model is unavailable: ${modelGone}`);
  const same = sha(files["Annual model handoff"]) === sha(handoff);
  return { reproduced: same && calc.annual_periods.length === 0 && everyNull && modelGone, notes };
});
