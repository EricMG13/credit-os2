import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const repo = process.cwd();
const { chromium } = createRequire(path.join(repo,'web/package.json'))('playwright');
const { writeDataFile } = await import(pathToFileURL(path.join(repo,'web/scripts/fixture-data.mjs')));
const out = path.join(repo,'docs/audit/2026-11-16-final/output/5-repair/charts-shared-evidence');
mkdirSync(out,{recursive:true});
const root = mkdtempSync(path.join(tmpdir(),'chart-shared-'));
cpSync(path.join(repo,'web/dist'),root,{recursive:true});
writeDataFile(root,path.join(repo,'web/fixtures'));
const address = hash => pathToFileURL(path.join(root,'index.html')).href+'#'+hash;
const results=[];
try {
 for (const [brand,key,channel] of [['Chrome','CHROME_PATH','chrome'],['Edge','EDGE_PATH','msedge']]) {
  const browser=await chromium.launch(process.env[key]?{executablePath:process.env[key]}:{channel});
  try {
   const context=await browser.newContext({viewport:{width:1440,height:900}});
   const outside=[], errors=[];
   await context.route('**/*',route=>{const url=new URL(route.request().url());if(['file:','data:','blob:'].includes(url.protocol))return route.continue();outside.push(url.href);return route.abort();});
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(address('/library/halden-aerostructures/2026-09-30/overview'));
   await page.locator('.text-metric').first().waitFor();await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.locator('.text-metric').evaluateAll(nodes=>nodes.map(node=>{const card=node.closest('li,article');const r=node.getBoundingClientRect();const c=card.getBoundingClientRect();const style=getComputedStyle(node);return{text:node.textContent,font:style.fontSize,weight:style.fontWeight,left:r.left,right:r.right,cardLeft:c.left,cardRight:c.right};}));
   assert.ok(metrics.length>0);
   for(const m of metrics){assert.equal(m.font,'40px');assert.ok(m.left>=m.cardLeft&&m.right<=m.cardRight+1,`Metric overflow ${JSON.stringify(m)}`);}
   const missing=await page.getByText('n.a.',{exact:true}).first().evaluate(node=>getComputedStyle(node).fontWeight);
   assert.equal(missing,'400');
   if(brand==='Chrome'){await page.locator('.text-metric').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'metric-cards-after.png')});}
   await page.goto(address('/kit'));await page.getByRole('heading',{name:'Trend chart',exact:true}).waitFor();
   const chart=page.getByRole('figure',{name:'Debt by period',exact:true});
   await chart.getByRole('radio',{name:'Table',exact:true}).click();await page.setViewportSize({width:481,height:900});
   const cue=chart.getByText('Scroll horizontally to see every column.',{exact:true});await cue.waitFor();
   const scroll=await chart.getByRole('table').evaluate(table=>({width:table.parentElement.clientWidth,scroll:table.parentElement.scrollWidth}));
   assert.ok(scroll.scroll>scroll.width);
   await page.setViewportSize({width:1440,height:900});
   await page.goto(address('/run/activity'));await page.getByRole('heading',{level:1}).waitFor();
   assert.equal(await page.locator('#recharts_measurement_span').count(),0);
   assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);
   results.push({brand,version:browser.version(),metrics,missingWeight:missing,desktop481Scroll:scroll,externalRequests:outside,pageErrors:errors,measurementSpanAfterLeaving:0});
   await context.close();
  } finally { await browser.close(); }
 }
 writeFileSync(path.join(out,'browser-after.json'),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results,null,2));
} finally {rmSync(root,{recursive:true,force:true});}
