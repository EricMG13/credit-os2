// P11: the Submit wording in LIVE mode, seen without spending: the page HTML is rewritten in the browser so its
// credit-os-mode meta says "live"; the dialog is opened and CANCELLED, never confirmed (R4). Also the case-kind
// notices (public, private, synthetic) on the review sheet. Prints JSON.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p11-live-wording.cjs
"use strict";
const L = require("./lib.cjs");
(async () => {
  const log = L.newLog();
  const out = { live: {}, kinds: {} };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    // live page: rewrite the meta; abort any POST to submit as a belt-and-braces guard
    await ctx.route("**/api/submissions/*/submit", (route) => { log.notes.push("submit POST aborted by probe"); return route.abort(); });
    await ctx.route(`${L.BASE}/start`, async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace('name="credit-os-mode" content="synthetic"', 'name="credit-os-mode" content="live"');
      await route.fulfill({ response, body });
    });
    const page = await ctx.newPage();
    L.watch(page, log);
    await L.reachReview(page, { agreement: false });
    out.live.badge = await page.getByText("Synthetic test", { exact: true }).count();
    out.live.capTitle = await page.getByRole("complementary", { name: "Readiness" }).innerText().then((t) => t.split("\n").slice(-3).join(" / "));
    out.live.heading = await page.getByRole("heading", { name: /Submit starts/ }).innerText();
    out.live.costText = await page.locator("#run-submit-cost").innerText();
    await L.decideAndApprove(page);
    const submit = page.getByRole("button", { name: /^Submit/ });
    out.live.submitLabel = await submit.innerText();
    await submit.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    out.live.dialogTitle = await dialog.getByRole("heading").innerText();
    out.live.dialogText = await dialog.locator("p").innerText();
    out.live.dialogButtons = await dialog.getByRole("button").allInnerTexts();
    await L.shot(page, "p11-live-dialog-1440");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    out.live.submitRequests = log.requests.filter((r) => /submit/.test(r));
    // Different pathway caps in the live dialog text
    await page.getByRole("button", { name: "Go back to Purpose" }).click();
    await page.getByRole("radiogroup", { name: "Pathway" }).getByText("Deep credit assessment", { exact: true }).click();
    await L.toContext(page);
    await L.toReview(page);
    await L.decideAndApprove(page);
    await page.getByRole("button", { name: /^Submit/ }).click();
    out.live.deepDialogText = await page.getByRole("dialog").locator("p").innerText();
    out.live.deepSubmitLabel = await page.getByRole("button", { name: /^Submit/ }).innerText();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    // case kinds on the review sheet
    for (const kind of ["public", "private", "synthetic"]) {
      await page.getByRole("button", { name: "Edit purpose and modules" }).click();
      await page.getByRole("combobox", { name: /Case kind/ }).selectOption(kind);
      await page.getByRole("button", { name: "Continue to context" }).click();
      await page.getByRole("button", { name: "Review run" }).click();
      await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
      await page.waitForTimeout(500);
      const text = await page.locator("main").innerText();
      out.kinds[kind] = text.split("\n").filter((l) => /search|Yahoo|lookup|Lookup|OpenAI|ticker/i.test(l));
    }
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
