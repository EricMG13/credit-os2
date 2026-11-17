// C1-014 (document titles), C1-015 (heading levels), C1-016 (Cards/List arrow keys), C1-019 (state lost on Back).
// Real service answers; needs one completed synthetic run (ensureRun makes it).
"use strict";
const L = require("./lib.cjs");
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    const defects = [];
    try {
      const { context, log } = await L.newContext(browser);
      const id = await L.ensureRun(context, log);
      for (const [label, url] of [["library", "/"], ["run activity", "/runs"], ["run", `/run/${id}`], ["report", `/report/${id}`]]) {
        const page = await L.open(context, log, url);
        await L.settle(page, 900);
        const title = await page.title();
        const heads = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => h.tagName));
        console.log(`${label}: title=${JSON.stringify(title)} headings=${heads.join(",")}`);
        if (title === "Credit OS" && label !== "report") defects.push(`title of ${label} is just 'Credit OS'`);
        const sequence = heads.map((h) => Number(h[1]));
        if (sequence.some((n, i) => i > 0 && n - sequence[i - 1] > 1)) defects.push(`heading level skipped on ${label}`);
        await page.close();
      }
      const page = await L.open(context, log, "/");
      await L.settle(page, 800);
      await page.getByRole("radio", { name: "Cards" }).focus();
      await page.keyboard.press("ArrowRight");
      const afterArrow = await page.getByRole("radio", { name: "List" }).getAttribute("aria-checked");
      const focused = await page.evaluate(() => document.activeElement?.innerText);
      await page.keyboard.press("Space");
      const afterSpace = await page.getByRole("radio", { name: "List" }).getAttribute("aria-checked");
      console.log(`ArrowRight: focus=${focused} List aria-checked=${afterArrow}; after Space: ${afterSpace}`);
      if (focused === "List" && afterArrow === "false") defects.push("arrow key moves focus without selecting (radio role)");
      await page.getByRole("radio", { name: "Cards" }).click();
      // state lost after Back
      await page.getByRole("searchbox", { name: "Search issuers" }).fill("zz-keep");
      await page.getByRole("searchbox", { name: "Search issuers" }).fill("");
      const first = (await page.locator("ul li h3").first().innerText());
      await page.getByRole("searchbox", { name: "Search issuers" }).fill(first.slice(0, 4));
      await page.getByRole("link", { name: "Open report" }).first().click();
      await L.settle(page, 800);
      await page.goBack();
      await L.settle(page, 800);
      const kept = await page.getByRole("searchbox", { name: "Search issuers" }).inputValue();
      console.log(`search text after Back: ${JSON.stringify(kept)}`);
      if (kept === "") defects.push("search text lost after Back");
      L.verdict(defects.length > 0, defects.join("; "));
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
