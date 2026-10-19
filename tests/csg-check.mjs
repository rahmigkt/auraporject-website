import {loadCsg} from '../assets/forma/csg.js';
import {buildMesh} from '../assets/forma/build.js';
import * as g from '../assets/forma/generate.js';
await loadCsg();
const d = g.sample({family: 'table', seed: 1}), top = g.compileDesign(d).parts.find(p => p.role === 'top');
d.overrides = [{tool: 'cut', id: top.id, ops: [{type: 'hole', at: [0, top.geom.t, 0], axis: 1, sign: 1, dia: 60, depth: 0}, {type: 'flutes', at: [0, top.geom.t, 200], axis: 1, sign: 1, a: 600, b: 12, depth: 5, count: 5, pitch: 24}, {type: 'pocket', at: [-300, top.geom.t, -150], axis: 1, sign: 1, a: 120, b: 80, depth: 8}]}];
const c = g.compileDesign(g.normalizeDesign(d)), q = c.parts.find(p => p.id === top.id), m = buildMesh(q), m0 = buildMesh(top);
console.log(q.geom.fn, m0.indices.length / 3, '->', m.indices.length / 3, m.positions.some(v => !Number.isFinite(v)) ? 'NaN!' : 'ok');
