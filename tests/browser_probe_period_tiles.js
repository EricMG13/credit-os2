// Chart periods review (2026-11-25): what a metric tile shows as its headline, read back from the DOM of the built library's module page.
// PROBE.labels are the tiles' row labels; each tile is read as its headline text, the lines beneath it and whether it is drawn inside the page.
(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const tileOf = label => [...document.querySelectorAll('.tile')].find(tile => tile.querySelector('.tile-k')?.textContent === label);
  for (let i = 0; i < 200 && !PROBE.labels.every(tileOf); i++) await sleep(50);
  const read = label => {
    const tile = tileOf(label);
    if (!tile) return null;
    const value = tile.querySelector('.tile-v'), box = tile.getBoundingClientRect();
    return {
      headline: value.textContent,
      headlineSize: parseFloat(getComputedStyle(value).fontSize),
      below: [...tile.querySelectorAll('.tile-b')].map(p => p.textContent),
      absence: [...tile.querySelectorAll('.tile-a')].map(p => p.textContent),
      belowSize: Math.max(...[...tile.querySelectorAll('.tile-b, .tile-a')].map(p => parseFloat(getComputedStyle(p).fontSize))),
      drawn: box.width > 0 && box.height > 0 && box.left >= 0 && box.right <= window.innerWidth,
      clipped: tile.scrollWidth > tile.clientWidth,
    };
  };
  const out = document.createElement('pre');
  out.id = 'probe';
  out.textContent = JSON.stringify({ width: window.innerWidth, tiles: Object.fromEntries(PROBE.labels.map(label => [label, read(label)])) });
  document.body.appendChild(out);
})();
