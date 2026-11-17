// J3-005: working pages (not Evidence) carry module codes and tool names in reader text.
// Run from the repository root: timeout 600 node <this file>
"use strict";
const lib = require("./_j3lib.cjs");

lib.runProbe("005", async ({ page, origin, id }) => {
  const pattern = /\bCP-[0-9A-Z]+\b|\bPython\b|\bPYTD\b|\bLTM\b/gu;
  const routes = ["overview", "modules/CP-1", "modules/CP-2G", "forecast", "calendar", "changes"];
  const hits = [];
  for (const route of routes) {
    await page.goto(`${origin}/report/${id}#${route}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);
    const lines = (await page.locator("main").innerText()).split("\n");
    for (const line of lines) {
      const found = line.match(pattern);
      if (found) hits.push({ route, found: [...new Set(found)], line: line.slice(0, 140) });
    }
  }
  return {
    reproduced: hits.length > 0,
    summary: `${hits.length} reader-text lines outside Evidence name a module code or tool: ${JSON.stringify(hits.slice(0, 4))}`,
  };
});
