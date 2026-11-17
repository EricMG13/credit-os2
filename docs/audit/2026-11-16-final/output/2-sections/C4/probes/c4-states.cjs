// C4 state probe: drives the Forecast and Calendar tabs through states the canned run cannot reach,
// by rewriting the JSON the service returns for /connected/snapshot inside the browser (no service
// or application code is changed). Run from the repository root with proof.serve on C4_PORT and a
// finished synthetic run (c4-setup-run.cjs):
//   C4_STATE=<name> node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-states.cjs
// States: no-model, no-charts, no-events, error500, slow, null-case, negative-cash, long-text, units-usd,
//         two-models, nan-grid, many-cases, dup-case, chart-gap, withheld, basis-note, cal-bad-date, cal-gap-years, cal-many, cal-long, no-forecast-handoff, cal-gap-cards, upside-case, other-grid, cal-ref, sent-back
"use strict";
const lib = require("./c4-lib.cjs");
const state = process.env.C4_STATE || "no-model";
const width = Number(process.env.C4_WIDTH || 1440);

function mutate(snap) {
  const ws = snap.workspace;
  const m = ws.models[0];
  const cf = m && m.cashflow;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const fiscalRow = (label) => cf.rows.find((r) => r.label === label);
  const colsOf = (group) => cf.columns.map((c, i) => [c, i]).filter(([c]) => c.group === group).map(([, i]) => i);
  switch (state) {
    case "no-model": ws.models = []; break;
    case "no-charts":
      for (const o of Object.values(ws.outputs)) { o.charts = []; o.chartGaps = []; }
      break;
    case "no-events":
      for (const o of Object.values(ws.outputs)) o.events = [];
      break;
    case "null-case": {
      // the Downside case's last cash proxy cell is not a value
      const row = fiscalRow("Cash proxy (not issuer free cash flow)");
      const last = colsOf("Downside case").at(-1);
      row.cells[last] = { exact: null, display: "n.a.", reason: "Not calculable: cash is negative before funding", status: "na" };
      break;
    }
    case "negative-cash": {
      const cash = fiscalRow("Closing cash");
      const base = colsOf("Base case");
      cash.cells[base[2]] = { exact: "-12.5", display: "-13", reason: null, status: "value" };
      break;
    }
    case "long-text": {
      const long = "This is a very long qualification without any break opportunity " + "x".repeat(200) + " and then a long sentence that keeps going to test wrapping inside the card and the cell, ".repeat(6);
      cf.notes.push(long);
      cf.limits.push(long);
      cf.notes[1] = "Base case is " + "A".repeat(180) + " the reference case with a conditional illustration that carries on for a long time.";
      break;
    }
    case "units-usd": cf.units = "USD millions"; break;
    case "chart-gap": {
      const cp1 = Object.values(ws.outputs).find((o) => o.module === "CP-1");
      cp1.chartGaps = [
        { title: "Peer range", table: 999, gap: "No peer set was supplied for this run." },
        { title: "Rating trigger headroom", table: 998, gap: "Not established: see Filing p.12 for the trigger text (CP-4)." },
        { title: "A very long chart gap title ".repeat(6), table: 997, gap: "Reason ".repeat(80) },
      ];
      break;
    }
    case "basis-note": {
      cf.units = "USD millions";
      cf.limits.push("The machine input is set to zero for taxes and working capital in the first forecast year.");
      const entry = Object.values(ws.outputs).find((o) => o.module === "CP-2G");
      const sections = ws.handoffs[entry.sha256];
      const calc = sections.find((sec) => sec.heading === "Calculations");
      const table = calc.blocks.find((b) => b.type === "table");
      table.headers = ["ID", "Calculation", "Inputs", "Result", "Source"];
      table.rows = [
        { line: table.line + 2, cells: ["C1", "Base FCF FY2025", "x", "194.00", "Filing p.1"] },
        { line: table.line + 3, cells: ["C2", "Base taxes and working-capital inflow FY2025", "y", "62.00", "Filing p.1"] },
      ];
      break;
    }
    case "cal-ref":
    case "cal-bad-date":
    case "cal-gap-years":
    case "cal-many":
    case "cal-long": {
      // keep one module's event table (CP-2D) and drop the other modules' events
      for (const o of Object.values(ws.outputs)) if (o.module !== "CP-2D") o.events = [];
      const entry = Object.values(ws.outputs).find((o) => o.module === "CP-2D");
      const table = ws.handoffs[entry.sha256].flatMap((sec) => sec.blocks).find((b) => b.type === "table" && b.line === entry.events[0].table);
      const row = (date, precision, event, status, line) => ({ line, cells: [date, precision, "2024-11-07", event, status, "Filing p.1", "Wall"] });
      if (state === "cal-ref") table.rows = [row("2025-03-31", "day", "Redemption notice per notice_of_redemption.pdf", "Scheduled — matures", table.line + 2), row("2025-06-30", "day", "Coupon", "Scheduled — pays", table.line + 3)];
      if (state === "cal-bad-date") table.rows = [row("2025-02-30", "day", "Impossible date", "Scheduled — matures", table.line + 2), row("2025-06", "month", "Fine", "Historical — noted", table.line + 3)];
      if (state === "cal-gap-years") table.rows = [row("2025-03-31", "day", "Near", "Scheduled — matures", table.line + 2), row("2031", "year", "Far maturity", "Scheduled — maturity", table.line + 3), row("2025-05-01", "day", "User note", "User reminder — set", table.line + 4)];
      if (state === "cal-many") table.rows = Array.from({ length: 250 }, (_, i) => row(`2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`, "day", `Event ${i}`, i % 3 ? "Scheduled — x" : "Historical — y", table.line + 2 + i));
      if (state === "cal-long") table.rows = [row("2025-03-31", "day", "A very long event name ".repeat(20) + "x".repeat(150), "Scheduled — matures", table.line + 2)];
      break;
    }
    case "no-forecast-handoff": {
      // the model no longer matches exactly one CP-2G handoff
      m.download = "../runs/other/deliveries/other/annual.md";
      break;
    }
    case "cal-gap-cards": {
      const gaps = ["Maturity schedule not supplied.", "Dates are in annual_report.pdf p.12"];
      let k = 0;
      for (const o of Object.values(ws.outputs)) { if (o.events && o.events.length && k < 2) { o.events[0].gap = gaps[k]; k += 1; } }
      break;
    }
    case "upside-case": {
      const base = colsOf("Base case");
      base.forEach((i) => cf.columns.push({ ...cf.columns[i], group: "Upside" }));
      cf.rows.forEach((r) => base.forEach((i) => r.cells.push(clone(r.cells[i]))));
      cf.notes.push("Upside is the optimistic case: growth above the base case.");
      break;
    }
    case "other-grid": {
      const other = clone({ columns: cf.columns.filter((c) => /^FY/.test(c.label) && c.group === "Base case"), rows: cf.rows.map((r) => ({ ...r, cells: r.cells.filter((_, i) => cf.columns[i].group === "Base case" && /^FY/.test(cf.columns[i].label)) })) });
      other.columns.forEach((c) => { c.group = "Downside (CP-2G drivers)"; });
      cf.other = other;
      break;
    }
    case "sent-back": {
      const cp1 = Object.values(ws.outputs).find((o) => o.module === "CP-1");
      cp1.charts = cp1.charts.filter((c) => c.title !== "Leverage");
      cp1.issue = "Chart data: leverage is not in its fixed table";
      break;
    }
    case "withheld": {
      const cp4 = Object.values(ws.outputs).find((o) => o.module === "CP-4");
      cp4.state = { established: false, declared: "not assessable" };
      cp4.summary = { limitation: "This module could not be assessed: the credit agreement was not supplied." };
      break;
    }
    case "two-models": { const second = clone(m); second.id = "second-model-id"; second.mode = "alternate"; ws.models.push(second); break; }
    case "nan-grid": cf.rows.forEach((r) => r.cells.forEach((c) => { if (c.status === "value") { c.exact = "not a number"; } })); break;
    case "many-cases": {
      // seven cases: past the six-case cap of cashProxyCases
      const base = colsOf("Base case");
      for (let k = 0; k < 5; k += 1) {
        base.forEach((i) => cf.columns.push({ ...cf.columns[i], group: `Extra case ${k}` }));
        cf.rows.forEach((r) => base.forEach((i) => r.cells.push(clone(r.cells[i]))));
      }
      break;
    }
    case "dup-case": {
      const base = colsOf("Base case");
      base.forEach((i) => cf.columns.push({ ...cf.columns[i], group: "Base case" }));
      cf.rows.forEach((r) => base.forEach((i) => r.cells.push(clone(r.cells[i]))));
      break;
    }
    default: break;
  }
  return snap;
}

