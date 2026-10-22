// Optional one-way local evidence index. Canonical state and approvals never come from Ruflo.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const HERE=import.meta.dirname,LOCK=JSON.parse(fs.readFileSync(path.join(HERE,'pilot-lock.json'),'utf8'));
const SOURCES={H5:'H5-runtime.json',C7:'C7-runtime.json',release:'site-release-runtime.json'};
const FIELDS=['status','state','stage','branch','pr','url','head_sha','main_sha','model_run','training_started','next','limits'];
const sha=b=>createHash('sha256').update(b).digest('hex');
export function snapshot(stateRoot,key){
 assert(Object.hasOwn(SOURCES,key),'Unknown index key');
 const base=fs.realpathSync(stateRoot),file=path.join(base,SOURCES[key]);
 assert(!fs.lstatSync(file).isSymbolicLink(),'Source links are not accepted');
 assert.equal(path.dirname(fs.realpathSync(file)),base,'Source escapes state directory');
 const raw=fs.readFileSync(file);assert(raw.length<1024*1024,'State file exceeds limit');const data=JSON.parse(raw);
 return {schema:'aura.ruflo-evidence/1',key,source:SOURCES[key],source_sha256:sha(raw),data:Object.fromEntries(FIELDS.filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]])),advisory_only:true};
}
function verifyPilot(root){
 for(const [name,version]of [['ruflo','3.59.17'],['@claude-flow/cli','3.59.17'],['better-sqlite3','12.9.0']])assert.equal(JSON.parse(fs.readFileSync(path.join(root,'node_modules',name,'package.json'),'utf8')).version,version,`Unreviewed ${name} version`);
 for(const[name,hash]of Object.entries(LOCK.files))assert.equal(sha(fs.readFileSync(path.join(root,'node_modules/@claude-flow/cli/dist/src',name))),hash.after_sha256,`Unreviewed Ruflo code: ${name}`);
 assert.equal(sha(fs.readFileSync(path.join(root,'node_modules/better-sqlite3/build/Release/better_sqlite3.node'))),LOCK.sqlite_binary_sha256,'Unreviewed SQLite binary');
}
function invoke(root,args){
 verifyPilot(root);
 fs.mkdirSync(path.join(root,'.claude'),{recursive:true});
 const home=path.join(root,'index-home');fs.mkdirSync(home,{recursive:true});
 const env=Object.fromEntries(['SystemRoot','WINDIR','PATH','PATHEXT','TEMP','TMP','COMSPEC'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
 Object.assign(env,{HOME:home,USERPROFILE:home,APPDATA:path.join(home,'appdata'),LOCALAPPDATA:path.join(home,'local'),AURA_RUFLO_PILOT_ROOT:root,NO_COLOR:'1',CI:'true',DO_NOT_TRACK:'1',HF_HUB_OFFLINE:'1',TRANSFORMERS_OFFLINE:'1'});
 const p=spawnSync(process.execPath,['--import',pathToFileURL(path.join(HERE,'offline-guard.mjs')).href,path.join(root,'node_modules/ruflo/bin/ruflo.js'),...args],{cwd:root,env,encoding:'utf8',timeout:45000,windowsHide:true,maxBuffer:2*1024*1024});
 assert.equal(p.status,0,`Ruflo command failed: ${p.stderr||p.error?.message}`);return p.stdout;
}
export function sync(stateRoot,pilotRoot){
 const records=Object.keys(SOURCES).map(key=>snapshot(stateRoot,key));
 const root=fs.realpathSync(pilotRoot),db=path.join(root,'aura-index/memory.db');fs.mkdirSync(path.dirname(db),{recursive:true});
 if(!fs.existsSync(db))invoke(root,['memory','init','--backend','sqlite','--path',db]);
 const receipts=[];
 for(const record of records){
  const key=record.key;
  invoke(root,['memory','store','--key',key,'--value',JSON.stringify(record),'--namespace','aura-evidence','--no-embedding','--provenance','tool_result','--path',db]);
  const got=query(stateRoot,root,key);assert.deepEqual(got,record);
  receipts.push({key,source_sha256:record.source_sha256,verified:true});
 }
 return {advisory_only:true,receipts};
}
export function query(stateRoot,pilotRoot,key){
 assert(Object.hasOwn(SOURCES,key),'Unknown index key');const root=fs.realpathSync(pilotRoot);
 const result=JSON.parse(invoke(root,['memory','retrieve','--key',key,'--namespace','aura-evidence','--path',path.join(root,'aura-index/memory.db'),'--format','json']));
 const stored=JSON.parse(result.content),current=snapshot(stateRoot,key);
 assert.deepEqual(stored,current,'Stale or altered Ruflo snapshot; read canonical state and sync again');return stored;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
 const args=process.argv.slice(2),flag=name=>args[args.indexOf(name)+1];
 assert(args.includes('--state-root')&&args.includes('--pilot-root'),'Explicit --state-root and --pilot-root required');
 const state=flag('--state-root'),pilot=flag('--pilot-root');
 assert(['sync','query'].includes(args[0]),'Only sync/query are allowed');
 console.log(JSON.stringify(args[0]==='sync'?sync(state,pilot):query(state,pilot,flag('--key')),null,2));
}
