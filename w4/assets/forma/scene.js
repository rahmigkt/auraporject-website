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
import {COLORS, FIBERS, METALS, WOODS, FINISHES, STAINS, STONES, GLASS} from './catalog.js';
import {fabricMaps} from './textile.js';
import {woodMaps} from './wood.js';
import {stoneMaps} from './stone.js';
import {caneMaps} from './cane.js';

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
function materialSet(materials, opts = {}) { return materials.top ? tableMaterialSet(materials, opts) : materials.case ? bedroomMaterialSet(materials, opts) : seatingMaterialSet(materials, opts); }
/** Room shell and room textiles on top of the bedroom set. */
function roomMaterials(set, materials, detail, jobs) {
  if (!materials.wall) return;
  const Wc = COLORS[materials.wall.color] || COLORS.cream;
  set.wall = new THREE.MeshStandardMaterial({color: hexColor(Wc.hex), roughness: 0.92});
  set.wallcut = new THREE.MeshStandardMaterial({color: '#3a3934', roughness: 0.9});
  set.floor = surfaceMaterial({...materials.floor, surface: materials.floor.surface === 'stone' ? 'stone' : 'wood'}, set, detail ? jobs : [], {rotate: false});
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
  const weltSpec = {...f, color: materials.welt.color || f.color2, pattern: 'none'};
  const welt = fabric.clone(); welt.color = hexColor(COLORS[weltSpec.color].hex); welt.sheenColor = welt.color.clone().lerp(new THREE.Color('#fff'), 0.35);
  const wood = woodMaterial(materials.wood);
  const M = METALS[materials.metal.finish];
  const metal = new THREE.MeshPhysicalMaterial({color: hexColor(M.hex), metalness: 1, roughness: M.rough});
  const dark = new THREE.MeshStandardMaterial({color: '#1d1c1a', roughness: 0.8});
  const frame = new THREE.MeshStandardMaterial({color: '#d9c7a4', roughness: 0.85});
  const set = {fabric, welt, wood, metal, dark, frame, textures: []};
  if (detail) Promise.all([makeMaps('fabric', f), makeMaps('fabric', weltSpec, 512), makeMaps('wood', materials.wood)]).then(([a, b, c]) => {
    if (set.disposed) return;
    applyMaps(set, fabric, a, a?.tileMm, a?.tileMm); applyMaps(set, welt, b, b?.tileMm, b?.tileMm);
    if (c) applyMaps(set, wood, c, c.tileMm[0], c.tileMm[1]);
    onReady?.();
  });
  set.dispose = () => { set.disposed = true; for (const m of [fabric, welt, wood, metal, dark, frame]) m.dispose(); for (const t of set.textures) t.dispose(); };
  return set;
}

function woodMaterial(w) {
  const W = WOODS[w.species] || WOODS.oak, Fi = FINISHES[w.finish] || FINISHES.matte, St = STAINS[w.stain];
  const color = hexColor(W.base); if (St?.hex) color.lerp(hexColor(St.hex), St.k);
  return new THREE.MeshPhysicalMaterial({color, roughness: Fi.rough, clearcoat: Fi.clearcoat, clearcoatRoughness: 0.2});
}

/** Surface material for table tops and bases: wood/veneer, stone, glass, lacquer or metal. */
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
  set.top = surfaceMaterial(materials.top, set, quiet, {rotate: true});
  set.base = materials.base.surface === 'same' ? set.top : surfaceMaterial(materials.base, set, quiet);
  const M = METALS[materials.hardware?.metal] || METALS.brass;
  set.metal = materials.base.surface === 'metal' ? set.base : new THREE.MeshPhysicalMaterial({color: hexColor(M.hex), metalness: 1, roughness: M.rough});
  set.dark = new THREE.MeshStandardMaterial({color: '#1d1c1a', roughness: 0.8});
  set.frame = new THREE.MeshStandardMaterial({color: '#d9c7a4', roughness: 0.85});
  set.fabric = set.base; set.wood = set.base; set.welt = set.base;
  if (detail) Promise.all(jobs).then(() => { if (!set.disposed) onReady?.(); });
  set.dispose = () => { set.disposed = true; for (const m of new Set([set.top, set.base, set.metal, set.dark, set.frame])) m.dispose(); for (const t of set.textures) t.dispose(); };
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
  set.mirror = new THREE.MeshPhysicalMaterial({color: '#d3dcdf', metalness: 0.55, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02});
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

