// P17: drag and drop onto the drop zone (and onto it while busy), keyboard activation of Choose files / Choose a folder,
// the "No action needed" disclosure on the review sheet, and a double activation of the confirmation (how many submit
// requests leave the page; the probe answers them itself, nothing is started).
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p17-dropzone-keyboard.cjs
"use strict";
const L = require("./lib.cjs");
const fs = require("node:fs");
const active = (page) => page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return "BODY"; return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50)}"`; });
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    // keyboard on Choose files / Choose a folder
    for (const label of ["Choose files", "Choose a folder"]) {
      for (const key of ["Enter", "Space"]) {
        await page.getByRole("button", { name: label }).focus();
        const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 4000 }).catch(() => null), page.keyboard.press(key)]);
        out[`${label} ${key}`] = chooser ? "file chooser opened" : "nothing";
        if (chooser && label === "Choose files") await chooser.setFiles([]); else if (chooser) await chooser.setFiles("/tmp/cs-C2/files/sub");
      }
    }
    // drop
    const drop = async (names) => {
      await page.evaluate(async (items) => {
        const dt = new DataTransfer();
        for (const [name, text] of items) dt.items.add(new File([text], name, { type: "text/plain" }));
        const zone = [...document.querySelectorAll("*")].find((e) => e.textContent.trim() === "Drop files here")?.closest("div[class*=border]") || document.body;
        for (const type of ["dragenter", "dragover", "drop"]) zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
      }, names);
      await page.waitForTimeout(300);
    };
    await drop([["dropped-a.txt", "Revenue 1"], ["dropped-b.txt", "Revenue 2"], [".dropped-hidden.txt", "x"]]);
    out.afterDrop = await page.locator("[aria-label='Documents added'] li").allInnerTexts().then((t) => t.map((x) => x.split("\n")[0]));
    // drop while busy: slow upload
    await ctx.route("**/api/submissions/*/files*", async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
    const inspect = page.getByRole("button", { name: "Inspect documents" });
    await inspect.click();
    await page.waitForTimeout(300);
    out.busyLabel = await page.getByRole("button", { name: /Reading documents/ }).count();
    await drop([["during-busy.txt", "x"]]);
    out.rowsDuringBusyDrop = await page.locator("[aria-label='Documents added'] li").count();
    await page.waitForTimeout(4500);
    out.rowsAfterBusy = await page.locator("[aria-label='Documents added'] li").count();
    out.focusAfterBusy = await active(page);
    out.rowsText = await page.locator("[aria-label='Documents added'] li").allInnerTexts().then((t) => t.map((x) => x.split("\n").filter(Boolean).join(" | ")));
    await ctx.unroute("**/api/submissions/*/files*");
    // review sheet: No action needed disclosure + double activation
    const page2 = await ctx.newPage();
    L.watch(page2, log);
    let submits = 0;
    await ctx.route("**/api/submissions/*/submit", async (route) => { submits += 1; await new Promise((r) => setTimeout(r, 1500)); await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "probe: not started" }) }); });
    await L.reachReview(page2, { agreement: false });
    const sum = page2.locator("summary", { hasText: "No action needed" });
    out.noActionCount = await sum.count();
    if (out.noActionCount) {
      await sum.focus(); await page2.keyboard.press("Enter");
      out.noActionOpenAfterEnter = await sum.evaluate((e) => e.parentElement.open);
      out.noActionText = await sum.evaluate((e) => e.parentElement.innerText.slice(0, 300));
    }
    await L.decideAndApprove(page2);
    await page2.getByRole("button", { name: "Submit run", exact: true }).click();
    const dlg = page2.getByRole("dialog");
    await dlg.waitFor();
    const confirm = dlg.getByRole("button", { name: "Start synthetic run" });
    await confirm.focus();
    await page2.keyboard.press("Enter");
    await page2.keyboard.press("Enter");
    await page2.waitForTimeout(3500);
    out.submitRequestsAfterDoubleEnter = submits;
    out.alertsAfter = await page2.locator("[role=alert]").allInnerTexts();
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
