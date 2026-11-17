// J1-001: the review sheet offers "Leave out Legal & covenants" as the way past a "Will refuse" limit. After it, approval and
// the confirmation dialog work, but Submit is refused with "unknown module CP-MODEL": no run starts and the analyst is sent back
// to the More context step. (src/deploy_workflow/inbox/scheduler.py:323 refuses any code not in cpos_launch.METHODS;
// web/src/pages/connected/api.ts:384 says CP-MODEL "is sent, never drawn as a module", and cpos_launch.METHODS has no CP-MODEL.)
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-001-leave-out-refused-at-submit.cjs
// Exit 1 = defect present (Submit refused and no run started), 0 = the run starts.
const { main } = require('./_j1-common.cjs');
main('001', async (page, { BASE, FILES, documentsAndPurpose, approveAndSubmit }) => {
  await documentsAndPurpose(page, { files: [FILES.filing, FILES.workbook], pathway: 'Full credit assessment', name: 'Ana L' });
  await page.getByLabel('Portfolio workbook').selectOption({ label: 'northbridge-portfolio.xlsx' });
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  await page.getByRole('heading', { name: 'Review and start', exact: true }).waitFor();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Leave out Legal & covenants' }).click();
  await page.waitForTimeout(2000);
  console.log('after "Leave out": headings = ' + JSON.stringify(await page.getByRole('heading', { level: 2 }).allInnerTexts()) + ' (the analyst is on the More context step, with no message saying so)');
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  const dialog = await approveAndSubmit(page);
  const review = await page.locator('main').innerText();
  console.log('review sheet shows: ' + (review.match(/Left out: [^\n]+/) || ['(no left-out line)'])[0] + '; modules ' + (review.match(/Modules \(\d+\)/) || [''])[0]);
  await dialog.getByRole('button', { name: 'Start synthetic run', exact: true }).click();
  await page.waitForTimeout(5000);
  const url = page.url();
  const alerts = await page.getByRole('alert').allInnerTexts();
  console.log('url after confirming: ' + url + '; alerts: ' + JSON.stringify(alerts));
  const refused = !/\/run\//.test(url) && alerts.some((a) => /unknown module CP-MODEL/.test(a));
  if (refused) console.log('DEFECT REPRODUCED (leave out): Submit refused with "unknown module CP-MODEL"; no run started');
  await page.screenshot({ path: '/tmp/jr/j1-probe-004.png' }).catch(() => {});
  // Same refusal through the Advanced form level: untick one module under Requested modules (agreement supplied, so nothing else is in the way).
  await page.goto(BASE + '/start');
  await page.getByLabel('Issuer name', { exact: true }).fill('Northbridge Synthetic Group');
  await page.getByLabel('As-of date', { exact: true }).fill('2025-03-31');
  await page.getByLabel('Your name', { exact: true }).fill('Ana L');
  await page.getByLabel('Documents', { exact: true }).setInputFiles([FILES.filing, FILES.workbook, FILES.agreement]);
  await page.getByRole('button', { name: 'Continue to purpose', exact: true }).click();
  await page.getByRole('heading', { name: 'Purpose', exact: true }).waitFor();
  await page.getByLabel('Run form level').selectOption({ label: 'Advanced' });
  await page.getByRole('button', { name: 'Continue to context', exact: true }).click();
  await page.getByRole('heading', { name: 'More context', exact: true }).waitFor();
  await page.getByLabel('Legal documents').selectOption('executed');
  await page.getByLabel(/^The agreement/).selectOption({ label: 'northbridge-credit-agreement.txt' });
  await page.getByLabel('Portfolio workbook').selectOption({ label: 'northbridge-portfolio.xlsx' });
  await page.getByRole('checkbox', { name: 'Rates, FX & hedging' }).uncheck({ force: true });
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  const dialog2 = await approveAndSubmit(page);
  await dialog2.getByRole('button', { name: 'Start synthetic run', exact: true }).click();
  await page.waitForTimeout(5000);
  const alerts2 = await page.getByRole('alert').allInnerTexts();
  const refused2 = !/\/run\//.test(page.url()) && alerts2.some((a) => /unknown module CP-MODEL/.test(a));
  console.log('Advanced, one module unticked: url ' + page.url() + '; alerts ' + JSON.stringify(alerts2));
  if (refused2) console.log('DEFECT REPRODUCED (Advanced module list): Submit refused with "unknown module CP-MODEL"');
  return refused || refused2;
});
