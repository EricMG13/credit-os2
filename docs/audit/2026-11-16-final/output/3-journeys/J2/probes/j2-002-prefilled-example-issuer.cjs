// J2-002: Start a run opens with an example issuer in the required Issuer name and Issuer ID fields.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-002-prefilled-example-issuer.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-002", async ({ page, origin }) => {
  await page.goto(origin + "/");
  await page.getByRole("link", { name: "Start a run", exact: true }).first().click();
  await page.getByLabel("Issuer name", { exact: true }).waitFor();
  const read = (label) => page.getByLabel(label, { exact: true }).evaluate((e) => ({ value: e.value, placeholder: e.placeholder, required: e.required }));
  const name = await read("Issuer name");
  const id = await read("Issuer ID");
  const asof = await read("As-of date");
  const yours = await read("Your name");
  console.log("Issuer name:", JSON.stringify(name));
  console.log("Issuer ID:", JSON.stringify(id));
  console.log("As-of date:", JSON.stringify(asof));
  console.log("Your name:", JSON.stringify(yours));
  const ctx = await (await page.request.get(origin + "/connected/context")).json();
  console.log("service default context: issuer_name=%s as_of=%s", ctx.identity.issuer_name, ctx.run.as_of);
  const prefilled = name.value !== "" && name.required && id.value !== "";
  console.log(prefilled
    ? "REPRODUCED: the required fields hold a filled-in example issuer (not placeholders) before the analyst types anything."
    : "NOT REPRODUCED");
});
