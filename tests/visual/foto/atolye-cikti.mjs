import {createRequire} from 'node:module'; import {readFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
const out=process.argv[2]||'/tmp';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1400,height:900},acceptDownloads:true}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8812/tasarla.html');
await p.evaluate(async()=>{const g=await import('/assets/forma/generate.js'); const d=g.sample({family:'table',seed:3}); d.overrides=[{tool:'cut',id:'top',ops:[{type:'hole',at:[300,26,0],axis:1,sign:1,dia:60}]}]; localStorage.setItem('aura-forma-family','"table"'); localStorage.setItem('aura-forma-design-table',JSON.stringify(d)); localStorage.removeItem('aura-forma-project');});
await p.goto('http://127.0.0.1:8812/tasarimci.html'); await p.waitForTimeout(6000);
for (const act of ['dxf','stl','cut']) { const dl=p.waitForEvent('download'); await p.click(`[data-act=${act}]`); const d=await dl; const f=`${out}/out.${act}`; await d.saveAs(f); const buf=readFileSync(f); console.log(act, buf.length, act==='cut'?buf.toString('utf8').split('\n').slice(0,3).join(' | '):''); }
console.log(errs.join('|')||'no errors'); await b.close();
