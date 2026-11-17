// S3-001: moving to another module with the navigator keeps the old scroll offset, drops focus to <body>,
// leaves document.title unchanged and announces nothing. 1440 x 900, fixture data.
import { activeLabel, fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  const page = await newPage(browser, app.base, modulePath("business-profile"));
  const nav = page.getByRole("navigation", { name: "Modules and sections" });
  const top = () => page.evaluate(() => Math.round(document.querySelector("#main").scrollTop));
  await nav.getByRole("button", { name: "Limitations", exact: true }).click();
  const before = await top();
  const title0 = await page.title();
  await nav.getByRole("link", { name: "Capital structure, Delivered with gaps" }).click();
  await page.waitForTimeout(300);
  const after = await top();
  const heading = await page.evaluate(() => {
    const m = document.querySelector("#main"); const mr = m.getBoundingClientRect();
    const h = [...m.querySelectorAll("h2,h3")].find((e) => e.getBoundingClientRect().bottom > mr.top + 5);
    return h ? `${h.tagName} ${h.textContent.trim().slice(0, 40)}` : "none";
  });
  const focus = await activeLabel(page);
  const live = await page.evaluate(() => document.querySelectorAll("[aria-live],[role=status],[role=alert]").length);
  say(`scroll before ${before}, after ${after}; first visible heading after: ${heading}; focus: ${focus}; title: ${JSON.stringify(await page.title())} (was ${JSON.stringify(title0)}); live regions: ${live}`);
  if (after === before && after > 0) defect("the new module opens at the previous scroll offset, not at its top");
  if (focus.startsWith("body")) defect("focus is on <body> after choosing a module link by pointer");
  await page.goBack();
  await nav.getByRole("link", { name: "Financial performance, Delivered" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const kb = await activeLabel(page);
  say(`keyboard Enter on a module link: focus ${kb}`);
  if (kb.startsWith("body")) defect("focus is on <body> after choosing a module link by keyboard");
  if ((await page.title()) === title0) defect("document.title does not change with the module");
  if (live === 0) defect("no live region announces the change of module");
});
app.cleanup();
