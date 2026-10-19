// Workshop: load a table, tap a part in 3D, move it numerically, duplicate, mirror, add a part, delete, undo.
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
const out=process.argv[2]||'/tmp', fam=process.argv[3]||'table';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1400,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://127.0.0.1:8812/tasarla.html'); // seed a design in storage
await p.evaluate(async f=>{const g=await import('/assets/forma/generate.js'); const d=g.sample({family:f,seed:3}); localStorage.setItem('aura-forma-family',JSON.stringify(f)); localStorage.setItem('aura-forma-design-'+f,JSON.stringify(d)); localStorage.removeItem('aura-forma-project');},fam);
await p.goto('http://127.0.0.1:8812/tasarimci.html'); await p.waitForTimeout(6000);
const cv=await p.$('#stage canvas'), bx=await cv.boundingBox();
await p.mouse.click(bx.x+bx.width*0.5, bx.y+bx.height*0.36); await p.waitForTimeout(1500);
const sel=await p.evaluate(()=>document.querySelector('#panel .a-note b')?.textContent||'none'); console.log('selected:',sel);
await p.screenshot({path:`${out}/atolye-1.png`});
if(sel!=='none'){
  await p.fill('[data-tf=m1]','120'); await p.dispatchEvent('[data-tf=m1]','change'); await p.waitForTimeout(1500);
  await p.click('[data-mirror]'); await p.waitForTimeout(1500);
}
await p.selectOption('#addShape','round'); await p.fill('#addW','40'); await p.fill('#addH','500'); await p.click('[data-add]'); await p.waitForTimeout(1500);
await p.fill('[data-tf=m0]','300'); await p.dispatchEvent('[data-tf=m0]','change'); await p.waitForTimeout(1500);
await p.click('[data-mode=rotate]'); await p.waitForTimeout(1500);
await p.screenshot({path:`${out}/atolye-2.png`});
const ov=await p.evaluate(()=>JSON.stringify((window.__d=null)||[...document.querySelectorAll('#items button')].map(b=>b.textContent)));
await p.click('[data-delpart]'); await p.waitForTimeout(1000); await p.click('[data-sundo]'); await p.waitForTimeout(1500);
console.log('items',ov,'errors:',errs.join(' | ')||'none');
await b.close();
