// S2 probe: figures and wording drawn on the four S2 screen types against the fixture they come from.
// Expected values are read straight from web/fixtures/library.json (no production code is called).
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/figure-fidelity.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { makeVariant, open, hash } from "./harness.mjs";
const lib = JSON.parse(readFileSync(path.join(process.cwd(), "web", "fixtures", "library.json"), "utf8")).slice;
const norm = (s) => s.replace(/\s+/g, " ").trim();
const cellText = (c) => (c === null ? "n.a." : c.kind === "value" ? c.text : c.kind === "withheld" ? "Withheld" : "Not established for this run");
let checks = 0;
const bad = [];
const expectIn = (where, hay, needle) => { checks++; if (!norm(hay).includes(norm(needle))) bad.push(`${where}: "${needle}" not in "${norm(hay).slice(0, 90)}"`); };
const expectEq = (where, got, want) => { checks++; if (got !== want) bad.push(`${where}: got ${got}, want ${want}`); };

const v = makeVariant();
const { browser, page, blocked, consoleLines } = await open();
try {
  // Home: every card
  await page.goto(hash(v.url, "/library/home"));
  await page.waitForTimeout(500);
  const cards = await page.$$eval("main a[href^='#/library/']", (as) => as.map((a) => ({ href: a.getAttribute("href"), text: a.innerText })));
  const want = lib.home.cards.filter((c) => c.kind === "issuer");
  expectEq("home card count", cards.length, want.length);
  want.forEach((c, i) => {
    const got = cards[i];
    for (const f of [c.name, c.sector, c.state, c.lead, c.asOf, c.pathway, c.progress.text, ...(c.note ? [c.note] : [])]) expectIn(`home ${c.issuer}`, got.text, f);
    const run = c.href;
    expectEq(`home ${c.issuer} href`, got.href, run === null ? `#/library/${c.issuer}/history` : `#/library/${c.issuer}/${run}/overview`);
  });
  // Home list view: three measures per row
  await page.getByRole("radio", { name: "List" }).click();
  await page.waitForTimeout(300);
  const rows = await page.$$eval("main [role=row]", (rs) => rs.slice(1).map((r) => [...r.querySelectorAll("[role=gridcell],[role=rowheader],[role=columnheader]")].map((c) => c.innerText.replace(/\s+/g, " ").trim())));
  want.forEach((c, i) => {
    for (const [j, k] of ["leverage", "netLeverage", "interestCoverage"].entries()) {
      const m = c.measures[k];
      const cell = rows[i][6 + j] ?? "(missing cell)";
      if (m === null) expectIn(`list ${c.issuer} ${k} (missing reads n.a., not 0)`, cell, "n.a.");
      else { expectIn(`list ${c.issuer} ${k}`, cell, m.text); expectEq(`list ${c.issuer} ${k} adj`, /adj\./.test(cell), m.basis === "adjusted"); }
    }
  });
  // History: every entry of every issuer
  for (const i of lib.issuers) {
    await page.goto(hash(v.url, `/library/${i.id}/history`));
    await page.waitForTimeout(300);
    const text = await page.locator("main").innerText();
    expectIn(`history ${i.id} subtitle`, text, i.history.subtitle);
    if (i.history.empty !== null) { expectIn(`history ${i.id} empty`, text, i.history.empty); continue; }
    for (const e of i.history.entries) for (const f of [`Run as of ${e.asOf}`, `Ran ${e.ran}`, e.state, e.pathway, e.text]) expectIn(`history ${i.id} ${e.asOf}/${e.ran}`, text, f);
  }
  // Overview and Changes of every loaded run
  for (const i of lib.issuers) for (const r of i.runs) {
    if (r.loading) continue;
    const o = r.overview;
    await page.goto(hash(v.url, `/library/${i.id}/${r.id}/overview`));
    await page.waitForTimeout(300);
    const tiles = await page.$$eval("section[aria-label] ul > li", () => []).catch(() => []);
    const text = await page.locator("main").innerText();
    for (const f of [o.bottomLine.lead, o.bottomLine.rest]) expectIn(`overview ${i.id}/${r.id} bottom line`, text, f);
    const metricLis = await page.$$eval(`section[aria-label="${o.metricsLabel}"] > ul > li`, (ls) => ls.map((l) => l.innerText));
    expectEq(`overview ${i.id}/${r.id} metric count`, metricLis.length, o.metrics.length);
    o.metrics.forEach((m, k) => { for (const f of [m.label, cellText(m.value), m.note]) expectIn(`overview ${i.id}/${r.id} metric ${m.label}`, metricLis[k] ?? "", f); });
    if (o.sides) for (const col of o.sides.columns) for (const p of col.items) for (const f of [cellText(p.figure), p.text, p.qualifier]) expectIn(`overview ${i.id}/${r.id} point`, text, f);
    for (const f of o.findings) for (const s of [f.number, f.lead, f.body]) expectIn(`overview ${i.id}/${r.id} finding ${f.number}`, text, s);
    if (o.changeView) for (const s of [o.changeView.title, o.changeView.text]) expectIn(`overview ${i.id}/${r.id} change view`, text, s);
    for (const d of o.dates) for (const s of [d.date, d.state, d.title, d.text]) expectIn(`overview ${i.id}/${r.id} date`, text, s);
    for (const m of o.modules.items) for (const s of [m.title, m.lead, m.state]) expectIn(`overview ${i.id}/${r.id} module ${m.title}`, text, s);
    for (const l of o.limitations.items) expectIn(`overview ${i.id}/${r.id} limitation`, text, l.text);
    expectIn(`overview ${i.id}/${r.id} limitations count`, text, `Limitations ${o.limitations.count}`);
    await page.goto(hash(v.url, `/library/${i.id}/${r.id}/changes`));
    await page.waitForTimeout(300);
    const ctext = await page.locator("main").innerText();
    const c = r.changes;
    if (c.kind !== "compared") { expectIn(`changes ${i.id}/${r.id} ${c.kind}`, ctext, c.title); expectIn(`changes ${i.id}/${r.id} ${c.kind}`, ctext, c.text); continue; }
    expectIn(`changes ${i.id}/${r.id} heading`, ctext, c.heading);
    const lis = await page.$$eval("main ul > li:has(strong)", (ls) => ls.map((l) => l.innerText));
    expectEq(`changes ${i.id}/${r.id} card count`, lis.length, c.changes.length);
    c.changes.forEach((ch, k) => { for (const f of [ch.measure, ch.kind, cellText(ch.current), cellText(ch.from), ch.change ?? "", ch.cause, ch.effect]) expectIn(`changes ${i.id}/${r.id} card ${ch.measure}`, lis[k] ?? "", f); });
    for (const m of c.modules.items) for (const s of [m.title, m.lead, m.state]) expectIn(`changes ${i.id}/${r.id} module ${m.title}`, ctext, s);
  }
} finally { await browser.close(); v.cleanup(); }
console.log("checks:", checks, "mismatches:", bad.length, "blocked:", blocked.length, "console:", consoleLines.length);
bad.slice(0, 40).forEach((b) => console.log(" -", b));
