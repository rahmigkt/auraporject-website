import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {sample,normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {bom} from '../assets/forma/bom.js';
import {drawingSheet} from '../assets/forma/drawing.js';
import * as catalog from '../assets/forma/catalog.js';
import {t,partName} from '../assets/forma/i18n.js';
const source=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const functions=source.slice(source.indexOf('function sheetLabels('),source.indexOf('function specRows('))+'\n'+source.slice(source.indexOf('function surfaceShort('),source.indexOf('\nfunction weightOf('))+'\n'+source.slice(source.indexOf('function specRows('),source.indexOf('\nfunction deliverables('));
const failures=[];let passed=0,sheets=0;
for(const lang of ['tr','en','ar'])for(const kind of ['dining','coffee','side','console','desk','sofa'])for(const surface of (kind==='sofa'?['wood']:['wood','metal','lacquer'])){
 try{
  const family=kind==='sofa'?'seating':'table';let d=sample({family,kind,style:'aura',seed:1});
  if(family==='table')d=normalizeDesign({...d,materials:{...d.materials,base:{...d.materials.base,surface}}});
  const c=compileDesign(d),b=bom(c,d.materials,lang),state={lang,design:d,compiled:c};
  const {rows,labels}=vm.runInNewContext(`${functions}\n({rows:specRows(b),labels:sheetLabels()})`,{...catalog,state,b,L:k=>t(k,lang),N:e=>catalog.name(e,lang),partName});
  assert(rows.length>0);assert(!/undefined|NaN/.test(JSON.stringify(rows)));
  if(family==='table'){
   assert(rows.some(([key,value])=>key===t('overall',lang)&&value===`${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height}`));
   assert(rows.some(([key])=>key===t('topMat',lang)));assert(rows.some(([key])=>key===t('baseMat',lang)));
   assert(!rows.some(([key])=>key===t('fabric',lang)||key===t('seatHeightL',lang)));
   if(lang==='tr'&&surface==='wood'){const {svg}=drawingSheet(c,labels,{title:kind,rows});assert(svg.includes('<svg'));assert(!/undefined|NaN/.test(svg));sheets++;}
  }else assert(rows.some(([key])=>key===t('fabric',lang)));
  passed++;
 }catch(error){failures.push({lang,kind,surface,message:error.message});}
}
console.log(JSON.stringify({passed,sheets,failed:failures.length,failures}));if(failures.length)process.exitCode=1;

