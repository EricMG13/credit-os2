// C3-007: report error states: a network failure prints the browser's own "Failed to fetch"; an unpublished or unknown run reads
// "could not be loaded" with no link or action (D-31).
const { main } = require("./lib.cjs");
main("p07-report-error-states", async ({ context, base, run }) => {
  const read = async (page) => page.evaluate(() => ({ text: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(0, 200), links: [...document.querySelectorAll("main a, main button")].map((e) => e.textContent.trim()).filter(Boolean), alerts: [...document.querySelectorAll("[role=alert]")].map((e) => e.textContent.trim()) }));
  const out = {};
  const unknown = await context.newPage();
  await unknown.goto(`${base}/report/no-such-run#overview`);
  await unknown.waitForTimeout(1200);
  out.unknownRun = await read(unknown);
  await context.route("**/connected/snapshot*", (route) => route.abort("failed"));
  const net = await context.newPage();
  await net.goto(`${base}/report/${run}#overview`);
  await net.waitForTimeout(1500);
  out.networkFailure = await read(net);
  const rawBrowserText = /Failed to fetch/.test(out.networkFailure.text);
  const noWayOut = out.unknownRun.links.length === 0;
  return { defect: rawBrowserText || noWayOut, expected: "a plain sentence naming what happened and a way back (Library, Run activity, retry)", rawBrowserText, noWayOut, detail: out };
});
