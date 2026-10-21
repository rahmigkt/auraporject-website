// In-memory Supabase/storage only: never connect, sign in or write to a real account.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const originals={window:globalThis.window,localStorage:globalThis.localStorage};
let serial=0;
class Storage {
 constructor(entries={}){this.entries=new Map(Object.entries(entries));}
 get length(){return this.entries.size;}
 key(i){return [...this.entries.keys()][i]??null;}
 getItem(k){return this.entries.get(k)??null;}
 setItem(k,v){this.entries.set(k,String(v));}
 removeItem(k){this.entries.delete(k);}
}
const later=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup({local={},remote={},remoteAt='2026-02-01T00:00:00Z',query,upsert}={}){
 const writes=[],selects=[],storage=new Storage(local);let onAuth;
 const client={auth:{
  onAuthStateChange(fn){onAuth=fn;},getSession:async()=>({data:{session:{user:{id:'A'}}}}),
  signOut:async()=>onAuth('SIGNED_OUT',null)
 },from(table){assert.equal(table,'forma_workspaces');return {
  select(){return {eq(key,id){assert.equal(key,'user_id');selects.push(id);return {maybeSingle:()=>query?query(id):Promise.resolve({data:{data:remote,updated_at:remoteAt},error:null})};}};},
  async upsert(data){writes.push(structuredClone(data));return upsert?upsert(data):{error:null};}
 };}};
 globalThis.window={supabase:{createClient:()=>client}};globalThis.localStorage=storage;
 const {account}=await import(`../assets/forma/account.js?sync-test=${serial++}`);await account.init();
 return {account,storage,writes,selects,switchTo(id){onAuth('SIGNED_IN',id?{user:{id}}:null);}};
}
const keyOf=d=>d.key;
// Exercise the studio's actual storage adapter without loading WebGL or external services.
const studioSource=readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8');
const storeCode=studioSource.match(/^const store = .+;$/m)?.[0];
assert(storeCode,'studio storage adapter exists');
const studioStore=account=>runInNewContext(storeCode+'\nstore;',{account,localStorage:globalThis.localStorage,JSON});
const tests=[
 ['overlapping saves cannot let an older response overwrite newer work',async()=>{
  const gates=[later(),later()];let calls=0,server;
  const e=await setup({local:{'aura-forma-design':'old'},upsert:async data=>{
   await gates[calls++].promise;server=structuredClone(data);return {error:null};
  }});
  const old=e.account.push();await tick();
  e.storage.setItem('aura-forma-design','new');const current=e.account.push();await tick();
  // Make the newer request finish first whenever requests are allowed to overlap.
  if(e.writes.length===2){gates[1].resolve();await current;}
  gates[0].resolve();await old;await tick();gates[1].resolve();await current;
  assert.equal(server.data['aura-forma-design'],'new');
 }],
 ['a failed save reports its error without blocking the next snapshot',async()=>{
  const gate=later(),failure=new Error('offline');let calls=0;
  const e=await setup({local:{'aura-forma-design':'old'},upsert:async()=>{
   if(calls++===0){await gate.promise;return {error:failure};}return {error:null};
  }});
  const old=e.account.push().catch(error=>error);await tick();
  e.storage.setItem('aura-forma-design','new');const current=e.account.push();
  gate.resolve();assert.equal(await old,failure);await current;
  assert.equal(e.writes.length,2);assert.equal(e.writes[1].data['aura-forma-design'],'new');
  assert.equal(e.storage.getItem('aura-forma-synced-user'),'A');
 }],
 ['switching accounts skips queued old work and does not block the new account',async()=>{
  const gate=later();
  const e=await setup({local:{'aura-forma-design':'A original'},upsert:async data=>{
   if(data.user_id==='A')await gate.promise;return {error:null};
  }});
  const old=e.account.push();await tick();
  e.storage.setItem('aura-forma-design','A queued');const queued=e.account.push();
  e.switchTo('B');e.storage.setItem('aura-forma-design','B work');
  const current=e.account.push();await tick();
  assert.equal(e.writes.length,2);assert.equal(e.writes[1].user_id,'B');
  await current;gate.resolve();await old;await queued;
  assert.equal(e.writes.length,2);assert.equal(e.writes[1].data['aura-forma-design'],'B work');
  assert.equal(e.storage.getItem('aura-forma-synced-user'),'B');
 }],
 ['queued snapshot keeps its capture time when a later local edit occurs',async()=>{
  const OriginalDate=globalThis.Date;let now='2026-03-01T00:00:00.000Z';
  try{
   globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[now]));}};
   const gate=later();let calls=0;
   const e=await setup({upsert:async()=>{if(calls++===0)await gate.promise;return {error:null};}});
   const old=e.account.push();await tick();now='2026-03-01T00:00:01.000Z';
   e.storage.setItem('aura-forma-design','queued');const current=e.account.push();
   now='2026-03-01T00:00:02.000Z';e.storage.setItem('aura-forma-design','later edit');
   e.storage.setItem('aura-forma-local-at',now);gate.resolve();await old;await current;
   assert.equal(e.writes[1].data['aura-forma-design'],'queued');
   assert.equal(e.writes[1].updated_at,'2026-03-01T00:00:01.000Z');
   assert(e.writes[1].updated_at<e.storage.getItem('aura-forma-local-at'));
  }finally{globalThis.Date=OriginalDate;}
 }],
 ['opening unchanged saved work does not make it newer than a remote edit',async()=>{
  const e=await setup({local:{'aura-forma-synced-user':'A','aura-forma-local-at':'2026-01-01T00:00:00Z','aura-forma-family':'"seating"'},remote:{'aura-forma-family':'"storage"'}});
  studioStore(e.account).set('aura-forma-family','seating');
  assert.equal(e.storage.getItem('aura-forma-local-at'),'2026-01-01T00:00:00Z');
  await e.account.pull(keyOf);assert.equal(e.storage.getItem('aura-forma-family'),'"storage"');
 }],
 ['first pull merges projects without losing unsynced local work',async()=>{
  const item=(id,key)=>({id,design:{key}});
  const e=await setup({local:{'aura-forma-project':JSON.stringify({items:[item('P1','same'),item('P2','local')]}),'aura-forma-local':'local'},remote:{'aura-forma-project':JSON.stringify({items:[item('P3','same')]}),'aura-forma-remote':'remote'}});
  assert.equal(await e.account.pull(keyOf),true);
  const items=JSON.parse(e.storage.getItem('aura-forma-project')).items;
  assert.deepEqual(items.map(i=>i.design.key),['same','local']);assert.equal(new Set(items.map(i=>i.id)).size,2);
  assert.equal(e.storage.getItem('aura-forma-local'),'local');assert.equal(e.storage.getItem('aura-forma-remote'),'remote');
 }],
 ['editing stored work still marks it newer and saves it',async()=>{
  const e=await setup({local:{'aura-forma-synced-user':'A','aura-forma-local-at':'2026-01-01T00:00:00Z','aura-forma-family':'"seating"'},remote:{'aura-forma-family':'"storage"'}});
  studioStore(e.account).set('aura-forma-family','table');
  assert.notEqual(e.storage.getItem('aura-forma-local-at'),'2026-01-01T00:00:00Z');
  await e.account.flush();await e.account.pull(keyOf);assert.equal(e.storage.getItem('aura-forma-family'),'"table"');
 }],
 ['newer remote snapshot preserves deletions instead of uploading stale keys again',async()=>{
  const e=await setup({local:{'aura-forma-synced-user':'A','aura-forma-local-at':'2026-01-01T00:00:00Z','aura-forma-old':'deleted on another device','unrelated':'keep'},remote:{'aura-forma-new':'remote'}});
  assert.equal(await e.account.pull(keyOf),true);
  assert.equal(e.storage.getItem('aura-forma-old'),null);assert.equal(e.storage.getItem('unrelated'),'keep');
  assert(!Object.hasOwn(e.writes[0].data,'aura-forma-old'));assert.equal(e.writes[0].data['aura-forma-new'],'remote');
 }],
 ['newer local snapshot wins without resurrecting old remote-only keys',async()=>{
  const e=await setup({local:{'aura-forma-synced-user':'A','aura-forma-local-at':'2026-03-01T00:00:00Z','aura-forma-local':'latest'},remote:{'aura-forma-remote':'stale'}});
  await e.account.pull(keyOf);assert.equal(e.storage.getItem('aura-forma-local'),'latest');assert.equal(e.storage.getItem('aura-forma-remote'),null);
 }],
 ['cloud snapshots cannot overwrite session or browser-only preferences',async()=>{
  const e=await setup({local:{'aura-account-session':'local session','aura-forma-account-skip':'local preference'},remote:{'aura-account-session':'foreign session','aura-forma-account-skip':'cloud preference','aura-forma-design':'remote'}});
  await e.account.pull(keyOf);assert.equal(e.storage.getItem('aura-account-session'),'local session');assert.equal(e.storage.getItem('aura-forma-account-skip'),'local preference');
  assert(!Object.hasOwn(e.writes[0].data,'aura-account-session'));assert(!Object.hasOwn(e.writes[0].data,'aura-forma-account-skip'));
 }],
 ['account switch during pull cannot apply or push the previous account response',async()=>{
  const q=later(),e=await setup({local:{'aura-forma-design':'local'},query:()=>q.promise});
  const pending=e.account.pull(keyOf);await Promise.resolve();e.switchTo('B');
  q.resolve({data:{data:{'aura-forma-design':'A private work'},updated_at:'2026-02-01T00:00:00Z'},error:null});
  assert.equal(await pending,false);assert.equal(e.storage.getItem('aura-forma-design'),'local');assert.deepEqual(e.writes,[]);
 }],
 ['account switch before push starts cannot relabel old work as the new user',async()=>{
  const e=await setup({local:{'aura-forma-design':'A work'}});
  const pending=e.account.push();e.switchTo('B');await pending;assert.deepEqual(e.writes,[]);
 }],
 ['old completed push cannot mark the newly signed-in account as synchronized',async()=>{
  const q=later(),e=await setup({upsert:()=>q.promise});
  const pending=e.account.push();await tick();
  assert.equal(e.writes.length,1);assert.equal(e.writes[0].user_id,'A');e.switchTo('B');q.resolve({error:null});await pending;
  assert.equal(e.storage.getItem('aura-forma-synced-user'),null);
 }],
 ['malformed cloud values leave local work intact',async()=>{
  const e=await setup({local:{'aura-forma-synced-user':'A','aura-forma-design':'valid'},remote:{'aura-forma-design':42}});
  await assert.rejects(()=>e.account.pull(keyOf));assert.equal(e.storage.getItem('aura-forma-design'),'valid');assert.deepEqual(e.writes,[]);
 }],
 ['empty remote snapshot removes the last deleted workspace key',async()=>{
  const e=await setup({local:{'aura-forma-synced-user':'A','aura-forma-design':'old'},remote:{}});
  assert.equal(await e.account.pull(keyOf),true);assert.equal(e.storage.getItem('aura-forma-design'),null);assert.deepEqual(e.writes[0].data,{});
 }],
 ['account switch cancels the previous account scheduled save',async()=>{
  const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
  const scheduled=new Map();let next=1;
  try{
   globalThis.setTimeout=fn=>{const id=next++;scheduled.set(id,fn);return id;};globalThis.clearTimeout=id=>scheduled.delete(id);
   const e=await setup({local:{'aura-forma-design':'A work'}});e.account.schedule();assert.equal(scheduled.size,1);
   const callback=[...scheduled.values()][0];e.switchTo('B');assert.equal(scheduled.size,0);
   callback();await Promise.resolve();await Promise.resolve();assert.deepEqual(e.writes,[]);
  }finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
 }]
];
let failed=0;
try{for(const [name,run]of tests){try{await run();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}}
finally{globalThis.window=originals.window;globalThis.localStorage=originals.localStorage;}
assert.equal(failed,0,`${failed} account synchronization regressions`);
