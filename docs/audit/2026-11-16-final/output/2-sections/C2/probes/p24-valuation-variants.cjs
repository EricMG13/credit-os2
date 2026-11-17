// P24: controls revealed by each Peer source and Valuation basis choice, and by each scenario pin, on the Advanced Deep
// context step; each revealed control is listed and each "Add ..." button is operated once. JSON out. (Inventory check: the
// stage 0 inventory only saw the default state of these sections.)
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p24-valuation-variants.cjs
"use strict";
const L = require("./lib.cjs");
const names = (page, scope) => scope.evaluate((root) => [...root.querySelectorAll("input,select,textarea,button,summary")].filter((e) => e.offsetParent !== null).map((e) => `${e.tagName.toLowerCase()}${e.type && e.tagName === "INPUT" ? ":" + e.type : ""} ${(e.getAttribute("aria-label") || e.labels?.[0]?.textContent || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}`));
(async () => {
  const log = L.newLog();
  const out = { peer: {}, basis: {}, pins: {}, ticker: null };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page); await L.addFiles(page, ["filing"]);
    await L.toPurpose(page);
    await page.getByRole("radiogroup", { name: "Pathway" }).getByText("Deep credit assessment", { exact: true }).click();
    await page.getByRole("combobox", { name: /Run form level/ }).selectOption("advanced");
    await L.toContext(page);
    await page.locator("summary", { hasText: "Valuation and peers" }).click();
    await page.locator("summary", { hasText: "Scenario assumptions" }).click();
    await page.locator("summary", { hasText: "Issuer details" }).click();
    const val = page.locator("details", { has: page.locator("summary", { hasText: "Valuation and peers" }) });
    const peerSel = page.getByRole("combobox", { name: "Peer source" });
    const basisSel = page.getByRole("combobox", { name: "Valuation basis" });
    out.peerOptions = await peerSel.evaluate((s) => [...s.options].map((o) => `${o.value}:${o.text}`));
    out.basisOptions = await basisSel.evaluate((s) => [...s.options].map((o) => `${o.value}:${o.text}`));
    const base = new Set(await names(page, val));
    for (const v of await peerSel.evaluate((s) => [...s.options].map((o) => o.value))) {
      await peerSel.selectOption(v);
      const now = await names(page, val);
      out.peer[v] = now.filter((n) => !base.has(n));
      for (const add of await val.getByRole("button", { name: /^Add / }).all()) { const label = await add.innerText(); if (await add.isEnabled()) { await add.click(); out.peer[v].push(`(operated: ${label})`); } }
    }
    await peerSel.selectOption("cp_dr_public");
    for (const v of await basisSel.evaluate((s) => [...s.options].map((o) => o.value))) {
      await basisSel.selectOption(v);
      const now = await names(page, val);
      out.basis[v] = now.filter((n) => !base.has(n));
      for (const add of await val.getByRole("button", { name: /^Add / }).all()) { const label = await add.innerText(); if (await add.isEnabled()) { await add.click(); out.basis[v].push(`(operated: ${label})`); } }
    }
    const asm = page.locator("details", { has: page.locator("summary", { hasText: "Scenario assumptions" }) });
    for (const box of await asm.getByRole("checkbox").all()) {
      const label = await box.evaluate((e) => e.labels[0].textContent.trim());
      const before = new Set(await names(page, asm));
      await box.check();
      out.pins[label] = (await names(page, asm)).filter((n) => !before.has(n));
      for (const add of await asm.getByRole("button", { name: /^Add / }).all()) if (await add.isEnabled()) { await add.click(); out.pins[label].push("(operated: " + (await add.innerText()) + ")"); }
    }
    await page.getByRole("checkbox", { name: "Listed equity" }).check();
    out.ticker = await page.getByRole("textbox", { name: "Ticker" }).count();
    out.previousOnContext = await page.getByRole("button", { name: "Previous" }).count();
  } catch (e) { out.error = String(e).slice(0, 600); } finally { await browser.close(); }
  out.log = { console: log.console.slice(0, 5), bad: log.bad };
  console.log(JSON.stringify(out, null, 1));
})();
