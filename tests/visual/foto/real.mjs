// Real studio path: render mode, press the photo button, drag the view while it renders; save the download.
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
const out=process.argv[2]||'/tmp', fam=process.argv[3]||'seating';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1300,height:850},acceptDownloads:true});
await ctx.addInitScript(()=>{localStorage.setItem('aura-forma-account-skip','1');localStorage.setItem('aura-forma-guide-seen','1');});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://127.0.0.1:8812/tasarla.html'); await p.waitForSelector('#families button');
if(fam!=='seating') await p.evaluate(f=>document.querySelector('#families [data-family='+f+']').click(),fam);
await p.waitForTimeout(1500); const mb=await p.$('#modeBtn'); if((await mb.getAttribute('aria-pressed'))!=='true') await mb.evaluate(e=>e.click());
await p.waitForTimeout(6000);
const dl=p.waitForEvent('download',{timeout:900000}); await p.evaluate(()=>document.querySelector('#photoBtn').click());
const c=await p.$('canvas.f-canvas'), bx=await c.boundingBox();
for(let i=0;i<5;i++){await p.mouse.move(bx.x+200,bx.y+200);await p.mouse.down();await p.mouse.move(bx.x+400,bx.y+260,{steps:5});await p.mouse.up();await p.waitForTimeout(2000);}
const d=await dl; await d.saveAs(`${out}/real-${fam}.jpg`); console.log('saved', errs.join(' | ')||'no errors');
await b.close();
