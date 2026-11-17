// A Modules page with contrary evidence in the static fixture: the role of the permanent passage.
// Shows X1-005. Usage (repository root): node docs/audit/2026-11-16-final/output/2-sections/X1/probes/contrary-alert-role.mjs
import path from "node:path";
import { fixtureDist, launch, newPage, removeFolder, tempFolder } from "./lib.mjs";

const tmp = tempFolder("alert");
const base = await fixtureDist(path.join(tmp, "dist"));
const browser = await launch();
try {
  const { context, page, blocked, consoleMsgs } = await newPage(browser);
  await page.goto(base + "#/library/halden-aerostructures/2026-09-30/modules/business-profile");
  await page.waitForSelector("h1");
  await page.waitForTimeout(500);
  console.log(await page.evaluate(() => [...document.querySelectorAll("[role=alert],[role=status],[role=note]")].map((e) => ({ role: e.getAttribute("role"), text: e.textContent.trim().slice(0, 90) }))));
  console.log("blocked:", blocked, "console:", consoleMsgs);
  await context.close();
} finally {
  await browser.close();
  removeFolder(tmp);
}
