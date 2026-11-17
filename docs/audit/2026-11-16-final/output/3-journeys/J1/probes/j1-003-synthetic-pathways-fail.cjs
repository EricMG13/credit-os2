// J1-003: the synthetic test lets the analyst choose, review, approve and submit seven pathways that cannot run;
// each ends Failed with "launcher exited 2; see logs/<run>.log" (no reason, and a log the analyst cannot open).
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-003-synthetic-pathways-fail.cjs
// Exit 1 = defect present. Tries Lite and Deep (the other five, including Earnings Update once its two periods are filled, fail the same way in the journey record).
const { main } = require('./_j1-common.cjs');
main('003', async (page, { FILES, documentsAndPurpose, approveAndSubmit, waitForEnd }) => {
  let defect = false;
  for (const pathway of ['Lite credit assessment', 'Deep credit assessment']) {
    await documentsAndPurpose(page, { files: [FILES.filing, FILES.workbook, FILES.agreement], pathway, name: 'Ana L' });
    await page.getByLabel('Legal documents').selectOption('executed');
    await page.getByLabel(/^The agreement/).selectOption({ label: 'northbridge-credit-agreement.txt' });
    await page.getByRole('button', { name: 'Review run', exact: true }).click();
    const dialog = await approveAndSubmit(page);
    const dialogText = (await dialog.innerText()).replace(/\n+/g, ' | ');
    await dialog.getByRole('button', { name: 'Start synthetic run', exact: true }).click();
    const head = await waitForEnd(page);
    const line = head.replace(/\n+/g, ' | ');
    console.log(`${pathway}: dialog said "${dialogText}"`);
    console.log(`${pathway}: run page said "${line}"`);
    if (/Failed/.test(head) && /launcher exited \d+; see logs\//.test(head)) {
      console.log('DEFECT REPRODUCED: ' + pathway + ' ended Failed with a launcher exit code and a log path');
      defect = true;
    }
  }
  return defect;
});
