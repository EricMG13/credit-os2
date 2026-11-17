// Operates every control of the kit page with the mouse and with Enter and Space, one fresh load per control, and records what changed.
// Run from the repository root: timeout 280 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/kit-control-sweep.mjs [shipped]
import { makeDist, pageUrl, shippedUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const variant = process.argv[2] === "shipped" ? "shipped" : "fixture";
const dir = makeDist("fixture");
const SEL = 'main a[href], main button, main [role=tab], main [role=radio], main input:not([type=file]), main [role=columnheader][tabindex], main [role=combobox]';
const SNAP = `(() => ({ h: location.hash, d: document.querySelectorAll("[role=dialog]").length, l: document.querySelectorAll("[role=listbox]").length, t: document.querySelector("main").innerText.length, sel: [...document.querySelectorAll("[aria-selected=true],[aria-checked=true],[aria-sort]")].map((e) => (e.getAttribute("aria-selected") ?? e.getAttribute("aria-checked") ?? e.getAttribute("aria-sort")) + ":" + (e.textContent || "").trim().slice(0, 12)).join("|") }))()`;
const out = [];
try {
  const { browser, page, log } = await open({ width: 1440, height: 900 });
  try {
    const load = async () => { await page.goto("about:blank"); await page.goto(variant === "shipped" ? shippedUrl("#/kit") : pageUrl(dir, "#/kit")); await page.waitForSelector("h1"); await sleep(150); };
    await load();
    const n = await page.locator(SEL).count();
    console.log(`variant ${variant}: ${n} controls in main`);
    for (let i = 0; i < Math.min(n, 120); i++) {
      for (const how of ["click", "Enter", "Space"]) {
        await load();
        const el = page.locator(SEL).nth(i);
        const info = await el.evaluate((e) => ({ role: e.getAttribute("role") || e.tagName.toLowerCase(), name: (e.getAttribute("aria-label") || e.textContent || e.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 34), disabled: e.disabled === true || e.getAttribute("aria-disabled") === "true" }));
        if (info.role === "input" || info.role === "textbox") { if (how !== "click") continue; }
        await el.scrollIntoViewIfNeeded().catch(() => {});
        const before = await page.evaluate(SNAP);
        try {
          if (how === "click") await el.click({ timeout: 3000 });
          else { await el.focus(); await page.keyboard.press(how); }
        } catch (e) { out.push({ i, how, ...info, err: String(e).split("\n")[0].slice(0, 60) }); continue; }
        await sleep(200);
        const after = await page.evaluate(SNAP);
        out.push({ i, how, ...info, changed: JSON.stringify(before) !== JSON.stringify(after), what: ["h", "d", "l", "t", "sel"].filter((k) => before[k] !== after[k]).join(",") });
      }
    }
    const per = new Map();
    for (const o of out) { const k = o.i; per.set(k, { ...(per.get(k) ?? { i: k, role: o.role, name: o.name, disabled: o.disabled }), [o.how]: o.err ? "ERR " + o.err : o.changed ? "changes " + o.what : "no change" }); }
    for (const v of per.values()) console.log(JSON.stringify(v));
    console.log("log " + JSON.stringify(log));
  } finally { await browser.close(); }
} finally { cleanup(); }
