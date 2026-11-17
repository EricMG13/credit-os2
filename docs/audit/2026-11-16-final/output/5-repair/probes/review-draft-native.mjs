import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const repo='/workspace/audit-draft-tail';
const require=createRequire(path.join(repo,'web/package.json'));
const {chromium}=require('playwright');
const html=readFileSync(path.join(repo,'web/dist/connected.html'),'utf8').replace("connect-src 'none'","connect-src 'self'").replaceAll('./connected-assets/','/connected-assets/').replace('<title>','<meta name="credit-os-mode" content="synthetic"><title>');
const actualApi=[];
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/connected/')) {actualApi.push(url.pathname);res.writeHead(500);res.end('No application service allowed');return;}
 const file=path.join(repo,'web/dist',url.pathname);
 if(url.pathname!='/start'&&existsSync(file)) {
  const ext=path.extname(file);res.setHeader('content-type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'})[ext]||'application/octet-stream');res.end(readFileSync(file));return;
 }
 res.setHeader('content-type','text/html');res.end(html);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const expired='This draft is unavailable and may have expired. Your answers and selected documents are still here. Continue the form or review the run again to create a new draft and re-upload the documents.';
const capacity='too many unfinished submissions; continue an existing form, or try again after an unused draft has been idle for 2 hours (24 hours if it reached review)';
const caps={credit_snapshot:'25',lite_credit_assessment:'15',deep_credit_assessment:'40',earnings_update:'20',relative_value:'20',covenant_refinancing:'20',distressed_restructuring:'20',portfolio_decision:'20'};
const results=[];
try {
 for(const [browserName,executablePath] of [['Chrome','/workspace/audit-browsers/chrome/opt/google/chrome/chrome'],['Edge','/workspace/audit-browsers/edge/opt/microsoft/msedge/msedge']]) {
  const browser=await chromium.launch({executablePath});
  try {
   for(const scenario of ['unknown-submission','capacity']) {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    let creates=0,reads=0;const uploads=[],requests=[],errors=[],external=[],unexpected=[];
    await context.route('**/*',async route=>{
     const request=route.request(),url=new URL(request.url());
     if(url.origin!==origin){external.push(url.href);return route.abort();}
     const fulfill=(json,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(json)});
     if(url.pathname==='/connected/context')return fulfill({run:{as_of:'',pathway:'credit_snapshot',case_kind:'synthetic'},identity:{issuer_name:'',issuer_id:''},submission_caps_usd:caps});
     if(url.pathname.startsWith('/api/')) {
      requests.push({method:request.method(),path:url.pathname,query:url.search});
      if(url.pathname.startsWith('/api/issuers/'))return fulfill({latest_run:'',runs:0,latest_as_of:''});
      if(url.pathname==='/api/submissions'&&request.method()==='POST') {
       creates+=1;
       if(scenario==='capacity'&&creates===1)return fulfill({error:capacity},400);
       return fulfill({id:`draft-${creates}`});
      }
      if(/^\/api\/submissions\/draft-\d+\/files$/.test(url.pathname)&&request.method()==='POST') {
       const name=url.searchParams.get('name');uploads.push({name,bytes:request.postDataBuffer().toString('utf8')});return fulfill({name});
      }
      if(/^\/api\/submissions\/draft-\d+\/reading$/.test(url.pathname)) {
       reads+=1;
       if(scenario==='unknown-submission'&&reads===1)return fulfill({error:'unknown submission'},404);
       return fulfill({documents:[{source:'annual.txt',kind:'annual_report'}],ignored:[],error:''});
      }
      unexpected.push(url.pathname);return fulfill({error:'Unexpected request in independent review harness'},500);
     }
     return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/start');
    await page.getByLabel('Issuer name',{exact:true}).fill('Northbridge');
    await page.getByLabel('As-of date',{exact:true}).fill('2026-10-31');
    await page.getByLabel('Your name',{exact:true}).fill('Ana L');
    await page.getByLabel('Documents',{exact:true}).setInputFiles({name:'annual.txt',mimeType:'text/plain',buffer:Buffer.from('filing')});
    await page.getByRole('button',{name:'Inspect documents',exact:true}).click();
    await page.getByRole('alert').filter({hasText:scenario==='capacity'?capacity:expired}).waitFor();
    assert.equal(await page.getByLabel('Issuer name',{exact:true}).inputValue(),'Northbridge');
    assert.equal(await page.getByLabel('As-of date',{exact:true}).inputValue(),'2026-10-31');
    assert.equal(await page.getByLabel('Your name',{exact:true}).inputValue(),'Ana L');
    assert.equal(await page.getByText('annual.txt',{exact:true}).isVisible(),true);
    await page.getByRole('button',{name:'Continue to purpose',exact:true}).click();
    await page.getByRole('heading',{name:'Purpose',exact:true}).waitFor();
    assert.equal(creates,2);
    assert.equal(uploads.length,scenario==='capacity'?1:2);
    assert.deepEqual(uploads,Array.from({length:uploads.length},()=>({name:'annual.txt',bytes:'filing'})));
    assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    assert.equal(requests.some(request=>request.path.endsWith('/submit')),false);
    results.push({browser:browserName,version:browser.version(),scenario,creates,reads,uploads,answersRetained:true,purposeReached:true,realSubmit:false,errors,external,unexpected});
    await context.close();
   }
  } finally {await browser.close();}
 }
 assert.deepEqual(actualApi,[]);
 console.log(JSON.stringify({results,actualApplicationApiRequests:actualApi},null,2));
} finally {
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 writeFileSync('/workspace/scratch/review-draft-native.json',JSON.stringify({results,actualApplicationApiRequests:actualApi},null,2));
}
