// S6-001: the focused Purpose card looks exactly like the selected, unfocused one (no focus ring is drawn).
import { createHash } from "node:crypto";
import { active, verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  await open("#/run/start/purpose");
  const clip = { x: 100, y: 350, width: 960, height: 150 };
  const sha = (b) => createHash("sha1").update(b).digest("hex");
  const before = sha(await page.screenshot({ clip }));
  for (let i = 0; i < 12 && !(await active(page)).startsWith("input"); i++) await page.keyboard.press("Tab");
  const focused = sha(await page.screenshot({ clip }));
  const label = await page.evaluate(() => { const l = document.activeElement.closest("label"); const cs = getComputedStyle(l); return { focusVisible: l.getAttribute("data-focus-visible"), outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth }; });
  console.log("focus on:", await active(page), JSON.stringify(label));
  console.log("card pixels unfocused vs focused identical:", before === focused);
  verdict(before === focused || label.outlineStyle === "none" ? 1 : 0);
});
