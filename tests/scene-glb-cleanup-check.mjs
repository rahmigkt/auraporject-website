import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../assets/forma/scene.js', import.meta.url), 'utf8');
const method = source.slice(source.indexOf('    async exportGLB() {'), source.indexOf('    texturesReady:'))
  .replace("await import('../vendor/addons/exporters/GLTFExporter.js')", '({GLTFExporter: Exporter})');
const dispose = source.match(/function disposeGroup\(group\) \{[^\n]+/)[0];
const failures = [];
for (const mode of ['success', 'callback-error', 'parse-throw', 'constructor-throw']) {
  try {
    const owned = [], original = [], marker = new Error(mode), result = new ArrayBuffer(8);
    const resource = (list, extra = {}) => { const r = {...extra, disposed: 0, dispose() { this.disposed++; }}; list.push(r); return r; };
    const data = resource(original, {isDataTexture: true, image: {width: 1, height: 1, data: [1, 2, 3, 255]}, repeat: {}});
    const shared = resource(original, {isDataTexture: false});
    const material = () => resource(original, {isMaterial: true, map: data, normalMap: data, roughnessMap: shared, clone() { return resource(owned, {...this, dispose() { this.disposed++; }}); }});
    const mats = {a: material(), b: material(), metadata: 'skip'};
    let geometry, canvasCount = 0, parseCount = 0;
    class Exporter {
      constructor() { if (mode === 'constructor-throw') throw marker; }
      parse(group, resolve, reject, opts) {
        parseCount++; assert.equal(opts.binary, true);
        assert.equal(owned.filter(x => x.isMaterial).length, 2);
        if (mode === 'parse-throw') throw marker;
        queueMicrotask(() => mode === 'callback-error' ? reject(marker) : resolve(result));
      }
    }
    const context = {Exporter, mats, compiled: {}, Uint8ClampedArray, Map, Object,
      ImageData: class {}, document: {createElement() { canvasCount++; return {getContext: () => ({putImageData() {}})}; }},
      THREE: {RepeatWrapping: 1, CanvasTexture: class { constructor() { return resource(owned, {repeat: {copy() {}}}); }}},
      buildGroup() { geometry = resource(owned, {userData: {}, type: 'BufferGeometry'}); return {traverse(fn) { fn({geometry}); }}; }
    };
    const api = vm.runInNewContext(`${dispose}\n({${method}})`, context);
    if (mode === 'success') assert.equal(await api.exportGLB(), result);
    else await assert.rejects(api.exportGLB(), error => error === marker);
    assert.equal(canvasCount, 1, 'shared DataTexture converted once');
    assert.equal(parseCount, mode === 'constructor-throw' ? 0 : 1);
    for (const r of owned) assert.equal(r.disposed, 1, 'export-owned resource disposed once');
    for (const r of original) assert.equal(r.disposed, 0, 'live scene resource preserved');
  } catch (error) { failures.push({mode, message: error.message}); }
}
console.log(JSON.stringify({passed: 4 - failures.length, failed: failures.length, failures}));
if (failures.length) process.exitCode = 1;
