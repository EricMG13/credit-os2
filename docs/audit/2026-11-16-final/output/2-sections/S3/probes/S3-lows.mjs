// Probes for the Low and Info findings of S3 (one block per finding id). Exit 1 when any defect reproduces.
import { readFileSync } from "node:fs";
import { activeLabel, fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp((slice) => {
  // variant data for S3-016 (unbroken token) and S3-028 (53 modules): changed copies only, never web/fixtures
  const r = slice.issuers.find((i) => i.id === "halden-aerostructures").runs.find((x) => x.id === "2026-09-30");
  const bp = r.modules.find((m) => m.id === "business-profile");
  bp.body.records.find((x) => x.kind === "watch").items[0].threshold = "Supercalifragilisticexpialidocious".repeat(4);
  bp.body.findings[1].lead = "Supercalifragilisticexpialidocious".repeat(4);
  const tpl = r.modules.find((m) => m.id === "industry-and-competition");
  for (let i = 1; i <= 40; i += 1) { const c = structuredClone(tpl); c.id = `extra-module-${i}`; c.name = `Extra module number ${i}`; r.modules.push(c); }
  r.head.tabs.modulesCount = String(r.modules.length);
});
const plain = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  // S3-015: text under 13 px in S3's own files
  let page = await newPage(browser, plain.base, modulePath("capital-structure"));
  const small = await page.evaluate(() => {
    const out = new Set(); const w = document.createTreeWalker(document.querySelector("#main"), NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const t = n.textContent.trim(); const el = n.parentElement; if (!t || el.closest(".sr-only")) continue; const cs = getComputedStyle(el); if (el.getBoundingClientRect().width && parseFloat(cs.fontSize) < 13) out.add(`${cs.fontSize} "${t.slice(0, 30)}"`); }
    return [...out];
  });
  say(`S3-015 text under 13px: ${small.join("; ")}`);
  if (small.length) defect("S3-015: text set under 13px (D-30)");
  // S3-018 / S3-017: Show all control size and the 3-line clamp
  const p2 = await newPage(browser, plain.base, modulePath("business-profile"));
  const show = await p2.getByRole("button", { name: "Show all" }).first().boundingBox();
  say(`S3-018 Show all box ${Math.round(show.width)}x${Math.round(show.height)}`);
  if (show.height < 24) defect("S3-018: Show all is under 24px tall (D-41)");
  const clamped = await p2.locator("section[aria-label=Limitations] li span.line-clamp-3").count();
  if (clamped) defect(`S3-017: ${clamped} limitation(s) cut at three lines behind Show all (D-32)`);
  // S3-022 / S3-021: table scrollers at 390
  const p3 = await newPage(browser, plain.base, modulePath("capital-structure"), { w: 390, h: 844 });
  const scrollers = await p3.evaluate(() => [...document.querySelectorAll("#main div")].filter((d) => getComputedStyle(d).overflowX === "auto" && d.scrollWidth > d.clientWidth).map((d) => ({ role: d.getAttribute("role"), label: d.getAttribute("aria-label"), tabindex: d.getAttribute("tabindex"), cap: d.querySelector("caption")?.textContent })));
  say(`S3-022 scrollers at 390: ${scrollers.length}; with role or name: ${scrollers.filter((s) => s.role || s.label).length}`);
  if (scrollers.length && scrollers.every((s) => !s.role && !s.label)) defect("S3-022: scrollable table wrappers are unnamed generic elements and become tab stops");
  const p4 = await newPage(browser, plain.base, modulePath("business-profile"), { w: 390, h: 844 });
  const impact = await p4.evaluate(() => { const th = [...document.querySelectorAll("th")].find((t) => t.textContent.trim() === "Impact"); const r = th.getBoundingClientRect(); const box = th.closest("div.overflow-x-auto").getBoundingClientRect(); return { right: Math.round(r.right), clip: Math.round(box.right) }; });
  say(`S3-021 Impact column header ends at ${impact.right}, its card's scroll area ends at ${impact.clip}`);
  if (impact.right > impact.clip) defect("S3-021: the Impact column is clipped at 390px with no scroll cue");
  // S3-023: identical trace control names
  const names = await p2.locator("#main button[aria-label^='Show sources']").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  const dup = Object.entries(names.reduce((a, n) => ((a[n] = (a[n] ?? 0) + 1), a), {})).filter(([, c]) => c > 1);
  say(`S3-023 repeated names: ${dup.map(([n, c]) => `${n} x${c}`).join("; ")}`);
  if (dup.length) defect("S3-023: several trace controls on one page share a generic name");
  // S3-024: tab stops before content
  await p2.getByRole("link", { name: "Evidence", exact: true }).focus();
  let stops = 1;
  for (; stops < 80; stops += 1) { const a = await activeLabel(p2); if (/Show sources for the bottom line/.test(a)) break; await p2.keyboard.press("Tab"); }
  say(`S3-024 Tab presses from the Evidence tab to the first content control: ${stops}`);
  if (stops > 15) defect("S3-024: no way past the navigator to the content");
  // S3-025: stale aria-current
  const nav = p2.getByRole("navigation", { name: "Modules and sections" });
  await nav.getByRole("button", { name: "Limitations", exact: true }).click();
  await p2.evaluate(() => { document.querySelector("#main").scrollTop = 0; });
  await p2.waitForTimeout(200);
  const cur = await nav.locator("[aria-current=location]").innerText();
  say(`S3-025 after scrolling back to the top, aria-current is still ${cur}`);
  if (cur === "Limitations") defect("S3-025: the On this page marker does not follow the reader");
  // S3-016: unbroken token overflow (variant data)
  const p2v = await newPage(browser, app.base, modulePath("business-profile"));
  const over = await p2v.evaluate(() => [...document.querySelectorAll("#main li span")].filter((s) => s.textContent.startsWith("Supercali") && s.getBoundingClientRect().right > s.closest("li").getBoundingClientRect().right + 2).length);
  if (over) defect(`S3-016: ${over} unbroken token(s) overflow their row`);
  // S3-028: current entry out of the navigator's view
  const p5 = await newPage(browser, app.base, modulePath("extra-module-40"), { w: 1440, h: 800 });
  const vis = await p5.evaluate(() => { const nav = document.querySelector("nav[aria-label='Modules and sections']"); const c = nav.querySelector("[aria-current=page]").getBoundingClientRect(); const n = nav.getBoundingClientRect(); return c.top >= n.top && c.bottom <= n.bottom; });
  if (!vis) defect("S3-028: the current module entry is outside the navigator's visible area on load");
  // S3-013: Not run modules listed; S3-012: blocked page has no Bottom line
  const p6 = await newPage(browser, plain.base, modulePath("financial-performance", "halden-aerostructures", "2026-03-31"));
  const notRun = await p6.getByRole("navigation", { name: "Modules and sections" }).getByRole("link", { name: /Not run$/ }).count();
  if (notRun) defect(`S3-013: ${notRun} Not run modules are listed in the navigator`);
  const p7 = await newPage(browser, plain.base, modulePath("recovery"));
  const hasBottom = await p7.locator("section[aria-label='Bottom line']").count();
  if (!hasBottom) defect("S3-012: the blocked module page has no Bottom line");
  // S3-014: data module has bottom line only
  const p8 = await newPage(browser, plain.base, "/library/brevane-marine/r-0412/modules/source-readiness");
  const blocks = await p8.locator("#main h3, #main table, #main dl").count();
  say(`S3-014 data module blocks after the bottom line: ${blocks - 1}`);
  if (blocks <= 1) defect("S3-014: the fixture's data module shows only a bottom line");
  // S3-019: loading run
  const p9 = await newPage(browser, plain.base, "/library/halden-aerostructures/2026-06-30/modules");
  const load = await p9.evaluate(() => ({ busy: document.querySelector("[aria-busy=true]")?.getAttribute("aria-label") ?? null, status: document.querySelectorAll("[role=status]").length, nav: document.querySelectorAll("nav[aria-label='Modules and sections']").length, tab: document.querySelector("a[aria-current=page]")?.textContent ?? null }));
  say(`S3-019 loading Modules route: ${JSON.stringify(load)}`);
  if (load.busy === null && load.status === 0 && load.nav === 0) defect("S3-019: loading skeleton has no name or status and no module-shaped content");
  // S3-026: Records label; S3-027: Basis label
  const recs = await p2.getByRole("navigation", { name: "Modules and sections" }).getByRole("button", { name: "Records", exact: true }).count();
  if (recs) defect("S3-026: the navigator entry for typed record blocks is called Records");
  const basis = await p3.locator("#main").innerText();
  if (/\bBasis:/.test(basis)) defect("S3-027: the label 'Basis:' is printed in a footnote");
  // S3-029: New run at 320
  const p10 = await newPage(browser, plain.base, modulePath("business-profile"), { w: 320, h: 700 });
  const nr = await p10.getByRole("link", { name: "New run", exact: true }).evaluate((e) => Math.round(e.getBoundingClientRect().right));
  if (nr > 320) defect(`S3-029: the New run button ends at ${nr}px in a 320px window`);
  // S3-030: no Model entry
  const model = await p2.getByRole("navigation", { name: "Modules and sections" }).getByRole("link", { name: /^Model/ }).count();
  if (!model) defect("S3-030: no Model entry in the Modules navigator");
  // S3-020: statement background
  const bg = await p3.evaluate(() => { const t = [...document.querySelectorAll("table")].find((x) => x.querySelector("caption")?.textContent === "Debt and leverage by year"); const th = t.querySelector("tbody th"); const td = t.querySelector("tbody td"); return [getComputedStyle(th).backgroundColor, getComputedStyle(td).backgroundColor, getComputedStyle(t.closest("section")).backgroundColor]; });
  say(`S3-020 statement row header ${bg[0]}, cell ${bg[1]}, section ${bg[2]}`);
  if (bg[0] !== bg[1]) defect("S3-020: the statement's label column and figure cells have different backgrounds");
  // S3-036: facts of one facility share one drawer; S3-037: navigator state shown by shape only
  const p11 = await newPage(browser, plain.base, modulePath("capital-structure"));
  const facts = p11.locator("#main button[aria-label='Show sources for this fact']");
  const heads = [];
  for (let i = 0; i < 3; i += 1) {
    await facts.nth(i).click(); await p11.waitForTimeout(250);
    heads.push((await p11.getByRole("dialog").first().locator("h2").first().innerText()).trim());
    await p11.keyboard.press("Escape"); await p11.waitForTimeout(250);
  }
  say(`S3-036 drawer headings for Amount, Margin, Maturity: ${heads.join(" | ")}`);
  if (new Set(heads).size === 1) defect("S3-036: Margin and Maturity open a drawer headed with the facility's amount");
  const navText = await p11.getByRole("navigation", { name: "Modules and sections" }).getByRole("link", { name: /Delivered with gaps$/ }).first().innerText();
  say(`S3-037 visible text of a 'Delivered with gaps' entry: "${navText.trim()}"`);
  if (!/gaps/.test(navText)) defect("S3-037: the navigator entry does not draw its state word");
  // Info: reader drops watch.detail
  const read = readFileSync("web/src/pages/library/read.ts", "utf8");
  const watchReader = read.slice(read.indexOf("function readWatch"), read.indexOf("const ANSWER_STATES"));
  if (!/detail/.test(watchReader)) defect("S3-031 (Info): readWatch never reads `detail`; WatchBlock's detail branch is reachable only from the connected report");
});
app.cleanup();
plain.cleanup();