function geometryFor(part) {
  const m = buildMesh(part), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(m.uvs, 2));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  return g;
}

/** Group of meshes for a compiled design (units: metres). */
function buildGroup(compiled, mats, {structure = false} = {}) {
  const group = new THREE.Group(); group.scale.setScalar(0.001);
  for (const part of compiled.parts) {
    if (part.internal && !structure) continue;
    if (part.planOnly) continue;
    let mat = mats[part.mat] || mats.fabric;
    if (structure && part.decor) continue;
    if (structure && !part.internal && ['fabric', 'welt', 'top', 'case'].includes(part.mat)) {
      mat = mat.clone(); mat.transparent = true; mat.opacity = 0.16; mat.depthWrite = false; mat.userData.temp = true;
    }
    const mesh = new THREE.Mesh(geometryFor(part), mat);
    mesh.position.set(...part.pos); mesh.rotation.set(...part.rot);
    mesh.castShadow = !part.noShadow && (!structure || part.internal); mesh.receiveShadow = true;
    mesh.userData.part = part.id;
    group.add(mesh);
  }
  return group;
}

function disposeGroup(group) { group?.traverse(o => { o.geometry?.dispose(); if (o.material?.userData?.temp) o.material.dispose(); }); }

function makeRenderer(canvas, {alpha = true} = {}) {
  const r = new THREE.WebGLRenderer({canvas, antialias: true, alpha, preserveDrawingBuffer: true});
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.VSMShadowMap;
  return r;
}

