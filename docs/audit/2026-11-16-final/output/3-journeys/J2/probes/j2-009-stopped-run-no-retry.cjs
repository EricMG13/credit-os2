// J2-009 and J2-010: a stopped (Failed) run offers no retry or resume, and its activity feed never records the stop.
// A Lite credit assessment ends Failed in the synthetic test (J1-003); that is the stopped run the analyst meets.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-009-stopped-run-no-retry.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-009", async ({ page, origin }) => {
  const dialog = await L.toDialog(page, origin, { pathway: "Lite credit assessment" });
  await L.confirm(dialog);
  await page.waitForURL(/\/run\//);
  const id = page.url().split("/").pop();
  const status = await L.waitEnded(page);
  await L.sleep(500);
  const body = await L.text(page, "main");
  const links = await page.getByRole("link").evaluateAll((els) => els.map((e) => `${e.textContent.trim()} -> ${e.getAttribute("href")}`).filter((s) => !s.startsWith("Skip")));
  const buttons = await page.getByRole("button").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  console.log(`run ${id} ended: ${status}`);
  console.log("header:", body.split("\n").filter(Boolean).slice(0, 12).join(" | "));
  console.log("links:", JSON.stringify(links));
  console.log("buttons:", JSON.stringify(buttons));
  const words = /retry|resume|try again|restart|start again/i.test(body);
  console.log("any retry / resume / try again / restart wording on the page:", words);
  const reason = (body.match(/launcher exited[^\n]*/) || [""])[0];
  const logStatus = (await page.request.get(`${origin}/logs/${id}.log`)).status();
  console.log(`reason on screen: "${reason}"; GET /logs/${id}.log -> ${logStatus}`);
  const activity = body.slice(body.indexOf("Activity"));
  const events = activity.split("\n").filter((l) => l.trim());
  console.log("activity feed (newest first):", events.slice(0, 8).join(" | "));
  const newest = events.slice(0, 6).join(" ");
  const stopRecorded = /Failed|stopped|launcher exited/i.test(newest);
  console.log(status === "Failed" && !words && /Start from this run/.test(links.join(" "))
    ? "REPRODUCED (J2-009): Failed run; the only way on is 'Start from this run'; no retry or resume wording; the reason points to a log the browser cannot open."
    : "NOT REPRODUCED (J2-009)");
  console.log(!stopRecorded
    ? "REPRODUCED (J2-010): the newest activity entries read 'Running / Run started'; nothing in the feed says the run stopped."
    : "NOT REPRODUCED (J2-010)");
});
