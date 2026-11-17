// C5 probe: axe-core (from web/node_modules) on each Evidence screen and on an open trace drawer, plus a heading-order dump.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>   Output: C5_OUT (default /tmp/cs-C5/scratch/axe.json)
"use strict";
const fs = require("fs");
const path = require("path");
const lib = require("./c5lib.cjs");
const OUT = process.env.C5_OUT || "/tmp/cs-C5/scratch/axe.json";
const AXE = fs.readFileSync(path.join(lib.REPO, "web", "node_modules", "axe-core", "axe.min.js"), "utf8");
lib.withRun(async ({ page, base, run, log }) => {
  const tokens = {};
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  for (const [id, o] of Object.entries(snap.workspace.outputs)) tokens[o.module] = `${encodeURIComponent(id)}~${o.sha256}`;
  const screens = [["summary", "summary"], ["trace", "trace"], ["sources", "sources"], ["gaps", "gaps"], ["checks", "checks"], ["record", "record"], ["handoff-CP-1", tokens["CP-1"]], ["handoff-CP-6-line", tokens["CP-6"] + "-32"], ["checks-CP-4", "checks/CP-4"]];
  const res = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, hash] of screens) {
      await page.goto(`${base}/report/${run}#evidence/${hash}`); await page.reload();
      await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(600);
      // open every details so hidden content is checked too
      await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => { d.open = true; }));
      await page.evaluate(AXE);
      const r = await page.evaluate(async () => {
        const out = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
        return { violations: out.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(" "), html: n.html.slice(0, 160), summary: n.failureSummary?.split("\n").slice(0, 3).join(" ") })), count: v.nodes.length })) };
      });
      const headings = await page.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6, h1")].map((h) => `${h.tagName}:${h.textContent.trim().slice(0, 40)}`));
      res.push({ width, name, violations: r.violations, headings });
    }
  }
  // drawer open
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/report/${run}#modules/CP-1`); await page.reload(); await page.waitForTimeout(800);
    await page.locator('button[aria-label^="Show sources for"]').nth(1).click();
    await page.getByRole("dialog").waitFor(); await page.waitForTimeout(500);
    await page.evaluate(AXE);
    const r = await page.evaluate(async () => { const out = await axe.run(document.querySelector('[role="dialog"]'), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] } }); return out.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, html: v.nodes[0].html.slice(0, 160) })); });
    const headings = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] h3')].map((h) => `${h.tagName}:${h.textContent.trim().slice(0, 40)}`));
    const box = await page.getByRole("dialog").boundingBox();
    res.push({ width, name: "drawer-CP-1-confidence", violations: r, headings, dialogBox: box });
    await page.screenshot({ path: `/tmp/cs-C5/scratch/drawer-${width}.png` });
    await page.keyboard.press("Escape");
  }
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  for (const r of res) console.log(r.width, r.name, r.violations.map((v) => `${v.id}(${v.impact},${v.count})`).join(" ") || "none", "|", r.headings.join(" > ").slice(0, 300));
  console.log(JSON.stringify({ blocked: log.blocked, pageErrors: log.pageErrors }));
}).catch((e) => { console.error(e); process.exit(1); });
