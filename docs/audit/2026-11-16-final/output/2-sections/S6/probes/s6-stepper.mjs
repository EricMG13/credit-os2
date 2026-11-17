// S6-011: CM-083 says completed steps of the Run start stepper are buttons. The static page passes no onSelect.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  await open("#/run/start/start");
  const done = await page.locator("ol[aria-label='Steps in this run'] li").evaluateAll((els) => els.filter((e) => /Complete/.test(e.textContent)).length);
  const buttons = await page.locator("ol[aria-label='Steps in this run'] button").count();
  console.log("completed steps:", done, "| of them operable as buttons:", buttons, "(web/src/pages/run/start/StartPage.tsx passes <Stepper step={draft.step} /> with no onSelect)");
  verdict(buttons < done ? 1 : 0);
});
