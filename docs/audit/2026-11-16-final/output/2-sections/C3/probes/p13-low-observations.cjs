// C3-014 to C3-020 (Low): several small observations in one run, each printed with the value that shows it.
const { main, inject, sectionsOf } = require("./lib.cjs");
main("p13-low-observations", async ({ page, context, run, report }) => {
  const out = {};
  // identical accessible names
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page.waitForTimeout(500);
  out.repeatedNames = await page.evaluate(() => {
    const names = [...document.querySelectorAll("main button, main a")].map((e) => (e.getAttribute("aria-label") || e.textContent).trim()).filter(Boolean);
    const count = {};
    for (const n of names) count[n] = (count[n] || 0) + 1;
    return Object.fromEntries(Object.entries(count).filter(([, c]) => c > 1));
  });
  // trace control of 'Bottom line by module' sits on its own row under the paragraph
  out.bottomLineByModuleLayout = await page.evaluate(() => {
    const li = document.querySelector('section[aria-label="Bottom line by module"] li');
    const p = li.querySelector("p").getBoundingClientRect();
    const b = li.querySelector('button[aria-label^="Show sources"]').getBoundingClientRect();
    return { paragraphBottom: Math.round(p.bottom), controlTop: Math.round(b.top), controlOnOwnRow: b.top >= p.bottom };
  });
  // landmarks and label in name on a module page
  await page.goto("about:blank");
  await page.goto(report("modules/CP-1"));
  await page.getByRole("heading", { name: "Financial foundation", exact: true }).waitFor();
  out.unlabelledAsides = await page.evaluate(() => [...document.querySelectorAll("aside")].filter((a) => !a.getAttribute("aria-label") && !a.getAttribute("aria-labelledby")).length);
  out.modulesTab = await page.evaluate(() => { const a = document.querySelector('nav[aria-label="Report sections"] a[aria-label^="Modules"]'); return { ariaLabel: a.getAttribute("aria-label"), visibleText: a.textContent.trim() }; });
  // 'Decision rationale' on a lead that is not a decision (CP-6 has no Bottom line here, so CP-2 leads)
  const page2 = await context.newPage();
  await inject(context, (snap) => {
    for (const s of sectionsOf(snap, "CP-6")) if (s.heading === "Bottom line") s.heading = "Summary";
    sectionsOf(snap, "CP-2").find((s) => s.heading === "Bottom line").blocks.push({ type: "text", line: 22, end: 22, text: "A second paragraph of the fundamental credit view." });
  });
  await page2.goto(report("overview"));
  await page2.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page2.waitForTimeout(500);
  out.decisionRationale = await page2.evaluate(() => ({ disclosure: [...document.querySelectorAll("summary")].map((s) => s.textContent.trim()), lead: [...document.querySelectorAll("main h2")].map((h) => h.textContent.trim().slice(0, 40))[1] }));
  await page2.close();
  const defect = Object.values(out.repeatedNames).some((c) => c >= 4) || out.bottomLineByModuleLayout.controlOnOwnRow || out.unlabelledAsides > 1 || out.decisionRationale.disclosure.includes("Decision rationale");
  return { defect, detail: out };
});
