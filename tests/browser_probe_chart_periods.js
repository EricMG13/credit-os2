// Chart periods (owner, 2026-11-25): what the page draws, read back from the DOM. The reader chart on the module page and on the
// Forecast page come from the built library; the three legacy charts (no route reaches them: catalog.json pins no run) are drawn here
// by their own functions over tables of the same built handoff, with the order the store supplies (PROBE.path, PROBE.paired; the
// trend table's `periods` is in the built data).
(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const centre = el => { const r = el.getBoundingClientRect(); return Math.round(r.left + r.width / 2); };
  const figure = root => {
    const chart = [...root.querySelectorAll('.column-chart')].find(c => c.querySelector('.chart-legend')?.textContent.includes(PROBE.legend));
    if (!chart) return null;
    return {
      periods: [...chart.querySelectorAll('.chart-row')].map(row => ({
        label: row.querySelector('.chart-label').firstChild.textContent, x: centre(row),
        values: [...row.querySelectorAll('.col strong')].map(s => s.textContent),
        heights: [...row.querySelectorAll('.col i')].map(i => Math.round(i.getBoundingClientRect().height)),
      })),
      legend: [...chart.querySelectorAll('.chart-legend span')].map(s => s.textContent),
      notes: [...chart.parentElement.querySelectorAll('.matrix-note')].map(p => p.textContent),
      scrolls: chart.scrollWidth > chart.clientWidth,
    };
  };
  const content = document.getElementById('content'), seen = {};
  for (let i = 0; i < 200 && !figure(content); i++) await sleep(50);
  seen.module = figure(content);
  location.hash = '#W-Forecast/run-charts?c=' + PROBE.run;
  for (let i = 0; i < 200 && !(document.getElementById('run-charts') && figure(document.getElementById('run-charts'))); i++) await sleep(50);
  await sleep(300);
  seen.forecast = figure(document.getElementById('run-charts') || document.createElement('div'));
  const id = Object.keys(data).find(key => data[key].module === 'CP-1' && data[key].run === PROBE.run);
  data[id].basis = { unit: 'USD millions' };
  content.innerHTML = `<div id="legacy-path">${pathChart(id, PROBE.path)}</div><div id="legacy-paired">${comparisonChart(id, PROBE.paired)}</div><div id="legacy-trend">${trendChart(id, 'Trend sales')}</div>`;
  await sleep(200);
  const path = document.getElementById('legacy-path');
  seen.path = {
    axis: [...path.querySelectorAll('text.axis-label[y="230"]')].map(t => ({ label: t.textContent, x: centre(t) })),
    grid: [...path.querySelectorAll('text.axis-label[x="55"]')].map(t => t.textContent),
    lines: [...path.querySelectorAll('polyline')].map(l => l.getAttribute('class')),
    points: [...path.querySelectorAll('a.plot-point')].map(a => ({ said: a.getAttribute('aria-label'), x: centre(a.querySelector('.point-hit')), y: Math.round(a.querySelector('.point-hit').getBoundingClientRect().top) })),
    legend: [...path.querySelectorAll('.path-legend span')].map(s => s.textContent),
    readout: [...path.querySelectorAll('.path-readout > div')].map(d => [d.querySelector('span').textContent, d.querySelector('strong').textContent]),
  };
  const paired = document.getElementById('legacy-paired');
  seen.paired = {
    periods: [...paired.querySelectorAll('.chart-row')].map(row => ({ label: row.querySelector('.chart-label').textContent, x: centre(row), values: [...row.querySelectorAll('.col strong')].map(s => s.textContent), heights: [...row.querySelectorAll('.col i')].map(i => Math.round(i.getBoundingClientRect().height)) })),
    legend: [...paired.querySelectorAll('.chart-legend span')].map(s => s.textContent),
  };
  seen.trend = [...document.querySelectorAll('#legacy-trend .bar-column')].map(b => ({ label: b.querySelector('.bar-period').textContent, value: b.querySelector('.bar-value').textContent, x: centre(b), height: Math.round(b.querySelector('.bar').getBoundingClientRect().height) }));
  const out = document.createElement('pre');
  out.id = 'probe';
  out.textContent = JSON.stringify(seen);
  document.body.appendChild(out);
})();
