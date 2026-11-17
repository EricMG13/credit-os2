// P02: where focus goes when the Submit confirmation dialog closes, by each way of opening and closing it.
// Expected (D-38): focus returns to the "Submit run" button after Escape, Cancel, the Dismiss button and an
// outside click, however the dialog was opened.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p02-dialog-focus.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");

const where = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a) return "none";
  if (a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()}${a.getAttribute("role") ? `[role=${a.getAttribute("role")}]` : ""} "${(a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40)}"`;
});

(async () => {
  const log = L.newLog();
  const out = { results: [] };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await L.reachReview(page, { agreement: false });
    await L.decideAndApprove(page);
    const submit = page.getByRole("button", { name: "Submit run", exact: true });
    const dialog = page.getByRole("dialog");
    const openers = {
      "mouse click": async () => submit.click(),
      "keyboard Enter": async () => { await submit.focus(); await page.keyboard.press("Enter"); },
      "keyboard Space": async () => { await submit.focus(); await page.keyboard.press("Space"); },
    };
    const closers = {
      Escape: async () => page.keyboard.press("Escape"),
      "Cancel (mouse)": async () => dialog.getByRole("button", { name: "Cancel" }).click(),
      "Cancel (keyboard Enter)": async () => { await dialog.getByRole("button", { name: "Cancel" }).focus(); await page.keyboard.press("Enter"); },
      "Dismiss button (hidden, programmatic click)": async () => page.getByRole("button", { name: "Dismiss" }).evaluate((el) => el.click()),
      "outside click": async () => page.mouse.click(4, 4),
    };
    for (const [o, open] of Object.entries(openers)) {
      for (const [c, close] of Object.entries(closers)) {
        await open();
        await dialog.waitFor({ timeout: 5000 });
        const inside = await where(page);
        await close();
        await dialog.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(150);
        out.results.push({ opened: o, closed: c, focusInDialogOnOpen: inside, focusAfterClose: await where(page) });
      }
    }
    // Tab trap inside dialog
    await submit.click();
    await dialog.waitFor();
    const seq = [];
    for (let i = 0; i < 6; i += 1) { await page.keyboard.press("Tab"); seq.push(await where(page)); }
    out.tabSequenceInDialog = seq;
    await page.keyboard.press("Escape");
  } catch (e) {
    out.error = String(e).slice(0, 500);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 2));
})();
