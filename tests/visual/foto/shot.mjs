import {createRequire} from 'node:module'; import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage(); p.on('pageerror',e=>console.log('ERR',e.message));
for (const seed of (process.argv[3]||'1').split(',')) {
await p.goto(`http://127.0.0.1:8812/tests/visual/foto/foto.html?family=${process.argv[2]||'seating'}&seed=${seed}`);
await p.waitForFunction(()=>window.ready,null,{timeout:300000});
const u=await p.evaluate(()=>window.shot); writeFileSync(`${process.argv[4]||'/tmp'}/${process.argv[2]}-${seed}.jpg`,Buffer.from(u.split(',')[1],'base64')); console.log('ok',seed);}
await b.close();
