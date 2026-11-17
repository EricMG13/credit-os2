// J2-013: when the Submit request fails, the message is drawn at the top of a long page while the analyst
// is looking at the Submit button; the dialog closes and nothing visible happens.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-013-failed-submit-message-offscreen.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-013", async ({ page, origin }) => {
  let aborted = 0;
  await page.route(/\/api\/submissions\/[^/]+\/submit$/, (route) => {
    if (aborted < 1) { aborted += 1; return route.abort("connectionreset"); } // the analyst's connection drops once
    return route.fallback();
  });
  const submit = await L.toApproved(page, origin);
  await submit.click();
  const dialog = page.getByRole("dialog", { name: "Start a synthetic test?" });
  await L.confirm(dialog);
  await L.sleep(1500);
  const info = await page.evaluate(() => {
    const alerts = [...document.querySelectorAll("[role=alert]")].map((e) => {
      const r = e.getBoundingClientRect();
      return { text: e.textContent.trim(), top: Math.round(r.top), inViewport: r.bottom > 0 && r.top < innerHeight };
    });
    const main = document.querySelector("main");
    return { alerts, viewportHeight: innerHeight, mainScrollTop: main ? Math.round(main.scrollTop) : null, active: document.activeElement?.textContent?.trim().slice(0, 30) };
  });
  console.log(JSON.stringify(info));
  console.log("dialog still open:", await dialog.isVisible().catch(() => false), "| url:", page.url().replace(origin, ""));
  await page.screenshot({ path: "/tmp/jr/j2-probe-013-viewport.png" });
  const hidden = info.alerts.length === 1 && !info.alerts[0].inViewport && /Failed to fetch/.test(info.alerts[0].text);
  console.log(hidden
    ? `REPRODUCED: the message "${info.alerts[0].text}" is at y=${info.alerts[0].top}px, outside the ${info.viewportHeight}px viewport; the analyst sees the dialog close and nothing else.`
    : "NOT REPRODUCED");
});
