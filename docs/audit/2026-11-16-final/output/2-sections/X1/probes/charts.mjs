// The twelve chart components not on the kit page, rendered in an esbuild bundle of the real components.
// Shows X1-019 (value label clipped), X1-020 (colour-only series), X1-021 (path chart tab stops),
// X1-022 (label and table figures not compared), X1-023 (limit labels at 390 px), X1-024 (zero part throws).
// Usage (repository root): node docs/audit/2026-11-16-final/output/2-sections/X1/probes/charts.mjs
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch, newPage, removeFolder, tempFolder } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = tempFolder("charts");
execFileSync("node", [path.join(here, "harness", "build.mjs"), dir], { stdio: "inherit", timeout: 120000 });
const base = pathToFileURL(path.join(dir, "index.html")).href;
const browser = await launch();
async function load(c, width = 900) {
  const p = await newPage(browser, { width, height: 800 });
  await p.page.goto(`${base}?case=${c}`);
  await p.page.waitForTimeout(900);
  return p;
}
const lum = (hex) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
try {
  {
    const { context, page } = await load("columns-3");
    console.log("=== columns-3: value labels against the svg top (a negative top is outside the drawing)");
    console.log(
      await page.evaluate(() => {
        const svg = document.querySelector("svg.recharts-surface").getBoundingClientRect();
        return [...document.querySelectorAll("text[data-label]")].map((t) => ({ series: t.dataset.series, text: t.textContent, topBelowSvgTop: Math.round((t.getBoundingClientRect().top - svg.top) * 10) / 10 })).filter((r) => r.topBelowSvgTop < 4);
      }),
    );
    await context.close();
  }
  {
    console.log("=== series colours in grey (relative luminance of the first three chart tokens, and the contrast ratio between them)");
    const c = { "chart-1": "#001aff", "chart-2": "#827bcc", "chart-3": "#994a34", "waterfall total": "#001aff", "waterfall up (brand-400)": "#4d5fff", "waterfall down (chart-3)": "#994a34" };
    for (const [k, v] of Object.entries(c)) console.log(k, v, "L=" + lum(v).toFixed(3));
    const ratio = (a, b) => ((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)).toFixed(2);
    console.log("chart-1 vs chart-3 luminance ratio:", ratio("#001aff", "#994a34"), "| waterfall total vs down:", ratio("#001aff", "#994a34"), "| total vs up:", ratio("#001aff", "#4d5fff"));
  }
  {
    const { context, page } = await load("columns-mismatch");
    console.log("=== columns-mismatch: bar labels vs the table the tooltip and Table side read");
    console.log(await page.evaluate(() => ({ barLabels: [...document.querySelectorAll("text[data-label]")].map((t) => t.textContent), error: window.__uncaught ?? null, errors: window.__errors })));
    await page.getByRole("radio", { name: "Table" }).click();
    console.log("table cells:", await page.evaluate(() => [...document.querySelectorAll("tbody td")].map((t) => t.textContent)));
    await context.close();
  }
  {
    const { context, page } = await load("path", 1440);
    console.log("=== path chart at 1440 px: tab stops and the scroll region");
    console.log(
      await page.evaluate(() => {
        const region = document.querySelector("[role=region]");
        const tabbable = [...document.querySelectorAll("[tabindex='0']")].map((e) => `${e.tagName.toLowerCase()} role=${e.getAttribute("role")}`);
        return { regionLabel: region.getAttribute("aria-label"), scrollWidth: region.scrollWidth, clientWidth: region.clientWidth, tabbable };
      }),
    );
    await context.close();
  }
  {
    const { context, page } = await load("limits-5", 390);
    console.log("=== limits-5 at 390 px: overlapping or clipped label boxes");
    console.log(
      await page.evaluate(() => {
        const items = [...document.querySelectorAll("[data-exposure],[data-limit-label],[data-limit-missing],[data-missing]")].map((e) => ({ t: e.textContent.trim(), r: e.getBoundingClientRect(), col: e.closest("[data-column]")?.getAttribute("data-column") }));
        const clash = [];
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
          const a = items[i].r, b = items[j].r;
          if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) clash.push(`${items[i].t} (${items[i].col}) x ${items[j].t} (${items[j].col})`);
        }
        const plot = document.querySelector("[data-plot]").getBoundingClientRect();
        const out = items.filter((i) => i.r.left < plot.left - 1 || i.r.right > plot.right + 1).map((i) => i.t);
        return { labels: items.length, clash, outsidePlot: out, plotWidth: Math.round(plot.width) };
      }),
    );
    await page.screenshot({ path: path.join(dir, "limits-390.png") });
    await context.close();
  }
  for (const c of ["columns-3", "waterfall-colours", "stack-zero-ok", "scatter", "path"]) {
    const { context, page } = await load(c === "stack-zero-ok" ? "stack-zero" : c);
    if (c === "stack-zero-ok") { await context.close(); continue; }
    const svg = page.locator("svg.recharts-surface").first();
    await svg.focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(250);
    const tip = await page.evaluate(() => document.querySelector(".recharts-tooltip-wrapper")?.textContent ?? null);
    const role = await svg.evaluate((e) => `${e.getAttribute("role")} tabindex=${e.getAttribute("tabindex")}`);
    console.log(`=== keyboard on ${c}: svg ${role}; tooltip text after three ArrowRight presses:`, JSON.stringify(tip));
    await context.close();
  }
  {
    const { context, page } = await load("stack-zero");
    console.log("=== stack-zero: a zero-balance part");
    console.log(await page.evaluate(() => ({ uncaught: window.__uncaught ?? null, root: document.querySelector("#root").textContent })));
    await context.close();
  }
} finally {
  await browser.close();
  removeFolder(dir);
}
