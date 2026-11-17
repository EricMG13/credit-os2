// J2-012 (Low): after a run exists for an issuer, typing that issuer on Start a run shows no notice that it already has runs.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-012-no-issuer-notice.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-012", async ({ page, origin }) => {
  const dialog = await L.toDialog(page, origin);
  await L.confirm(dialog);
  await page.waitForURL(/\/run\//);
  console.log("first run:", await L.waitEnded(page));
  const lookups = [];
  page.on("request", (r) => { if (r.url().includes("/api/issuers/")) lookups.push(r.url().replace(origin, "")); });
  await page.goto(origin + "/start");
  const name = page.getByLabel("Issuer name", { exact: true });
  await name.waitFor();
  await name.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("Northbridge Synthetic Group", { delay: 30 });
  await page.getByLabel("Your name", { exact: true }).click();
  await page.keyboard.type("Ana L");
  await L.sleep(2000);
  const section = (await L.text(page)).split("Issuer and case date")[1].split("Readiness")[0];
  console.log("issuer id now:", await page.getByLabel("Issuer ID", { exact: true }).inputValue());
  console.log("text of the issuer section:", section.replace(/\n+/g, " | ").slice(0, 400));
  console.log("issuer lookups made by typing:", JSON.stringify(lookups));
  const notice = /already|earlier run|previous run|has \d+ run|existing run/i.test(section);
  const lookupsWhileTyping = lookups.length;
  await page.getByRole("button", { name: "Carry over from latest run" }).click();
  await L.sleep(1500);
  console.log("after pressing 'Carry over from latest run', lookups:", JSON.stringify(lookups));
  console.log(!notice && lookupsWhileTyping === 0
    ? "REPRODUCED: no notice and no lookup until the analyst presses Carry over from latest run."
    : "NOT REPRODUCED");
});
