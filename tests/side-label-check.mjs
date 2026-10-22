import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {t} from '../assets/forma/i18n.js';
const source=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const shell=source.slice(source.indexOf('function shell() {'),source.indexOf('\nfunction shellNav()')).replace("import('./scene.js?v=20261020k')",'loadScene()');
const kind=source.match(/^const kindRow = .*$/m)[0],chip=source.match(/^const chip = .*$/m)[0];
const actions=source.slice(source.indexOf('function applyActions('),source.indexOf('\nfunction materialLabel('));
const langs=['tr','en','de','fr','nl','da','es','it','ar'];
const product=['Yan sehpa','Side table','Beistelltisch','Bout de canapé','Bijzettafel','Sidebord','Mesa auxiliar','Tavolino laterale','طاولة جانبية'];
const direction=['Yandan','Side','Seite','Côté','Zij','Side','Lado','Lato','جانبية'];
const failures=[];let passed=0;
for(const [i,lang] of langs.entries())for(const mode of ['product','camera','command']){
 try{
  let html='';const stage={},ctx={state:{lang,design:{family:'table',kind:'side',materials:{}},tab:'parts'},L:k=>t(k,lang),esc:s=>s,
   isBedroom:()=>false,ui:()=>({kinds:['side']}),document:{documentElement:{}},UI_LANGS:{},viewer:null,
   $:id=>id==='#app'?{set innerHTML(value){html=value;}}:stage,loadScene:()=>new Promise(()=>{}),bindShell(){},shellNav(){},renderCaption(){},renderPanel(){},textileView(){},
   applyDesignActions:()=>({changed:false,effects:[{name:'viewSide'}],notes:[]}),studioEnv:()=>({}),markView(){}};
  if(mode==='product'){assert.equal(t('side',lang),product[i]);const out=vm.runInNewContext(`${chip}\n${kind}\nkindRow()`,ctx);assert(out.includes(`>${product[i]}</button>`));}
  else if(mode==='camera'){assert.equal(t('sideDirection',lang),direction[i]);vm.runInNewContext(`${shell}\nshell()`,ctx);assert(html.includes(`data-view="side">${direction[i]}</button>`));}
  else{const notes=vm.runInNewContext(`${actions}\napplyActions([])`,ctx);assert.equal(notes[0],direction[i]);}
  passed++;
 }catch(error){failures.push({lang,mode,message:error.message});}
}
console.log(JSON.stringify({passed,failed:failures.length,failures}));if(failures.length)process.exitCode=1;
