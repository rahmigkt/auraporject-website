import assert from 'node:assert/strict';
import {compile,validate} from '../assets/forma/sofa.js';
import {legProfile} from '../assets/forma/profiles.js';
const thin=p=>validate(compile({width:2400,...p})).filter(i=>i.code==='thinLegs');
assert(thin({baseType:'frame',legType:'squareTaper',legSize:19,legTaper:.45,legHeight:210}).length,'Video frame base must not bypass existing thin-leg warning');
assert(thin({baseType:'legs',legType:'tapered',legSize:22,legTaper:.3,legHeight:210}).length,'Wide leg top must not hide its thin tapered end');
assert.equal(thin({baseType:'legs',legType:'cylinder',legSize:48,legHeight:140}).length,0,'Thick constant section remains free of thin-leg warning (not a load-capacity approval)');
assert.equal(thin({baseType:'plinth',legSize:10,legHeight:100}).length,0,'Plinth does not use these individual legs');
assert.equal(thin({baseType:'legs',legSize:10,legHeight:0}).length,0,'No exposed leg has no slender-leg warning');
for(const baseType of ['legs','frame']){
 const c=compile({width:2400,baseType,legType:'squareTaper',legSize:19,legTaper:.45,legHeight:210});
 const radius=Math.min(...legProfile(c.params.legType,c.params.legHeight,c.params.legSize,c.params.legTaper).map(p=>p[1]));
 assert(thin(c.params).some(i=>Math.abs(i.value-radius)<1e-9),'Warning reports actual smallest section radius');
}
console.log('PASS frame/legs, actual taper section, constant-thick and absent-leg controls; no load certification asserted');
