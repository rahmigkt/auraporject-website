import assert from 'node:assert/strict';
import {runnerMountPattern} from '../assets/forma/production/runner-layout.js';
// Independent expected values transcribed from drawing datums, not generated with the implementation.
// Corrected after reading both arrow endpoints at 500dpi. Earlier uncommitted
// fixture omitted the initial37 from all subsequent cabinet fixings; it was wrong.
const expected={300:[[37,133,296.3],[37,133,229]],350:[[37,133,197,346.3],[37,165,266.5]],400:[[37,165,229,396.3],[37,165,325]],450:[[37,165,261,446.3],[37,165,229,357]],500:[[37,165,261,325,496.3],[37,165,261,389]],550:[[37,165,261,389,546.3],[37,165,293,453]]};
for(const [n,[cabinet,drawer]]of Object.entries(expected)){
 const p=runnerMountPattern('hettich-ka5632-ss-2025',+n);assert.deepEqual(p.cabinet_from_front_mm,cabinet);assert.deepEqual(p.drawer_from_front_mm,drawer);
 assert.equal(p.rear_cabinet_hole_drop_mm,14.5);assert(p.cabinet_from_front_mm.every(v=>v>0&&v<+n));assert.equal(p.drilling_verified,false);
}
assert.equal(runnerMountPattern('hettich-ka5632-ss-2025',600).status,'unsupported_length');
assert.equal(runnerMountPattern('accuride-3832ec',500).status,'unsupported_profile');
for(const n of ['500',NaN,-500,500.5])assert.equal(runnerMountPattern('hettich-ka5632-ss-2025',n).status,'unsupported_length');
assert.equal(runnerMountPattern('hettich-ka5632-ss-2025',500).cabinet_from_front_mm.at(-1),496.3);
assert.notEqual(runnerMountPattern('hettich-ka5632-ss-2025',500).cabinet_from_front_mm.at(-1),459.3,'Reject the earlier front-origin misreading.');
console.log('PASS six source runner patterns, 37mm-origin regression and unsupported profile/length guards; no pilot/load approval.');
