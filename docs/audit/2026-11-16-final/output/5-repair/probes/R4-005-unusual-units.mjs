// Run from the checkout root: timeout 300 node <path-to-this-probe>.
// Offline read-only probe. Requires the checkout's existing web/node_modules.
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.join(process.cwd(), 'web');
const { createServer } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')));
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { amount } = await server.ssrLoadModule('/src/pages/connected/visuals/visualData.ts');
  const ordinary = [
    { value: '10m', unit: 'US$m', expected: 10 },
    { value: '10m', unit: 'USD billions', expected: null },
  ].map(item => ({ ...item, actual: amount(item.value, item.unit) }));
  for (const item of ordinary) assert.equal(item.actual, item.expected);
  const unusual = ['minimum', 'term'].map(unit => ({ value: '10m', unit, actual: amount('10m', unit) }));
  for (const item of unusual) assert.equal(item.actual, 10);
  console.log(JSON.stringify({
    finding: 'R4-005',
    classification: 'Low; hostile-input; parked under R3',
    scope: 'Requires an invalid or unusual reporting unit. No valid scale conversion or normal-data failure was observed.',
    ordinary,
    unusual,
  }, null, 2));
} finally {
  await server.close();
}
