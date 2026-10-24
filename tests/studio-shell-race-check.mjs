import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const shell=source.slice(source.indexOf('function shell() {'),source.indexOf('\nfunction shellNav()'))
 .replace("import('./scene.js?v=20261020k')",'loadScene()');
const failures=[];
for(const order of [[0],[0,1],[1,0],[1,0,2],[2,1,0]]){
 try{
  const pending=[],hosts=[],created=[];let current=null;
  const app={set innerHTML(value){current={innerHTML:'',id:hosts.length};hosts.push(current);}};
  const ctx={state:{lang:'tr',tab:'parts',design:{family:'seating',materials:{}},sketch:false},viewer:null,sceneModule:null,stopLayoutObservation(){},watchVisualHeight:()=>()=>{},
   document:{documentElement:{}},UI_LANGS:{tr:'Türkçe'},L:s=>s,esc:s=>s,
   $:id=>id==='#app'?app:id==='#stage'?current:null,
   loadScene:()=>new Promise(resolve=>pending.push(resolve)),bindShell(){},shellNav(){},renderCaption(){},renderPanel(){},shown:()=>({}),showRoom(){},textileView(){}};
  vm.runInNewContext(`${shell}\nthis.runShell=shell;`,ctx);
  for(let i=0;i<order.length;i++)ctx.runShell();
  const mod={createViewer(host){const v={host,disposed:0,mode(){},setDesign(){},dispose(){this.disposed++;}};created.push(v);return v;}};
  for(const i of order){pending[i](mod);await Promise.resolve();await Promise.resolve();}
  assert.equal(created.length,1,'only current shell creates viewer');assert.equal(ctx.viewer.host,current,'live viewer belongs to current host');
  ctx.runShell();assert.equal(created[0].disposed,1,'existing live viewer disposed on next shell');
 }catch(error){failures.push({order,message:error.message});}
}
console.log(JSON.stringify({passed:5-failures.length,failed:failures.length,failures}));
if(failures.length)process.exitCode=1;
