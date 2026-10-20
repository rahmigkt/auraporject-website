// Read the real runtime vocabulary. No replacement drawing engine and no model call.
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {vocabulary, sanitizeActions} from '../../assets/forma/ai.js';
import {sample} from '../../assets/forma/generate.js';

const runtimeFiles = ['ai.js','studio.js','generate.js','families.js','overrides.js','physics.js'];
const families = Object.fromEntries(['seating','table','storage','kitchen','bath'].map(family => {
  const design = sample({family,seed:1});
  const schema = vocabulary(design);
  const key = ['width','length','height','depth',...Object.keys(schema.params)].find(k=>schema.params[k] && Number.isFinite(design.params[k]));
  if (!key) throw Error(`No numeric runtime parameter for ${family}`);
  const valid = [{type:'set',key,value:design.params[key]}];
  if (JSON.stringify(sanitizeActions(valid,schema)) !== JSON.stringify(valid)) throw Error(`Runtime rejected ${key} action for ${family}`);
  if (sanitizeActions([{type:'execute_shell',value:'anything'},{type:'set',key:'invented_field',value:1}],schema).length) throw Error('Runtime allowlist mismatch');
  return [family,{kind:design.kind,units:'mm',verifiedAction:valid[0],schema}];
}));
const report = {schema:'aura.qwen.studio-contract/1',source:'existing Forma runtime exports',
  sources:Object.fromEntries(runtimeFiles.map(name=>[`assets/forma/${name}`,createHash('sha256').update(readFileSync(new URL(`../../assets/forma/${name}`,import.meta.url),'utf8').replaceAll('\r\n','\n')).digest('hex')])),
  families, integrationStatus:'vocabulary verified; browser action application and learned adapter not yet integrated',
  warning:'sanitizeActions filters vocabulary but does not prove value ranges, geometry or physical safety; normalise, compile and inspect before preview',
  excludedLegacyContract:'assets/design-tools.js uses a different cm-based studio tool schema; do not mix with Forma mm actions'};
mkdirSync('outputs/qwen-local',{recursive:true});
writeFileSync('outputs/qwen-local/studio-contract.json',JSON.stringify(report,null,2)+'\n');
console.log(`PASS actual runtime vocabulary and action allowlist for ${Object.keys(families).length} Forma families. No browser action executor or model was run.`);
