// Real panel rendering functions in a local Chrome DOM; geometry is not instantiated.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=readFileSync('assets/ev/plan.js','utf8');
const between=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start);assert(start>=0&&end>start);return source.slice(start,end);};
const constant=name=>source.match(new RegExp(`^const ${name} = .+;$`,'m'))?.[0]||'';
const panelCode=[constant('esc'),constant('NAMES'),constant('EXAMPLES'),constant('PAINTS'),
 between('function decorUI()', '\n{ const D0'),between('function layoutPanel()', '\nasync function layoutAction'),
 between('function finishPanel()', '\nfunction pick('),between('function side()', "\n$('#side').addEventListener('click'")].join('\n');
let browser,context;const rows=[];
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu']});
 context=await browser.newContext();context.setDefaultTimeout(3000);await context.route('**/*',r=>r.abort());
 const page=await context.newPage();await page.setContent('<div id="side"></div><div id="dekor"></div>');
 await page.evaluate(code=>{
  const setup=`const $=s=>document.querySelector(s),S={},DEC={tab:'curtain'},LAY={};let D;
   const COLORS={living:'#ddd'},PAINTS=[['white','Beyaz','#fff']],FLOORS={oak:{name:'Meşe'}},SCHEMES={iskandinav:{name:'İskandinav'}};
   const walls=[],ops=[],H=2600,hooks={panel:()=>'<button data-trusted="yes">Araç</button>'};
   const area=()=>12,finishOf=()=>({wall:'white',floor:'oak'}),accessories=()=>({rugs:[],lights:[]});
   const merged=()=>({}),chooserHTML=()=>'<button data-trusted="decor">Perde</button>';
   window.renderFixture=f=>{D={walls:[],spaces:[{id:f.id,name:f.name,kind:'living'}],items:[{design:{},space_id:f.id}]};
    Object.assign(S,{room:f.id,view:'room',name:f.file});Object.assign(LAY,{room:f.id,res:f.res,pick:0});side();decorUI();};`;
  (0,eval)(setup+'\n'+code);
 },panelCode);
 for(const name of ['ordinary','room-markup','quoted-id','filename-markup','solver-reason','solver-notes']){
  const f={id:'R1',name:'Salon 1',file:'Yerel plan.json',res:null};
  const markup='<em data-audit-injected>özel</em>';
  if(name==='room-markup')f.name=`Salon ${markup} & "batı"`;
  if(name==='quoted-id')f.id='R" data-audit-injected="attribute';
  if(name==='filename-markup')f.file=`Plan ${markup}.json`;
  if(name==='solver-reason')f.res={ok:false,reason:`Sığmadı ${markup}`};
  if(name==='solver-notes')f.res={ok:true,alternatives:[{notes:[`Uzaklık ${markup}`]}]};
  try{
   await page.evaluate(f=>window.renderFixture(f),f);
   assert.equal(await page.locator('[data-audit-injected]').count(),0,'imported text created DOM markup/attributes');
   assert.equal(await page.locator('[data-pick]').getAttribute('data-pick'),f.id,'room ID changed during rendering');
   const label=f.name.replace(/\s+\d+$/,'');
   assert.equal(await page.locator('[data-pick] b').textContent(),label);
   assert.equal(await page.locator('#dekor .dk-tabs span').textContent(),label+' · ev geneli');
   assert.equal(await page.locator('#pickPlan option:checked').textContent(),f.file);
   if(f.res)assert((await page.locator('#side').textContent()).includes(f.res.ok?f.res.alternatives[0].notes[0]:f.res.reason));
   assert.equal(await page.locator('[data-trusted]').count(),2,'trusted tool/chooser markup changed');
   rows.push({name,result:'PASS'});
  }catch(error){rows.push({name,result:'FAIL',error:error.message});}
 }
 mkdirSync('work',{recursive:true});writeFileSync('work/home-plan-label-report.json',JSON.stringify({browser:browser.version(),scope:'Actual panel functions, mocked geometry dependencies, no network/WebGL',rows},null,2));
 console.log(rows);assert(rows.every(r=>r.result==='PASS'),'Home plan labels must remain literal text');
}finally{await context?.close();await browser?.close();}
