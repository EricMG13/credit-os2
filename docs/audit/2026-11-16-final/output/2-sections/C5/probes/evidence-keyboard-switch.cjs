// C5 probe: keyboard walk of the Evidence page, the Show sources switch on Evidence, drawer focus trap.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const fs = require("fs");
const lib = require("./c5lib.cjs");
const OUT = process.env.C5_OUT || "/tmp/cs-C5/scratch/evidence-keyboard.json";
lib.withRun(async ({ page, base, run, log }) => {
  const res = {};
  await page.goto(`${base}/report/${run}#evidence/summary`);
  await page.reload();
  await page.locator('nav[aria-label="Evidence sections"]').waitFor();
  await page.waitForTimeout(500);
  // 1. Tab walk from the top of the document: focus order and visible focus indicator
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  const walk = [];
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const label = el.getAttribute("aria-label") || el.textContent.trim().slice(0, 40) || el.tagName;
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, label, href: el.getAttribute("href"), outline: cs.outlineStyle + " " + cs.outlineWidth, ring: cs.boxShadow.slice(0, 60), w: Math.round(r.width), h: Math.round(r.height) };
    });
    walk.push(info);
  }
  res.walk = walk;
  // 2. Show sources switch on each Evidence tab: does anything change?
  res.switch = [];
  for (const tab of ["summary", "trace", "sources", "gaps", "checks", "record"]) {
    await page.goto(`${base}/report/${run}#evidence/${tab}`);
    await page.reload();
    await page.locator('nav[aria-label="Evidence sections"]').waitFor();
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => ({ html: document.querySelector("main").innerHTML.length, sources: document.querySelector("[data-sources]")?.getAttribute("data-sources"), traceBtns: document.querySelectorAll('button[aria-label^="Show sources"]').length }));
    await page.locator("label", { hasText: "Show sources" }).first().click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({ html: document.querySelector("main").innerHTML.length, sources: document.querySelector("[data-sources]")?.getAttribute("data-sources"), traceBtns: document.querySelectorAll('button[aria-label^="Show sources"]').length, checked: document.querySelector('input[type=checkbox][role=switch], [role=switch]')?.checked }));
    res.switch.push({ tab, before, after });
  }
  // 3. Drawer focus trap and background: open one drawer on overview, Tab 12 times, record where focus goes
  await page.goto(`${base}/report/${run}#overview`);
  await page.reload();
  await page.waitForTimeout(700);
  await page.locator('button[aria-label^="Show sources for"]').first().click();
  await page.getByRole("dialog").waitFor();
  const trap = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    trap.push(await page.evaluate(() => { const el = document.activeElement; return { label: el?.getAttribute("aria-label") || el?.textContent.trim().slice(0, 30) || el?.tagName, inDialog: !!el?.closest('[role="dialog"]') }; }));
  }
  res.trap = trap;
  res.bgInert = await page.evaluate(() => [...document.querySelectorAll("main, nav")].map((n) => n.closest("[aria-hidden=true],[inert]") !== null));
  // Click outside (overlay) to close
  await page.mouse.click(30, 450);
  await page.waitForTimeout(300);
  res.overlayClickCloses = (await page.getByRole("dialog").count()) === 0;
  res.focusAfterOverlay = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  // Browser Back while the drawer is open
  await page.locator('button[aria-label^="Show sources for"]').nth(3).click();
  await page.getByRole("dialog").waitFor();
  const urlOpen = page.url();
  await page.goBack().catch(() => {});
  await page.waitForTimeout(400);
  res.backWhileOpen = { urlOpen: urlOpen.replace(base, ""), urlAfter: page.url().replace(base, ""), dialogCount: await page.getByRole("dialog").count() };
  // Tab change while the drawer is open is impossible (modal); hash change by script closes?
  await page.goto(`${base}/report/${run}#overview`);
  await page.reload();
  await page.waitForTimeout(500);
  await page.locator('button[aria-label^="Show sources for"]').nth(2).click();
  await page.getByRole("dialog").waitFor();
  await page.evaluate(() => { location.hash = "#changes"; });
  await page.waitForTimeout(500);
  res.hashChangeWhileOpen = { dialogCount: await page.getByRole("dialog").count(), url: page.url().replace(base, "") };
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ switch: res.switch, trap: res.trap, bgInert: res.bgInert, overlayClickCloses: res.overlayClickCloses, focusAfterOverlay: res.focusAfterOverlay, backWhileOpen: res.backWhileOpen, hashChangeWhileOpen: res.hashChangeWhileOpen, blocked: log.blocked, console: log.console.slice(0, 5), pageErrors: log.pageErrors }, null, 1));
  console.log(res.walk.filter(Boolean).map((w) => `${w.tag} | ${w.label} | outline ${w.outline} | ring ${w.ring} | ${w.w}x${w.h}`).join("\n"));
}).catch((e) => { console.error(e); process.exit(1); });
