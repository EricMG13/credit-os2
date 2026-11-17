// S3-003: at 480 px and below the Limitations header overflows its card; focusing the collapse button
// scrolls the whole <main> sideways. 390 x 844, fixture data (the part is Limitations.tsx, S2's file).
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  for (const w of [480, 390, 320]) {
    const page = await newPage(browser, app.base, modulePath("business-profile"), { w, h: 844 });
    const m = await page.evaluate(() => { const main = document.querySelector("#main"); return { sw: main.scrollWidth, cw: main.clientWidth }; });
    say(`width ${w}: main scrollWidth ${m.sw} vs clientWidth ${m.cw}`);
    if (m.sw > m.cw + 1) defect(`at ${w}px the page scrolls sideways (WCAG 1.4.10 reflow)`);
    if (w === 390) {
      const collapse = page.getByRole("button", { name: "Collapse limitations" });
      await page.getByRole("link", { name: "See this module’s gaps in Evidence" }).focus();
      const before = await page.evaluate(() => document.querySelector("#main").scrollLeft);
      await page.keyboard.press("Tab");
      const after = await page.evaluate(() => document.querySelector("#main").scrollLeft);
      say(`Tab from the gaps link reached: ${await collapse.evaluate((e) => e === document.activeElement)}`);
      const box = await collapse.boundingBox();
      const card = await page.locator("section[aria-label=Limitations]").boundingBox();
      say(`before focus scrollLeft ${before}; after focusing Collapse limitations ${after}; button right edge ${Math.round(box.x + box.width)} (card right edge ${Math.round(card.x + card.width)})`);
      if (after > before) defect("focusing the collapse button shifts the whole page sideways");
    }
    await page.context().close();
  }
});
app.cleanup();
