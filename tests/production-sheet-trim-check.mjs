import assert from 'node:assert/strict';
import {packBoard,sheetSvg,CUT_RULES} from '../assets/forma/production/nesting.js';
const sheet={l:2400,w:1200,label:'test'},board={grain:false,label:'test'};
let failed=0;
for(const trim of [0,10,25,50]){
 try{
  const plan=packBoard([{code:'E001',role:'side',l:400,w:300,qty:2,board}],sheet,{...CUT_RULES,trim});
  assert.equal(plan.length,1);assert.equal(plan[0].placed.length,2);
  const svg=sheetSvg({board,sheet,sheetCount:1},plan[0],0);
  const rects=[...svg.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" fill="([^"]+)"/g)];
  const stock=rects.find(r=>r[5]==='#f4efe6'),parts=rects.filter(r=>r[5]==='#fff');
  assert(stock);assert.equal(parts.length,2);const scale=+stock[3]/sheet.l;
  for(const [i,p]of plan[0].placed.entries()){
   assert(Math.abs((+parts[i][1]-+stock[1])/scale-(trim+p.x))<1e-8,`trim ${trim}: drawn X disagrees with cutting plan`);
   assert(Math.abs((+parts[i][2]-+stock[2])/scale-(trim+p.y))<1e-8,`trim ${trim}: drawn Y disagrees with cutting plan`);
   assert(Math.abs(+parts[i][3]/scale-p.l)<1e-8);assert(Math.abs(+parts[i][4]/scale-p.w)<1e-8);
   assert(p.x+p.l<=sheet.l-2*trim);assert(p.y+p.w<=sheet.w-2*trim);
  }
  console.log(`PASS trim ${trim}: drawing position and size match the packed pieces`);
 }catch(e){failed++;console.error('FAIL '+e.message);}
}
// Callers providing an older sheet result without trim retain the documented default margin.
const legacy={sheet,placed:[{code:'E1',x:0,y:0,l:100,w:100}],used:0};
const current={...legacy,trim:CUT_RULES.trim};
assert.equal(sheetSvg({board,sheet,sheetCount:1},legacy,0),sheetSvg({board,sheet,sheetCount:1},current,0));
assert.equal(failed,0,`${failed} custom trim drawing regressions`);
