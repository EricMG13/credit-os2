// P12: loading, error, partial and refusal states, reached by intercepting requests in the browser (no code edited):
// slow or failing /connected/context, missing caps, failing upload, refused summary (several shapes), failing
// Submit (400, 404, 500, network). Submit is never sent to the service (every submit is fulfilled by the probe).
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p12-states.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60)}"`;
});
const alerts = (page) => page.locator("[role=alert]").allInnerTexts();
const fresh = async (browser, log, width = 1440) => {
  const ctx = await L.context(browser, { log, width });
  const page = await ctx.newPage();
  L.watch(page, log);
  return { ctx, page };
};
(async () => {
  const log = L.newLog();
  const out = { context: {}, summary: {}, upload: {}, submit: {} };
  const browser = await L.launch();
  try {
    // ---- /connected/context states
    {
      const { ctx, page } = await fresh(browser, log);
      await ctx.route("**/connected/context", async (route) => { await new Promise((r) => setTimeout(r, 3000)); await route.continue(); });
      await page.goto(`${L.BASE}/start`);
      await page.waitForTimeout(800);
      out.context.loadingText = await page.locator("main").innerText();
      out.context.loadingRole = await page.getByText("Loading run options…").evaluate((e) => e.getAttribute("role"));
      await L.shot(page, "p12-loading-1440");
      await ctx.close();
    }
    for (const [label, fulfill] of [
      ["500json", { status: 500, contentType: "application/json", body: JSON.stringify({ error: "boom: internal" }) }],
      ["500html", { status: 500, contentType: "text/html", body: "<html>oops</html>" }],
      ["200empty", { status: 200, contentType: "application/json", body: "{}" }],
      ["200nocaps", { status: 200, contentType: "application/json", body: null }],
    ]) {
      const { ctx, page } = await fresh(browser, log);
      await ctx.route("**/connected/context", async (route) => {
        if (label === "200nocaps") {
          const r = await route.fetch(); const j = await r.json(); delete j.submission_caps_usd; return route.fulfill({ response: r, body: JSON.stringify(j) });
        }
        return route.fulfill(fulfill);
      });
      await page.goto(`${L.BASE}/start`);
      await page.waitForTimeout(1200);
      out.context[label] = { alerts: await alerts(page), main: (await page.locator("main").innerText()).split("\n").slice(0, 14).join(" | ").slice(0, 600), pageerrors: log.pageerrors.slice(-2) };
      if (label === "200nocaps") {
        await L.fillIdentity(page); await L.addFiles(page, ["filing"]);
        out.context[label].readiness = await page.getByRole("complementary", { name: "Readiness" }).innerText().then((t) => t.split("\n").slice(-3).join(" / "));
        await L.toPurpose(page); await L.toContext(page);
        await page.getByRole("button", { name: "Review run" }).click();
        await page.waitForTimeout(1500);
        out.context[label].afterReview = { alerts: await alerts(page), h2: await page.$$eval("h2", (h) => h[0].textContent) };
      }
      if (label === "500json") await L.shot(page, "p12-context-error-1440");
      await ctx.close();
    }
    // network abort of context
    {
      const { ctx, page } = await fresh(browser, log);
      await ctx.route("**/connected/context", (route) => route.abort());
      await page.goto(`${L.BASE}/start`);
      await page.waitForTimeout(1000);
      out.context.abort = { alerts: await alerts(page) };
      await ctx.close();
    }
    // ---- upload failure and summary shapes
    const reach = async (page) => { await page.goto(`${L.BASE}/start`); await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor(); await L.fillIdentity(page); await L.addFiles(page, ["filing", "workbook"]); };
    {
      const { ctx, page } = await fresh(browser, log);
      let n = 0;
      await ctx.route("**/api/submissions/*/files*", (route) => { n += 1; return route.fulfill({ status: 500, contentType: "text/plain", body: "Internal Server Error" }); });
      await reach(page);
      await page.getByRole("button", { name: "Inspect documents" }).click();
      await page.waitForTimeout(1200);
      out.upload.fail500 = { alerts: await alerts(page), rows: await page.locator("[aria-label='Documents added'] li").count(), requests: n, focus: await active(page), busyStuck: await page.getByRole("button", { name: /Inspect documents|Reading documents/ }).innerText() };
      await ctx.close();
    }
    {
      const { ctx, page } = await fresh(browser, log);
      await ctx.route("**/api/submissions", (route) => route.request().method() === "POST" ? route.abort() : route.continue());
      await reach(page);
      await page.getByRole("button", { name: "Continue to purpose" }).click();
      await page.waitForTimeout(1200);
      out.upload.createAbort = { alerts: await alerts(page), h2: await page.$$eval("h2", (h) => h[0].textContent) };
      await ctx.close();
    }
    const summaryCases = {
      refusedField: { status: 200, body: { error: "run.cutoff: must not be later than run.as_of" } },
      multi: { status: 200, body: { error: "identity.issuer_name: cannot be blank; attachments.legal_documents: needs an agreement; ratings[0].rating: must not be empty" } },
      stale: { status: 400, body: { error: "this page is out of date: it does not show this pathway's cap of USD 25. Reload the page." } },
      server500: { status: 500, body: { error: "unexpected failure: Traceback (most recent call last): File \"/srv/app/x.py\", line 3" } },
      noJson: { status: 502, body: "Bad gateway", raw: true },
      noDigest: { status: 200, body: { schema: "summary/1", cap: "25", items: [], documents: [], ignored: [], modules: ["CP-0"], omitted: [], changes: "", digest: "" } },
      capMismatch: { status: 200, body: "__passthrough_cap__" },
    };
    for (const [label, spec] of Object.entries(summaryCases)) {
      const { ctx, page } = await fresh(browser, log);
      await ctx.route("**/api/submissions/*/summary", async (route) => {
        if (spec.body === "__passthrough_cap__") { const r = await route.fetch(); const j = await r.json(); j.cap = "999"; return route.fulfill({ response: r, body: JSON.stringify(j) }); }
        return route.fulfill({ status: spec.status, contentType: spec.raw ? "text/plain" : "application/json", body: spec.raw ? spec.body : JSON.stringify(spec.body) });
      });
      await reach(page);
      await L.toPurpose(page); await L.toContext(page);
      await page.getByRole("button", { name: "Review run" }).click();
      await page.waitForTimeout(1500);
      out.summary[label] = { alerts: (await alerts(page)).map((a) => a.slice(0, 300)), h2: await page.$$eval("h2", (h) => h[0].textContent), focus: await active(page), problemButton: await page.getByRole("button", { name: /problem to fix/ }).allInnerTexts() };
      if (label === "multi") await L.shot(page, "p12-summary-multi-1440");
      await ctx.close();
    }
    // ---- submit failures (the POST to submit is always fulfilled by the probe)
    const submitCases = { s400: { status: 400, body: { error: "documents or answers changed after approval" } }, s404: { status: 404, body: { error: "unknown submission" } }, s500: { status: 500, body: { error: "launcher failed" } }, snet: { abort: true }, s200noRun: { status: 200, body: {} } };
    for (const [label, spec] of Object.entries(submitCases)) {
      const { ctx, page } = await fresh(browser, log);
      let hits = 0;
      await ctx.route("**/api/submissions/*/submit", (route) => { hits += 1; if (spec.abort) return route.abort(); return route.fulfill({ status: spec.status, contentType: "application/json", body: JSON.stringify(spec.body) }); });
      await L.reachReview(page, { agreement: false });
      await L.decideAndApprove(page);
      await page.getByRole("button", { name: "Submit run", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Start synthetic run" }).click();
      await page.waitForTimeout(1500);
      const rec = { hits, url: page.url().replace(L.BASE, ""), alerts: await alerts(page), h2: await page.$$eval("h2", (h) => h[0].textContent), focus: await active(page) };
      if (label === "s500" || label === "snet") {
        rec.approveDisabled = await page.getByRole("checkbox", { name: /^Approve:/ }).isDisabled();
        rec.submitEnabled = await page.getByRole("button", { name: "Submit run", exact: true }).isEnabled();
        rec.stepperButtons = await page.getByRole("list", { name: "Steps in this run" }).locator("button").count();
        rec.editDisabled = await page.getByRole("button", { name: "Edit context", exact: true }).isDisabled();
        rec.limitBoxDisabled = await page.getByRole("region", { name: "Limits to decide" }).getByRole("checkbox").first().isDisabled();
        await L.shot(page, `p12-submit-${label}-1440`);
        // retry: second submit
        await page.getByRole("button", { name: "Submit run", exact: true }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Start synthetic run" }).click();
        await page.waitForTimeout(1000);
        rec.hitsAfterRetry = hits;
        rec.alertsAfterRetry = await alerts(page);
      }
      out.submit[label] = rec;
      await ctx.close();
    }
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
