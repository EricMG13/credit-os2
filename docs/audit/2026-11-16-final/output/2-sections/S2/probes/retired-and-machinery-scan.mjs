// S2 probe: text on the four S2 screen types that the retired list or the "findings pages carry no machinery" rows forbid.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/retired-and-machinery-scan.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { makeVariant, open, hash } from "./harness.mjs";
const lib = JSON.parse(readFileSync(path.join(process.cwd(), "web", "fixtures", "library.json"), "utf8")).slice;
const ADDR = ["/library/home"];
for (const i of lib.issuers) { ADDR.push(`/library/${i.id}/history`); for (const r of i.runs) if (!r.loading) ADDR.push(`/library/${i.id}/${r.id}/overview`, `/library/${i.id}/${r.id}/changes`); }
const RULES = [
  ["module code (R-13, CM-012)", /\bCP-[A-Z0-9]+\b/],
  ["source file / hash / page (CM-011, R-12)", /\b[\w-]+\.(pdf|xlsx?|csv|docx?|html|json|md|txt)\b|sha-?256|\bp\.\s?\d|\bpp\.\s?\d|\[[^\]]{1,40}\]/i],
  ["register / row / run ids (CM-011)", /\b(T|C|R|G)-\d{3,}\b|\brow_id\b|\btable_id\b|\bregister\b|\bcalc_/i],
  ["routing / pipeline words (CM-019, R-17)", /next module|upstream|downstream|handoff|hand-off|canonical|fact pack|transport|helper script|[a-z]+_[a-z]+_?[a-z]*/i],
  ["report.html (R-01)", /report\.html|download.*report/i],
  ["Excel / workbook (R-04)", /excel|workbook|\.xlsx|export to/i],
  ["memo module (R-03)", /\bmemo\b/i],
  ["short snapshot start (R-05)", /short (credit )?snapshot/i],
  ["post-mortem / calibration / decision ledger (R-06)", /post-mortem|calibration|decision ledger/i],
  ["Reports rail / Event calendar tab (R-15)", /\bReports\b|event calendar/i],
  ["module navigator on Overview (R-16)", /lead[- ]handoff|module navigator/i],
  ["earlier format / earlier methods labels (CM-032, CM-048, CM-060)", /earlier format|earlier methods/i],
  ["better/worse/unchanged marks (D-46)", /\b(better|worse)\b/i],
];
const v = makeVariant();
const { browser, page } = await open();
const hits = new Map();
try {
  for (const a of ADDR) {
    await page.goto(hash(v.url, a));
    await page.waitForTimeout(250);
    const text = await page.locator("main").innerText();
    for (const [name, re] of RULES) { const m = text.match(re); if (m) { const k = name; const e = hits.get(k) ?? []; e.push(`${a.replace("/library/", "")}: "${m[0]}"`); hits.set(k, e); } }
  }
} finally { await browser.close(); v.cleanup(); }
console.log("addresses scanned:", ADDR.length);
for (const [name] of RULES) console.log(hits.has(name) ? `HIT  ${name}\n     ${hits.get(name).slice(0, 4).join("\n     ")}` : `none ${name}`);
