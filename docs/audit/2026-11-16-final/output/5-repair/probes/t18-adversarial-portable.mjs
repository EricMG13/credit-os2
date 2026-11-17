/** T18 source-only money/source probe. Run from the checkout root; no analytical engine or providers.
 * node path/to/t18-adversarial-portable.mjs --out /path/to/result.json [--browser /local/chrome]
 * An unfixed checkout exits 1 and retains JSON observations. Uses existing Vite/React/Playwright.
 */
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const checkout = process.cwd();
const webRoot = path.join(checkout, 'web');
const require = createRequire(path.join(webRoot, 'package.json'));
const { createServer } = await import(require.resolve('vite'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i=args.indexOf(name); return i<0?fallback:args[i+1]; };
const outputPath = path.resolve(option('--out', 't18-adversarial-result.json'));
const executablePath = option('--browser', null);
const expectedHash='a'.repeat(64), conflictingHash='b'.repeat(64);
// Literal synthetic source and model values are independent of any production calculation.
const input={schema_version:'cpos-forecast-inputs/1',currency:'GBP',scale:1000,base:{revenue:{amount:'1000000'},cash:{amount:'100000'}},base_drivers:{revenue_growth:{values:['0.05','0.04','0.03'],category:'Analyst Interpretation',rationale:'Recorded retained growth',limitation:null},dividends:{values:['20000','20000','20000'],category:'Analyst Interpretation',rationale:'Recorded retained dividend',limitation:null}},downside_shock:{ebitda_decline:'0.1234',rate_increase:'0.1000'},years:[{year:2025,start:'2025-04-01',end:'2026-03-31'},{year:2026,start:'2026-04-01',end:'2027-03-31'},{year:2027,start:'2027-04-01',end:'2028-03-31'}],facilities:[{name:'Recorded bond',balance:'600000',fixed_rate_pct:'5.1250',spread_pct:null,floor_pct:null,reference_rate:null,annual_amortisation:'50000',maturity:'2028-03-31'}],scope_limits:['Scope as recorded']};
const source={selected:true,output:{id:'forward',module:'CP-2G',sha256:conflictingHash,label:'Forward credit model',href:'library/run/CP-2G.md'},sections:[{heading:'Forecast inputs (machine-readable)',level:3,line:70,blocks:[{type:'text',line:72,end:74,text:'```json\n'+JSON.stringify(input)+'\n```'}]}]};
const model={id:'model',issuerKey:'issuer',runId:'run',runFolder:'run',href:'',download:'library/run/annual.md',sources:[{output:'forward',sha256:expectedHash,role:'forecast'}],cashflow:{units:'GBP millions',notes:['Base case is a conditional illustration.','Downside case is the stress case: a shock applied to the base-case drivers.'],limits:['The forecast inputs state base amounts, amount drivers and facility amounts in GBP thousands, as Financial foundation prints them (scale 1000); each was divided by 1,000 before any calculation. Every figure here is GBP millions.'],columns:['Base case','Downside case'].flatMap(group=>[{label:'FY2026E',group,start:'2025-04-01',end:'2026-03-31'},{label:'FY2027E',group,start:'2026-04-01',end:'2027-03-31'},{label:'FY2028E',group,start:'2027-04-01',end:'2028-03-31'}]),rows:[{label:'Revenue',band:'Revenue',total:false,cells:['1050','1092','1124.76','840','873.6','899.808'].map(exact=>({status:'value',exact,display:exact}))},{label:'Cash proxy (not issuer free cash flow)',band:'Cash',total:true,cells:['10','12','14','5','6','7'].map(exact=>({status:'value',exact,display:exact}))}]}};
const run={folder:'run',asOf:'2025-03-31',modules:{},evidence:{sources:[],unused:[],unrecorded:[],noSourcesModules:[],handoffs:[],zip:null,downloads:[],record:{hashes:[],instructions:[],calls:[],cap:null}}};
const view={entries:[source],modules:[],models:[model]};
const fixture=JSON.stringify({input,source,model,run,view});
const browserEntry=`import React from 'react'; import {createRoot} from 'react-dom/client'; import {Forecast} from '/src/pages/connected/report/Forecast'; import {PublishedTraceProvider,PublishedSource} from '/src/pages/connected/report/PublishedTrace'; const {view,run}=${fixture}; if(new URLSearchParams(location.search).get('case')==='valid')view.entries[0].output.sha256='${expectedHash}'; const snapshot={workspace:{runs:{},outputs:{},handoffs:{},models:[]},chips:{}};createRoot(document.getElementById('root')).render(<PublishedTraceProvider snapshot={snapshot} folder='run' entries={view.entries} route='forecast'><Forecast view={view} run={run}/><PublishedSource name='Default trace' href={'/report/run#evidence/forward~'+view.entries[0].output.sha256+'-72'}>Default trace</PublishedSource></PublishedTraceProvider>);`;
const server=await createServer({configFile:false,root:webRoot,resolve:{alias:{'@':path.join(webRoot,'src')}},esbuild:{jsx:'automatic'},server:{middlewareMode:true},appType:'custom'});
const results={checkout,scope:'Synthetic source/component presentation only; no analytical engine, provider or real Submit',checks:[],observations:{},browser:null};
const check=(name,condition)=>results.checks.push({name,passed:Boolean(condition)});
const clone=x=>structuredClone(x);
try {
 const {Forecast}=await server.ssrLoadModule('/src/pages/connected/report/Forecast.tsx');
 const {forecastTraceContext,RecordedForecastAssumptions,RecordedModelQualifications}=await server.ssrLoadModule('/src/pages/connected/report/ForecastRecord.tsx');
 const html=renderToStaticMarkup(React.createElement(Forecast,{view,run}));
 results.observations.conflict={modelSource:expectedHash,handoffSource:conflictingHash,gap:html.includes('Forecast source details are not available'),borrowedDriver:html.includes('Recorded retained dividend'),conflictingLink:html.includes(`forward~${conflictingHash}-72`)};
 check('R4-006 conflicting retained hash produces explicit gap',results.observations.conflict.gap);
 check('R4-006 conflict borrows neither drivers nor source links',!results.observations.conflict.borrowedDriver&&!results.observations.conflict.conflictingLink);
 const assumptions=renderToStaticMarkup(React.createElement(RecordedForecastAssumptions,{document:input}));
 results.observations.units={recordedCaption:assumptions.includes('GBP thousands (recorded scale 1000)'),rawDividends:assumptions.includes('20000'),rawBalance:assumptions.includes('600000'),rawAmortisation:assumptions.includes('50000')};
 check('R4-007 raw assumptions state GBP thousands scale1000',results.observations.units.recordedCaption);
 check('R4-007 original amounts remain unconverted',results.observations.units.rawDividends&&results.observations.units.rawBalance&&results.observations.units.rawAmortisation);
 check('Planning years retain exact recorded spans',assumptions.includes('2025 · 2025-04-01 to 2026-03-31'));
 const c=forecastTraceContext(model,input,'Revenue',{case:'Downside shock',row:'Revenue',period:'FY2027E'});
 check('Selected trace binds exact case/period/value',c.statement.includes('Downside shock · FY2027E: 873.6')&&!c.statement.includes('FY2026E')&&!c.statement.includes('Base case'));
 check('Raw input fields retain source value and scale',c.details.some(x=>x.label==='base.revenue'&&x.value==='{"amount":"1000000"}')&&c.details.some(x=>x.label==='scale'&&x.value==='1000')&&c.details.some(x=>x.label==='downside_shock.ebitda_decline'&&x.value==='0.1234'));
 const all=forecastTraceContext(model,input,'Cash proxy by scenario',{row:'Cash proxy (not issuer free cash flow)',case:'',periods:['FY2026E','FY2027E','FY2028E']});
 check('All-case proxy trace preserves both final values',['Base case · FY2028E: 14','Downside shock · FY2028E: 7'].every(x=>all.statement.includes(x)));
 const m=clone(model),reason='Literal retained reason: input-row.pdf p.9';m.cashflow.rows[0].cells[0].display='';for(const i of [0,1,3])m.cashflow.rows[0].cells[i].reason=reason;m.cashflow.other={columns:[{group:'Upside',label:'FY2028E'}],rows:[{label:'Debt',cells:[{reason,display:''}]}]};
 const ledger=renderToStaticMarkup(React.createElement(RecordedModelQualifications,{models:[m]}));
 check('Malformed-grid qualification retains exact text once/all scopes',ledger.split(reason).length===2&&['Revenue · Base case · FY2026E','Revenue · Base case · FY2027E','Revenue · Downside shock · FY2026E','Debt · Upside case · FY2028E',expectedHash].every(x=>ledger.includes(x)));
 const missing=clone(view);missing.entries=[];
 check('Absent evidence leaves explicit gap and figures',renderToStaticMarkup(React.createElement(Forecast,{view:missing,run})).includes('Forecast source details are not available'));
 if(executablePath){
  const temporary=fs.mkdtempSync(path.join(tmpdir(),'t18-source-probe-'));
  require('esbuild').buildSync({stdin:{contents:browserEntry.replaceAll("from '/src/","from './src/"),resolveDir:webRoot,loader:'tsx'},bundle:true,platform:'browser',format:'iife',jsx:'automatic',alias:{'@':path.join(webRoot,'src')},outfile:path.join(temporary,'entry.js')});
  fs.writeFileSync(path.join(temporary,'index.html'),'<html><head><title>T18 source-only probe</title></head><body><div id="root"></div><script src="./entry.js"></script></body></html>');const base=pathToFileURL(path.join(temporary,'index.html')).href;
  const {chromium}=require('playwright');const browser=await chromium.launch({executablePath,headless:true});
  try{const page=await browser.newPage({viewport:{width:1440,height:1000}});const external=[],errors=[],roles=[];await page.route('**/*',route=>{const u=new URL(route.request().url());if(['file:','data:','blob:'].includes(u.protocol))return route.continue();external.push(u.href);return route.abort();});page.on('pageerror',e=>errors.push(String(e)));results.browser={version:browser.version(),executablePath,roles,external,errors};
   await page.goto(base);await page.getByRole('heading',{name:'Forecast',exact:true}).waitFor();const mismatchText=await page.locator('body').innerText();check('Native conflict→visible gap/no driver borrow',mismatchText.includes('Forecast source details are not available')&&!mismatchText.includes('Recorded retained dividend'));
   await page.goto(base+'?case=valid');await page.getByRole('table',{name:'Recorded forecast drivers',exact:true}).waitFor();const validText=await page.locator('body').innerText();check('Native raw unit/scale caption, dates and amounts preserved',validText.includes('GBP thousands (recorded scale 1000)')&&validText.includes('2025 · 2025-04-01 to 2026-03-31')&&['20000','600000','50000'].every(x=>validText.includes(x)));
   const trace=async(name,control,terms,excluded=[])=>{await control.click();const dialog=page.getByRole('dialog');await dialog.waitFor();const text=await dialog.innerText();const href=await dialog.getByRole('link',{name:'Open in Evidence',exact:true}).getAttribute('href');const passed=terms.every(x=>text.includes(x))&&excluded.every(x=>!text.includes(x))&&href===`/report/run#evidence/forward~${expectedHash}-72`;check('Native trace role: '+name,passed);roles.push({name,href,passed});await dialog.getByRole('button',{name:'Close',exact:true}).first().click();};
   await trace('base trend',page.getByRole('figure',{name:'Revenue',exact:true}).getByRole('button',{name:'Show sources for Revenue',exact:true}),['Base case · FY2026E: 1050','Base case · FY2028E: 1124.76','base.revenue','1000000'],['Downside shock · FY2026E: 840']);
   await page.getByRole('radio').nth(1).check();await trace('downside trend',page.getByRole('figure',{name:'Revenue',exact:true}).getByRole('button',{name:'Show sources for Revenue',exact:true}),['Downside shock · FY2026E: 840','Downside shock · FY2028E: 899.808','0.1234'],['Base case · FY2026E: 1050']);
   await trace('all-case cash proxy',page.getByRole('button',{name:'Show sources for Cash proxy by scenario',exact:true}),['Base case · FY2028E: 14','Downside shock · FY2028E: 7']);
   await trace('row',page.getByRole('region',{name:'Cash flow model',exact:true}).getByRole('button',{name:'Show sources for Revenue',exact:true}),['Downside shock · FY2028E: 899.808'],['Base case · FY2026E: 1050']);
   await trace('card',page.getByRole('button',{name:'Show sources for Base case',exact:true}),['Base case · FY2028E: 14'],['FY2026E: 10']);
   await trace('driver',page.getByRole('button',{name:'Show sources for Revenue growth assumptions',exact:true}),['base_drivers.revenue_growth','Recorded retained growth','0.05']);
   await trace('facility',page.getByRole('button',{name:'Show sources for Facility 1',exact:true}),['facilities.0','600000','50000','scale','1000']);
   await trace('default no-context caller',page.getByRole('button',{name:'Show sources for Default trace',exact:true}),['Forecast inputs (machine-readable)','The model calculation uses the inputs recorded in this handoff.'],['Sources for Revenue']);
   check('Native runtime uses no external host and has no page error',external.length===0&&errors.length===0);results.browser={version:browser.version(),executablePath,roles,external,errors};
  }finally{await browser.close();fs.rmSync(temporary,{recursive:true,force:true});}
 }
} catch(error){results.error=String(error?.stack??error);process.exitCode=1;}finally{await server.close();}
results.passed=results.checks.filter(x=>x.passed).length;results.failed=results.checks.filter(x=>!x.passed).length;if(results.failed)process.exitCode=1;fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({outputPath,passed:results.passed,failed:results.failed,error:results.error??null}));
