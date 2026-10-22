// Execute the actual package function with local rendering/link stubs. No browser,
// email, API or production form. Geometry compilation and review are real.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {technicalReview,reviewMatches} from '../assets/forma/technical-review.js';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
const source=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('async function projectPackage()'),source.indexOf('async function downloadAs('));
const designs=['sofa','armchair'].map(kind=>normalizeDesign({family:'seating',kind}));
const original=structuredClone(designs),editing={marker:'unsaved editor'},cache={marker:'cache'};
const state={project:{items:designs.map((design,n)=>({id:'U'+n,design,technicalReview:{schema:'old'}}))},design:editing,compiled:null,drawingCache:cache,room:null,lang:'tr'};
let saved=0;
const sandbox={state,technicalReview,compileOf:compileDesign,issuesOf:()=>[],SCHEMA:'test',viewer:null,sceneModule:null,
 projectLink:async()=> 'https://example.invalid/project',designLink:async()=> 'https://example.invalid/design',
 deliverables:()=>({sheet:{svg:'<svg/>'},bom:[]}),drawingDxf:()=>'',bomCsv:()=>'',linkPage:()=>'',urlShortcut:()=>'',
 svgToJpeg:async()=>({data:new Uint8Array()}),jpegPdf:()=>new Uint8Array(),specRows:()=>[],itemName:d=>d.kind,L:k=>k,saveProject:()=>saved++};
vm.createContext(sandbox);vm.runInContext(fn,sandbox);
const result=await sandbox.projectPackage();
assert.equal(saved,1);assert.equal(state.design,editing);assert.equal(state.drawingCache,cache);
assert.deepEqual(designs,original,'Packaging must not alter original customer models');
const reports=JSON.parse(result.files.find(f=>f.name==='technical-reviews.json').data);
assert.equal(reports.items.length,2);
for(const [n,item] of state.project.items.entries()){
 assert(reviewMatches(item.technicalReview,item.design));
 assert.equal(item.technicalReview.production_approved,false);
 const folder=String(n+1).padStart(2,'0')+'-seating-'+item.design.kind+'/';
 const r=JSON.parse(result.files.find(f=>f.name===folder+'technical-review.json').data);
 const d=JSON.parse(result.files.find(f=>f.name===folder+'design.json').data);
 assert.deepEqual(r,d.technicalReview);assert.deepEqual(r,reports.items[n].review);
}
assert(result.summary.includes('technicalReturn'));assert(result.summary.includes('technicalLimits'));
// A rendering failure must restore the active editor, not leave another model selected.
sandbox.deliverables=()=>{throw new Error('local render failure');};
await assert.rejects(()=>sandbox.projectPackage(),/local render failure/);
assert.equal(state.design,editing);assert.equal(state.drawingCache,cache);assert.deepEqual(designs,original);
console.log('PASS actual package function: two models, fresh per-model+aggregate reports, original model/editor preserved, render failure restoration; no external send');
