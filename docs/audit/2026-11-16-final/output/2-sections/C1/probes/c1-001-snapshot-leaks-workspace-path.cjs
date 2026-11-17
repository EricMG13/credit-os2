// C1-001: GET /connected/snapshot sends the server's absolute workspace path (catalogue.workspace).
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-001-snapshot-leaks-workspace-path.cjs
// Uses the service at C1_BASE (default http://127.0.0.1:8731) or starts proof.serve there on a new root.
"use strict";
const L = require("./lib.cjs");
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const id = await L.ensureRun(context, log);
      const page = await L.open(context, log);
      // The report page itself fetches this URL; read the response the browser receives.
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes("/connected/snapshot?run=")),
        page.goto(`${L.BASE}/report/${id}`),
      ]);
      const body = await response.json();
      const workspace = body?.catalogue?.workspace;
      const index = await (await fetch(`${L.BASE}/connected/library`)).json();
      console.log("catalogue.workspace in /connected/snapshot:", JSON.stringify(workspace));
      console.log("catalogue.workspace in /connected/library:", JSON.stringify(index?.catalogue?.workspace));
      const onScreen = (await page.locator("body").innerText()).includes(String(workspace));
      console.log("path drawn on the report page:", onScreen);
      L.verdict(typeof workspace === "string" && workspace.startsWith("/"), `absolute server path ${JSON.stringify(workspace)} sent to the browser; unused by web/src (grep catalogue.workspace)`);
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
