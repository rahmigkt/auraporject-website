// three.js view for Forma designs: PBR materials from woven-textile and wood maps, soft shadows,
// ambient occlusion, orbit/orthographic views, structure mode, photo capture and GLB export.
import * as THREE from '../vendor/three.module.js?v=20261016b';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js?v=20261016b';
import {EffectComposer} from '../vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/addons/postprocessing/RenderPass.js';
import {GTAOPass} from '../vendor/addons/postprocessing/GTAOPass.js';
import {SMAAPass} from '../vendor/addons/postprocessing/SMAAPass.js';
import {OutputPass} from '../vendor/addons/postprocessing/OutputPass.js';
import {buildMesh} from './build.js';
import {csgReady, onCsgReady} from './csg.js';
import {COLORS, FIBERS, METALS, WOODS, FINISHES, STAINS, STONES, GLASS} from './catalog.js';
import {fabricMaps} from './textile.js';
import {woodMaps} from './wood.js';
import {stoneMaps} from './stone.js';
import {caneMaps} from './cane.js';
import {mergeSketchSegments, sketchDetail} from './sketch.js';

// ---- Map generation (worker with synchronous fallback) ----------------------
let worker = null, jobs = 0;
const pending = new Map(), mapCache = new Map();
function makeMaps(kind, spec, maxPx = 1024) {
  const key = kind + JSON.stringify(spec) + maxPx;
  if (mapCache.has(key)) return mapCache.get(key);
  const job = new Promise((resolve) => {
    try {
      worker ??= new Worker(new URL('./maps-worker.js?v=20261016a', import.meta.url), {type: 'module'});
      worker.onmessage = ({data}) => { const p = pending.get(data.id); pending.delete(data.id); p?.(data.error ? null : data.out); };
      worker.onerror = () => { worker = null; for (const [, p] of pending) p(null); pending.clear(); };
      const id = ++jobs; pending.set(id, out => resolve(out || sync())); worker.postMessage({id, kind, spec, maxPx});
    } catch { resolve(sync()); }
    function sync() { return kind === 'wood' ? woodMaps(spec.species, spec.finish, {stain: spec.stain}) : kind === 'stone' ? stoneMaps(spec.stone, spec.polish) : fabricMaps(spec, {maxPx}); }
  });
  mapCache.set(key, job);
  if (mapCache.size > 24) mapCache.delete(mapCache.keys().next().value);
  return job;
}

function dataTexture(data, w, h, srgb) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true; return t;
}

const hexColor = h => new THREE.Color(h);

/** Material set for one design. Starts with flat colours; textures arrive asynchronously. */
function materialSet(materials, opts = {}) { return materials.front ? storageMaterialSet(materials, opts) : materials.top ? tableMaterialSet(materials, opts) : materials.case ? bedroomMaterialSet(materials, opts) : seatingMaterialSet(materials, opts); }
/** Room for a project view: walls, floor, rug, LED, window glass. */
function roomMaterialSet(spec, {onReady} = {}) {
  const set = {textures: []}, jobs = [];
  roomMaterials(set, spec, true, jobs);
  set.glass = new THREE.MeshPhysicalMaterial({color: '#e4edf1', roughness: 0.04, transparent: true, opacity: 0.18, depthWrite: false});
  set.fabric = set.wall;
  Promise.all(jobs).then(() => { if (!set.disposed) onReady?.(); });
  set.dispose = () => { set.disposed = true; for (const m of new Set([...(set.extra || []), set.glass])) m.dispose(); for (const t of set.textures) t.dispose(); };
  return set;
}
/** Room shell and room textiles on top of the bedroom set. */
function roomMaterials(set, materials, detail, jobs) {
  if (!materials.wall) return;
  const Wc = COLORS[materials.wall.color] || COLORS.cream;
  set.wall = new THREE.MeshStandardMaterial({color: hexColor(Wc.hex), roughness: 0.92});
  set.wallcut = new THREE.MeshStandardMaterial({color: '#3a3934', roughness: 0.9});
  set.floor = surfaceMaterial(materials.floor, set, detail ? jobs : [], {rotate: false});
  const Rc = COLORS[materials.rug?.color] || COLORS.cream;
  set.rug = new THREE.MeshPhysicalMaterial({color: hexColor(Rc.hex), roughness: 1, sheen: 0.6, sheenRoughness: 0.9, sheenColor: hexColor(Rc.hex).lerp(new THREE.Color('#fff'), 0.3)});
  if (detail) jobs.push(makeMaps('fabric', {fiber: 'wool', weave: 'basket', color: materials.rug?.color || 'cream', pattern: 'none', color2: 'white', scale: 1, density: 3}, 512).then(out => applyMaps(set, set.rug, out, out?.tileMm, out?.tileMm)));
  set.led = new THREE.MeshStandardMaterial({color: '#fff1d6', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 2.2, roughness: 0.5});
  set.extra = [set.wall, set.wallcut, set.floor, set.rug, set.led];
}

function applyMaps(set, mat, out, tileMmX, tileMmY, {rotate = false} = {}) {
  if (!out || set.disposed) return;
  const w = out.w || out.size, h = out.h || out.size;
  const map = dataTexture(out.albedo, w, h, true), normal = dataTexture(out.normal, w, h, false), rough = dataTexture(out.rough, w, h, false);
  for (const t of [map, normal, rough]) { t.repeat.set(1000 / tileMmX, 1000 / tileMmY); if (rotate) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; } }
  Object.assign(mat, {map, normalMap: normal, roughnessMap: rough, roughness: 1});
  mat.normalScale = new THREE.Vector2(0.7, 0.7);
  mat.color.set('#ffffff');
  mat.needsUpdate = true; set.textures.push(map, normal, rough);
}

function seatingMaterialSet(materials, {detail = true, onReady} = {}) {
  const f = materials.fabric, F = FIBERS[f.fiber] || FIBERS.linen, base = hexColor(COLORS[f.color].hex);
  const fabric = new THREE.MeshPhysicalMaterial({color: base, roughness: F.rough, sheen: F.sheen, sheenRoughness: f.fiber === 'velvet' ? 0.45 : 0.75, sheenColor: base.clone().lerp(new THREE.Color('#ffffff'), 0.35)});
  if (f.fiber === 'leather') { fabric.clearcoat = 0.25; fabric.clearcoatRoughness = 0.5; }
  // Napped hides: no gloss, a soft sheen that lightens at grazing angles.
  if (f.fiber === 'suede' || f.fiber === 'nubuck') { fabric.sheenRoughness = f.fiber === 'suede' ? 0.85 : 0.7; fabric.sheenColor = base.clone().lerp(new THREE.Color('#ffffff'), 0.22); }
  const weltSpec = {...f, color: materials.welt.color || f.color2, pattern: 'none'};
  fabricMacro(fabric, f.fiber === 'leather' ? 0.1 : f.fiber === 'velvet' ? 0.09 : 0.06);
  const welt = fabric.clone(); fabricMacro(welt, 0.05); welt.color = hexColor(COLORS[weltSpec.color].hex); welt.sheenColor = welt.color.clone().lerp(new THREE.Color('#fff'), 0.35);
  const wood = woodMaterial(materials.wood);
  const M = METALS[materials.metal.finish];
  const metal = new THREE.MeshPhysicalMaterial({color: hexColor(M.hex), metalness: 1, roughness: M.rough});
  const dark = new THREE.MeshStandardMaterial({color: '#1d1c1a', roughness: 0.8});
  const frame = new THREE.MeshStandardMaterial({color: '#d9c7a4', roughness: 0.85});
  // Thread for topstitching: the fabric colour, a shade deeper; inlay: the chosen metal.
  const stitch = new THREE.MeshStandardMaterial({color: base.clone().multiplyScalar(0.55), roughness: 0.8});
  const inlay = metal;
  const set = {fabric, welt, wood, metal, dark, frame, stitch, inlay, textures: []};
  if (detail) Promise.all([makeMaps('fabric', f), makeMaps('fabric', weltSpec, 512), makeMaps('wood', materials.wood)]).then(([a, b, c]) => {
    if (set.disposed) return;
    applyMaps(set, fabric, a, a?.tileMm, a?.tileMm); applyMaps(set, welt, b, b?.tileMm, b?.tileMm);
    // Real cloth never reflects like paper: cap the albedo so whites keep their weave/loops under the key light.
    for (const m of [fabric, welt]) m.color.setScalar(0.84);
    if (c) applyMaps(set, wood, c, c.tileMm[0], c.tileMm[1]);
    onReady?.();
  });
  set.dispose = () => { set.disposed = true; for (const m of [fabric, welt, wood, metal, dark, frame, stitch]) m.dispose(); for (const t of set.textures) t.dispose(); };
  return set;
}


