// Component cases the kit page cannot reach, rendered in a bundle of the real components
// (web/src/components/**) with React in development mode. Nothing in web/ is changed.
// Shows X1-004 (blank cell), X1-006 (Alert nesting), X1-008 (throws), X1-010 (Timeline key),
// X1-009 (tab hover), X1-011 (loading status), X1-012 (Card heading), X1-013 (drop zone colour), X1-015 (truncation).
// Usage (repository root): node docs/audit/2026-11-16-final/output/2-sections/X1/probes/components.mjs
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch, newPage, removeFolder, tempFolder } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = tempFolder("components");
execFileSync("node", [path.join(here, "harness", "build.mjs"), dir], { stdio: "inherit", timeout: 120000 });
const base = pathToFileURL(path.join(dir, "index.html")).href;
const browser = await launch();
async function load(c, width = 420) {
  const p = await newPage(browser, { width, height: 600 });
  await p.page.goto(`${base}?case=${c}`);
  await p.page.waitForTimeout(500);
  return p;
}
try {
  for (const c of ["table-cells", "alert-nesting", "timeline-dup", "status-unknown", "progress-over", "charttable-empty", "charttable-blank", "loading", "card-heading"]) {
    const { context, page } = await load(c);
    const info = await page.evaluate(() => ({
      text: document.querySelector("#root")?.textContent ?? "",
      html: document.querySelector("#root")?.innerHTML ?? "",
      errors: window.__errors ?? [],
      uncaught: window.__uncaught ?? null,
    }));
    console.log(`=== ${c}`);
    console.log("text:", JSON.stringify(info.text).slice(0, 200));
    if (c === "alert-nesting") console.log("alert role:", /role="alert"/.test(info.html), "| errors:", info.errors.map((e) => e.replace(/\s+/g, " ").slice(0, 110)));
    if (c === "timeline-dup") console.log("errors:", info.errors.map((e) => e.slice(0, 120)));
    if (["status-unknown", "progress-over", "charttable-empty", "charttable-blank"].includes(c)) console.log("uncaught render error:", info.uncaught, "| root content:", JSON.stringify(info.text));
    if (c === "loading") console.log("status region html:", info.html);
    if (c === "card-heading") console.log("heading tags:", [...info.html.matchAll(/<h([1-6])/g)].map((m) => "h" + m[1]));
    await context.close();
  }
  {
    const { context, page } = await load("select-long");
    console.log("=== select-long (value text 1185px wide in a 296px box)");
    console.log(await page.evaluate(() => {
      const p = [...document.querySelectorAll("p")].find((e) => e.textContent.includes("Amended"));
      return { scrollWidth: p?.scrollWidth, clientWidth: p?.clientWidth, textOverflow: p && getComputedStyle(p).textOverflow, title: p?.getAttribute("title") };
    }));
    await context.close();
  }
  {
    const { context, page } = await load("file-long");
    console.log("=== file-long");
    console.log(await page.evaluate(() => {
      const p = document.querySelector("p");
      return { scrollWidth: p.scrollWidth, clientWidth: p.clientWidth, textOverflow: getComputedStyle(p).textOverflow, title: p.getAttribute("title") };
    }));
    await context.close();
  }
  {
    const { context, page } = await load("tabs-hover");
    const state = (i) =>
      page.evaluate((i) => {
        const t = document.querySelectorAll("[role=tab]")[i];
        const cs = getComputedStyle(t);
        return { tab: t.textContent, ariaSelected: t.getAttribute("aria-selected"), underline: cs.borderBottomColor, text: cs.color };
      }, i);
    console.log("=== tabs: selected tab vs hovered unselected tab");
    console.log("selected:", await state(0));
    await page.getByRole("tab").nth(1).hover();
    await page.waitForTimeout(250);
    console.log("hovered :", await state(1));
    await context.close();
  }
  {
    const { context, page } = await load("dropzone-invalid");
    await page.locator("input[type=file]").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
    await page.waitForTimeout(300);
    console.log("=== drop zone after a file of the wrong type (accept=.pdf)");
    console.log(await page.evaluate(() => {
      const dz = document.querySelector("[data-dropzone]");
      const p = dz.querySelector("p");
      return { hint: p.textContent, hintColour: getComputedStyle(p).color, hasLiveRegionOrMessage: !!dz.querySelector("[aria-live],[role=alert],[role=status]") };
    }));
    await context.close();
  }
} finally {
  await browser.close();
  removeFolder(dir);
}
