// J2-014: in the synthetic test, one extra document (a duplicate download or any other file) is read, summarised
// and approved, then the run ends Failed with only "launcher exited 2"; nothing before Submit said it would.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-014-extra-document-fails-run.cjs
"use strict";
const fs = require("node:fs");
const L = require("./_j2lib.cjs");

L.run("j2-probe-014", async ({ page, origin }) => {
  // The browser's name for a second download of the same filing.
  const copy = { name: "northbridge-filing (1).txt", mimeType: "text/plain", buffer: fs.readFileSync(`${L.REPO}/proof/northbridge-filing.txt`) };
  const dialog = await L.toDialog(page, origin, {}, [copy]);
  const sheet = await L.text(page);
  const read = sheet.slice(sheet.indexOf("Documents read"), sheet.indexOf("Purpose and modules")).replace(/\n+/g, " | ");
  console.log("review sheet:", read);
  const warned = /duplicate|same file|already/i.test(sheet);
  console.log("review sheet warns about a duplicate or extra file:", warned);
  await L.confirm(dialog);
  await page.waitForURL(/\/run\//);
  const status = await L.waitEnded(page);
  const body = await L.text(page, "main");
  console.log(`run ended: ${status}; reason on screen: "${(body.match(/launcher exited[^\n]*/) || [""])[0]}"`);
  console.log(status === "Failed" && !warned
    ? "REPRODUCED: the extra document was accepted and approved; the run Failed with no reason the analyst can act on."
    : "NOT REPRODUCED");

  // Control: an extra document that is not a duplicate, for another issuer so that "second run" is not the cause.
  const note = { name: "other-note.txt", mimeType: "text/plain", buffer: Buffer.from("A short analyst note about the issuer. Nothing else.\n") };
  const dialog2 = await L.toDialog(page, origin, { issuer: "Southbridge Synthetic Group" }, [note]);
  await L.confirm(dialog2);
  await page.waitForURL(/\/run\//);
  const status2 = await L.waitEnded(page);
  const body2 = await L.text(page, "main");
  console.log(`control, extra file other-note.txt for another issuer: ${status2}; reason "${(body2.match(/launcher exited[^\n]*/) || [""])[0]}"`);
  console.log(status2 === "Failed" ? "REPRODUCED (control): any fourth file fails the synthetic run." : "NOT REPRODUCED (control)");
});
