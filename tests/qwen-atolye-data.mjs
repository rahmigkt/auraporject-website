// Experimental workshop examples, not the live ai.js action vocabulary.
// Authoritative shapes and execution come from the pinned studio; nothing edits assets/.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {sample,compileDesign,normalizeDesign} from '../assets/forma/generate.js';
import {normalizeOverrides} from '../assets/forma/overrides.js';
import {worldPositions,buildMesh} from '../assets/forma/build.js';
import {loadCsg,csgReady} from '../assets/forma/csg.js';
const out='outputs/qwen-local/atolye-v1',sha=x=>createHash('sha256').update(x).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
function source(){const tree=git('ls-tree','-r','origin/main','--','assets');git('diff','--exit-code','origin/main','--','assets');return {main:git('rev-parse','origin/main'),sha256:sha(tree),tree};}
const types=['add','remove','duplicate','transform','edge','sweep','cut'];
export function validateActions(actions,design){
 if(!Array.isArray(actions)||actions.length>20)throw Error('action_count');
 const known=new Set(compileDesign(design).parts.map(p=>p.id));
 for(const a of actions){
  if(!a||!types.includes(a.tool))throw Error('unsupported_tool');
  if(a.tool!=='add'&&!known.has(a.id))throw Error('unknown_part');
  if(a.tool==='add'&&(known.has(a.id)||!a.id))throw Error('duplicate_or_empty_id');
  if(a.tool==='duplicate'&&(known.has(a.as)||!a.as))throw Error('duplicate_or_empty_id');
  const checkNumbers=x=>{if(typeof x==='number'&&!Number.isFinite(x))throw Error('nonfinite');if(x&&typeof x==='object')for(const v of Object.values(x))checkNumbers(v);};checkNumbers(a);
  // Normalize is permissive and clamps; training validation must not silently repair outputs.
  const norm=normalizeOverrides([a]);if(norm.length!==1||!equal(a,norm[0]))throw Error('schema_or_bounds');
  if(a.tool==='add')known.add(a.id);if(a.tool==='duplicate')known.add(a.as);if(a.tool==='remove')known.delete(a.id);
 }
}
function bounds(part){const p=worldPositions(part),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<p.length;i++){if(!Number.isFinite(p[i]))throw Error('invalid_mesh');const k=i%3;lo[k]=Math.min(lo[k],p[i]);hi[k]=Math.max(hi[k],p[i]);}return {lo,hi,size:hi.map((v,k)=>v-lo[k])};}
function inner(g){return g.inner?inner(g.inner):g;}
function volume(part){const {positions:p,indices:idx}=buildMesh(part);let v=0;for(let t=0;t<idx.length;t+=3){const a=idx[t]*3,b=idx[t+1]*3,c=idx[t+2]*3;v+=p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])-p[a+1]*(p[b]*p[c+2]-p[b+2]*p[c])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]);}return Math.abs(v/6);}
export function replay(row){
 const d=row.input.design,actions=row.expected.actions;validateActions(actions,d);
 const before=compileDesign(d),snapshot=JSON.stringify(d);
 const after=compileDesign(normalizeDesign({...d,overrides:[...(d.overrides||[]),...actions]}));
 assert.equal(JSON.stringify(d),snapshot,'input_mutated');
 const a=actions[0],target=a&&after.parts.find(p=>p.id===a.id),old=a&&before.parts.find(p=>p.id===a.id);
 const expectedDelta= !a?0:a.tool==='remove'?-1:['add','duplicate'].includes(a.tool)?1:0;
 assert.equal(after.parts.length,before.parts.length+expectedDelta,'part_count');
 if(a?.tool==='transform'){assert.deepEqual(target.pos,old.pos.map((v,i)=>v+a.move[i]));assert.deepEqual(target.rot,old.rot.map((v,i)=>v+a.rot[i]));const oldBox=bounds(old),newBox=bounds(target);if(a.scale.every(v=>v===1)&&a.rot.every(v=>v===0))for(let k=0;k<3;k++)assert(Math.abs(newBox.lo[k]-oldBox.lo[k]-a.move[k])<.05);}
 if(a?.tool==='add'){assert(target);if(a.shape==='panel'){const size=bounds(target).size;for(let k=0;k<3;k++)assert(Math.abs(size[k]-a.size[k])<.1,'added dimensions');}}
 if(a?.tool==='duplicate')assert(after.parts.some(p=>p.id===a.as));
 if(a?.tool==='edge')assert(equal(target.geom.edges.front,a.sides.front));
 if(a?.tool==='sweep'){assert.equal(inner(target.geom).fn,'sweep');assert(bounds(target).hi[0]>bounds(old).hi[0]+a.bow*.1,'sweep must bend mesh');}
 if(a?.tool==='cut'){assert.equal(target.geom.fn,'cut');assert(equal(target.cuts,a.ops));assert(volume(target)<volume(old)-1,'cut must remove actual volume');}
 if(!actions.length)assert(equal(before,after));
 const evidence={beforeParts:before.parts.length,afterParts:after.parts.length,expectedPartDelta:expectedDelta,
  targetBefore:old?{id:old.id,bounds:bounds(old)}:null,targetAfter:target?{id:target.id,bounds:bounds(target)}:null,
  targetGeometry:target?.geom,...a?.tool==='cut'?{volumeBeforeMm3:volume(old),volumeAfterMm3:volume(target)}:{},scope:'Node compile + counts/coordinates/mesh bounds/descriptor effect; NOT a browser or machining/strength test'};
 return evidence;
}
const tr=['{x}.','Lütfen {x}.','Şimdi {x}.','Bu modelde {x}.','Diğer parçaları koruyarak {x}.','Sadece bu işlem için {x}.','Önizleme olarak {x}.','İsteğim şu: {x}.','Bir öneri hazırla: {x}.','Seçimimi koru ve {x}.','Tasarım için {x}.','Sonraki adımda {x}.','Bu düzenlemede {x}.','Ölçüleri belirttim; {x}.','Başka işlem eklemeden {x}.'];
const en=['Please {x}.','Could you {x}?','For this design, {x}.','As a preview, {x}.','Without changing other parts, {x}.','For the next step, {x}.','My request is to {x}.','I would like you to {x}.','Can you {x}?','Only {x}.','Prepare a proposal to {x}.','For this edit, {x}.','Keep the remaining design and {x}.','Now {x}.','As the next change, {x}.'];
function action(tool,i){const n=i+1;
 const raw=tool==='add'?{tool,id:`user:new-${n}`,shape:'panel',size:[200+n*10,20,150],mat:'wood',pos:[0,300,0],radius:2}
 :tool==='remove'?{tool,id:'user:panel'}:tool==='duplicate'?{tool,id:'user:panel',as:`user:copy-${n}`,mirror:false}
 :tool==='transform'?{tool,id:'user:panel',move:[n*10,0,0],rot:[0,0,0],scale:[1,1,1]}
 :tool==='edge'?{tool,id:'user:panel',sides:{front:['chamfer',3+i%5]}}
 :tool==='sweep'?{tool,id:'user:bar',mode:'sabre',shape:'square',bow:20+n*2,dir:'+x',taper0:1,taper1:.6}
 :{tool,id:'user:panel',ops:[{type:'hole',at:[0,15,0],axis:1,sign:-1,dia:8+i%5,depth:0}]};
 return normalizeOverrides([raw])[0];
}
function descriptions(a){const tool=a.tool;
 return tool==='add'?[`${a.size[0]} mm genişliğinde, 20 mm yüksekliğinde, 150 mm derinliğinde bir ahşap paneli x=0, y=300, z=0 mm konumuna ekle; kenar yarıçapı 2 mm olsun`,`add a wood panel ${a.size[0]} mm wide, 20 mm high and 150 mm deep at x=0, y=300, z=0 mm, with a 2 mm edge radius`]
 :tool==='remove'?['seçili parçayı sil','remove the selected part']
 :tool==='duplicate'?['seçili örnek panelin bir kopyasını oluştur; aynalama yapma','duplicate the selected reference panel once, without mirroring']
 :tool==='transform'?[`seçili örnek paneli X yönünde ${a.move[0]} mm taşı; döndürme veya ölçekleme yapma`,`move the selected reference panel ${a.move[0]} mm along X, with no rotation or scaling`]
 :tool==='edge'?[`seçili örnek panelin yalnız ön kenarına ${a.sides.front[1]} mm pah uygula`,`chamfer only the front edge of the selected reference panel by ${a.sides.front[1]} mm`]
 :tool==='sweep'?[`seçili örnek çubuğu kare kesitli kılıç ayak yap; X yönünde ${a.bow} mm eğ; başlangıç ölçeği 1, bitiş ölçeği 0,6 olsun`,`make the selected reference bar a square-section sabre member, bending ${a.bow} mm toward positive X with start scale 1 and end scale 0.6`]
 :[`seçili örnek panelin üst yüz merkezinden aşağı doğru ${a.ops[0].dia} mm çapında bir geçişli delik aç`,`cut a ${a.ops[0].dia} mm diameter through-hole downward from the top face centre of the selected reference panel`];
}
function fixtures(family,seed){return normalizeDesign({...sample({family,seed}),overrides:[{tool:'add',id:'user:panel',shape:'panel',size:[600,30,400],mat:'wood',pos:[0,900,0],radius:2},{tool:'add',id:'user:bar',shape:'square',size:[40,500,40],mat:'wood',pos:[400,0,0],radius:2}]});}
export function build(){const rows=[];
 for(const tool of types)for(let i=0;i<15;i++)for(const[lang,templates,index]of [['tr',tr,0],['en',en,1]]){
  const family=['table','storage','kitchen','bath','seating'][i%5],design=fixtures(family,101+i),a=action(tool,i);
  if(tool==='remove')a.id=compileDesign(sample({family,seed:101+i})).parts.find(p=>!p.line&&!p.internal).id;
  const text=templates[i].replace('{x}',descriptions(a)[index]);
  const row={schema:'aura.atelier.examples/1',id:`${tool}-${lang}-${i+1}`,group:`fixture-${family}-${101+i}`,split:i<11?'train':i<13?'dev':'test',review:'unreviewed',fixture:'Added calibration panel and bar, not an aesthetic/structural furniture proposal',tool,lang,decision:'edit',input:{text,design,selectedPartId:a.id},expected:{actions:[a],reply:lang==='tr'?'Düzenleme önerisini hazırladım.':'I prepared the edit proposal.'}};
  row.evidence=replay(row);rows.push(row);
 }
 for(const tool of types)for(const lang of ['tr','en'])for(const invalid of ['unknown_part','invalid_dimension']){
  const design=fixtures('table',101),a=action(tool,0);
  if(invalid==='unknown_part'){
   if(tool==='add')a.id='user:panel';else a.id='missing-part';
  }else if(tool==='add')a.size[0]=-10;else if(tool==='transform')a.scale[0]=0;else if(tool==='edge')a.sides.front[1]=-2;else if(tool==='sweep')a.bow=1000;else if(tool==='cut')a.ops[0].dia=0;else if(tool==='duplicate')a.as='user:bar';else a.id='missing-part';
  assert.throws(()=>validateActions([a],design));
  const row={schema:'aura.atelier.examples/1',id:`reject-${tool}-${lang}-${invalid}`,group:'negative-fixtures',split:'dev',review:'unreviewed',tool,lang,decision:'reject',input:{text:lang==='tr'?`Bu ${tool} isteğini uygula: ${JSON.stringify(a)}`:`Apply this ${tool} request: ${JSON.stringify(a)}`,design,selectedPartId:a.id,invalidProposal:a},expected:{actions:[],reply:lang==='tr'?'Parça veya ölçü geçerli değil; düzeltir misiniz?':'The part or dimension is invalid; could you correct it?'}};
  row.evidence=replay(row);rows.push(row);
 }
 return rows;
}
if(process.argv[2]==='--check'){
 await loadCsg();assert(csgReady(),'CSG_WASM_NOT_READY');
 const m=JSON.parse(readFileSync(out+'/manifest.json','utf8'));
 if(source().sha256!==m.source.sha256)throw Error('STALE_SOURCE');
 for(const[name,hash]of Object.entries(m.files))assert.equal(sha(readFileSync(out+'/'+name)),hash,'file_hash');
 const rows=readFileSync(out+'/examples.jsonl','utf8').trim().split('\n').map(JSON.parse);for(const row of rows)replay(row);
 // Dedicated staleness negative, without modifying any studio file.
 assert.notEqual(sha(m.source.tree+'changed-source'),m.source.sha256);
 for(const tool of types)for(const lang of ['tr','en'])assert.equal(rows.filter(r=>r.tool===tool&&r.lang===lang&&r.decision==='edit').length,15);
 console.log('PASS source and file hashes, staleness negative, 210 edits +28 rejects, all compiled and checked');
}else if(process.argv[2]==='--generate'){
 await loadCsg();assert(csgReady(),'CSG_WASM_NOT_READY');
 const s=source();
 if(existsSync(out+'/manifest.json')){const previous=JSON.parse(readFileSync(out+'/manifest.json','utf8'));if(previous.source.sha256!==s.sha256){writeFileSync(out+'/STALE.json',JSON.stringify({previous:previous.source.sha256,current:s.sha256,reason:'studio changed; frozen v1 not overwritten'},null,2)+'\n');throw Error('STALE_SOURCE: use a new dataset version and new review');}}
 const rows=build();mkdirSync(out,{recursive:true});
 const selected=[];for(const tool of types)for(const lang of ['tr','en'])selected.push(...rows.filter(r=>r.tool===tool&&r.lang===lang&&r.decision==='edit'&&r.split==='train').slice(0,2));
 types.forEach((tool,i)=>selected.push(rows.find(r=>r.tool===tool&&r.decision==='reject'&&r.lang==='tr'&&r.id.endsWith(i%2?'invalid_dimension':'unknown_part'))));
 types.slice(0,5).forEach(tool=>selected.push(rows.find(r=>r.tool===tool&&r.decision==='reject'&&r.lang==='en')));assert.equal(selected.length,40);
 const files={'examples.jsonl':rows.map(JSON.stringify).join('\n')+'\n','review-40.jsonl':selected.map(JSON.stringify).join('\n')+'\n'};
 const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 files['okuma.html']='<!doctype html><meta charset="utf-8"><title>Atölye eylemleri: 40 aday</title><style>body{font:18px system-ui;max-width:1000px;margin:30px auto}section{border-bottom:1px solid #aaa;padding:20px}pre{white-space:pre-wrap;font-size:13px}</style><h1>40 onaysız Atölye örneği</h1><p>Şablon etiketleri; model çalıştırılmadı. Bu JSON canlı ai.js sözleşmesine henüz eklenmedi. Test parçaları estetik veya mühendislik önerisi değildir.</p>'+selected.map((r,i)=>`<section><h2>${i+1}: ${esc(r.tool)} / ${r.lang}</h2><p>${esc(r.input.text)}</p><pre>${esc(JSON.stringify(r.expected,null,2))}</pre><details><summary>Girdi, seçili parça ve gerçek derleme</summary><pre>${esc(JSON.stringify({id:r.id,selected:r.input.selectedPartId,design:r.input.design,evidence:r.evidence},null,2))}</pre></details><small>${r.id}: unreviewed</small></section>`).join('');
 for(const[name,value]of Object.entries(files))writeFileSync(out+'/'+name,value);
 writeFileSync(out+'/manifest.json',JSON.stringify({schema:'aura.atelier.dataset/1',source:s,count:rows.length,positive:210,negative:28,reviewPacket:40,files:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,sha(v)])),liveContractIntegrated:false,modelTrained:false,humanReviewed:false,scope:'7 workshop tools; normalizer shape + compile replay; no browser/machining/physics certification'},null,2)+'\n');
 console.log('Generated',rows.length,'unreviewed records;40 selected;no model run');
}
