import assert from 'node:assert/strict';
import {templateProject,safeStudioSave} from '../assets/studio-templates.js';
import {changeFamily} from '../assets/design-library.js';
let passed=0;
for(const scope of ['home','room','furniture']) for(let index=0;index<3;index++) {
 const project=templateProject(scope,index,'bedroom');
 project.rooms[0].width+=10;project.rooms[0].measured=true;
 const raw={version:1,scope,templateIndex:index,project,design:changeFamily({},'sofa')};
 const before=structuredClone(raw),saved=safeStudioSave(JSON.parse(JSON.stringify(raw)));
 assert.deepEqual(saved.project.source,project.source,'restore must retain canonical template source');
 assert.equal(saved.project.templateIndex,index);
 assert.equal(saved.project.rooms[0].width,project.rooms[0].width,'customer dimension preserved');
 assert.equal(saved.project.rooms[0].measured,true);
 assert.deepEqual(raw,before,'source object remains unchanged');
 const again=safeStudioSave(JSON.parse(JSON.stringify({version:1,...saved})));
 assert.deepEqual(again.project,saved.project,'second save/restore is stable');
 // Source and index inside the imported project are untrusted: derive them from the selected built-in template.
 raw.project.source={repository:'javascript:alert(1)',templateId:'invented',license:'invented',adapted:false};
 raw.project.templateIndex=999;
 const clean=safeStudioSave(raw);
 assert.deepEqual(clean.project.source,saved.project.source);
 assert.equal(clean.project.templateIndex,index);
 passed++;
}
for(const value of [-1,3,1.5,'1',null]) {
 const project=templateProject('home',0);
 const s=safeStudioSave({version:1,scope:'home',templateIndex:value,project,design:changeFamily({},'sofa')});
 assert.equal(s.templateIndex,0);assert.equal(s.project.templateIndex,0);assert.deepEqual(s.project.source,project.source);passed++;
}
console.log(`PASS ${passed} source metadata, repeated JSON restore, dimensions and untrusted source/index controls.`);
