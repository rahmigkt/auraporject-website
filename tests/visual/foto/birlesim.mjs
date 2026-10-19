import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
const out=process.argv[2]||'/tmp';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:1400,height:900},acceptDownloads:true})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8812/tasarla.html');
await p.evaluate(async()=>{localStorage.clear(); const g=await import('/assets/forma/generate.js'); const d=g.sample({family:'table',seed:3}); localStorage.setItem('aura-forma-family','"table"'); localStorage.setItem('aura-forma-design-table',JSON.stringify(d));});
await p.goto('http://127.0.0.1:8812/tasarimci.html'); await p.waitForTimeout(6000);
for (const [a,bb,k,c,dep] of [['apron-front','leg-1','dowel8',0,''],['apron-side-l','leg-2','domino6',2,''],['stretcher-long','stretcher-side-l','mortise',0,'25']]) {
  await p.evaluate(([a,bb])=>{const A=window.__atelier; A.S.multiOn=true; A.S.multi=[]; A.pickPart(a); A.pickPart(bb);},[a,bb]); await p.waitForTimeout(800);
  await p.selectOption('#jType',k); await p.fill('#jCount',String(c)); await p.fill('#jDepth',dep); await p.click('[data-joint]'); await p.waitForTimeout(3000);
  console.log(a,bb,k,'->', await p.evaluate(()=>document.querySelector('#jOut b')?.textContent));
}
const ovj=await p.evaluate(()=>JSON.stringify(window.__atelier.S.items[0].design.overrides)); (await import('node:fs')).writeFileSync(out+'/joint-ov.json',ovj);
const dl=p.waitForEvent('download'); await p.click('[data-act=cut]'); const d=await dl; await d.saveAs(out+'/joint.csv');

console.log(errs.join('|')||'no errors'); await b.close();
