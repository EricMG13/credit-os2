// S3-011: the "No forecast for this run" hint on every run page is text-disabled grey at 12 px: 2.19:1, helper text (D-33).
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  const page = await newPage(browser, app.base, modulePath("business-profile"));
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll("#main span")].find((s) => s.textContent.trim() === "No forecast for this run");
    const cs = getComputedStyle(el);
    return { color: cs.color, size: cs.fontSize, bg: getComputedStyle(document.body).backgroundColor, opacity: cs.opacity };
  });
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = (rgb) => { const [r, g, b] = rgb.match(/\d+/g).map(Number); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
  const canvas = "rgb(246, 245, 255)";
  const ratio = (Math.max(L(r.color), L(canvas)) + 0.05) / (Math.min(L(r.color), L(canvas)) + 0.05);
  say(`hint colour ${r.color} on canvas ${canvas}: ${ratio.toFixed(2)}:1 at ${r.size}`);
  if (ratio < 4.5) defect(`the reason the Forecast tab is unavailable is ${ratio.toFixed(2)}:1 at ${r.size}`);
});
app.cleanup();
