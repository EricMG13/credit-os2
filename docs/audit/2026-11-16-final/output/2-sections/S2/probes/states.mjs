// S2 probe: states reached by editing a COPY of the fixture (web/fixtures and web/dist are not touched).
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/states.mjs [outDir]
import { mkdirSync } from "node:fs";
import { makeVariant, open, hash, shippedUrl } from "./harness.mjs";
const OUT = process.argv[2] ?? "/tmp/ss-S2/scratch/states";
mkdirSync(OUT, { recursive: true });
const LONG = process.env.LONGMODE === "words" ? "Extraordinarily detailed ".repeat(9).trim() : "Extraordinarily".repeat(14); // 210 characters
const SENT = "This sentence is deliberately long so that it wraps across several lines and must stay complete without an ellipsis. ".repeat(6);
const halden = (lib) => lib.slice.issuers.find((i) => i.id === "halden-aerostructures");
const run = (lib, id = "2026-09-30") => halden(lib).runs.find((r) => r.id === id);

const VARIANTS = {
  "zero-cards": { addr: ["/library/home"], mutate: (l) => { l.slice.home.cards = []; } },
  "long-card": { addr: ["/library/home"], mutate: (l) => { const c = l.slice.home.cards[0]; c.name = LONG; c.sector = LONG; c.lead = SENT; c.note = SENT; c.pathway = "Long pathway name ".repeat(5); } },
  "long-overview": { addr: ["/library/halden-aerostructures/2026-09-30/overview"], mutate: (l) => {
    const o = run(l).overview;
    o.bottomLine.lead = LONG; o.bottomLine.rest = SENT;
    o.findings[0].lead = LONG; o.findings[0].body = SENT;
    o.limitations.items[0].text = SENT + SENT;
    o.modules.items[0].title = LONG; o.modules.items[0].lead = SENT;
    o.metrics[0].label = LONG; o.metrics[0].note = SENT;
    o.sides.columns[0].items[0].text = SENT; o.sides.columns[0].items[0].qualifier = SENT;
    o.dates[0].title = LONG; o.dates[0].text = SENT;
  } },
  "sparse-overview": { addr: ["/library/halden-aerostructures/2026-09-30/overview"], mutate: (l) => {
    const o = run(l).overview; o.metrics = []; o.sides = null; o.changeView = null;
  } },
  "zero-vs-missing": { addr: ["/library/halden-aerostructures/2026-09-30/overview", "/library/halden-aerostructures/2026-09-30/changes"], mutate: (l) => {
    const r = run(l);
    r.overview.metrics[0].value = { kind: "value", text: "0", at: 0 };
    r.overview.metrics[1].value = null;
    r.overview.metrics[2].value = { kind: "withheld", reason: null };
    r.overview.metrics[3].value = { kind: "gap", reason: "Not established for this run" };
    const ch = r.changes.changes;
    ch[0].from = { kind: "value", text: "0", at: 0 }; ch[0].current = { kind: "value", text: "0.0x", at: 0 }; ch[0].direction = "flat"; ch[0].change = "Unchanged";
    ch[1].from = null; ch[1].current = null; ch[1].direction = "none"; ch[1].change = null;
    ch[2].from = { kind: "withheld", reason: "Withheld until delivered" }; ch[2].current = { kind: "gap", reason: "Not established for this run" }; ch[2].direction = "none"; ch[2].change = null;
  } },
  "long-changes": { addr: ["/library/halden-aerostructures/2026-09-30/changes"], mutate: (l) => {
    const c = run(l).changes; c.heading = SENT; c.subtitle = SENT;
    c.changes[0].measure = LONG; c.changes[0].cause = SENT; c.changes[0].effect = SENT; c.changes[0].change = SENT;
    c.changes[1].current = { kind: "value", text: LONG, at: null }; c.changes[1].from = { kind: "value", text: LONG, at: null };
    c.modules.items[0].lead = SENT;
  } },
  "long-history": { addr: ["/library/halden-aerostructures/history"], mutate: (l) => {
    const h = halden(l).history; h.subtitle = SENT; h.entries[0].text = SENT + LONG; h.entries[0].changes.label = SENT;
  } },
  "invalid-slice": { addr: ["/library/home", "/library/halden-aerostructures/2026-09-30/overview"], mutate: (l) => { delete run(l).overview.bottomLine.lead; } },
  "many-issuers": { addr: ["/library/home"], mutate: (l) => {
    const base = l.slice.home.cards[0];
    for (let i = 0; i < 60; i++) { const c = structuredClone(base); c.issuer = "halden-aerostructures"; c.name = "Issuer " + i; l.slice.home.cards.push(c); }
  }, expectInvalid: true },
};
const only = process.env.ONLY ? process.env.ONLY.split(",") : Object.keys(VARIANTS);
for (const name of only) {
  const spec = VARIANTS[name];
  const v = makeVariant(spec.mutate);
  for (const width of [1440, 390]) {
    const { browser, page, consoleLines, blocked } = await open({ width });
    try {
      for (const a of spec.addr) {
        await page.goto(hash(v.url, a));
        await page.waitForTimeout(500);
        const m = await page.evaluate(() => {
          const main = document.querySelector("main");
          const over = [...document.querySelectorAll("main *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest("[class*=overflow-x-auto]"); }).slice(0, 4).map((e) => e.tagName + "." + String(e.className).slice(0, 40) + " right=" + Math.round(e.getBoundingClientRect().right) + " :" + e.textContent.trim().slice(0, 25));
          return { docOverflow: document.documentElement.scrollWidth > innerWidth + 1, mainOverflow: main ? main.scrollWidth > main.clientWidth + 1 : null, over, text: main?.innerText.replace(/\s+/g, " ").slice(0, 160) };
        });
        const h = await page.evaluate(() => Math.min(document.querySelector("main")?.scrollHeight + 30 || 900, 6000));
        await page.setViewportSize({ width, height: Math.max(900, h) });
        await page.screenshot({ path: `${OUT}/${name}__${a.replace(/[^a-z0-9]+/gi, "_")}__${width}.png` });
        await page.setViewportSize({ width, height: 900 });
        console.log(name, width, a, JSON.stringify(m), "console:", consoleLines.length, "blocked:", blocked.length);
      }
    } finally { await browser.close(); }
  }
  v.cleanup();
}