// Background colours are pre-compensated for ACES tone mapping so the page paper tone (#f1eee6) is reproduced.
const PAPER = [1.884, 1.594, 1.132];
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
  const {scene, contact, sun} = makeStage(renderer);
  const persp = new THREE.PerspectiveCamera(30, 1, 0.05, 60), ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 60);
  let userMoved = false, camera = persp, view = 'angle', yaw = 0.62, pitch = 0.2, zoom = 1, group = null, mats = null, compiled = null, materials = null, structure = false, size = [1, 1, 1];
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera), ao = new GTAOPass(scene, camera, 1, 1), smaa = new SMAAPass(), out = new OutputPass();
  ao.blendIntensity = 0.85; ao.updateGtaoMaterial({radius: 0.35, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 16});
  composer.addPass(renderPass); composer.addPass(ao); composer.addPass(smaa); composer.addPass(out);
  let raf = 0;
  const draw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { place(); renderPass.camera = camera; ao.camera = camera; composer.render(); }); };
  function place() {
    const rect = host.getBoundingClientRect(), aspect = Math.max(0.2, rect.width / Math.max(1, rect.height));
    const [W, H, D] = size, target = new THREE.Vector3(0, H * 0.45, 0);
    if (view === 'angle') {
      camera = persp; persp.aspect = aspect;
      const radius = Math.hypot(W, H, D) * 0.5, fov = persp.fov * Math.PI / 180;
      const dist = radius / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2) * (aspect < 1 ? 1.02 : 0.8) / zoom;
      persp.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
      persp.lookAt(target); persp.updateProjectionMatrix();
    } else {
      camera = ortho;
      const spanX = view === 'side' ? D : W, spanY = view === 'top' ? D : H, half = Math.max(spanY * 0.62, spanX * 0.62 / aspect) / zoom;
      Object.assign(ortho, {left: -half * aspect, right: half * aspect, top: half, bottom: -half});
      if (view === 'front') ortho.position.set(0, H / 2, 20); else if (view === 'side') ortho.position.set(20, H / 2, 0); else ortho.position.set(0, 20, 0.0001);
      ortho.lookAt(view === 'top' ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(0, H / 2, 0)); ortho.updateProjectionMatrix();
    }
  }
  const resize = () => { const r = host.getBoundingClientRect(), pr = Math.min(2, window.devicePixelRatio || 1); renderer.setPixelRatio(pr); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false); composer.setPixelRatio(pr); composer.setSize(Math.max(1, r.width), Math.max(1, r.height)); draw(); };
  const ro = new ResizeObserver(resize); ro.observe(host);
  // Orbit with pointer; wheel zoom; arrow keys.
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, yaw, pitch}; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag) return; userMoved = true; view = 'angle'; yaw = drag.yaw - (e.clientX - drag.x) * 0.008; pitch = Math.max(-0.05, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.005)); draw(); onRotate?.(); });
  for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, () => { drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.min(2.5, Math.max(0.6, zoom * (e.deltaY > 0 ? 0.93 : 1.07))); draw(); }, {passive: false});
  canvas.addEventListener('keydown', e => { const k = {ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08]}[e.key]; if (k) { e.preventDefault(); view = 'angle'; yaw += k[0]; pitch = Math.max(-0.05, Math.min(1.2, pitch + k[1])); draw(); } });

  function rebuild() {
    if (!compiled) return;
    if (group) { scene.remove(group); disposeGroup(group); }
    group = buildGroup(compiled, mats, {structure}); scene.add(group);
    const b = new THREE.Box3().setFromObject(group), s = b.getSize(new THREE.Vector3());
    size = [s.x, s.y, s.z]; contact.scale.set(s.x * 1.25, s.z * 1.45, 1);
    // Rooms: light through the open corner, a shadow camera that covers the floor, no contact blob.
    const isRoom = !!compiled.meta?.room, e = Math.max(2.5, Math.max(s.x, s.z) * 0.62);
    contact.visible = !isRoom;
    if (isRoom) sun.position.set(-(compiled.meta.cameraYaw > 0 ? -1 : 1) * 2.6, 4.6, 3.4); else sun.position.set(-1.6, 4.2, 3.2);
    Object.assign(sun.shadow.camera, {left: -e, right: e, top: e, bottom: -e}); sun.shadow.camera.updateProjectionMatrix();
    if (isRoom && !userMoved) { yaw = compiled.meta.cameraYaw; pitch = 0.32; }
    draw();
  }
  return {
    setDesign(next, nextMaterials) {
      const matKey = JSON.stringify(nextMaterials);
      if (!mats || matKey !== JSON.stringify(materials)) { mats?.dispose(); mats = materialSet(nextMaterials, {onReady: () => rebuild()}); materials = structuredClone(nextMaterials); }
      compiled = next; rebuild();
    },
    view(kind) { view = kind; zoom = 1; if (kind === 'angle') { yaw = compiled?.meta?.room ? compiled.meta.cameraYaw : 0.62; pitch = 0.2; userMoved = false; } draw(); },
    zoom(f) { zoom = Math.min(2.5, Math.max(0.6, zoom * f)); draw(); },
    structure(on) { structure = on; rebuild(); },
    /** High-resolution still (longer AO sampling). */
    async photo(scale = 2) {
      const r = host.getBoundingClientRect(), w = Math.round(r.width * scale), h = Math.round(r.height * scale);
      const pr = renderer.getPixelRatio(); renderer.setPixelRatio(1); renderer.setSize(w, h, false); composer.setPixelRatio(1); composer.setSize(w, h);
      ao.updateGtaoMaterial({samples: 32}); place(); renderPass.camera = camera; ao.camera = camera; composer.render();
      const url = canvas.toDataURL('image/jpeg', 0.92);
      ao.updateGtaoMaterial({samples: 16}); renderer.setPixelRatio(pr); resize();
      return url;
    },
    capture() { place(); composer.render(); return canvas; },
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
    texturesReady: () => !!mats?.textures.length,
    dispose() { ro.disconnect(); mats?.dispose(); disposeGroup(group); composer.dispose(); renderer.dispose(); canvas.remove(); }
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
