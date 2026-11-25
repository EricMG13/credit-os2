// Rendered check of connected pages in a real browser. A test in jsdom has no layout, so it
// cannot see overflow, colliding labels, small targets or shrunken text; this can.
//
// Usage:
//   node docs/design/preview/check-render.cjs --out <dir> [--stress] [--fixture <file.cjs>]
//        [--widths 1440,1280,1024,768,390] "<path-and-hash>" ["<path-and-hash>" ...]
// Example:
//   node docs/design/preview/check-render.cjs --out ~/shots --stress "/report/<run>#overview"
//
// --stress    triples every one-line prose string in the /connected/* JSON the page loads, so
//             text wraps the way a real handoff's does. Layout only: never judge content on it.
// --fixture   a module exporting (url, json) => json, applied to the same responses, for cases
//             the synthetic run does not have (many events, long names, a blocked module).
// Writes one full-page PNG per page and width, prints the failures, exits 1 if there are any.
// It finds what a look would find; it does not replace looking at the PNGs.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const ORIGIN = process.env.PREVIEW_ORIGIN || "http://127.0.0.1:8765";

function options(argv) {
  const found = {
    widths: [1440, 1280, 1024, 768, 390],
    pages: [],
    stress: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") found.out = argv[(i += 1)];
    else if (arg === "--fixture")
      found.fixture = require(path.resolve(argv[(i += 1)]));
    else if (arg === "--widths")
      found.widths = argv[(i += 1)].split(",").map(Number);
    else if (arg === "--stress") found.stress = true;
    else found.pages.push(arg);
  }
  if (!found.out || found.pages.length === 0) {
    console.error(
      "usage: check-render.cjs --out <dir> [--stress] [--fixture f.cjs] <path> ...",
    );
    process.exit(2);
  }
  return found;
}

const PROSE = /^[^\n]{60,}$/;
const NOT_PROSE = /^(https?:|\/|[0-9a-f]{32,}$)/i;

function stressed(value) {
  if (typeof value === "string") {
    return PROSE.test(value) && value.includes(" ") && !NOT_PROSE.test(value)
      ? `${value} ${value} ${value}`
      : value;
  }
  if (Array.isArray(value)) return value.map(stressed);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, stressed(item)]),
    );
  }
  return value;
}

async function intercept(page, { stress, fixture }) {
  if (!stress && !fixture) return;
  await page.route("**/connected/**", async (route) => {
    const response = await route.fetch();
    if (!(response.headers()["content-type"] || "").includes("json")) {
      return route.fulfill({ response });
    }
    let json = await response.json();
    if (fixture) json = fixture(route.request().url(), json);
    if (stress) json = stressed(json);
    return route.fulfill({ response, json });
  });
}

