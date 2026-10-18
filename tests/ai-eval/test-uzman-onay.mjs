import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,importDecisions} from './uzman-onay.mjs';
const header='id,dil,aile,cümle,beklenen,yasaklar,soru mu,karar,not\r\n';
const records=[{id:'a',lang:'tr',context:{family:'table'},text:'bir, iki "üç"\nsatır'}];
const row=d=>`a,tr,table,"bir, iki ""üç""\nsatır",,,hayır,${d},\r\n`;
test('BOM, CRLF, quoted commas/newlines/quotes',()=>assert.equal(parseCSV('\uFEFF'+header+row('onay'))[1][3],records[0].text));
test('blank decisions preserve approvals; no record mutation',()=>{
 const before=JSON.stringify(records),prior={z:{review:'approved'}};
 assert.deepEqual(importDecisions(header+row(''),'Uzman',records,prior),prior);
 assert.equal(JSON.stringify(records),before);
});
test('approval and rejection are explicit and attributed',()=>{
 for(const [d,review] of [['onay','approved'],['ret','rejected']]){
  const r=importDecisions(header+row(d),'Uzman',records).a;
  assert.equal(r.review,review);assert.equal(r.reviewed_by,'Uzman');assert.ok(Number.isFinite(Date.parse(r.date)));
 }
});
test('corrections require notes and never approve',()=>{
 assert.throws(()=>importDecisions(header+row('düzelt'),'Uzman',records));
 const r=importDecisions(header+row('düzelt').replace('düzelt,','düzelt,ölçü netleştirilmeli'),'Uzman',records).a;
 assert.equal(r.review,'rejected');assert.equal(r.decision,'düzelt');
});
test('reject unknown, duplicate, altered records and invalid decisions',()=>{
 for(const csv of [header+row('onay').replace(/^a,/,'b,'),header+row('onay')+row('ret'),header+row('onay').replace('bir, iki','değişmiş'),header+row('evet')])assert.throws(()=>importDecisions(csv,'Uzman',records));
 assert.throws(()=>importDecisions(header+row('onay'),' ',records));
});
test('reject malformed quoting',()=>{
 assert.throws(()=>parseCSV('"open'));assert.throws(()=>parseCSV('"closed"extra'));
});
