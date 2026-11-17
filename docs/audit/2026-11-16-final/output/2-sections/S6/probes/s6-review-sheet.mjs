// S6-012: what the static Confirm step (the review sheet, CM-086) holds, against what the row says it holds.
import { verdict, withApp } from "./_s6lib.mjs";
const NEEDED = { "modules, plain-named": /Documentation review|Financial analysis|Liquidity/, "left-out modules": /left out|not run|omitted/i, "run limits / decisions": /decision|limit/i, "Changes comparison row": /Changes|first run|earlier run/i, "web-lookup statement": /web|search|look.?up/i, "approval control": null };
await withApp(async ({ open, page }) => {
  await open("#/run/start/confirm");
  const t = await page.locator("main").innerText();
  const main = t.split("Readiness")[0];
  let missing = 0;
  for (const [name, re] of Object.entries(NEEDED)) {
    const found = re ? re.test(main.replace(/Documents[\s\S]*?Left out[^\n]*\n[^\n]*/, "")) : (await page.getByRole("checkbox").count()) > 0;
    if (!found) missing++;
    console.log(name.padEnd(26), found ? "present" : "ABSENT");
  }
  console.log("Approve summary is a", await page.getByRole("link", { name: "Approve summary" }).evaluate((e) => e.tagName.toLowerCase()), "to", await page.getByRole("link", { name: "Approve summary" }).getAttribute("href"));
  verdict(missing > 0 ? 1 : 0);
});
