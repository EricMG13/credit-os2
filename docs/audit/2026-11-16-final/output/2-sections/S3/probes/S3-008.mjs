// S3-008: on the shipped build (data.js holds no issuers) the module routes show one bare sentence in builder wording.
import { newPage, run, shippedBase } from "./_lib.mjs";

await run(async ({ browser, say, defect }) => {
  for (const hash of ["/library/halden-aerostructures/2026-09-30/modules", "/library/halden-aerostructures/2026-09-30/modules/business-profile"]) {
    const page = await newPage(browser, shippedBase(), hash);
    const r = await page.evaluate(() => ({ text: document.querySelector("#main").innerText.replace(/\n+/g, " | "), icons: document.querySelectorAll("#main svg").length, links: document.querySelectorAll("#main a").length, buttons: document.querySelectorAll("#main button").length, h1: document.querySelector("h1")?.textContent }));
    say(`${hash}: h1 "${r.h1}", text "${r.text}", icons ${r.icons}, links ${r.links}, buttons ${r.buttons}`);
    if (r.links === 0 && r.buttons === 0 && r.icons === 0) defect("the empty state is a plain sentence: no icon, no title, no next action, and it says 'data file'");
    await page.context().close();
  }
});
