import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeSketchSegments, sketchDetail} from '../assets/forma/sketch.js';
import {familyOf} from '../assets/forma/families.js';
import {buildMesh} from '../assets/forma/build.js';
import * as THREE from '../assets/vendor/three.module.js';

// Reversed/shared edges, partial overlap, separate strokes, oblique and translated lines.
assert.deepEqual(mergeSketchSegments([
  [[0,0,0],[2,0,0]], [[3,0,0],[1,0,0]], [[3,0,0],[4,0,0]],
  [[6,0,0],[7,0,0]], [[0,1,0],[2,1,0]], [[1,1,1],[1,1,1]]
]), [ [[0,0,0],[4,0,0]], [[6,0,0],[7,0,0]], [[0,1,0],[2,1,0]] ]);
const diagonal = mergeSketchSegments([[[1,2,3],[3,4,5]], [[4,5,6],[2,3,4]]]);
assert.equal(diagonal.length, 1);
diagonal[0].flat().forEach((n,i) => assert(Math.abs(n - [1,2,3,4,5,6][i]) < 1e-9));
// Close, parallel physical edges remain distinct (e.g. the two sides of a door reveal).
assert.equal(mergeSketchSegments([[[0,0,0],[10,0,0]], [[0,0.2,0],[10,0.2,0]]]).length, 2);
assert.equal(mergeSketchSegments([[[0,0,0],[1,0,0]], [[1.1,0,0],[2,0,0]]]).length, 2);
// Only sub-tolerance floating point gaps are stitched; a measurable gap survives.
assert.equal(mergeSketchSegments([[[0,0,0],[1,0,0]], [[1.005,0,0],[2,0,0]]]).length, 1);
assert.equal(mergeSketchSegments([[[0,0,0],[1,0,0]], [[1.011,0,0],[2,0,0]]]).length, 2);
assert.equal(mergeSketchSegments([[[0,0,0],[1,0,0]], [[1,0,0],[1,1,0]]]).length, 2);
assert(sketchDetail({role:'pull'})); assert(sketchDetail({line:true})); assert(!sketchDetail({role:'top'}));

// Exercise the actual six-family geometry, including rotations. The drawing pass must not
// mutate the engine's design/parts/meshes; merged strokes stay finite and on their original lines.
const designs=JSON.parse(readFileSync(new URL('./visual/gorsel-01/designs.json',import.meta.url)));
const result=[];
for(const d of designs){
  const c=familyOf(d).mod.compile(d.params), original=JSON.stringify(c), segments=[];
  for(const part of c.parts){
    if(part.internal||part.planOnly||part.line||part.decor==='room')continue;
    const m=buildMesh(part), g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));
    const e=new THREE.EdgesGeometry(g,sketchDetail(part)?50:36), p=e.getAttribute('position');
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...part.pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...part.rot)),new THREE.Vector3(1,1,1));
    const v=new THREE.Vector3();
    for(let i=0;i<p.count;i+=2)segments.push([v.fromBufferAttribute(p,i).applyMatrix4(matrix).toArray(),v.fromBufferAttribute(p,i+1).applyMatrix4(matrix).toArray()]);
    g.dispose();e.dispose();
  }
  const clean=mergeSketchSegments(segments);
  assert(clean.length>0&&clean.length<=segments.length,d.family);
  assert(clean.flat(2).every(Number.isFinite));assert.equal(JSON.stringify(c),original);
  result.push(`${d.family}: ${segments.length} → ${clean.length}`);
}
console.log('PASS sketch: overlap/reversal/collinearity, genuine gaps/reveals, detail classes, six-family finite/non-mutating geometry.\n'+result.join('\n'));
