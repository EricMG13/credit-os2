// S3-005: Limitations is drawn after every record block; the matrix (CM-004, CM-005) and D-11 put it before them.
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  for (const mod of ["capital-structure", "business-profile"]) {
    const page = await newPage(browser, app.base, modulePath(mod));
    const order = await page.evaluate(() => [...document.querySelectorAll("#main h3")].map((h) => `${Math.round(h.getBoundingClientRect().top + document.querySelector("#main").scrollTop)} ${h.textContent.trim().replace(/\s+/g, " ").slice(0, 48)}`));
    say(`${mod} h3 order (offset, text):\n  ${order.join("\n  ")}`);
    const last = order.at(-1);
    if (/Limitations/.test(last)) defect(`${mod}: Limitations is the last section, after ${order.length - 1} other sections`);
    const navOrder = await page.getByRole("navigation", { name: "Modules and sections" }).locator("ul").first().locator("button").allInnerTexts();
    say(`${mod} On this page: ${navOrder.join(" > ")}`);
  }
});
app.cleanup();
