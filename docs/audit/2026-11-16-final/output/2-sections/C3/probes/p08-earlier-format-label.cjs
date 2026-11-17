// C3-008: a run whose handoffs have no reader passages ("Earlier format", H7 / CM-048) is not labelled on its Overview.
const { main, inject } = require("./lib.cjs");
main("p08-earlier-format-label", async ({ page, context, report }) => {
  await inject(context, (snap) => {
    for (const sections of Object.values(snap.workspace.handoffs))
      for (const s of sections)
        if (["Bottom line", "Key findings", "Contrary evidence and what would change the view", "Limitations"].includes(s.heading))
          s.heading = s.heading === "Bottom line" ? "Reader summary" : `Analysis note ${s.heading.slice(0, 3)}`;
    for (const o of Object.values(snap.workspace.outputs)) o.summary = { bottomLine: "Earlier summary sentence.", limitation: "Earlier limitation sentence.", line: 5 };
  });
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page.waitForTimeout(600);
  const text = await page.locator("body").innerText();
  return { defect: !/earlier format/i.test(text), expected: "the Overview (and Report history) names the run 'Earlier format' (CM-048; ruling H7)", leadShown: !/No credit view is available/.test(text), labelFound: /earlier format/i.test(text) };
});
