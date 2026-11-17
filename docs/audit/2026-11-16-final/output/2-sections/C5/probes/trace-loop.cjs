// C5 probe: open every trace control on the given report screens and check the drawer.
// Usage (repo root): C5_BASE=http://127.0.0.1:8735 C5_RUN=<run> C5_SCREENS=overview,modules,forecast node <this file>
// Without C5_BASE it starts its own proof.serve on C5_PORT and completes a synthetic run first.
// Per trace: mouse open, focus moved into the dialog, Escape closes and returns focus to the opener,
// keyboard (Enter) reopens, footer Close and X close return focus, "Open in Evidence" resolves.
// Writes one JSON line per trace to C5_OUT (default /tmp/cs-C5/scratch/trace-loop.jsonl).
"use strict";
const fs = require("fs");
const lib = require("./c5lib.cjs");
const OUT = process.env.C5_OUT || "/tmp/cs-C5/scratch/trace-loop.jsonl";
const SCREENS = (process.env.C5_SCREENS || "overview").split(",");
const MAXN = Number(process.env.C5_MAX || 1000);
const WIDTH = Number(process.env.C5_WIDTH || 1440);

lib.withRun(async ({ page, base, run, log, browser }) => {
  await page.setViewportSize({ width: WIDTH, height: 900 });
  fs.writeFileSync(OUT, "");
  let total = 0;
  for (const screen of SCREENS) {
    const url = `${base}/report/${run}#${screen}`;
    const open = async () => {
      await page.goto(url);
      await page.reload();
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.locator("main").first().waitFor();
      await page.waitForTimeout(500);
    };
    await open();
    const sel = 'button[aria-label^="Show sources for"]';
    const n = Math.min(await page.locator(sel).count(), MAXN);
    const only = process.env.C5_INDEXES ? process.env.C5_INDEXES.split(",").map(Number) : null;
    for (let i = 0; i < n && total < MAXN; i += 1) {
      if (only && !only.includes(i)) continue;
      total += 1;
      const rec = { screen, index: i, n };
      try {
        const btn = page.locator(sel).nth(i);
        // A trace control inside a closed disclosure is in the DOM but not reachable: open it as a reader would.
        rec.wasHidden = !(await btn.isVisible());
        if (rec.wasHidden) {
          await btn.evaluate((el) => { for (let d = el.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) { d.open = true; } });
          await page.waitForTimeout(150);
        }
        await btn.scrollIntoViewIfNeeded();
        rec.name = await btn.getAttribute("aria-label");
        rec.box = await btn.boundingBox();
        await btn.click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ timeout: 5000 });
        await page.waitForTimeout(250);
        rec.label = await dialog.getAttribute("aria-label");
        rec.heading = await dialog.locator("h2").first().innerText();
        rec.subtitle = await dialog.locator("header p").first().innerText();
        rec.text = await dialog.innerText();
        rec.focusInside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
        rec.evidenceHref = await dialog.getByRole("link", { name: "Open in Evidence" }).getAttribute("href");
        rec.sourceLinks = await dialog.locator("ul.grid a, a[target=_blank]").evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
        rec.closeButtons = await dialog.getByRole("button", { name: "Close" }).count();
        // Escape
        await page.keyboard.press("Escape");
        await page.waitForTimeout(250);
        rec.escClosed = (await dialog.count()) === 0;
        rec.escFocus = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
        rec.escFocusIsOpener = rec.escFocus === rec.name;
        // keyboard open
        await btn.focus();
        await page.keyboard.press("Enter");
        await dialog.waitFor({ timeout: 5000 });
        rec.kbEnterOpens = true;
        // footer Close
        const closes = dialog.getByRole("button", { name: "Close" });
        await closes.last().click();
        await page.waitForTimeout(250);
        rec.footerCloseClosed = (await dialog.count()) === 0;
        rec.footerCloseFocus = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
        // Space open then X close
        await btn.focus();
        await page.keyboard.press("Space");
        await dialog.waitFor({ timeout: 5000 });
        rec.kbSpaceOpens = true;
        await dialog.getByRole("button", { name: "Close" }).first().click();
        await page.waitForTimeout(250);
        rec.xCloseFocus = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
        // Open in Evidence
        await btn.click();
        await dialog.waitFor({ timeout: 5000 });
        await dialog.getByRole("link", { name: "Open in Evidence" }).click();
        await page.waitForTimeout(500);
        rec.afterEvidenceUrl = page.url().replace(base, "");
        rec.dialogClosedAfterEvidence = (await page.getByRole("dialog").count()) === 0;
        rec.evidenceAlert = (await page.getByRole("alert").count()) > 0;
        rec.evidenceHeading = await page.locator("main article h2").first().innerText().catch(() => null);
        rec.evidenceText = (await page.locator("main article").first().innerText().catch(() => "")).slice(0, 1500);
        rec.evidenceTab = await page.locator('nav[aria-label="Evidence sections"] [aria-current="page"]').first().innerText().catch(() => null);
        // Back
        await page.goBack();
        await page.waitForTimeout(400);
        rec.backUrl = page.url().replace(base, "");
      } catch (e) {
        rec.error = String(e.message).split("\n")[0];
      }
      fs.appendFileSync(OUT, JSON.stringify(rec) + "\n");
      if (rec.error || !rec.escClosed) await open();
      else if (!page.url().endsWith(`#${screen}`)) await open();
    }
  }
  console.log(JSON.stringify({ total, blocked: log.blocked, console: log.console.slice(0, 20), pageErrors: log.pageErrors.slice(0, 10), failed: log.failed.slice(0, 20) }));
}).catch((e) => { console.error(e); process.exit(1); });
