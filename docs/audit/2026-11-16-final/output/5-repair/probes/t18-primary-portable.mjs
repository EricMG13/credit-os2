/** Portable T18 source-context regression. Run from the checkout root:
 * node /path/to/t18-primary-portable.mjs --out /path/to/observations.json
 * Exits 1 when any assertion fails. Existing Vite/React only; no browser, engine or providers.
 * Fixtures are literal retained presentation data, not calculated financial expectations.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const checkout = process.cwd();
const webRoot = path.join(checkout, 'web');
const require = createRequire(path.join(webRoot, 'package.json'));
const { createServer } = await import(require.resolve('vite'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const args = process.argv.slice(2);
const option = name => { const at=args.indexOf(name); return at < 0 ? null : args[at+1]; };
const output = path.resolve(option('--out') ?? 't18-primary-observations.json');
const hash = 'a'.repeat(64);
const growth = values => ({values,category:'Analyst Interpretation',rationale:'Retained own-downside growth',limitation:null});
const doc = {
 schema_version:'cpos-forecast-inputs/1',currency:'GBP',scale:1000,
 base:{revenue:{amount:'1000000',reason:null},debt:{amount:'600000',reason:null}},
 base_drivers:{revenue_growth:{...growth(['0.05','0.04','0.03']),rationale:'Retained base growth'},debt_repayment:{values:['50000','50000','50000'],category:'Analyst Interpretation',rationale:'Retained debt repayment',limitation:null}},
 downside_drivers:{revenue_growth:growth(['0.01','0.01','0.01'])},
 downside_shock:{ebitda_decline:'0.20',rate_increase:'0.10'},
 years:[{year:2025,start:'2025-04-01',end:'2026-03-31'},{year:2026,start:'2026-04-01',end:'2027-03-31'},{year:2027,start:'2027-04-01',end:'2028-03-31'}],
 facilities:[{name:'Retained fixed facility',balance:'600000',fixed_rate_pct:'6.00',spread_pct:null,floor_pct:null,reference_rate:null,annual_amortisation:'50000',maturity:'2028-03-31'}],scope_limits:['Synthetic source selection only']
};
const baseNote='Downside case is the stress case: a shock applied to the base-case drivers.';
const ownNote="Downside case is the stress case: a shock applied to the model's own downside drivers.";
const noShockNote="Downside case is CP-2G's own downside drivers; no CP-2A shock was supplied.";
const exactCells=values=>values.map(exact=>({status:'value',exact,display:exact,reason:null}));
const model={id:'retained-model',issuerKey:'issuer',runId:'run',runFolder:'run',href:'',download:'library/run/annual.md',sources:[{output:'forward',sha256:hash,role:'forecast'}],cashflow:{units:'GBP millions',notes:['Base case is a conditional illustration.',baseNote],limits:[],columns:['Base case','Downside case'].flatMap(group=>['FY2026E','FY2027E','FY2028E'].map(label=>({group,label}))),rows:[{label:'Revenue',band:'Revenue',total:false,cells:exactCells(['1050','1092','1124.76','840','873.6','899.808'])},{label:'Closing debt',band:'Debt',total:true,cells:exactCells(['550','500','450','550','500','450'])},{label:'Cash proxy (not issuer free cash flow)',band:'Cash',total:true,cells:exactCells(['10','12','14','5','6','7'])}]}};
const results={checkout,revision:execFileSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8'}).trim(),scope:'Literal synthetic source/component selection only; no analytical engine, provider or real Submit',checks:[],observations:{}};
const check=(name,passed)=>results.checks.push({name,passed:Boolean(passed)});
const server=await createServer({configFile:false,root:webRoot,resolve:{alias:{'@':path.join(webRoot,'src')}},esbuild:{jsx:'automatic'},server:{middlewareMode:true},appType:'custom'});
try {
 const {forecastTraceContext}=await server.ssrLoadModule('/src/pages/connected/report/ForecastRecord.tsx');
 const {LegacyForecast}=await server.ssrLoadModule('/src/pages/connected/visuals/LegacyForecast.tsx');
 const other=structuredClone(model);
 other.cashflow.other={columns:other.cashflow.columns.slice(0,3).map(column=>({...column,group:'Downside (CP-2G drivers)'})),rows:other.cashflow.rows.map(row=>({...row,cells:row.cells.slice(0,3)}))};
 const captured=[];
 renderToStaticMarkup(React.createElement(LegacyForecast,{model:other,selectedCase:'Base case',evidenceOnlyQualifications:true,source:(name,selection={})=>{const trace=forecastTraceContext(other,doc,name,{case:'Base case',...selection});captured.push({name,selection,trace});return null;}}));
 const otherTrace=captured.find(x=>x.name==='Revenue'&&x.selection.groups?.length===1&&x.selection.groups[0]==='Downside drivers');
 results.observations.other=otherTrace??null;
 check('R4-008 Other-grid drawer names its own case, not global Base',otherTrace&&otherTrace.trace.heading==='Revenue · Downside drivers'&&!otherTrace.trace.statement.includes('Base case')&&otherTrace.trace.statement.includes('Downside drivers · FY2026E: 1050'));
 for(const [label,note,shock] of [['shock-on-own-drivers',ownNote,true],['own-drivers-without-shock',noShockNote,false]]){
  const own=structuredClone(model);own.cashflow.notes=[note];const input={...doc,downside_shock:shock?doc.downside_shock:null};
  const trace=forecastTraceContext(own,input,'Revenue',{case:shock?'Downside shock':'Downside case',row:'Revenue'});
  results.observations[label]=trace;
  check('R4-009 '+label+' retains actual downside override',trace.details.some(x=>x.label==='downside_drivers.revenue_growth'&&x.value.includes('"0.01"')&&x.value.includes('Retained own-downside growth'))&&!trace.details.some(x=>x.label==='base_drivers.revenue_growth'));
  check('Retained shock presence is unchanged: '+label,trace.details.some(x=>x.label==='downside_shock.ebitda_decline')===shock);
 }
 const historical=forecastTraceContext(model,doc,'Revenue',{case:'Downside shock',row:'Revenue'});
 results.observations.historical=historical;
 check('Historical explicit base-stress keeps base driver basis',historical.details.some(x=>x.label==='base_drivers.revenue_growth'&&x.value.includes('"0.05"'))&&!historical.details.some(x=>x.label==='downside_drivers.revenue_growth'));
 const facility=forecastTraceContext(model,doc,'Closing debt',{case:'Base case',row:'Closing debt'});
 results.observations.facility=facility;
 check('R4-010 Debt source retains exact facility schedule fields',Object.entries({name:'Retained fixed facility',balance:'600000',fixed_rate_pct:'6.00',annual_amortisation:'50000',maturity:'2028-03-31'}).every(([key,value])=>facility.details.some(x=>x.label===`facilities.0.${key}`&&x.value===value)));
 for(const [label,inputPath] of [['driver',['base_drivers','revenue_growth']],['shock',['downside_shock','ebitda_decline']],['facility',['facilities','0']]]){
  const trace=forecastTraceContext(model,doc,label,{inputPath});results.observations[label+'-field']=trace;
  check('Field drawer retains original planning years/currency/scale: '+label,trace.details.some(x=>x.label==='years'&&x.value===JSON.stringify(doc.years))&&trace.details.some(x=>x.label==='currency'&&x.value==='GBP')&&trace.details.some(x=>x.label==='scale'&&x.value==='1000'));
 }
 check('Exact selected case/period figure survives',forecastTraceContext(model,doc,'Revenue',{case:'Downside shock',row:'Revenue',period:'FY2027E'}).statement==='Revenue · Downside shock · Downside shock · FY2027E: 873.6');
} catch(error) {results.error=String(error?.stack??error);process.exitCode=1;} finally {await server.close();}
results.passed=results.checks.filter(x=>x.passed).length;results.failed=results.checks.filter(x=>!x.passed).length;if(results.failed)process.exitCode=1;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({output,revision:results.revision,passed:results.passed,failed:results.failed,error:results.error??null}));
