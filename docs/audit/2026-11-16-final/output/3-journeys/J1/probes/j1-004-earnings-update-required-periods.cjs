// J1-004: for Earnings Update the More context step says "Optional", but Current period and Prior period are required.
// The only signal is the browser's own "Please fill out this field." tooltip; the page shows no message of its own.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-004-earnings-update-required-periods.cjs
// Exit 1 = defect present (required, unmarked, and no in-page message).
const { main } = require('./_j1-common.cjs');
main('004', async (page, { FILES, documentsAndPurpose }) => {
  await documentsAndPurpose(page, { files: [FILES.filing], pathway: 'Earnings Update', name: 'Ana L' });
  const intro = await page.locator('main p').filter({ hasText: /^Optional\./ }).first().innerText();
  const required = await page.evaluate(() => [...document.querySelectorAll('input,select,textarea')].filter((e) => e.required).map((e) => (e.labels && e.labels[0] ? e.labels[0].innerText.trim() : e.name)));
  const marked = await page.evaluate(() => [...document.querySelectorAll('label')].filter((l) => /current period|prior period/i.test(l.innerText)).map((l) => /required|\*/i.test(l.innerText) || !!l.querySelector('[aria-hidden]')));
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  await page.waitForTimeout(800);
  const stillOnStep = (await page.getByRole('heading', { name: 'More context', exact: true }).count()) === 1;
  const alerts = await page.getByRole('alert').allInnerTexts();
  const native = await page.evaluate(() => (document.activeElement ? document.activeElement.validationMessage : ''));
  console.log('step intro: ' + intro);
  console.log('required controls: ' + JSON.stringify(required) + '; labelled as required on the page: ' + JSON.stringify(marked));
  console.log('after Review run: still on More context = ' + stillOnStep + '; in-page alerts = ' + JSON.stringify(alerts) + '; native message = ' + native);
  const defect = /^Optional/.test(intro) && required.length > 0 && !marked.some(Boolean) && alerts.length === 0;
  if (defect) console.log('DEFECT REPRODUCED: required fields are not marked, the step says Optional, and no in-page message appears');
  return defect;
});
