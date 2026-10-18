import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {FAMILIES} from '../../assets/forma/families.js';
import * as catalog from '../../assets/forma/catalog.js';

const names = ['WOODS','STAINS','FINISHES','COLORS','STONES','METALS','GLASS','FIBERS','PATTERNS','SINK_FINISHES'];
const catalogs = Object.fromEntries(names.map(k => [k, catalog[k]]));
const source = readFileSync(new URL('../../assets/forma/commands.js', import.meta.url), 'utf8');
const actionTypes = [...new Set([...source.matchAll(/type:\s*'([a-z]+)'/g)].map(m => m[1]))].sort();
const materialKeys = {species:'WOODS', stain:'STAINS', finish:'FINISHES', color:'COLORS', stone:'STONES', metal:'METALS', glass:'GLASS', fiber:'FIBERS', pattern:'PATTERNS'};
const options = value => Array.isArray(value) ? value : Object.keys(value);
const families = Object.fromEntries(Object.entries(FAMILIES).map(([id,f]) => {
  const materials = f.normalizeMaterials({});
  return [id, {ranges:f.mod.RANGES, enums:f.mod.ENUMS, kinds:f.kinds,
    styles:f.styles.map(s=>s.id), materials,
    materialSlots:Object.fromEntries(Object.entries(materials).map(([slot, fields]) => [slot,
      Object.fromEntries(Object.entries(fields).map(([key,value]) => [key,
        key === 'surface' ? (slot === 'top' ? (id === 'table' ? ['wood','veneer','stone','glass','lacquer'] : ['stone','wood','lacquer']) : slot === 'base' ? ['wood','metal','lacquer','same'] : ['wood','veneer','lacquer']) :
        key === 'finish' && slot === 'metal' ? Object.keys(catalog.METALS) :
        key === 'finish' && slot === 'sink' ? options(catalog.SINK_FINISHES) :
        key === 'polish' ? ['honed','polished'] :
        key === 'weave' ? Object.keys(catalog.WEAVES) :
        key === 'color2' ? Object.keys(catalog.COLORS) :
        materialKeys[key] ? options(catalog[materialKeys[key]]) : {default:value}]))]))}];
}));
export const vocab = {catalogs, families, actionTypes,
  notes:['Ranges: [min,max,step]; values in mm unless parameter is angular/count/ratio.',
    'Material slots reflect normalizeMaterials defaults; surface choices are documented from the family grammars.',
    'Pattern-only forbid actions may omit slot/key/value. Layout requests without an action belong in gold.unsupported.']};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('./vocab.json', import.meta.url), JSON.stringify(vocab,null,2)+'\n');
  console.log(`${Object.keys(families).length} families; action types: ${actionTypes.join(', ')}`);
}
