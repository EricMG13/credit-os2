// J1 journey driver: first visit, documented steps, accepted limit -> Failed run, "Start from this run" with the agreement,
// synthetic confirmation, report, library, Run activity. Prints the facts the Low findings cite as "FACT:" lines.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-journey.cjs
// Exit 0 when the journey completes (a finished run and its report), 1 when it does not.
const { main, BASE, FILES } = require('./_j1-common.cjs');
const fact = (k, v) => console.log('FACT: ' + k + ' = ' + (typeof v === 'string' ? v : JSON.stringify(v)));
const flat = (s) => s.replace(/\n+/g, ' | ');
main('journey', async (page, { approveAndSubmit, waitForEnd }) => {
  const title = async (label, url) => { await page.goto(BASE + url); await page.waitForTimeout(900); fact('title ' + label, await page.title()); };
  // 1. Empty library and the rail
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle').catch(() => {});
  fact('library empty text', flat(await page.locator('main').innerText()).slice(-60));
  fact('rail links (aria-label, title, visible text)', await page.evaluate(() => [...document.querySelectorAll('a[href="/"],a[href="/runs"]')].filter((a) => a.closest('nav,aside,[role=navigation]')).map((a) => [a.getAttribute('aria-label'), a.getAttribute('title'), a.innerText.trim()])));
  await title('/', '/'); await title('/start', '/start'); await title('/runs', '/runs');
  // 2. Documented steps: filing + workbook, no name
  await page.goto(BASE + '/start');
  fact('as-of date on a fresh /start page, before typing', await page.getByLabel('As-of date', { exact: true }).inputValue());
  await page.getByLabel('Issuer name', { exact: true }).fill('Northbridge Synthetic Group');
  await page.getByLabel('As-of date', { exact: true }).fill('2025-03-31');
  await page.getByLabel('Documents', { exact: true }).setInputFiles([FILES.filing, FILES.workbook]);
  await page.getByRole('button', { name: 'Continue to purpose', exact: true }).click();
  await page.getByRole('heading', { name: 'Purpose', exact: true }).waitFor();
  fact('purpose step has two things called purpose', await page.locator('main').innerText().then((t) => ({ stepCard: /Full credit assessment/.test(t), runPurposeSelect: /Run purpose/.test(t) })));
  await page.getByRole('button', { name: 'Continue to context', exact: true }).click();
  await page.getByRole('heading', { name: 'More context', exact: true }).waitFor();
  await page.getByLabel('Portfolio workbook').selectOption({ label: 'northbridge-portfolio.xlsx' });
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  await page.waitForTimeout(2500);
  fact('after Review run with no name: headings', await page.getByRole('heading', { level: 2 }).allInnerTexts());
  fact('stepper after the bounce', flat(await page.getByRole('list', { name: 'Steps in this run' }).innerText()));
  await page.getByLabel('Your name', { exact: true }).fill('Ana L');
  await page.getByRole('button', { name: 'Continue to purpose', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to context', exact: true }).click();
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  await page.getByRole('heading', { name: 'Review and start', exact: true }).waitFor();
  await page.waitForTimeout(2500);
  let review = await page.locator('main').innerText();
  fact('review A: documents read', review.match(/northbridge-[a-z.]+ · unrecognised/g));
  fact('review A: portfolio workbook row', (review.match(/Portfolio workbook\n[^\n]+/) || [''])[0]);
  fact('review A: odd wording', ['Fixed below the Advanced form level.'].filter((s) => review.includes(s)));
  // 3. Accept, approve, cancel at the confirmation, then confirm
  const dialog = await approveAndSubmit(page);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.waitForTimeout(400);
  fact('after Cancel: dialog open / focus', [await page.getByRole('dialog').count(), await page.evaluate(() => document.activeElement.textContent.trim())]);
  await page.getByRole('button', { name: 'Submit run', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Start synthetic run', exact: true }).click();
  const headA = await waitForEnd(page);
  fact('run A', flat(headA));
  await title('run page', new URL(page.url()).pathname);
  // 4. Start from this run, as the page offers
  await page.getByRole('link', { name: 'Start from this run' }).click();
  await page.waitForTimeout(1500);
  fact('from-run: as-of value, name value', [await page.getByLabel('As-of date', { exact: true }).inputValue(), await page.getByLabel('Your name', { exact: true }).inputValue()]);
  fact('from-run: text', flat((await page.locator('main').innerText()).match(/Starting from run[^\n]*/)[0] + ' / ' + ((await page.locator('main').innerText()).match(/No documents yet\./) || ['(documents listed)'])[0]));
  await page.getByRole('button', { name: 'Inspect documents', exact: true }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel('As-of date', { exact: true }).fill('2025-03-31');
  await page.getByLabel('Your name', { exact: true }).fill('Ana L');
  await page.getByLabel('Documents', { exact: true }).setInputFiles([FILES.agreement]);
  await page.getByRole('button', { name: 'Continue to purpose', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to context', exact: true }).click();
  await page.getByLabel('Legal documents').selectOption('executed');
  await page.getByLabel(/^The agreement/).selectOption({ label: 'northbridge-credit-agreement.txt' });
  fact('from-run: portfolio workbook carried', await page.getByLabel('Portfolio workbook').inputValue());
  await page.getByRole('button', { name: 'Review run', exact: true }).click();
  await page.getByRole('heading', { name: 'Review and start', exact: true }).waitFor();
  await page.waitForTimeout(2500);
  review = await page.locator('main').innerText();
  fact('review B: workbook check text', (review.match(/A portfolio workbook or[^\n]*\n[^\n]*/) || [''])[0]);
  fact('review B: workbook row and documents', [(review.match(/Portfolio workbook\n[^\n]+/) || [''])[0], review.match(/northbridge-portfolio.xlsx · unrecognised/) ? 'workbook listed unrecognised' : 'workbook recognised']);
  fact('review B: sections that contain the words "Issuer and dates"', (await page.getByText('Issuer and dates', { exact: true }).count()));
  fact('review B: step names', await page.getByRole('list', { name: 'Steps in this run' }).locator('li').allInnerTexts().then((a) => a.map((s) => s.split('\n')[1])));
  const dlg = await approveAndSubmit(page);
  await dlg.getByRole('button', { name: 'Start synthetic run', exact: true }).click();
  const headB = await waitForEnd(page);
  fact('run B', flat(headB));
  const runOrder = (await page.locator('main').innerText()).split('Modules\n')[1].split('\nReport')[0].split('\n').filter((l, i) => i % 2 === 0);
  fact('run page module order', runOrder);
  fact('run page date format', (await page.locator('main').innerText()).match(/As of [^\n]+|Finished at [^\n]+/g));
  // 5. Report
  await page.getByRole('link', { name: 'Open report' }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/jr/j1-probe-journey-report.png' }).catch(() => {});
  fact('report title', await page.title());
  const ov = await page.locator('main').innerText();
  fact('report header date format', (ov.match(/As of [^\n]+/) || [''])[0]);
  const byModule = ov.split('Bottom line by module')[1].split('Limitations')[0].split('\n').filter((l) => l && l !== 'Delivered' && !/^The synthetic issuer/.test(l));
  fact('overview "Bottom line by module" lists', byModule.length);
  fact('modules nav badge', (await page.getByRole('link', { name: /^Modules/ }).first().innerText()).replace(/\n/g, ' '));
  await page.getByRole('link', { name: /^Modules/ }).first().click();
  await page.waitForTimeout(1500);
  const nav = (await page.locator('main').innerText()).split('Modules in this run')[1].split('Bottom line')[0].split('\n').filter(Boolean);
  fact('modules page navigator order', nav);
  // 6. Library and Run activity
  await page.goto(BASE + '/');
  await page.waitForTimeout(1200);
  fact('library card date format', (await page.locator('main').innerText()).match(/Full credit assessment · [^\n]+/));
  await page.goto(BASE + '/runs');
  await page.waitForTimeout(1200);
  const ra = await page.locator('main').innerText();
  fact('run activity', flat(ra));
  fact('run activity rows (links to runs)', await page.locator('main a[href^="/run/"]').count());
  return !/Finished/.test(headB);
});
