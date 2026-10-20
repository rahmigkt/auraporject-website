// Only authored choices enter this adapter: no sample(), random designs or source conversation.
import fs from 'node:fs';
import {normalizeDesign,compileDesign} from '../../assets/forma/generate.js';
import * as bedroom from '../../assets/forma/bedroom.js';
import {normalizeBedroomMaterials} from '../../assets/forma/catalog.js';
import {PAINTS,FLOORS,SCHEMES} from '../../assets/ev/finishes.js';
const products=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
for(const p of products){
  const requested=structuredClone(p.design);
  let compiled;
  if(p.design.family==='bedroom'){
    // The current general normalizer migrates legacy bedrooms to storage. The viewer
    // explicitly retains bed compilation; use that same documented compatibility path.
    p.design={...p.design,params:bedroom.normalize({...bedroom.DEFAULTS,...p.design.params,kind:'bed'}),materials:normalizeBedroomMaterials(p.design.materials)};
    compiled=bedroom.compile(p.design.params);p.compiler='bedroom.compile (viewer legacy bed adapter)';
  }else{p.design=normalizeDesign(p.design);compiled=compileDesign(p.design);p.compiler='compileDesign().meta.overall'}
  p.size=compiled.meta.overall;
  if(!Object.values(p.size).every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid compiled product: '+p.id);
  if(p.role==='sofa'&&p.design.materials.fabric.color!==requested.materials.fabric.color)throw Error('Requested fabric colour was silently changed: '+p.id);
  if(p.role==='dining'&&(p.design.materials.top.species!==requested.materials.top.species||p.design.materials.top.finish!==requested.materials.top.finish))throw Error('Requested table material was silently changed: '+p.id);
  p.requested_design=requested;
}
fs.writeFileSync(process.argv[3],JSON.stringify(products,null,2)+'\n');
if(process.argv[4])fs.writeFileSync(process.argv[4],JSON.stringify({paints:PAINTS,floors:FLOORS,schemes:SCHEMES},null,2)+'\n');
