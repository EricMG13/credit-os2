// J1-001: the review sheet says an accepted "Will refuse" limit on Legal & covenants affects five modules and the run goes on;
// the run instead ends Failed with "stopped: checker", most modules "Not run", and no report.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-001-accepted-limit-fails-run.cjs
// Exit 1 = defect present, 0 = the accepted limit leads to a run that finishes or to a plain reason.
const { main } = require('./_j1-common.cjs');
main('001', async (page, { FILES, documentsAndPurpose, approveAndSubmit, waitForEnd }) => {
  // The documented steps: filing and workbook only, no agreement.
  await documentsAndPurpose(page, { files: [FILES.filing, FILES.workbook], pathway: 'Full credit assessment', name: 'Ana L' });
  await page.getByLabel('Portfolio workbook').selectOption({ label: 'northbridge-portfolio.xlsx' });
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  await page.getByRole('heading', { name: 'Review and start', exact: true }).waitFor();
  await page.waitForTimeout(2500);
  const review = await page.locator('main').innerText();
  const said = /Legal & covenants stops with "No executed governing document"/.test(review) && /Also affects: Refinancing & LME, Security selection, Evidence validation, Committee decision/.test(review);
  console.log('review sheet promises 5 affected modules (Legal & covenants + 4 named): ' + said);
  const dialog = await approveAndSubmit(page);
  await dialog.getByRole('button', { name: 'Start synthetic run', exact: true }).click();
  const head = await waitForEnd(page);
  const text = await page.locator('main').innerText();
  const finished = (text.match(/(\d+) of (\d+)\s*\n?\s*modules/) || [])[0];
  const notRun = (text.match(/\nNot run/g) || []).length;
  console.log('run header: ' + head.replace(/\n+/g, ' | '));
  console.log('modules finished: ' + finished + '; rows reading "Not run": ' + notRun);
  console.log('Open report link present: ' + (await page.getByRole('link', { name: 'Open report' }).count()));
  const failed = /Failed/.test(head) && /stopped: checker/.test(text) && notRun > 4;
  if (failed) console.log('DEFECT REPRODUCED: accepted limit ended in a Failed run (reason "stopped: checker"), not a run with five limited modules');
  return failed;
});
