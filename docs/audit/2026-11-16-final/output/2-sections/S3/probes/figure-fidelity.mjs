// Figure fidelity (check 4): every cell of every record block in web/fixtures/library.json against what the module page draws:
// value, row, column, missing (n.a.) versus zero, withheld and gap forms. The expected values come from the fixture file only.
import { readFileSync } from "node:fs";
import { fixtureApp, newPage, run } from "./_lib.mjs";

const lib = JSON.parse(readFileSync("web/fixtures/library.json", "utf8")).slice;
const cellText = (c) => (c === null ? "n.a." : typeof c === "string" ? c : c.kind === "value" ? c.text : c.kind === "withheld" ? "Withheld" : "Not established for this run");
const norm = (s) => s.replace(/\s+/g, " ").replace(/n\.a\.\s*not available/g, "n.a.").trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  let checked = 0;
  const bad = [];
  const eq = (where, got, want) => { checked += 1; if (norm(got) !== norm(want)) bad.push(`${where}: page "${norm(got)}" vs fixture "${norm(want)}"`); };
  for (const issuer of lib.issuers) for (const r of issuer.runs) {
    if (r.loading) continue;
    for (const m of r.modules) {
      if (m.body.kind !== "delivered" || m.body.records.length === 0) continue;
      const page = await newPage(browser, app.base, `/library/${issuer.id}/${r.id}/modules/${m.id}`);
      for (const b of m.body.records) {
        const tag = `${issuer.id}/${r.id}/${m.id} [${b.kind}] "${b.title}"`;
        if (["statement", "chartTable", "matrix"].includes(b.kind)) {
          const t = page.locator("table").filter({ has: page.locator("caption", { hasText: b.title }) }).first();
          const rows = await t.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.textContent.trim())));
          const heads = await t.locator("thead th").allInnerTexts();
          const wantHeads = b.kind === "statement" ? [b.stub, ...b.periods] : b.kind === "matrix" ? b.columns : b.columns.map((c) => c.label);
          wantHeads.forEach((h, i) => eq(`${tag} head ${i}`, heads[i] ?? "<none>", h));
          const wantRows = b.kind === "statement" ? b.rows.map((x) => [x.label, ...x.cells.map(cellText)]) : b.kind === "matrix" ? b.rows.map((x) => [x.risk, x.probability ?? "n.a.", x.impact ?? "n.a."]) : b.rows.map((x) => x.cells.map(cellText));
          eq(`${tag} row count`, String(rows.length), String(wantRows.length));
          wantRows.forEach((wr, ri) => wr.forEach((w, ci) => {
            let got = rows[ri]?.[ci] ?? "<none>";
            got = got.replace(/\s*Gap\s*$/i, "Not established for this run");
            eq(`${tag} r${ri}c${ci}`, got, w);
          }));
        } else if (b.kind === "facts") {
          for (const g of b.groups) for (const x of g.rows) {
            const dd = await page.locator("dt", { hasText: new RegExp(`^${esc(x.label)}$`) }).first().locator("xpath=following-sibling::dd[1]").innerText();
            eq(`${tag} ${g.name}/${x.label}`, dd, cellText(x.value));
          }
        } else if (b.kind === "status") {
          for (const g of b.groups) for (const x of g.items) {
            const t = norm(await page.locator("li", { hasText: x.text }).first().innerText());
            checked += 1;
            if (!t.includes(x.text) || (x.value && x.value.kind === "value" && !t.includes(x.value.text))) bad.push(`${tag} ${x.text}: page "${t}"`);
          }
        } else if (b.kind === "metrics" || b.kind === "measures") {
          for (const x of b.items) {
            const t = norm(await page.locator(`#main section:has(> h3:text-is("${b.title}")) li`, { hasText: x.label }).first().innerText());
            const want = cellText(x.current ?? x.value);
            checked += 1; if (!t.includes(want)) bad.push(`${tag} ${x.label}: page "${t}" lacks "${want}"`);
            if (b.kind === "measures") {
              const ex = x.delta ? x.delta.text : "Earlier period " + cellText(x.earlier);
              checked += 1; if (!t.includes(ex)) bad.push(`${tag} ${x.label}: lacks "${ex}"`);
            }
          }
        }
      }
      await page.context().close();
    }
  }
  say(`checked ${checked} figures and cells; mismatches ${bad.length}`);
  bad.forEach((b) => defect(b));
});
app.cleanup();
