// Replay the real studio action function with DOM effects stubbed, without editing assets/.
// Only numeric set/delta actions are in this first curriculum. This is not a browser UI test.
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {normalizeDesign,compileDesign,sample} from '../../assets/forma/generate.js';
import {FAMILIES,familyOf} from '../../assets/forma/families.js';
import {vocabulary,sanitizeActions} from '../../assets/forma/ai.js';
import {buildMesh,worldPositions} from '../../assets/forma/build.js';
import {analyse} from '../../assets/forma/physics.js';

const sha=s=>createHash('sha256').update(s).digest('hex');
const source=readFileSync(new URL('../../assets/forma/studio.js',import.meta.url),'utf8');
const start=source.indexOf('function applyActions(actions) {'), end=source.indexOf('/** Bedroom set: which piece',start);
if(start<0||end<0)throw Error('Studio action boundary changed; review extraction');
const actionSource=source.slice(start,end);
export const SYSTEM='AURA Forma sayısal düzenleme pilotu. Yalnız {"actions":[...]} JSON döndür. set/delta işlemlerini mevcut vocabulary.params alanlarından seç; değerler mm. İstenmeyen alanları, malzemeleri ve aileyi değiştirme. İşlemler kullanıcı onayından önce öneridir.';
export function replay(design,actions){
  const vocab=vocabulary(design), filtered=sanitizeActions(actions,vocab);
  if(JSON.stringify(filtered)!==JSON.stringify(actions)||actions.some(a=>!['set','delta'].includes(a.type)))throw Error('Non-curriculum action');
  let after,compiled;
  const context=vm.createContext({structuredClone,state:{design,lang:'tr'},familyOf,FAMILIES,
    L:k=>k,partName:(_group,key)=>key,setDesign:d=>{after=normalizeDesign(d);compiled=compileDesign(after);}});
  new vm.Script(actionSource+'\napplyActions('+JSON.stringify(actions)+');').runInContext(context,{timeout:15000});
  if(!after||!compiled?.parts.length)throw Error('No compiled studio result');
  for(const part of compiled.parts.filter(p=>!p.line&&!p.planOnly)){
    const mesh=buildMesh(part),world=worldPositions(part);
    if(!mesh.indices?.length||!Array.from(world).every(Number.isFinite))throw Error('Invalid compiled geometry');
  }
  return {after,compiled};
}

export function buildRows(){
  const rows=[],rejected=[];
  for(const family of ['seating','table','storage','kitchen','bath'])for(const [styleIndex,style]of FAMILIES[family].styles.slice(0,3).entries()){
    const split=['train','dev','test'][styleIndex];
    for(let seed=1;seed<=(split==='train'?5:1);seed++){
      const before=sample({family,style:style.id,seed}),v=vocabulary(before);
      const keys=[...new Set(['width','length','height','depth','seatHeight','topThickness',...Object.keys(v.params)])].filter(k=>v.params[k]&&Number.isFinite(before.params[k])).slice(0,4);
      const group=sha(JSON.stringify(before));
      // Physics is an observation about the base, never a claim that an action is safe.
      const baseChecks=analyse(compileDesign(before),before.materials,family).checks;
      for(const key of keys)for(const type of ['set','delta']){
        const [lo,hi]=v.params[key],step=FAMILIES[family].mod.RANGES[key]?.[2]||1;
        let target=Math.min(hi,before.params[key]+step*2);if(target===before.params[key])target=Math.max(lo,before.params[key]-step*2);
        const value=type==='set'?target:target-before.params[key],actions=[{type,key,value}];
        const text=type==='set'?`${key} ölçüsünü ${value} mm yap. Diğer değerleri koru.`:`${key} ölçüsünü ${Math.abs(value)} mm ${value>=0?'artır':'azalt'}. Diğer değerleri koru.`;
        try{
          const {after,compiled}=replay(before,actions);
          if(after.params[key]!==target)throw Error('Normalisation changed the requested target');
          const changed=Object.keys(before.params).filter(k=>JSON.stringify(before.params[k])!==JSON.stringify(after.params[k]));
          if(changed.some(k=>k!==key))throw Error('Coupled parameter change requires a different example');
          const geometryChecks=familyOf(after).mod.validate(compiled,after.materials,buildMesh);
          rows.push({schema:'aura.studio.numeric/1',id:sha(`${group}/${type}/${key}`).slice(0,24),group,split,review:'unreviewed',lang:'tr',task:'studio_numeric_edit',
            input:{text,design:before,vocabulary:{family,params:Object.fromEntries(keys.map(k=>[k,v.params[k]])),allowedActions:['set','delta']}},
            expected:{actions},evidence:{executor:'actual studio.js applyActions source in VM; UI side effects stubbed',actionSourceSha256:sha(actionSource.replaceAll('\r\n','\n')),changedParams:changed,partCount:compiled.parts.length,
              afterDesign:after,geometryChecks,basePhysicsChecks:baseChecks,physicalSafetyApproved:false}});
        }catch(e){rejected.push({family,split,seed,key,type,reason:e.message});}
      }
    }
  }
  const groups=new Map();for(const r of rows){if(groups.has(r.group)&&groups.get(r.group)!==r.split)throw Error('Group leakage');groups.set(r.group,r.split);}
  return {rows,rejected};
}

if(process.argv[1]?.endsWith('studio_data.mjs')){
  const out=process.argv[2]||'outputs/qwen-local/studio-v1', {rows,rejected}=buildRows(),files={};
  for(const split of ['train','dev','test']){
    const selected=rows.filter(r=>r.split===split);if(!selected.length)throw Error('Empty split');
    files[`${split}.jsonl`]=selected.map(JSON.stringify).join('\n')+'\n';
    if(split!=='test')files[split==='train'?'sft-unreviewed.jsonl':'dev-prompts.jsonl']=selected.map(r=>JSON.stringify({id:r.id,review:r.review,messages:[{role:'system',content:SYSTEM},{role:'user',content:JSON.stringify(r.input)},...(split==='train'?[{role:'assistant',content:JSON.stringify(r.expected)}]:[])]})).join('\n')+'\n';
  }
  files['rejected.json']=JSON.stringify(rejected,null,2)+'\n';
  files['manifest.json']=JSON.stringify({schema:'aura.studio.numeric/1',counts:Object.fromEntries(['train','dev','test'].map(s=>[s,rows.filter(r=>r.split===s).length])),files:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,sha(v)])),
    actionSourceSha256:sha(actionSource.replaceAll('\r\n','\n')),trainingStarted:false,scope:'numeric edits only; deterministic unreviewed labels; actual source replay not browser UI; physical safety not certified'},null,2)+'\n';
  for(const[name,value]of Object.entries(files))if(existsSync(`${out}/${name}`)&&readFileSync(`${out}/${name}`,'utf8')!==value)throw Error('Refuse frozen overwrite '+name);
  mkdirSync(out,{recursive:true});for(const[name,value]of Object.entries(files))writeFileSync(`${out}/${name}`,value);
  console.log(files['manifest.json']);
}