/** Upholstery is never one flat colour: soft mottling and pile direction in world space (no tile repeat),
 *  a little darker in the folds the eye expects, and slightly varied roughness. */
const MACRO_GLSL = `
float mh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float mn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(mh(i), mh(i + vec3(1,0,0)), f.x), mix(mh(i + vec3(0,1,0)), mh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(mh(i + vec3(0,0,1)), mh(i + vec3(1,0,1)), f.x), mix(mh(i + vec3(0,1,1)), mh(i + vec3(1,1,1)), f.x), f.y), f.z); }
float mfbm(vec3 p){ return 0.55 * mn(p) + 0.3 * mn(p * 2.3 + 7.1) + 0.15 * mn(p * 5.7 + 3.3); }`;
function fabricMacro(mat, amount = 0.07) {
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMacroPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMacroPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vMacroPos;' + MACRO_GLSL)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float macroN = mfbm(vMacroPos * 7.0);
        diffuseColor.rgb *= 1.0 + ${amount.toFixed(3)} * (macroN - 0.5) * 2.0;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + 0.06 * (mfbm(vMacroPos * 11.0 + 5.0) - 0.5), 0.04, 1.0);`);
  };
  mat.customProgramCacheKey = () => 'fabricMacro' + amount;
  return mat;
}

function woodMaterial(w) {
  const W = WOODS[w.species] || WOODS.oak, Fi = FINISHES[w.finish] || FINISHES.matte, St = STAINS[w.stain];
  const color = hexColor(W.base); if (St?.hex) color.lerp(hexColor(St.hex), St.k);
  const m = new THREE.MeshPhysicalMaterial({color, roughness: Fi.rough, clearcoat: Fi.clearcoat, clearcoatRoughness: 0.2}); m.userData.timber = true; return m;
}

/** Surface material for table tops and bases: wood/veneer, stone, glass, lacquer or metal. */
/** Designer-chosen material for one part, cached on the part's material set; maps arrive later and trigger onPart. */
function partMaterial(spec, mats) {
  const key = JSON.stringify(spec); mats.perPart ??= new Map();
  if (!mats.perPart.has(key)) {
    const jobs = [], m = surfaceMaterial(spec, mats, jobs); mats.perPart.set(key, m); (mats.extra ??= []).push(m);
    mats.pendingParts = (mats.pendingParts || 0) + 1;
    Promise.all(jobs).then(() => { mats.pendingParts--; mats.onPart?.(); });
  }
  return mats.perPart.get(key);
}
function surfaceMaterial(spec, set, jobs, {rotate = false} = {}) {
  if (spec.surface === 'wood' || spec.surface === 'veneer') {
    const mat = woodMaterial(spec); jobs.push(makeMaps('wood', {species: spec.species, finish: spec.finish, stain: spec.stain}).then(out => applyMaps(set, mat, out, out?.tileMm[0], out?.tileMm[1], {rotate}))); return mat;
  }
  if (spec.surface === 'stone') {
    const S = STONES[spec.stone] || STONES.carrara, mat = new THREE.MeshPhysicalMaterial({color: hexColor(S.base), roughness: spec.polish === 'polished' ? 0.1 : 0.45, clearcoat: spec.polish === 'polished' ? 0.6 : 0, clearcoatRoughness: 0.08});
    jobs.push(makeMaps('stone', {stone: spec.stone, polish: spec.polish}).then(out => { applyMaps(set, mat, out, 600, 600); if (out) mat.normalScale = new THREE.Vector2(0.25, 0.25); })); return mat;
  }
  if (spec.surface === 'glass') {
    const G = GLASS[spec.glass] || GLASS.clear;
    return new THREE.MeshPhysicalMaterial({color: hexColor(G.hex), roughness: spec.glass === 'frosted' ? 0.55 : 0.04, metalness: 0, transparent: true, opacity: 0.35 + G.opacity * 0.9, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false});
  }
  if (spec.surface === 'metal') { const M = METALS[spec.metal] || METALS.black; return new THREE.MeshPhysicalMaterial({color: hexColor(M.hex), metalness: 1, roughness: M.rough}); }
  const C = COLORS[spec.color] || COLORS.white, gloss = spec.finish === 'lacquer';
  return new THREE.MeshPhysicalMaterial({color: hexColor(C.hex), roughness: gloss ? 0.14 : 0.5, clearcoat: gloss ? 0.9 : 0.1, clearcoatRoughness: 0.08});
}

function tableMaterialSet(materials, {detail = true, onReady} = {}) {
  const set = {textures: []}, jobs = [];
  const quiet = detail ? jobs : [];
  set.top = surfaceMaterial(materials.top, set, quiet, {rotate: false});
  set.base = materials.base.surface === 'same' ? set.top : surfaceMaterial(materials.base, set, quiet);
  const M = METALS[materials.hardware?.metal] || METALS.brass;
  set.metal = materials.base.surface === 'metal' ? set.base : new THREE.MeshPhysicalMaterial({color: hexColor(M.hex), metalness: 1, roughness: M.rough});
  set.dark = new THREE.MeshStandardMaterial({color: '#1d1c1a', roughness: 0.8});
  set.frame = new THREE.MeshStandardMaterial({color: '#d9c7a4', roughness: 0.85});
  set.fabric = set.base; set.wood = set.base; set.welt = set.base; set.stitch = set.dark;
  set.inlay = new THREE.MeshPhysicalMaterial({color: hexColor(M.hex), metalness: 1, roughness: Math.min(0.3, M.rough)});
  if (detail) Promise.all(jobs).then(() => { if (!set.disposed) onReady?.(); });
  set.dispose = () => { set.disposed = true; for (const m of new Set([set.top, set.base, set.metal, set.dark, set.frame, set.inlay])) m.dispose(); for (const t of set.textures) t.dispose(); };
  return set;
}

/** Bedroom: upholstery and solid wood as seating, plus case surface, mattress, bedding, cane, mirror, leather. */
let CANE = null;
function bedroomMaterialSet(materials, {detail = true, onReady} = {}) {
  let ready = 0;
  const done = () => { if (++ready === 2) onReady?.(); };
  const set = seatingMaterialSet(materials, {detail, onReady: done});
  const jobs = [];
  set.case = surfaceMaterial(materials.case, set, detail ? jobs : []);
  set.mattress = new THREE.MeshPhysicalMaterial({color: '#f3f1ec', roughness: 0.9, sheen: 0.4, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff')});
  const L = COLORS[materials.linen?.color] || COLORS.white;
  set.linen = new THREE.MeshPhysicalMaterial({color: hexColor(L.hex), roughness: 0.92, sheen: 0.5, sheenRoughness: 0.85, sheenColor: hexColor(L.hex).lerp(new THREE.Color('#fff'), 0.4)});
  set.leather = new THREE.MeshPhysicalMaterial({color: '#6b4428', roughness: 0.55, clearcoat: 0.2});
  set.mirror = new THREE.MeshPhysicalMaterial({color: '#dfe6e8', metalness: 0.5, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6});
  set.shadow = new THREE.MeshStandardMaterial({color: '#191714', roughness: 1});
  set.cane = new THREE.MeshStandardMaterial({color: '#d6b880', roughness: 0.6, side: THREE.DoubleSide});
  roomMaterials(set, materials, detail, jobs);
  if (detail) {
    jobs.push(makeMaps('fabric', {fiber: 'linen', weave: 'plain', color: materials.linen?.color || 'white', pattern: 'none', color2: 'white', scale: 1, density: 3}, 512).then(out => { applyMaps(set, set.linen, out, out?.tileMm, out?.tileMm); }));
  }
  { const cane = CANE ??= caneMaps(); applyMaps(set, set.cane, cane, cane.tileMm, cane.tileMm); }
  Promise.all(jobs).then(done);
  const base = set.dispose;
  set.dispose = () => { base(); for (const m of new Set([set.case, set.mattress, set.linen, set.leather, set.mirror, set.shadow, set.cane, ...(set.extra || [])])) m.dispose(); };
  return set;
}

/** RİTMO case goods: carcass and fronts (wood, veneer or lacquer), leg wood, hardware, birch-ply drawer boxes, glass, mirror. */
function storageMaterialSet(materials, {detail = true, onReady} = {}) {
  const set = {textures: []}, jobs = [], quiet = detail ? jobs : [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  set.case = surfaceMaterial(materials.case, set, quiet);
  set.front = same(materials.front, materials.case) ? set.case : surfaceMaterial(materials.front, set, quiet);
  // The back shows its inner face: the carcass colour, slightly darker so the interior reads.
  set.back = set.case.clone(); if (set.back.color) set.back.color.multiplyScalar(0.9);
  set.wood = woodMaterial(materials.wood);
  if (detail) jobs.push(makeMaps('wood', materials.wood).then(out => { if (out) applyMaps(set, set.wood, out, out.tileMm[0], out.tileMm[1]); }));
  const M = METALS[materials.metal?.finish] || METALS.black;
  set.metal = new THREE.MeshPhysicalMaterial({color: hexColor(M.hex), metalness: 1, roughness: M.rough});
  set.dark = new THREE.MeshStandardMaterial({color: '#1d1c1a', roughness: 0.8});
  set.frame = new THREE.MeshStandardMaterial({color: '#e2cfa9', roughness: 0.8});
  set.mirror = new THREE.MeshPhysicalMaterial({color: '#dfe6e8', metalness: 0.5, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6});
  const G = GLASS[materials.glass?.glass] || GLASS.clear;
  set.glass = new THREE.MeshPhysicalMaterial({color: hexColor(G.hex), roughness: materials.glass?.glass === 'frosted' ? 0.55 : 0.04, transparent: true, opacity: 0.22 + G.opacity * 0.8, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false});
  set.leather = new THREE.MeshPhysicalMaterial({color: '#6b4428', roughness: 0.55, clearcoat: 0.2});
  set.cane = new THREE.MeshStandardMaterial({color: '#d6b880', roughness: 0.6, side: THREE.DoubleSide});
  { const cane = CANE ??= caneMaps(); applyMaps(set, set.cane, cane, cane.tileMm, cane.tileMm); }
  set.inlay = set.metal; set.stitch = set.dark; set.shadow = set.dark; set.fabric = set.case;
  set.led = new THREE.MeshStandardMaterial({color: '#fff1d6', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 2.2, roughness: 0.5});
  // Kitchen: worktop, stainless steel, appliance glass, sink.
  if (materials.top) set.top = surfaceMaterial(materials.top, set, quiet, {rotate: false});
  set.steel = new THREE.MeshPhysicalMaterial({color: '#c9ccce', metalness: 1, roughness: 0.32});
  set.appliance = new THREE.MeshPhysicalMaterial({color: '#141617', roughness: 0.18, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05});
  const SF = {steel: null, black: '#2a2b2b', grey: '#6d6e6b', white: '#e9e7e2'}[materials.sink?.finish || 'steel'];
  set.sink = SF ? new THREE.MeshStandardMaterial({color: SF, roughness: 0.55}) : set.steel;
  // Per-cell lacquer colours (Ritmo: any door or drawer can take its own colour), made on first use.
  const lac = new Map(), gloss = materials.front?.surface === 'lacquer' && materials.front.finish === 'lacquer';
  set.lacquer = key => { if (!lac.has(key)) { const C = COLORS[key] || COLORS.white; lac.set(key, new THREE.MeshPhysicalMaterial({color: hexColor(C.hex), roughness: gloss ? 0.14 : 0.5, clearcoat: gloss ? 0.9 : 0.1, clearcoatRoughness: 0.08})); } return lac.get(key); };
  set.extra = [...(set.extra || [])]; set.lacMap = lac;
  Promise.all(jobs).then(() => { if (!set.disposed) onReady?.(); });
  set.dispose = () => { set.disposed = true; for (const m of new Set([set.case, set.front, set.back, set.wood, set.metal, set.dark, set.frame, set.mirror, set.glass, set.leather, set.cane])) m.dispose(); for (const m of lac.values()) m.dispose(); for (const m of new Set([set.top, set.steel, set.appliance, set.sink, set.led].filter(Boolean))) m.dispose(); for (const t of set.textures) t.dispose(); };
  return set;
}

// Geometry cache shared by rebuilds (slider moves rebuild the group; meshes and their sketch edges are reused).
const geoCache = new Map();
/** Timber UVs: the grain (texture v) runs along the part's longest axis on every face, as in a real board;
 *  end faces get end grain. A per-part offset keeps neighbouring parts from showing the same figure. */
function grainUV(m, id, dir = 'along') {
  const P = m.positions, N = m.normals, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P[i + a]); hi[a] = Math.max(hi[a], P[i + a]); }
  const ext = [0, 1, 2].map(a => hi[a] - lo[a]), L = ext.indexOf(Math.max(...ext));
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const du = (h % 997) / 997 * 0.3, dv = (h % 613) / 613 * 0.6, uv = new Float32Array(P.length / 3 * 2);
  for (let v = 0, i = 0; i < P.length; v++, i += 3) {
    const n = [Math.abs(N[i]), Math.abs(N[i + 1]), Math.abs(N[i + 2])], a = n.indexOf(Math.max(...n));
    const others = [0, 1, 2].filter(k => k !== a);
    if (a === L) { uv[v * 2] = P[i + others[0]] / 1000 + du; uv[v * 2 + 1] = P[i + others[1]] / 1000 * 0.12 + dv; } // end grain: compressed rings
    else { const across = others.find(k => k !== L); let u = P[i + across] / 1000, w = P[i + L] / 1000;
      if (dir === 'across') [u, w] = [w, u]; else if (dir === 'diag') [u, w] = [(u - w) * Math.SQRT1_2, (u + w) * Math.SQRT1_2];
      uv[v * 2] = u + du; uv[v * 2 + 1] = w + dv; }
  }
  return uv;
}

function geometryFor(part, timber = false) {
  const grain = part.grain || 'along', key = JSON.stringify(part.geom) + (timber ? '|g' + part.id + grain : '');
  let hit = geoCache.get(key);
  if (!hit) {
    const m = buildMesh(part), g = new THREE.BufferGeometry();
    if (timber) m.uvs = grainUV(m, part.id, grain);
    g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(m.uvs, 2));
    g.setIndex(new THREE.BufferAttribute(m.indices, 1));
    hit = {g, edges: new Map()};
    if (!csgReady() && key.includes('"fn":"cut"')) return hit; // uncut stand-in until the CSG module loads
    g.userData.cached = true;
    geoCache.set(key, hit);
    if (geoCache.size > 500) { const [k, old] = geoCache.entries().next().value; old.g.dispose(); for (const edge of old.edges.values()) edge.dispose(); geoCache.delete(k); }
  }
  return hit;
}

// ---- Sketch mode: the piece as a drawing — paper-white volumes, graphite creases and silhouettes. -----------
const SKETCH = {
  fill: new THREE.MeshStandardMaterial({color: '#fbfaf5', roughness: 1, metalness: 0, envMapIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1}),
  edge: new THREE.LineBasicMaterial({color: '#57564f', transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false}),
  detail: new THREE.LineBasicMaterial({color: '#6c685f', transparent: true, opacity: 0.56, depthWrite: false, toneMapped: false}),
  // Screen-space silhouette: constant CSS-pixel weight in perspective and orthographic views.
  hull: new THREE.ShaderMaterial({side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 6, uniforms: {color: {value: new THREE.Color('#383832')}, thickness: {value: 1.35}, resolution: {value: new THREE.Vector2(1, 1)}},
    vertexShader: 'uniform float thickness; uniform vec2 resolution; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vec2 n = (projectionMatrix * vec4(normalMatrix * normal, 0.0)).xy; float len = length(n); if(len > 0.00001) gl_Position.xy += (n / len) * thickness * 2.0 / resolution * gl_Position.w; }',
    fragmentShader: 'uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }'}),
  led: new THREE.MeshBasicMaterial({color: '#ffffff'}),
  // Line details (stitches, inlays, grooves) are drawn in ink, a little lighter than the outlines.
  ink: new THREE.LineBasicMaterial({color: '#9c3b22', transparent: true, opacity: 0.58, depthWrite: false, toneMapped: false}),
  inkDash: new THREE.LineDashedMaterial({color: '#9c3b22', transparent: true, opacity: 0.58, depthWrite: false, dashSize: 9, gapSize: 6, toneMapped: false})
};
// In the sketch, line details are drawn as 1 px ink lines (a 2 mm thread would vanish at drawing scale).
const lineCache = new Map();
function sketchLine(part) {
  const key = JSON.stringify(part.geom.points);
  let g = lineCache.get(key);
  if (!g) {
    const pts = part.geom.points.map(q => new THREE.Vector3(...q)); pts.push(pts[0].clone());
    g = new THREE.BufferGeometry().setFromPoints(pts); g.userData.cached = true;
    const tmp = new THREE.Line(g); tmp.computeLineDistances();
    lineCache.set(key, g); if (lineCache.size > 300) { const [k, old] = lineCache.entries().next().value; old.dispose(); lineCache.delete(k); }
  }
  const line = new THREE.Line(g, part.geom.dash ? SKETCH.inkDash : SKETCH.ink);
  line.position.set(...part.pos); line.rotation.set(...part.rot); line.renderOrder = 2;
  return line;
}
function sketchEdges(hit, angle = 36) {
  if (!hit.edges.has(angle)) hit.edges.set(angle, new THREE.EdgesGeometry(hit.g, angle));
  return hit.edges.get(angle);
}
/** Smallest extent of a cached geometry (mm): thin parts get no silhouette hull (it would swallow them). */
function minExtent(hit) { if (hit.min === undefined) { hit.g.computeBoundingBox(); const s = hit.g.boundingBox.getSize(new THREE.Vector3()); hit.min = Math.min(s.x, s.y, s.z); } return hit.min; }

/** Dimension lines (overall width, depth, height) drawn beside the piece, in metres, with mm labels. */
function dimensionGroup(box) {
  const g = new THREE.Group(), mat = new THREE.LineBasicMaterial({color: '#75665c', transparent: true, opacity: 0.72, toneMapped: false, depthTest: true, depthWrite: false}), s = box.getSize(new THREE.Vector3());
  mat.userData.temp = true;
  const off = Math.max(0.12, Math.max(s.x, s.z) * 0.06), tick = off * 0.16, min = box.min, max = box.max;
  const label = (text, at) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
    x.font = '600 38px ui-monospace, Menlo, Consolas, monospace'; x.fillStyle = '#6a5142'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: t, depthTest: false, depthWrite: false, transparent: true, toneMapped: false}));
    const h = Math.min(0.24, Math.max(0.07, Math.max(s.x, s.y, s.z) * 0.045)); sp.scale.set(h * 4, h, 1); sp.position.copy(at); sp.renderOrder = 10; g.add(sp);
  };
  const line = (a, b, n) => {
    const pts = [a, b, a.clone().addScaledVector(n, tick), a.clone().addScaledVector(n, -tick), b.clone().addScaledVector(n, tick), b.clone().addScaledVector(n, -tick)];
    const geo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]]);
    geo.setIndex([0, 1, 2, 3, 4, 5]); const ls = new THREE.LineSegments(geo, mat); ls.renderOrder = 9; g.add(ls);
  };
  const zf = max.z + off, xr = max.x + off, y0 = 0.002;
  line(new THREE.Vector3(min.x, y0, zf), new THREE.Vector3(max.x, y0, zf), new THREE.Vector3(0, 0, 1));
  label(`${Math.round(s.x * 1000)}`, new THREE.Vector3((min.x + max.x) / 2, y0 + off * 0.5, zf + off * 0.2));
  line(new THREE.Vector3(xr, y0, min.z), new THREE.Vector3(xr, y0, max.z), new THREE.Vector3(1, 0, 0));
  label(`${Math.round(s.z * 1000)}`, new THREE.Vector3(xr + off * 0.3, y0 + off * 0.5, (min.z + max.z) / 2));
  // Height at the back corner, where it stays clear of the piece in the usual three-quarter view.
  line(new THREE.Vector3(xr, 0, min.z), new THREE.Vector3(xr, max.y, min.z), new THREE.Vector3(1, 0, 0));
  label(`${Math.round(s.y * 1000)}`, new THREE.Vector3(xr + off * 0.45, max.y / 2, min.z));
  g.userData.dims = true;
  return g;
}

/** Group of meshes for a compiled design (units: metres). */
function buildGroup(compiled, mats, {structure = false, sketch = false} = {}) {
  const group = new THREE.Group(); group.scale.setScalar(0.001);
  const strokes = {edge: [], detail: []};
  for (const part of compiled.parts) {
    if (part.internal && !structure) continue;
    if (sketch && !part.planOnly) {
      if (part.decor === 'room') continue;
      if (part.line) { group.add(sketchLine(part)); continue; }
      const hit = geometryFor(part), mesh = new THREE.Mesh(hit.g, part.mat === 'led' ? SKETCH.led : SKETCH.fill);
      mesh.position.set(...part.pos); mesh.rotation.set(...part.rot); mesh.castShadow = !part.noShadow; mesh.receiveShadow = true;
      // Geometry depth hides the rear/intersecting edges; only distinct visible strokes survive.
      // Collect in world mm so shared edges between different parts can also be merged.
      mesh.updateMatrix();
      const p = sketchEdges(hit, sketchDetail(part) ? 50 : 36).getAttribute('position'), v = new THREE.Vector3();
      for (let i = 0; i < p.count; i += 2) {
        const a = v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrix).toArray();
        const b = v.fromBufferAttribute(p, i + 1).applyMatrix4(mesh.matrix).toArray();
        strokes[sketchDetail(part) ? 'detail' : 'edge'].push([a, b]);
      }
      if (!['tuft-button', 'reeds', 'seam', 'pull', 'cane'].includes(part.role) && !part.geom?.fn?.startsWith('tube') && minExtent(hit) >= 24) mesh.add(new THREE.Mesh(hit.g, SKETCH.hull));
      mesh.userData.part = part.id; group.add(mesh);
      continue;
    }
    if (part.planOnly) continue;
    let mat = (part.matSpec && partMaterial(part.matSpec, mats)) || mats[part.mat] || (part.mat?.startsWith('lac:') && mats.lacquer?.(part.mat.slice(4))) || mats.fabric;
    if (structure && part.decor) continue;
    if (structure && !part.internal && ['fabric', 'welt', 'top', 'case', 'front'].includes(part.mat)) {
      mat = mat.clone(); mat.transparent = true; mat.opacity = 0.16; mat.depthWrite = false; mat.userData.temp = true;
    }
    const mesh = new THREE.Mesh(geometryFor(part, !!mat.userData?.timber).g, mat);
    mesh.position.set(...part.pos); mesh.rotation.set(...part.rot);
    mesh.castShadow = !part.noShadow && (!structure || part.internal); mesh.receiveShadow = !part.line;
    mesh.userData.part = part.id;
    group.add(mesh);
  }
  if (sketch) for (const [kind, segments] of Object.entries(strokes)) {
    const points = mergeSketchSegments(segments).flat(2);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const line = new THREE.LineSegments(geometry, SKETCH[kind]); line.renderOrder = 1; group.add(line);
  }
  return group;
}

function disposeGroup(group) { group?.traverse(o => { if (o.geometry && !o.geometry.userData.cached && !(o.geometry.type === 'EdgesGeometry')) o.geometry.dispose(); if (o.material?.userData?.temp) o.material.dispose(); if (o.isSprite) { o.material.map?.dispose(); o.material.dispose(); } }); }

function makeRenderer(canvas, {alpha = true} = {}) {
  const r = new THREE.WebGLRenderer({canvas, antialias: true, alpha, preserveDrawingBuffer: true});
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.VSMShadowMap;
  return r;
}

// Background colours are pre-compensated for ACES tone mapping so the page paper tone (#f1eee6) is reproduced.
const PAPER = [1.884, 1.594, 1.132];
const SHEET = [4.894, 4.236, 2.486]; // studio sheet #fbfaf6
function makeStage(renderer, bg = PAPER) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color().setRGB(...bg, THREE.LinearSRGBColorSpace);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight('#ffffff', '#cfc7b8', 0.55));
  const sun = new THREE.DirectionalLight('#fff3e2', 2.3); sun.position.set(-1.6, 4.2, 3.2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 9; sun.shadow.blurSamples = 16; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01;
  Object.assign(sun.shadow.camera, {left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 12});
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#dce6f2', 0.6); rim.position.set(3, 2.5, -2.5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({color: '#2e2a22', opacity: 0.22}));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // Soft contact shadow under the piece (radial gradient), independent of the shadow map.
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64); grad.addColorStop(0, 'rgba(30,26,20,.42)'); grad.addColorStop(1, 'rgba(30,26,20,0)'); g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false}));
  contact.rotation.x = -Math.PI / 2; contact.position.y = 0.001; scene.add(contact);
  return {scene, sun, contact, pmrem};
}

/** Interactive viewer bound to a host element. */
export function createViewer(host, {onRotate} = {}) {
  const canvas = document.createElement('canvas'); canvas.className = 'f-canvas'; canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
  host.appendChild(canvas);
  let renderer;
  try { renderer = makeRenderer(canvas, {alpha: false}); } catch { host.dataset.webgl = 'off'; return null; }
  const {scene, contact, sun} = makeStage(renderer, SHEET);
  // A calm, untextured sheet: dimensions supply scale without a receding grid behind every part.
  const persp = new THREE.PerspectiveCamera(30, 1, 0.05, 60), ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 60);
  let userMoved = false, sketch = true, dims = null, camera = persp, view = 'angle', yaw = 0.62, pitch = 0.2, zoom = 1, group = null, mats = null, compiled = null, materials = null, structure = false, size = [1, 1, 1], baseY = 0, focus = null, matsReady = false;
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera), ao = new GTAOPass(scene, camera, 1, 1), smaa = new SMAAPass(), out = new OutputPass();
  ao.blendIntensity = 0.85; ao.updateGtaoMaterial({radius: 0.35, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 16});
  composer.addPass(renderPass); composer.addPass(ao); composer.addPass(smaa); composer.addPass(out);
  let raf = 0;
  let snapCfg = [5, 5], shooting = false, gizmo = null, gizmoId = null, gizmoCb = null, selBox = null, selId = null; // while a photo accumulates, nothing else may touch camera, size or scene
  const draw = () => { if (shooting) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { place(); if (gizmo) gizmo.camera = camera; sketchResolution(); renderPass.camera = camera; ao.camera = camera; composer.render(); }); };
  function sketchResolution() { const r = host.getBoundingClientRect(); SKETCH.hull.uniforms.resolution.value.set(Math.max(1, r.width), Math.max(1, r.height)); }
  function place() {
    const rect = host.getBoundingClientRect(), aspect = Math.max(0.2, rect.width / Math.max(1, rect.height));
    const [W, H, D] = size, target = focus ? new THREE.Vector3(...focus) : new THREE.Vector3(0, baseY + H * (H > 1.5 * Math.max(W, D) ? 0.5 : 0.45), 0); // wall-hung pieces start above the floor
    if (view === 'angle') {
      camera = persp; persp.aspect = aspect;
      const radius = Math.hypot(W, H, D) * 0.5, fov = persp.fov * Math.PI / 180;
      const dist = radius / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2) * (H > 1.5 * Math.max(W, D) ? 1.15 : aspect < 1 ? 1.02 : H > 0.8 * Math.max(W, D) ? 1.0 : 0.8) / zoom; // tall pieces (wardrobes) need the whole sphere
      persp.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
      persp.lookAt(target); persp.updateProjectionMatrix();
    } else {
      camera = ortho;
      const spanX = view === 'side' ? D : W, spanY = view === 'top' ? D : H, half = Math.max(spanY * 0.62, spanX * 0.62 / aspect) / zoom;
      Object.assign(ortho, {left: -half * aspect, right: half * aspect, top: half, bottom: -half});
      if (view === 'front') ortho.position.set(0, baseY + H / 2, 20); else if (view === 'side') ortho.position.set(20, baseY + H / 2, 0); else ortho.position.set(0, 20, 0.0001);
      ortho.lookAt(view === 'top' ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(0, baseY + H / 2, 0)); ortho.updateProjectionMatrix();
    }
  }
  const resize = () => { if (shooting) return; const r = host.getBoundingClientRect(), pr = Math.min(2, window.devicePixelRatio || 1); renderer.setPixelRatio(pr); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false); composer.setPixelRatio(pr); composer.setSize(Math.max(1, r.width), Math.max(1, r.height)); draw(); };
  const ro = new ResizeObserver(resize); ro.observe(host);
  const offCsg = onCsgReady(() => { if (JSON.stringify(compiled?.parts.map(q => q.geom.fn === 'cut' ? 1 : 0) || []).includes('1')) rebuild(); });
  // Orbit with pointer; wheel zoom; arrow keys.
  let drag = null;
  // Touch: one finger orbits, two fingers pinch to zoom (tablets).
  const fingers = new Map(); let pinch0 = null;
  canvas.addEventListener('pointerdown', e => {
    fingers.set(e.pointerId, [e.clientX, e.clientY]);
    if (fingers.size === 2) { const [a, b] = [...fingers.values()]; pinch0 = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom}; drag = null; return; }
    drag = {x: e.clientX, y: e.clientY, yaw, pitch}; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!fingers.has(e.pointerId)) return; fingers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch0 && fingers.size === 2) { const [a, b] = [...fingers.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom = Math.min(4, Math.max(0.5, pinch0.zoom * d / Math.max(10, pinch0.d))); draw(); }
  });
  for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, e => { fingers.delete(e.pointerId); if (fingers.size < 2) pinch0 = null; });
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointermove', e => { if (gizmo?.dragging || gizmo?.axis) { drag = null; return; } if (!drag) return; userMoved = true; view = 'angle'; yaw = drag.yaw - (e.clientX - drag.x) * 0.008; pitch = Math.max(-0.05, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.005)); draw(); onRotate?.(); });
  for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, () => { drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.min(4, Math.max(0.5, zoom * (e.deltaY > 0 ? 0.93 : 1.07))); draw(); }, {passive: false});
  canvas.addEventListener('keydown', e => { const k = {ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08]}[e.key]; if (k) { e.preventDefault(); view = 'angle'; yaw += k[0]; pitch = Math.max(-0.05, Math.min(1.2, pitch + k[1])); draw(); } });

  // Project room: one material set per product (cached by its materials), the shell, and a warm light under the cove.
  let room = null, roomMats = null; const itemMats = new Map();
  const cove = new THREE.PointLight('#ffd6a0', 0, 7, 1.6); cove.castShadow = false; scene.add(cove);
  const matsFor = m => { const k = JSON.stringify(m); if (!itemMats.has(k)) itemMats.set(k, materialSet(m, {onReady: () => rebuild()})); return itemMats.get(k); };
  function roomGroup() {
    const g = new THREE.Group();
    g.add(buildGroup(room.shell, roomMats, {sketch}));
    for (const it of room.items) {
      const w = new THREE.Group(); w.add(buildGroup(it.compiled, matsFor(it.materials), {sketch}));
      w.position.set(it.x / 1000, 0, it.z / 1000); w.rotation.y = it.rot; g.add(w);
    }
    return g;
  }

  // ---- Designer: pick a part, outline it, move/rotate/scale it with a gizmo ----------------------------------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const meshOf = id => { let m = null; group?.traverse(o => { if (!m && o.isMesh && o.userData.part === id) m = o; }); return m; };
  function reattach() {
    if (selBox) { for (const b of selBox) { scene.remove(b); b.geometry.dispose(); } selBox = null; }
    const ids = Array.isArray(selId) ? selId : selId ? [selId] : [];
    selBox = ids.map(id => meshOf(id)).filter(Boolean).map((m, i) => { const b = new THREE.BoxHelper(m, i === ids.length - 1 ? '#a24a2a' : '#c98a5a'); b.material.depthTest = false; b.renderOrder = 20; scene.add(b); return b; });
    if (gizmo) { const g = gizmoId && meshOf(gizmoId); if (g) gizmo.attach(g); else gizmo.detach(); }
  }
  let pendingRebuild = false;
  function rebuild() {
    if (shooting) { pendingRebuild = true; return; }
    if (!compiled && !room) return;
    if (group) { scene.remove(group); disposeGroup(group); }
    group = room ? roomGroup() : buildGroup(compiled, mats, {structure, sketch}); scene.add(group);
    const ov = room?.shell.meta.overall;
    cove.intensity = room && !sketch ? 5 : 0; if (ov) cove.position.set(0, (ov.height - 300) / 1000, (-ov.depth / 2 + 500) / 1000);
    const b = new THREE.Box3().setFromObject(group), s = b.getSize(new THREE.Vector3());
    if (dims) { scene.remove(dims); disposeGroup(dims); dims = null; }
    const meta = room ? room.shell.meta : compiled.meta;
    if (sketch && !meta?.room) { dims = dimensionGroup(b); scene.add(dims); }
    contact.visible = !sketch; ao.enabled = !sketch && !room; // a drawing needs no ambient occlusion
    size = [s.x, Math.max(s.y, b.max.y), s.z]; baseY = 0; contact.scale.set(s.x * 1.25, s.z * 1.45, 1);
    // Rooms: light through the open corner, a shadow camera that covers the floor, no contact blob.
    const isRoom = !!meta?.room, e = Math.max(2.5, Math.max(s.x, s.z) * 0.62);
    contact.visible = !isRoom && !sketch;
    // Rooms: daylight through the window in the left wall.
    if (isRoom) sun.position.set(-4.6, 3.6, 1.2); else sun.position.set(-1.6, 4.2, 3.2);
    Object.assign(sun.shadow.camera, {left: -e, right: e, top: e, bottom: -e}); sun.shadow.camera.updateProjectionMatrix();
    if (isRoom && !userMoved) { yaw = meta.cameraYaw; pitch = 0.32; }
    reattach();
    draw();
  }
  /** Catalogue photograph of one product: a seamless warm backdrop, a large soft key light (many shadow samples from
   *  an area, averaged), sub-pixel jitter for clean edges, a longer lens and a gentle vignette. Runs in the browser. */
  async function studioPhoto({width = 2400, height = 1600, samples = 48, yaw: y = yaw, pitch: pt = 0.16, lens = 24, zoom: zm = 1.04, focus: fc = null} = {}) {
    for (let t = 0; (!matsReady || mats?.pendingParts) && t < 200; t++) await new Promise(r => setTimeout(r, 100)); // full-resolution maps first (incl. per-part materials)
    if (shooting) return null; shooting = true; cancelAnimationFrame(raf);
    const keep = {bg: scene.background, env: scene.environmentIntensity, tm: renderer.toneMapping, exp: renderer.toneMappingExposure, sun: sun.position.clone(), si: sun.intensity, fov: persp.fov, yaw, pitch, view, zoom, focus, co: contact.material.opacity, pr: renderer.getPixelRatio(), hostRect: host.getBoundingClientRect};
    const floor = scene.children.find(o => o.material?.isShadowMaterial), fo = floor?.material.opacity;
    let wall = null;
    try {
    scene.background = new THREE.Color('#ebe6dc'); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
    scene.environmentIntensity = 0.75; sun.intensity = 2.6; if (floor) floor.material.opacity = 0.34; contact.material.opacity = 0.75;
    // Wall-hung pieces (wall cabinets, wall taps, mirrors) get the wall they hang on, so nothing floats.
    const bb = new THREE.Box3().setFromObject(group);
    const hung = bb.min.y > 0.04 || compiled.params?.base === 'wall' || compiled.parts.some(q => ['mirror', 'mirror-frame'].includes(q.role));
    if (hung || compiled.parts.some(q => ['tap', 'wall-rail', 'hood', 'mirror'].includes(q.role) && q.pos?.[1] > 900)) {
      wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({color: '#efeae1', roughness: 0.95}));
      wall.position.set(0, 6, bb.min.z - 0.002); wall.receiveShadow = true; scene.add(wall);
    }
    persp.fov = lens; yaw = y; pitch = pt; view = 'angle'; zoom = zm; focus = fc;
    renderer.setPixelRatio(1); renderer.setSize(width, height, false); composer.setPixelRatio(1); composer.setSize(width, height);
    const hostRect = host.getBoundingClientRect, fake = {width, height}; host.getBoundingClientRect = () => fake; // frame for the photo, not the panel
    place(); host.getBoundingClientRect = hostRect;
    ao.updateGtaoMaterial({samples: 24});
    const c2 = document.createElement('canvas'); c2.width = width; c2.height = height; const g = c2.getContext('2d', {willReadFrequently: true});
    const acc = new Float32Array(width * height * 4), base = keep.sun.clone().setLength(6), side = new THREE.Vector3().crossVectors(base, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(side, base).normalize();
    let rnd = 7; const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < samples; i++) {
      // key light: points on a disk ~1.6 m across (a softbox), golden-angle spread
      const r = 0.8 * Math.sqrt((i + 0.5) / samples), a = i * 2.39996;
      sun.position.copy(base).addScaledVector(side, r * Math.cos(a)).addScaledVector(up, r * Math.sin(a));
      persp.setViewOffset(width, height, rand() - 0.5, rand() - 0.5, width, height); persp.updateProjectionMatrix();
      renderPass.camera = persp; ao.camera = persp; composer.render();
      g.drawImage(canvas, 0, 0); const px = g.getImageData(0, 0, width, height).data;
      for (let k = 0; k < px.length; k++) acc[k] += px[k];
      if (i % 6 === 5) await new Promise(res => setTimeout(res));
    }
    persp.clearViewOffset();
    const img = g.createImageData(width, height), cx = width / 2, cy = height * 0.48, R = Math.hypot(cx, cy);
    for (let yy = 0, k = 0; yy < height; yy++) for (let xx = 0; xx < width; xx++, k += 4) {
      const v = 1 - 0.13 * Math.pow(Math.hypot(xx - cx, yy - cy) / R, 2.2);
      for (let j = 0; j < 3; j++) img.data[k + j] = acc[k + j] / samples * v; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c2.toDataURL('image/jpeg', 0.92);
    } finally {
    host.getBoundingClientRect = keep.hostRect;
    persp.clearViewOffset();
    if (wall) { scene.remove(wall); wall.geometry.dispose(); wall.material.dispose(); }
    Object.assign(scene, {background: keep.bg, environmentIntensity: keep.env}); renderer.toneMapping = keep.tm; renderer.toneMappingExposure = keep.exp;
    sun.position.copy(keep.sun); sun.intensity = keep.si; if (floor) floor.material.opacity = fo; contact.material.opacity = keep.co;
    persp.fov = keep.fov; ({yaw, pitch, view, zoom, focus} = keep); ao.updateGtaoMaterial({samples: 16}); renderer.setPixelRatio(keep.pr);
    shooting = false; if (pendingRebuild) { pendingRebuild = false; rebuild(); } resize();
    }
  }
  return {
    setDesign(next, nextMaterials) {
      const matKey = JSON.stringify(nextMaterials);
      if (!mats || matKey !== JSON.stringify(materials)) { mats?.perPart?.forEach(m => m.dispose()); mats?.dispose(); matsReady = false; mats = materialSet(nextMaterials, {onReady: () => { matsReady = true; rebuild(); }}); mats.onPart = () => rebuild(); materials = structuredClone(nextMaterials); }
      compiled = next; room = null; rebuild();
    },
    /** Project room: {shell (compiled room shell), roomMaterials, items: [{compiled, materials, x, z, rot}]}; null leaves it. */
    setRoom(spec) {
      if (!spec) { room = null; userMoved = false; rebuild(); return; }
      const key = JSON.stringify(spec.roomMaterials);
      if (!roomMats || roomMats.key !== key) { roomMats?.dispose(); roomMats = roomMaterialSet(spec.roomMaterials, {onReady: () => rebuild()}); roomMats.key = key; }
      const keep = new Set(spec.items.map(i => JSON.stringify(i.materials)));
      for (const [k, m] of itemMats) if (!keep.has(k)) { m.dispose(); itemMats.delete(k); }
      if (!room) userMoved = false;
      room = spec; zoom = 1; view = 'angle'; rebuild();
    },
    view(kind) { view = kind; zoom = 1; if (kind === 'angle') { yaw = room ? room.shell.meta.cameraYaw : compiled?.meta?.room ? compiled.meta.cameraYaw : 0.62; pitch = 0.2; userMoved = false; } draw(); },
    zoom(f) { zoom = Math.min(2.5, Math.max(0.6, zoom * f)); draw(); },
    structure(on) { structure = on; rebuild(); },
    /** Part id under a screen point (render or sketch mode), or null. */
    pick(cx, cy) {
      if (!group) return null; if (gizmo?.axis) return selId; place(); const r = canvas.getBoundingClientRect();
      ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
      for (const h of ray.intersectObject(group, true)) { let o = h.object; while (o && !o.userData.part) o = o.parent; if (o) return o.userData.part; }
      return null;
    },
    /** Surface point under the screen point: part id, point and normal in the part's own axes (mm). */
    pickPoint(cx, cy) {
      if (!group) return null; place(); const r = canvas.getBoundingClientRect();
      ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
      for (const h of ray.intersectObject(group, true)) {
        let o = h.object; while (o && !o.userData.part) o = o.parent; if (!o || !h.face) continue;
        const local = o.worldToLocal(h.point.clone()); return {id: o.userData.part, local: local.toArray(), normal: h.face.normal.toArray()};
      }
      return null;
    },
    /** Snap the gizmo: mm and degrees (0 turns off). */
    snap(mm, deg) { gizmo?.setTranslationSnap(mm || null); gizmo?.setRotationSnap(deg ? deg * Math.PI / 180 : null); gizmo?.setScaleSnap(mm ? 0.05 : null); snapCfg = [mm, deg]; },
    /** Outline one part or several (array of ids; null clears). */
    select(id) { selId = id; reattach(); draw(); },
    /** Gizmo on a part: mode 'translate' | 'rotate' | 'scale'; onEnd({pos, rot, scale}) in mm / rad / factors. Null id removes it. */
    async gizmo(id, mode = 'translate', onEnd = null) {
      gizmoId = id; gizmoCb = onEnd;
      if (!id) { gizmo?.detach(); draw(); return; }
      if (!gizmo) {
        const {TransformControls} = await import('../vendor/addons/controls/TransformControls.js');
        gizmo = new TransformControls(camera, canvas); gizmo.setSize(matchMedia('(pointer: coarse)').matches ? 1.35 : 0.9); gizmo.setTranslationSnap(snapCfg[0] || null); gizmo.setRotationSnap(snapCfg[1] ? snapCfg[1] * Math.PI / 180 : null); scene.add(gizmo.getHelper());
        gizmo.addEventListener('objectChange', () => { selBox?.forEach(b => b.update()); draw(); });
        gizmo.addEventListener('dragging-changed', e => { if (e.value || !gizmo.object) return; const o = gizmo.object; gizmoCb?.({pos: o.position.toArray(), rot: [o.rotation.x, o.rotation.y, o.rotation.z], scale: o.scale.toArray()}); });
      }
      gizmo.camera = camera; gizmo.setMode(mode); reattach(); draw();
    },
    /** 'sketch' (line drawing on paper) or 'render' (materials and colour). */
    mode(m) { const next = m === 'sketch'; if (next !== sketch) { sketch = next; rebuild(); } },
    /** High-resolution still. A single product in render mode gets the studio photograph (see studioPhoto). */
    async photo(scale = 2, opts = {}) {
      if (!room && !sketch && compiled && !compiled.meta?.room && opts.studio !== false) return studioPhoto(opts);
      const r = host.getBoundingClientRect(), w = Math.round(r.width * scale), h = Math.round(r.height * scale);
      const pr = renderer.getPixelRatio();
      try {
      renderer.setPixelRatio(1); renderer.setSize(w, h, false); composer.setPixelRatio(1); composer.setSize(w, h);
      ao.updateGtaoMaterial({samples: 32}); place(); sketchResolution(); renderPass.camera = camera; ao.camera = camera; composer.render();
      return canvas.toDataURL('image/jpeg', 0.92);
      } finally {
      ao.updateGtaoMaterial({samples: 16}); renderer.setPixelRatio(pr); resize();
      }
    },
    capture() { place(); sketchResolution(); composer.render(); return canvas; },
    /** Binary STL of what is shown, in millimetres. */
    async exportSTL() {
      const {STLExporter} = await import('../vendor/addons/exporters/STLExporter.js');
      const g = new THREE.Group(); g.add(buildGroup(compiled, mats, {structure: false})); g.children[0].scale.setScalar(1); g.updateMatrixWorld(true);
      const data = new STLExporter().parse(g, {binary: true}); disposeGroup(g.children[0]); return data;
    },
    async exportGLB() {
      const {GLTFExporter} = await import('../vendor/addons/exporters/GLTFExporter.js');
      // GLTFExporter needs canvas images: convert the generated DataTextures once per export.
      const conv = new Map(), toCanvas = t => {
        if (!t || !t.isDataTexture) return t;
        if (conv.has(t)) return conv.get(t);
        const c = document.createElement('canvas'); c.width = t.image.width; c.height = t.image.height;
        c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(t.image.data), c.width, c.height), 0, 0);
        const ct = new THREE.CanvasTexture(c); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.copy(t.repeat); ct.colorSpace = t.colorSpace; ct.flipY = false;
        conv.set(t, ct); return ct;
      };
      const exportMats = Object.fromEntries(Object.entries(mats).filter(([, m]) => m?.isMaterial).map(([k, m]) => { const c = m.clone(); for (const slot of ['map', 'normalMap', 'roughnessMap']) c[slot] = toCanvas(m[slot]); return [k, c]; }));
      const exportGroup = buildGroup(compiled, exportMats, {structure: false});
      return new Promise((resolve, reject) => new GLTFExporter().parse(exportGroup, r => { disposeGroup(exportGroup); for (const m of Object.values(exportMats)) m.dispose(); for (const t of conv.values()) t.dispose(); resolve(r); }, reject, {binary: true}));
    },
    texturesReady: () => matsReady,
    dispose() { ro.disconnect(); mats?.dispose(); roomMats?.dispose(); for (const m of itemMats.values()) m.dispose(); disposeGroup(group); composer.dispose(); renderer.dispose(); canvas.remove(); }
  };
}

/** Shared offscreen renderer for proposal cards (flat-colour materials, fast). */
let thumb = null;
export function renderThumbnail(compiled, materials, {width = 360, height = 240} = {}) {
  if (!thumb) {
    const canvas = document.createElement('canvas');
    try { const renderer = makeRenderer(canvas, {alpha: false}); thumb = {canvas, renderer, ...makeStage(renderer), camera: new THREE.PerspectiveCamera(28, 1, 0.05, 60)}; }
    catch { return null; }
    thumb.renderer.shadowMap.type = THREE.PCFShadowMap;
  }
  const {renderer, scene, camera, contact, sun} = thumb;
  renderer.setPixelRatio(1.5); renderer.setSize(width, height, false);
  const mats = materialSet(materials, {detail: false});
  const group = buildGroup(compiled, mats); scene.add(group);
  const b = new THREE.Box3().setFromObject(group), s = b.getSize(new THREE.Vector3());
  contact.scale.set(s.x * 1.25, s.z * 1.45, 1);
  const room = !!compiled.meta?.room, yaw = room ? compiled.meta.cameraYaw : 0.62, e = Math.max(2.5, Math.max(s.x, s.z) * 0.62);
  contact.visible = !room; sun.position.set(room ? Math.sign(yaw) * 2.6 : -1.6, room ? 4.6 : 4.2, room ? 3.4 : 3.2);
  Object.assign(sun.shadow.camera, {left: -e, right: e, top: e, bottom: -e}); sun.shadow.camera.updateProjectionMatrix();
  const aspect = width / height, radius = Math.hypot(s.x, s.y, s.z) * 0.5, fov = camera.fov * Math.PI / 180;
  const dist = radius / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2) * 0.86;
  camera.aspect = aspect; const pt = room ? 0.32 : 0.22; camera.position.set(Math.sin(yaw) * Math.cos(pt) * dist, s.y * 0.45 + Math.sin(pt) * dist, Math.cos(yaw) * Math.cos(pt) * dist);
  camera.lookAt(0, s.y * 0.45, 0); camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const url = thumb.canvas.toDataURL('image/jpeg', 0.86);
  scene.remove(group); disposeGroup(group); mats.dispose();
  return url;
}

/** A finished product as a Three group in metres (for placing studio products inside the home plan, ev.html). */
export function productObject(compiled, materials, {onReady} = {}) {
  const mats = materialSet(materials, {detail: true, onReady}), group = buildGroup(compiled, mats);
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}
