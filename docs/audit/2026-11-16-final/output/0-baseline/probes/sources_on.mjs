// Stage 0 probe: the "Show sources on" state of every screen that has the page-level switch.
// connected.mjs and static.mjs could not toggle the switch with a plain click (its input is
// visually hidden), so this pass sets it with check({ force: true }) and lists what it reveals.
// Run from the repository root with the synthetic service running:
//   node docs/audit/2026-11-16-final/output/0-baseline/probes/sources_on.mjs <origin> <probe-out-dir> <shots-dir> <out.jsonl>
// <probe-out-dir> holds screens-connected.json, screens-static.json and the static-* folders.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CAP, collect, launch, newLog, record, settle, shoot, slug } from "./lib.mjs";

const [origin, probeOut, shots, outFile] = process.argv.slice(2);
rmSync(outFile, { force: true });
const screens = [
  ...JSON.parse(readFileSync(path.join(probeOut, "screens-connected.json"), "utf8")).screens,
  ...JSON.parse(readFileSync(path.join(probeOut, "screens-static.json"), "utf8")).screens,
].filter((s) => !s.address.startsWith("/start") && !s.address.includes("[")); // Start steps keep form state

const seen = new Set();
const log = newLog();
const { browser, context } = await launch(log);
const page = await context.newPage();
page.setDefaultTimeout(10000);
const summary = [];
const domKey = (r) => `${r.tag}|${r.roleAttr ?? ""}|${r.ariaLabel ?? ""}|${r.text}|${r.href ?? ""}|${r.htmlId ?? ""}|${r.context}`;
try {
  for (const s of screens.slice(0, CAP)) {
    if (seen.has(s.address)) continue;
    seen.add(s.address);
    const url = s.surface === "connected" ? new URL(s.address, origin).href : pathToFileURL(path.join(probeOut, "static-fixture", "index.html")).href + s.address.replace(/^index\.html/, "");
    log.current = `${s.address} [Show sources on]`;
    await page.goto("about:blank");
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await settle(page, 800);
    const toggle = page.getByRole("switch", { name: "Show sources", exact: true });
    if ((await toggle.count()) === 0) continue;
    const before = await collect(page);
    await toggle.first().check({ force: true });
    await page.waitForTimeout(500);
    const after = await collect(page);
    const keys = new Set(before.map(domKey));
    const revealed = after.filter((r) => !keys.has(domKey(r)));
    const section = s.section;
    const n = record(outFile, { surface: s.surface, screen: s.screen, state: `${s.state}; Show sources on`, address: s.address }, revealed, (r) => (r.inRail ? (s.surface === "connected" ? "C1" : "S1") : section));
    const shot = await shoot(page, shots, `${s.surface}-${slug(s.address)}-sources-on`, 1440);
    summary.push({ surface: s.surface, section, screen: s.screen, state: `${s.state}; Show sources on`, address: s.address, revealed: n, checked: await toggle.first().isChecked(), shot });
    console.log(`${s.address} sources on: ${n} revealed`);
  }
} finally {
  writeFileSync(outFile.replace(/\.jsonl$/, ".json"), JSON.stringify({ summary, net: { requests: log.requests.length, blocked: log.blocked, csp: log.csp, errors: log.errors } }, null, 1));
  await browser.close();
}
