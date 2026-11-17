// Run after npm --prefix web run build, from the repository root, with CHROME_PATH set.
// Uses only a temporary copy of the local build and saved fixtures. No provider or service.
import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const require = createRequire(path.join(root, "web/package.json"));
const { chromium } = require("playwright");
const fixture = (name) =>
  JSON.parse(
    readFileSync(path.join(root, "web/fixtures", `${name}.json`), "utf8"),
  );
const library = fixture("library");
const model = fixture("model").slice;
const data = {
  schema: "credit-os-data/1",
  issuers: library.issuers,
  library: library.slice,
  model,
  run: fixture("run").slice,
};
const halden = data.library.issuers.find(
  (issuer) => issuer.id === "halden-aerostructures",
);
halden.runs[0].changes.changes[0].trace = null;
const counts = halden.runs.find((run) => run.id === "2026-03-31").evidence
  .summary.counts;
counts.push(counts.splice(1, 1)[0]);
model.runs[0].forecast = null;
for (const date of ["2024-12-31", "2024-09-30"]) {
  const bad = structuredClone(model.runs[0]);
  bad.run = date;
  bad.header.asOf = 5;
  model.runs.push(bad);
}

const directory = mkdtempSync(
  path.join(tmpdir(), "credit-os-ui-review-tails-"),
);
cpSync(path.join(root, "web/dist"), directory, { recursive: true });
writeFileSync(
  path.join(directory, "data.js"),
  `window.CREDIT_OS_DATA = ${JSON.stringify(data)};`,
);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const external = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("request", (request) => {
  if (/^https?:/.test(request.url())) external.push(request.url());
});
const go = async (route) => {
  await page.goto(
    `${pathToFileURL(path.join(directory, "index.html")).href}#${route}`,
  );
  await page.getByRole("main").waitFor();
};
const pick = async (name) => {
  await page.getByRole("button", { name: /^Module:/ }).click();
  await page.getByRole("option", { name, exact: true }).click();
  await page.getByRole("listbox").waitFor({ state: "hidden" });
};
const results = [];
try {
  await go("/library/halden-aerostructures/2026-09-30/evidence/record");
  await pick("Capital structure");
  assert.equal(
    await page
      .getByText(
        "Unfiltered timing record: From start to accepted, 13 Nov 2026. Six of thirteen shown.",
      )
      .isVisible(),
    true,
  );
  assert.equal(
    await page
      .getByText("1 of 6 recorded module timings shown for Capital structure.")
      .isVisible(),
    true,
  );
  assert.equal(
    await page
      .getByRole("table", { name: "Module timings" })
      .getByRole("row")
      .count(),
    2,
  );
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, "ui-tail-record.png"),
      fullPage: true,
    });
  results.push("filtered timing rows and full-record provenance");

  await go("/library/brevane-marine/r-0412/evidence/record");
  assert.equal(
    await page
      .getByText(
        "Call rows cover 1 of 2 modules in the run. The Total row is the delivered total for the run.",
      )
      .isVisible(),
    true,
  );
  assert.equal(
    await page
      .getByText("From start to accepted, 31 Dec 2026. One of one shown.")
      .isVisible(),
    true,
  );
  assert.equal(
    await page.getByRole("rowheader", { name: "Total", exact: true }).count(),
    1,
  );
  results.push("separate call-row and timing-sample scopes");

  await go("/library/halden-aerostructures/2026-03-31/evidence/summary");
  await pick("Capital structure");
  assert.match(
    await page.getByRole("region", { name: "Counts" }).innerText(),
    /Calculations\s+0\s+No calculation derivations are recorded in this saved example\./,
  );
  results.push("Calculations qualification survives count-tile reordering");

  await go("/library/halden-aerostructures/2026-09-30/changes");
  assert.equal(
    await page
      .getByRole("button", {
        name: "Show sources for this change: no source recorded",
        exact: true,
      })
      .count(),
    1,
  );
  assert.equal(await page.getByText("4.6x", { exact: true }).isVisible(), true);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, "ui-tail-change.png"),
      fullPage: true,
    });
  results.push("null change trace draws the visible missing marker");

  await go("/model/transdigm/2025-06-30/forecast");
  assert.equal(
    await page.getByText("No forecast was published for this run.").isVisible(),
    true,
  );
  assert.equal(
    await page.getByRole("switch", { name: "Show sources" }).count(),
    0,
  );
  await go("/model/transdigm/2025-06-30/front");
  assert.equal(
    await page.getByRole("switch", { name: "Show sources" }).isVisible(),
    true,
  );
  results.push(
    "no-forecast source switch hidden; populated Model switch retained",
  );

  await go("/model/transdigm/2024-12-31/front");
  assert.equal(
    await page
      .getByText(
        "The financial model for this run could not be shown. Open All financial models to see the available records.",
      )
      .isVisible(),
    true,
  );
  await page
    .getByRole("link", { name: "All financial models", exact: true })
    .click();
  assert.equal(
    await page.getByText("Could not be read", { exact: true }).count(),
    2,
  );
  assert.equal(
    await page.getByRole("link", { name: /TransDigm Group/ }).count(),
    3,
  );
  results.push(
    "multiple unreadable records remain listed with truthful recovery copy",
  );

  for (const [route, title] of [
    [
      "/run/start/purpose",
      "Start a run — Purpose — TransDigm Group — Credit OS",
    ],
    [
      "/run/start/context",
      "Start a run — More context — TransDigm Group — Credit OS",
    ],
    [
      "/run/start/started",
      "Start a run — Run started — TransDigm Group — Credit OS",
    ],
    [
      "/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014",
      "Evidence — Trace — Net leverage 4.6x — Halden Aerostructures — As of 30 Sep 2026 — Credit OS",
    ],
    [
      "/library/halden-aerostructures/2026-09-30/evidence/trace/T-0015",
      "Evidence — Trace — Interest cover 2.4x — Halden Aerostructures — As of 30 Sep 2026 — Credit OS",
    ],
  ]) {
    await go(route);
    await page.waitForFunction(
      (expected) => document.title === expected,
      title,
    );
  }
  results.push("actual saved step and selected item document titles");
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    JSON.stringify(
      { passed: results, pageErrors: errors, externalRequests: external },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  rmSync(directory, { recursive: true, force: true });
}
