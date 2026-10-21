import assert from'node:assert/strict';import{automaticLeafDefaultsOnly as allowed}from'../tools/hacim-istek/revalidation-policy.mjs';
const before={design:{params:{bays:[{cells:[{type:'door'}]}]}}},after=structuredClone(before),path='/design/params/bays/0/cells/0/lv';
after.design.params.bays[0].cells[0].lv=0;assert(allowed(before,after,[path]));
after.design.params.bays[0].cells[0].lv=1;assert(!allowed(before,after,[path]),'Requested leaf count is not a default');
after.design.params.bays[0].cells[0].lv=0;before.design.params.bays[0].cells[0].lv=2;assert(!allowed(before,after,[path]),'Existing leaf choice cannot be overwritten');
delete before.design.params.bays[0].cells[0].lv;
assert(!allowed(before,after,[path,'/design/params/width']),'Unrelated dimensions cannot be excused');
assert(!allowed(before,after,['/design/params/bays/0/cells/0/inside']));assert(!allowed(before,after,[]));
console.log('PASS strict absent-to-zero leaf normalization policy; nonzero/existing/width/unrelated changes rejected');
