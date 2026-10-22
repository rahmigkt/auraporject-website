// Actual editor hooks in a Chrome DOM; fake local EV data, no network or renderer.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=readFileSync('assets/ev/edit.js','utf8').replace('export function install','function install');
let browser;
const rows=[];
try {
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu']});
 const context=await browser.newContext();
 await context.route('**/*',r=>r.abort());
 const page=await context.newPage();
 await page.setContent('<main id="side"></main>');
 await page.evaluate(source=>{
  (0,eval)(source+'\nwindow.installEditor=install;');
  const root=document.querySelector('#side'),hooks={};
  const ev={S:{view:'plan',name:'local fixture'},hooks,D:{spaces:[{id:'R1',name:'Salon',kind:'living',boundary_xy_mm:[]}],walls:[],openings:[]},walls:[],ops:[],NAMES:{living:'Salon'},area:()=>12,toPlan:()=>[0,0],drawPlan(){},refresh(){this.side();},load(d){this.D=d;},side(){if(hooks.panel)root.innerHTML=hooks.panel();}};
  window.installEditor(ev);
  hooks.click({target:{closest:()=>({dataset:{e:'toggle'}})}});
  hooks.down({button:0,target:{closest:s=>s==='[data-room]'?{dataset:{room:'R1'}}:null}});
  window.checkName=name=>{
   hooks.down({button:0,target:{closest:s=>s==='[data-room]'?{dataset:{room:'R1'}}:null}});
   ev.D.spaces[0].name=name;ev.side();
   const input=root.querySelector('[data-f="rname"]'),display=input.value;
   hooks.change({target:input});
   const saved=ev.D.spaces[0].name;
   input.value='Yeni &quot; oda';hooks.change({target:input});
   const renamed=ev.D.spaces[0].name;
   hooks.click({target:{closest:()=>({dataset:{e:'undo'}})}});
   const undone=ev.D.spaces[0].name;
   hooks.click({target:{closest:()=>({dataset:{e:'redo'}})}});
   return {display,saved,renamed,undone,redone:ev.D.spaces[0].name,injected:root.querySelectorAll('[data-injected]').length};
  };
 },source);
 for(const name of ['Salon','Batı "oda"','Oda &quot; &amp; &#65;','Oda <b data-injected>test</b> & "batı"']) {
  try {
   const r=await page.evaluate(name=>window.checkName(name),name);
   assert.equal(r.display,name,'render changed literal room name');
   assert.equal(r.saved,name,'no-op change corrupted room name');
   assert.equal(r.undone,name,'undo failed to preserve name');
   assert.equal(r.renamed,'Yeni &quot; oda');assert.equal(r.redone,r.renamed);assert.equal(r.injected,0);
   rows.push({name,result:'PASS'});
  } catch(error) {rows.push({name,result:'FAIL',error:error.message});}
 }
 console.log(JSON.stringify({browser:browser.version(),rows},null,2));
 assert(rows.every(r=>r.result==='PASS'));
} finally {await browser?.close();}
