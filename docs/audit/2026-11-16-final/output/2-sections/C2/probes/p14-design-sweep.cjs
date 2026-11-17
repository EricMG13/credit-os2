// P14: mechanical design and accessibility sweep of each Start screen at 1440 and 390 px: horizontal overflow, text
// under 13 px (D-30), pointer targets under 24 px (D-41), text contrast (D-33), inputs without a name (D-37),
// duplicate ids, focus indicator on each tab stop (D-34), heading order (D-36). JSON out.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p14-design-sweep.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");

async function sweep(page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { let e = el; while (e) { const c = getComputedStyle(e).backgroundColor; const a = rgba(c); if (a[3] > 0.99) return a; e = e.parentElement; } return [255, 255, 255, 1]; };
    const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const out = { overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: [], targets: [], contrast: [], unnamed: [], dupIds: [], headings: [] };
    const seen = new Set();
    for (const el of document.querySelectorAll("main *, aside *, [role=dialog] *")) {
      if (!visible(el)) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const s = getComputedStyle(el);
      const fs = parseFloat(s.fontSize);
      const txt = el.textContent.trim().replace(/\s+/g, " ").slice(0, 40);
      if (fs < 13) out.small.push(`${fs}px ${el.tagName.toLowerCase()} "${txt}"`);
      const fg = rgba(s.color); const bg = bgOf(el);
      const a = fg[3]; const mixed = [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
      const L1 = lum(mixed), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const large = fs >= 24 || (fs >= 18.66 && parseInt(s.fontWeight) >= 700);
      const need = large ? 3 : 4.5;
      const key = `${txt}|${ratio.toFixed(2)}`;
      if (ratio < need && !seen.has(key)) { seen.add(key); out.contrast.push(`${ratio.toFixed(2)}:1 (${fs}px ${s.color} on rgb(${bg.slice(0, 3)})) ${el.tagName.toLowerCase()} "${txt}"`); }
    }
    for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=radio], [role=checkbox]")) {
      if (!visible(el) || el.closest(".sr-only")) continue;
      const r = el.getBoundingClientRect();
      const lab = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || (el.labels && el.labels[0]?.textContent.trim()) || el.textContent.trim() || el.title;
      if (!lab) out.unnamed.push(`${el.tagName.toLowerCase()}${el.type ? ":" + el.type : ""} ${el.outerHTML.slice(0, 80)}`);
      const isCb = el.type === "checkbox" || el.type === "radio";
      const target = isCb && el.labels?.[0] ? el.labels[0].getBoundingClientRect() : r;
      if ((target.width < 24 || target.height < 24) && !el.disabled) out.targets.push(`${Math.round(target.width)}x${Math.round(target.height)} ${el.tagName.toLowerCase()}${el.type ? ":" + el.type : ""} "${String(lab).replace(/\s+/g, " ").slice(0, 40)}"`);
    }
    const ids = {}; for (const e of document.querySelectorAll("[id]")) ids[e.id] = (ids[e.id] || 0) + 1;
    out.dupIds = Object.entries(ids).filter(([, n]) => n > 1).map(([i, n]) => `${i} x${n}`);
    out.headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((h) => Number(h.tagName[1]));
    return out;
  });
}

async function focusRing(page, max = 45) {
  const results = [];
  await page.evaluate(() => { document.body.focus(); });
  await page.mouse.click(1, 1);
  await page.keyboard.press("Tab");
  for (let i = 0; i < max; i += 1) {
    const info = await page.evaluate(() => {
      const a = document.activeElement; if (!a || a === document.body) return null;
      const s = getComputedStyle(a); const r = a.getBoundingClientRect();
      const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
      let ringParent = false; if (!ring) { const p = a.closest("label,[data-rac],summary,div"); if (p) { const ps = getComputedStyle(p); ringParent = (ps.outlineStyle !== "none" && parseFloat(ps.outlineWidth) > 0) || (ps.boxShadow && ps.boxShadow !== "none"); } }
      return { tag: a.tagName.toLowerCase(), name: (a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40), ring, ringParent, offscreen: r.bottom < 0 || r.top > innerHeight };
    });
    if (info === null) break;
    results.push(info);
    await page.keyboard.press("Tab");
  }
  return { count: results.length, noRing: results.filter((r) => !r.ring && !r.ringParent).map((r) => `${r.tag} "${r.name}"`) };
}

(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    for (const width of [1440, 390]) {
      const ctx = await L.context(browser, { log, width, height: width === 390 ? 844 : 900 });
      const page = await ctx.newPage();
      L.watch(page, log);
      const screens = {};
      await page.goto(`${L.BASE}/start`);
      await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
      screens["1-documents-empty"] = { sweep: await sweep(page), focus: await focusRing(page) };
      await L.shot(page, `sweep-1-documents-empty-${width}`);
      await L.fillIdentity(page); await L.addFiles(page, ["filing", "workbook", "agreement"]);
      await page.locator("input[type=file]").first().setInputFiles(["/tmp/cs-C2/files/long-" + "a".repeat(200) + ".txt"]);
      screens["1-documents-added-longname"] = { sweep: await sweep(page) };
      await L.shot(page, `sweep-1-documents-added-${width}`);
      await page.getByRole("button", { name: /^Remove long-/ }).click();
      await page.waitForTimeout(300);
      await L.toPurpose(page);
      screens["2-purpose"] = { sweep: await sweep(page), focus: await focusRing(page) };
      await L.shot(page, `sweep-2-purpose-${width}`);
      await page.getByRole("combobox", { name: /Run form level/ }).selectOption("advanced");
      await L.toContext(page);
      for (const t of ["Issuer details", "Valuation and peers", "Module options", "Scenario assumptions"]) await page.locator("summary", { hasText: t }).click().catch(() => {});
      for (const b of ["Add facility", "Add quote", "Add rating", "Add research question"]) await page.getByRole("button", { name: b, exact: true }).click();
      screens["3-context-advanced-open"] = { sweep: await sweep(page), focus: await focusRing(page, 60) };
      await L.shot(page, `sweep-3-context-advanced-${width}`);
      await page.getByRole("combobox", { name: "Legal documents" }).selectOption("executed");
      await page.getByRole("combobox", { name: "The agreement" }).selectOption({ label: "northbridge-credit-agreement.txt" });
      await page.getByRole("combobox", { name: "Portfolio workbook" }).selectOption({ label: "northbridge-portfolio.xlsx" });
      // remove empty rows to avoid validation noise
      for (const r of ["Remove Facility 1", "Remove Quote 1", "Remove Rating 1", "Remove Question 1"]) await page.getByRole("button", { name: r, exact: true }).click();
      await page.getByRole("combobox", { name: /Run form level/ }).count();
      await L.toReview(page).catch(async () => { out.reviewError = await page.locator("[role=alert]").allInnerTexts(); });
      screens["4-review"] = { sweep: await sweep(page), focus: await focusRing(page, 60) };
      await L.shot(page, `sweep-4-review-${width}`);
      await L.decideAndApprove(page);
      await page.getByRole("button", { name: "Submit run", exact: true }).click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(300);
      screens["5-dialog"] = { sweep: await sweep(page) };
      await L.shot(page, `sweep-5-dialog-${width}`);
      out[width] = screens;
      await ctx.close();
    }
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
