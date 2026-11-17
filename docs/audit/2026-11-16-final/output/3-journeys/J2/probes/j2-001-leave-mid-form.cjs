// J2-001: leaving the Start a run form mid-way loses the whole draft, with no warning and no way back.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-001-leave-mid-form.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-001", async ({ page, context, origin, log }) => {
  const dialogs = [];
  context.on("page", (p) => p.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); }));
  page.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });

  async function state(p, label) {
    const step = (await p.locator('[aria-current="step"]').first().innerText({ timeout: 800 }).catch(() => "")).replace(/\n+/g, " / ");
    const issuer = await p.getByLabel("Issuer name", { exact: true }).inputValue({ timeout: 400 }).catch(() => "(not on this step)");
    const files = await p.getByRole("button", { name: /^Remove / }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    const banners = await p.locator("[role=alert],[role=status]").evaluateAll((els) => els.map((e) => e.textContent.trim()).filter(Boolean));
    console.log(`${label}: url=${p.url().replace(origin, "")} step="${step}" issuer="${issuer}" files=${JSON.stringify(files)} notices=${JSON.stringify(banners)}`);
    return { step, files };
  }

  // The analyst fills Documents (three files read), chooses Full, and types a note on More context.
  await page.goto(origin + "/");
  await page.getByRole("link", { name: "Start a run", exact: true }).first().click();
  await page.getByLabel("Issuer name", { exact: true }).waitFor();
  await L.documentsStep(page);
  await L.toPurpose(page);
  await L.toContext(page);
  await page.getByLabel(/Anything the analysis should know/u).fill("Check the 2028 maturities.");
  await state(page, "before leaving (More context, note typed)");

  await page.goBack();
  await L.sleep(1200);
  const afterBack = page.url().replace(origin, "");
  console.log(`browser Back from step 3 -> ${afterBack} (a step earlier would be /start)`);
  await page.goForward();
  await L.sleep(1200);
  const forward = await state(page, "browser Forward");

  await page.getByRole("link", { name: "Library" }).first().click();
  await L.sleep(800);
  await page.getByRole("link", { name: "Start a run", exact: true }).first().click();
  await L.sleep(1200);
  const viaLibrary = await state(page, "rail Library, then Start a run");

  await page.reload();
  await L.sleep(1500);
  const reloaded = await state(page, "reload");

  const second = await context.newPage();
  L.setup(second, log);
  await page.close();
  await second.goto(origin + "/start");
  await L.sleep(1500);
  const reopened = await state(second, "page closed, new tab opened on /start");

  const lost = [forward, viaLibrary, reloaded, reopened].every((s) => /Documents/.test(s.step) && s.files.length === 0);
  console.log(`dialogs shown while leaving: ${JSON.stringify(dialogs)}`);
  console.log(lost && afterBack === "/" && dialogs.length === 0
    ? "REPRODUCED: Back leaves the form altogether; every way back in shows an empty Documents step; no warning was shown."
    : "NOT REPRODUCED");
});
