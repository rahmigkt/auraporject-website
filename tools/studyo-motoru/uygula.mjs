// CLI: node tools/studyo-motoru/uygula.mjs girdi.json  →  {state, rapor} as JSON on stdout
// girdi.json: {"state": {...}, "islemler": [{katman, type, ...}]}
import {readFileSync} from 'node:fs';
import {uygula} from './motor.mjs';
const g = JSON.parse(readFileSync(process.argv[2] || 0, 'utf8'));
const r = uygula(g.state, g.islemler);
process.stdout.write(JSON.stringify(process.argv.includes('--rapor') ? r.rapor : r, null, 1) + '\n');
process.exit(r.rapor.gecti ? 0 : 2);
