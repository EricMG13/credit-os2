// J2-004 to J2-007 (Low): what the Documents step says for a wrong file type, an empty file, and two kinds of duplicate.
// Prints the alert, the row badges and the readiness line after each Inspect.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-documents-step-mistakes.cjs
"use strict";
const fs = require("node:fs");
const L = require("./_j2lib.cjs");

const dir = "/tmp/jr/j2-probe-docs-input";
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/setup.exe`, Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00", "latin1"));
fs.writeFileSync(`${dir}/photo.png`, Buffer.alloc(2048, 7));
fs.writeFileSync(`${dir}/empty.txt`, "");
const pick = (name, type = "application/octet-stream") => ({ name, mimeType: type, buffer: fs.readFileSync(`${dir}/${name}`) });
const filing = (name = "northbridge-filing.txt") => ({ name, mimeType: "text/plain", buffer: fs.readFileSync(`${L.REPO}/proof/northbridge-filing.txt`) });

L.run("j2-probe-docs", async ({ page, origin }) => {
  const input = () => page.getByLabel("Documents", { exact: true });
  async function inspect(label) {
    await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
    await L.sleep(2500);
    const alerts = await page.locator("[role=alert]").evaluateAll((els) => els.map((e) => e.textContent.trim()));
    const status = await page.locator("[role=status]").evaluateAll((els) => els.map((e) => e.textContent.trim()).filter(Boolean));
    const rows = await page.locator("li").evaluateAll((els) => els.filter((e) => e.querySelector("button")).map((e) => e.innerText.replace(/\n+/g, " / ")).filter((t) => /Selected|Inspected|Ignored/.test(t)));
    const removes = await page.getByRole("button", { name: /^Remove / }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    console.log(`\n## ${label}\nalerts: ${JSON.stringify(alerts)}\nstatus: ${JSON.stringify(status)}\nrows: ${JSON.stringify(rows)}\nremove buttons: ${JSON.stringify(removes)}`);
  }
  async function clear() {
    for (let i = 0; i < 20; i += 1) {
      const b = page.getByRole("button", { name: /^Remove / }).first();
      if ((await b.count()) === 0) break;
      await b.click();
      await L.sleep(300);
    }
  }
  await page.goto(origin + "/start");
  await page.getByLabel("Issuer name", { exact: true }).waitFor();
  await L.fillIssuer(page);

  await input().setInputFiles([pick("setup.exe")]);
  await inspect("J2-006 wrong type alone: setup.exe");
  await clear();
  await input().setInputFiles([pick("setup.exe"), pick("photo.png", "image/png"), filing()]);
  await inspect("J2-006 wrong types beside a good file: setup.exe, photo.png, northbridge-filing.txt");
  await clear();
  await input().setInputFiles([pick("empty.txt", "text/plain")]);
  await inspect("J2-007 empty file alone: empty.txt (0 bytes)");
  await clear();
  await input().setInputFiles([filing()]);
  await input().setInputFiles([filing()]);
  await inspect("J2-004 same file chosen twice (same name)");
  await clear();
  await input().setInputFiles([filing(), filing("copy-of-filing.txt")]);
  await inspect("J2-005 same bytes under two names");
});
