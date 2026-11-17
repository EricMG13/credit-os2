// C5 probe: the trace drawer of the Confidence score (Financial foundation) shows no input values.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
const fs = require("fs");
lib.withRun(async ({ page, base, run }) => {
  await page.goto(`${base}/report/${run}#modules/CP-1`); await page.reload(); await page.waitForTimeout(800);
  const btn = page.getByRole("button", { name: "Show sources for this figure" }).first();
  await btn.click();
  const dialog = page.getByRole("dialog"); await dialog.waitFor();
  const text = await dialog.innerText();
  console.log(text);
  const inputs = ["Directly Sourced", "Fields present", "Source gate", "CRITICAL"];
  console.log("handoff Confidence inputs rows present in the drawer:", inputs.map((i) => `${i}=${text.includes(i)}`).join(", "));
  console.log("identical \"the row cites no page or register\" entries in the drawer:", (text.match(/the row cites no page or register/g) || []).length);
}).catch((e) => { console.error(e); process.exit(1); });