async function main() {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log, { width, height: 900 });
    const page = await ctx.newPage();
    await page.route("**/connected/snapshot*", async (route) => {
      if (state === "error500") return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "boom" }) });
      if (state === "slow") { await new Promise((r) => setTimeout(r, 4000)); }
      const response = await route.fetch();
      const body = await response.json();
      return route.fulfill({ response, json: state === "slow" ? body : mutate(body) });
    });
    const tab = process.env.C4_TAB || "forecast";
    await page.goto(`${lib.BASE}/report/${lib.runId()}#${tab}`);
    if (state === "slow") await page.waitForTimeout(1200);
    else await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    const main = page.locator("main");
    const text = (await main.innerText()).replace(/\n+/g, " | ");
    console.log(state, width, "TEXT:", text.slice(0, Number(process.env.C4_CHARS || 1500)));
    const h = await page.evaluate(() => document.getElementById("main")?.scrollHeight || 900);
    await page.setViewportSize({ width, height: Math.min(h + 40, 9000) });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/cs-C4/scratch/state-${state}-${tab}-${width}.png` });
    await page.unrouteAll({ behavior: "ignoreErrors" });
    console.log(JSON.stringify({ blocked: log.blocked, console: log.console.slice(0, 5), pageErrors: log.pageErrors.slice(0, 5), bad: log.bad.slice(0, 5) }));
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
