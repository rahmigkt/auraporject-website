// Material-slot consistency only: these arithmetic checks do not certify furniture safety.
import assert from 'node:assert/strict';
import {analyse} from '../assets/forma/physics.js';
const part={id:'base',role:'base',mat:'base',geom:{fn:'box',w:1000,h:100,d:1000},pos:[0,50,0],rot:[0,0,0]};
const compiled={family:'table',params:{},parts:[part]};
const rows=[];
for(const surface of ['wood','stone','metal','glass','lacquer','veneer']){
 const shared=analyse(compiled,{top:{surface},base:{surface:'same'}});
 const explicit=analyse(compiled,{top:{surface},base:{surface}});
 rows.push({surface,shared:shared.mass,explicit:explicit.mass});
}
console.log(rows);
for(const row of rows)assert.equal(row.shared,row.explicit,`${row.surface}: same-as-top base differs from explicit material`);
assert.deepEqual(analyse(compiled,{base:{surface:'same'}}),analyse(compiled,{}),'missing top fallback changed');
const override={...compiled,parts:[{...part,matSpec:{surface:'metal'}}]};
assert.deepEqual(analyse(override,{top:{surface:'stone'},base:{surface:'same'}}),analyse(override,{top:{surface:'wood'},base:{surface:'wood'}}),'explicit per-part override lost priority');
console.log('PASS6 shared material classes; fallback and explicit part override preserved');