// Runs in the page. Returns the failures a reader would see at this width.
function measure(minTarget) {
  const failures = [];
  const name = (el) => {
    const text = (el.getAttribute("aria-label") || el.textContent || "")
      .trim()
      .slice(0, 60);
    return `<${el.tagName.toLowerCase()}> "${text}"`;
  };
  const shown = (el) => {
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    // Content of a closed disclosure is not on screen, whatever its box says.
    const closed = el.closest("details:not([open])");
    if (closed && !el.closest("summary")) return false;
    return (
      box.width > 2 &&
      box.height > 2 &&
      style.visibility !== "hidden" &&
      style.display !== "none"
    );
  };
  // A point is the control's when the control or its content is hit there, or the label that
  // holds it (a label's whole box activates its input). A hit on any other ancestor is not.
  const inside = (el, x, y) => {
    const hit = document.elementFromPoint(x, y);
    if (!hit) return false;
    if (hit === el || el.contains(hit)) return true;
    const label = hit.closest("label");
    return Boolean(label && label.contains(el));
  };

  const page = document.documentElement;
  if (page.scrollWidth > window.innerWidth + 1) {
    failures.push(
      `page scrolls sideways: ${page.scrollWidth} in ${window.innerWidth}`,
    );
  }

  for (const el of document.querySelectorAll("*")) {
    const style = getComputedStyle(el);
    const scrolls =
      /auto|scroll/.test(style.overflowX) &&
      el.scrollWidth > el.clientWidth + 1;
    if (scrolls && shown(el)) {
      const named =
        el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
      if (el.tabIndex < 0 || !named) {
        failures.push(`scroll box not focusable or not named: ${name(el)}`);
      }
    }
    const cut =
      style.overflow === "hidden" && el.scrollWidth > el.clientWidth + 1;
    if (
      cut &&
      shown(el) &&
      el.children.length === 0 &&
      !el.closest("[title]")
    ) {
      failures.push(`text cut with no full text reachable: ${name(el)}`);
    }
  }

  const controls =
    "a[href], button, summary, select, [role=button], input:not([type=hidden], [type=checkbox], [type=radio])";
  for (const el of document.querySelectorAll(controls)) {
    if (!shown(el) || el.closest("p, li > span, td > span") !== null) continue;
    // A control a pointer cannot reach is no touch target (target size is about pointers).
    if (getComputedStyle(el).pointerEvents === "none") continue;
    // A control inside a sideways-scrolled box is hit-tested where a reader scrolls it to: in
    // view, not flush against the box's clipped edge.
    el.scrollIntoView({ block: "nearest", inline: "center" });
    const box = el.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const reach = minTarget / 2 - 1;
    const tall =
      box.height >= minTarget ||
      (inside(el, x, y - reach) && inside(el, x, y + reach));
    const wide =
      box.width >= minTarget ||
      (inside(el, x - reach, y) && inside(el, x + reach, y));
    if (!tall || !wide) {
      failures.push(
        `target under ${minTarget}px (${Math.round(box.width)}x${Math.round(box.height)}): ${name(el)}`,
      );
    }
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const small = new Set();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!node.textContent.trim() || !el || !shown(el) || el.closest(".sr-only"))
      continue;
    let size = Number.parseFloat(getComputedStyle(el).fontSize);
    const svg = el.closest("svg");
    if (svg && el instanceof SVGGraphicsElement)
      size *= el.getScreenCTM()?.a ?? 1;
    if (size < 11.5) small.add(`text at ${size.toFixed(1)}px: ${name(el)}`);
  }
  failures.push(...small);

  for (const svg of document.querySelectorAll("svg")) {
    const frame = svg.getBoundingClientRect();
    const labels = [...svg.querySelectorAll("text")].filter(shown);
    const boxes = labels.map((label) => label.getBoundingClientRect());
    boxes.forEach((box, i) => {
      if (box.left < frame.left - 1 || box.right > frame.right + 1) {
        failures.push(`chart label outside its figure: ${name(labels[i])}`);
      }
      for (let j = i + 1; j < boxes.length; j += 1) {
        const other = boxes[j];
        const across =
          Math.min(box.right, other.right) - Math.max(box.left, other.left);
        const down =
          Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top);
        if (across > 2 && down > 2) {
          failures.push(
            `chart labels overlap: ${name(labels[i])} and ${name(labels[j])}`,
          );
        }
      }
    });
  }
  return failures;
}

async function check(browser, target, width, found) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
  });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (error) =>
    failures.push(`page error: ${String(error).slice(0, 200)}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      failures.push(`console error: ${message.text().slice(0, 200)}`);
  });
  await intercept(page, found);
  await page.goto(ORIGIN + target);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  // The page scrolls inside <main>, so the viewport is grown to hold it. A box sized in viewport
  // units grows with the viewport, so measure again until the height settles.
  const tall = () =>
    page.evaluate(() => {
      const main = document.querySelector("main");
      return Math.max(
        document.documentElement.scrollHeight,
        (main?.scrollHeight ?? 0) + 120,
      );
    });
  let height = await tall();
  for (let pass = 0; pass < 4; pass += 1) {
    await page.setViewportSize({ width, height: Math.min(height, 15000) });
    await page.waitForTimeout(300);
    const next = await tall();
    if (next <= height) break;
    height = next;
  }
  // The screenshot comes first: the measure scrolls sideways-scrolled boxes to each control.
  const file = `${target.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-${width}.png`;
  await page.screenshot({ path: path.join(found.out, file) });
  // A phone is narrower than 480px, as the pages' `max-[480px]` styles are.
  const seen = await page.evaluate(measure, width < 480 ? 44 : 32);
  const kinds = new Map();
  for (const failure of seen) {
    const kind = failure.split(":")[0];
    kinds.set(kind, [...(kinds.get(kind) ?? []), failure]);
  }
  for (const [kind, list] of kinds) {
    failures.push(...list.slice(0, 6));
    if (list.length > 6)
      failures.push(`${kind}: ${list.length - 6} more of this kind`);
  }
  await context.close();
  return { target, width, height, file, failures };
}

(async () => {
  const found = options(process.argv.slice(2));
  fs.mkdirSync(found.out, { recursive: true });
  const browser = await chromium.launch();
  let failed = 0;
  for (const target of found.pages) {
    for (const width of found.widths) {
      const result = await check(browser, target, width, found);
      failed += result.failures.length;
      console.log(
        `${result.failures.length ? "FAIL" : "ok  "} ${target} @${width} (${result.height}px) ${result.file}`,
      );
      const counts = new Map();
      for (const failure of result.failures)
        counts.set(failure, (counts.get(failure) ?? 0) + 1);
      for (const [failure, count] of counts)
        console.log(`       ${failure}${count > 1 ? ` (x${count})` : ""}`);
    }
  }
  await browser.close();
  console.log(failed ? `${failed} failures` : "no failures");
  process.exit(failed ? 1 : 0);
})();
