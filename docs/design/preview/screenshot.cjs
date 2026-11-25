// Full-page screenshot of one connected page. Usage:
//   node docs/design/preview/screenshot.cjs <path-and-hash> <out.png> [width]
// Example: node docs/design/preview/screenshot.cjs "/report/<run>#overview" /tmp/overview.png 1440
const { chromium } = require('playwright');
const ORIGIN = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:8765';
(async () => {
  const [, , target, out, width = '1440'] = process.argv;
  const w = Number(width);
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: w, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  await page.goto(ORIGIN + target);
  await page.waitForTimeout(2500);
  const height = await page.evaluate(() => document.querySelector('main')?.scrollHeight ?? 1000);
  await page.setViewportSize({ width: w, height: Math.min(height + 80, 12000) });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out });
  console.log(JSON.stringify({ height, errors }));
  await browser.close();
})();
