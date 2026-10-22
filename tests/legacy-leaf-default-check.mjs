import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeDesign} from '../assets/forma/generate.js';
import {assertKnownMigration} from './helpers/legacy-design.mjs';
const records=JSON.parse(fs.readFileSync('tests/fixtures/legacy-leaf-default-migrations.json','utf8')).records;
const designs=JSON.parse(fs.readFileSync('knowledge/aura-ses/denemeler/tasarimlar.json','utf8'));
for(const r of designs.filter(r=>records['text:'+r.id])){
 const current=normalizeDesign(r.design);assertKnownMigration('text:'+r.id,r.design,current);
 const bad=structuredClone(current);bad.params.bays[0].cells[0].lv=1;
 assert.throws(()=>assertKnownMigration('text:'+r.id,r.design,bad));
 const hidden=structuredClone(current);hidden.params.width+=1;
 assert.throws(()=>assertKnownMigration('text:'+r.id,r.design,hidden));
 assert.equal(records['text:'+r.id].training_approved,false);
}
console.log('PASS 5 text default migrations; lv=1 and hidden dimension mutations rejected; original review and no training approval preserved');
