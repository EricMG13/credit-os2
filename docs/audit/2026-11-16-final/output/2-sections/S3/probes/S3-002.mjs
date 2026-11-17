// S3-002: the trace control on the Navy bottom-line band takes the Ultramarine focus ring (2.4:1 on Navy), not focus-inverse.
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (rgb) => "#" + rgb.match(/\d+/g).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  const page = await newPage(browser, app.base, modulePath("business-profile"));
  const control = page.getByRole("button", { name: "Show sources for the bottom line" });
  await page.getByRole("link", { name: "Evidence", exact: true }).focus();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    if (await control.evaluate((e) => e === document.activeElement)) break;
  }
  const shadows = await control.evaluate((e) => getComputedStyle(e).boxShadow);
  const colours = [...shadows.matchAll(/rgba?\([^)]+\)/g)].map((m) => m[0]).filter((c) => !/, 0\)$/.test(c));
  const band = await page.evaluate(() => getComputedStyle(document.querySelector("section[aria-label='Bottom line']")).backgroundColor);
  const ring = colours.at(-1);
  const r = ratio(hex(ring), hex(band));
  say(`focused control box-shadow: ${shadows}\nring ${hex(ring)} on band ${hex(band)} = ${r.toFixed(2)}:1; focus-inverse #4ad4ff on band = ${ratio("#4ad4ff", hex(band)).toFixed(2)}:1`);
  if (r < 3) defect(`focus ring contrast on the Navy band is ${r.toFixed(2)}:1, under 3:1 (D-34 asks for focus-inverse #4AD4FF, 11.36:1)`);
});
app.cleanup();
