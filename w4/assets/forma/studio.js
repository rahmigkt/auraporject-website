// AURA Forma design studio: family → style (one starting form) → parts / dimensions / materials → send to the designer.
// No ready-made proposal gallery: people build their own piece. Drawings, parts list and files never leave the
// browser before sending; afterwards the customer can download the PDF of the design they sent.
// Families: seating (sofa, loveseat, armchair), tables (dining, coffee, side, console, desk) and the bedroom set
// (bed, wardrobe, chest, bedside units: one piece is designed, the others are proposed to match and shown as a set).
import {sample, normalizeDesign, SCHEMA} from './generate.js';
import {FAMILIES, familyOf} from './families.js';
import {buildMesh} from './build.js';
import {styleName} from './styles.js';
import {COLORS, FIBERS, WEAVES, WEAVE_NAMES, PATTERNS, MOTIF_CHOICES, MOTIF_NAMES, WOODS, FINISHES, STAINS, METALS, STONES, GLASS, SURFACES, LINEN_COLORS, colorGroup, name as nm} from './catalog.js';
import {MATTRESS} from './bedroom.js';
import {harmonize} from './set.js';
import {draft, fabricMaps} from './textile.js';
import {stoneMaps} from './stone.js';
import {woodMaps} from './wood.js';
import {parse} from './commands.js';
import {startVoice} from './voice.js';
import {aiStatus, interpret, designFromImage} from './ai.js';
import {drawingSheet, drawingDxf} from './drawing.js';
import {bom, bomCsv} from './bom.js';
import {zip, jpegPdf, svgToJpeg, dataUrlJpeg, download} from './package.js';
const designKey = d => JSON.stringify({p: d.params, m: d.materials, k: d.kind, f: d.family});
import {t, partName, UI_LANGS} from './i18n.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const store = {get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }};

const params = new URLSearchParams(location.search);
const browserLang = (navigator.language || 'en').slice(0, 2);
const state = {
  lang: UI_LANGS[params.get('lang')] ? params.get('lang') : UI_LANGS[store.get('aura-forma-lang')] ? store.get('aura-forma-lang') : UI_LANGS[browserLang] ? browserLang : 'tr',
  design: null, compiled: null, history: [], future: [], tab: 'style', sent: null, structure: false, ai: {available: false, vision: false}, avoid: []
};
const L = k => t(k, state.lang);
const N = entry => nm(entry, state.lang);
let viewer = null;

const compileOf = d => familyOf(d).mod.compile({...d.params, kind: d.kind});
const issuesOf = (d, c) => d.family !== 'seating' ? familyOf(d).mod.validate(c, d.materials, buildMesh) : familyOf(d).mod.validate(c);
const isTable = () => state.design.family === 'table';
const isBedroom = () => state.design.family === 'bedroom';
const isBed = () => isBedroom() && state.design.kind === 'bed';
const focus = () => state.design.kind;

// ---- Design state --------------------------------------------------------------
function setDesign(next, {record = true, keepPanel = false, sync = true} = {}) {
  next = normalizeDesign(next);
  // Bedroom set: when the piece in focus changes, the other pieces are re-proposed to match it.
  if (sync && record && next.family === 'bedroom' && state.design?.family === 'bedroom') {
    // Only a change to the focused piece's design language is proposed to the others (sizes stay per piece).
    const LANG = {bed: ['headType', 'headShape', 'bedBase', 'legType'], wardrobe: ['wdDoorStyle', 'wdHandle', 'wdBase'], dresser: ['frontStyle', 'pull', 'drBase'], nightstand: ['frontStyle', 'pull', 'nsBase']}[next.kind] || [];
    if (LANG.some(k => next.params[k] !== state.design.params[k]) || (next.params.setMatch === 'on' && state.design.params.setMatch === 'off')) next = normalizeDesign({...next, params: harmonize(next.params, next.kind)});
  }
  if (record && state.design) { state.history.push(state.design); if (state.history.length > 80) state.history.shift(); state.future = []; }
  const familyChanged = state.design && state.design.family !== next.family;
  state.design = next; state.compiled = compileOf(next);
  viewer?.setDesign(state.compiled, next.materials);
  store.set('aura-forma-design-' + next.family, next); store.set('aura-forma-family', next.family); store.set(`aura-forma-kind-${next.family}-${next.kind}`, next);
  state.drawingCache = null;
  if (familyChanged) shellNav();
  renderCaption();
  if (!keepPanel) renderPanel(); else refreshReadouts();
}
const undo = () => { if (!state.history.length) return; state.future.push(state.design); setDesign(state.history.pop(), {record: false}); };
const redo = () => { if (!state.future.length) return; state.history.push(state.design); setDesign(state.future.pop(), {record: false}); };
/** The customer's own piece of another kind in the same family (e.g. back from the chest to the bed), else a new start in the same style. */
function designForKind(d, kind) {
  const prev = store.get(`aura-forma-kind-${d.family}-${kind}`);
  if (prev?.schema === SCHEMA && prev.family === d.family) return structuredClone(prev);
  return sample({family: d.family, style: d.style, kind, seed: d.seed, locks: {materials: d.materials}});
}
const withParams = patch => ({...state.design, params: {...state.design.params, ...patch}});
const withMaterial = (slot, patch) => ({...state.design, materials: {...state.design.materials, [slot]: {...state.design.materials[slot], ...patch}}});

// ---- Family-specific presentation ------------------------------------------------------
const UI = {
  seating: {
    brand: 'VEREV', kinds: ['sofa', 'loveseat', 'armchair'],
    styleSub: s => Object.keys(s.enums.armType).slice(0, 2).map(a => partName('armType', a, state.lang)).join(' · '),
    card: d => [`${partName('armType', d.params.armType, state.lang)} · ${partName('backType', d.params.backType, state.lang)} · ${partName('baseType', d.params.baseType, state.lang)}`, `${d.params.width} × ${d.params.depth} · ${N(COLORS[d.materials.fabric.color])} ${N(FIBERS[d.materials.fabric.fiber]).toLowerCase()}${d.materials.fabric.pattern !== 'none' ? ' · ' + N(PATTERNS[d.materials.fabric.pattern]).toLowerCase() : ''}`],
    dims: c => `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm · ${L('seatHeightL')} ${c.params.seatHeight} mm`,
    readout: m => [[L('seatDepth'), `${m.seatDepth} mm`], [L('innerWidth'), `${m.innerWidth} mm`], [L('seatWidth'), `${m.seatWidthEach} mm`]]
  },
  table: {
    brand: 'MASİF', kinds: ['dining', 'coffee', 'side', 'console', 'desk'],
    styleSub: s => Object.keys(s.enums.baseType).slice(0, 2).map(a => partName('tBaseType', a, state.lang)).join(' · '),
    card: d => [`${partName('topShape', d.params.topShape, state.lang)} · ${partName('tBaseType', d.params.baseType, state.lang)}`, `${d.params.length} × ${d.params.width} · ${surfaceShort(d.materials.top)}`],
    dims: c => `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm${c.meta.seats ? ` · ${c.meta.seats} ${L('persons')}` : ''}${c.meta.extendedLength ? ` · ↔ ${c.meta.extendedLength} mm` : ''}`,
    readout: m => [[L('knee'), `${m.knee} mm`], ...(m.seats ? [[L('persons'), String(m.seats)]] : []), [L('weight'), `~${weightOf()} kg`]]
  },
  bedroom: {
    brand: 'SÜKUN', kinds: ['bed', 'wardrobe', 'dresser', 'nightstand'],
    styleSub: s => Object.keys(s.enums.headType).slice(0, 2).map(a => partName('headType', a, state.lang)).join(' · '),
    dims: c => c.meta.set ? `${L('setOf')} · ${L('mattress')} ${c.meta.mattress} · ${L('wardrobe')} ${c.meta.pieces.wardrobe[0]} mm · ${c.meta.wardrobeDoors} ${L('doorsN')}` : `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm`,
    readout: m => [[L('mattressTop'), `${m.mattressTop} mm`], [L('headAbove'), `${m.headAbove} mm`], [L('nightstand'), `${m.nsHeight} mm`], [L('weight'), `~${weightOf()} kg`]]
  }
};
const ui = () => UI[state.design.family];
function surfaceShort(s) {
  if (s.surface === 'stone') return N(STONES[s.stone]); if (s.surface === 'glass') return N(GLASS[s.glass]);
  if (s.surface === 'lacquer') return `${N(SURFACES.lacquer)} · ${N(COLORS[s.color])}`;
  return `${N(WOODS[s.species])}${s.stain !== 'natural' ? ' · ' + N(STAINS[s.stain]) : ''}`;
}
function weightOf() { try { return bomOf().totals.weightKg; } catch { return '—'; } }
const bomOf = () => deliverables().bom;

// ---- Layout --------------------------------------------------------------------------
function shell() {
  document.documentElement.lang = state.lang;
  document.title = `AURA · ${L('title')}`;
  $('#app').innerHTML = `
  <header class="f-header">
    <a class="f-brand" href="index.html?lang=${state.lang}">AURA<small>PROJECT / STUDIO</small></a>
    <nav class="f-families" id="families" aria-label="${esc(L('title'))}"></nav>
    <label class="f-lang"><span class="sr">Language</span><select id="lang">${Object.entries(UI_LANGS).map(([k, v]) => `<option value="${k}" ${k === state.lang ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  </header>
  <main class="f-layout">
    <section class="f-visual" aria-label="3D">
      <div class="f-caption"><div><p class="f-eyebrow" id="eyebrow"></p><h1 id="designTitle"></h1><p class="f-dims" id="dims"></p></div><p class="f-status" id="status"></p></div>
      <div class="f-stage" id="stage" aria-label="${esc(L('perspective'))}"></div>
      <div class="f-toolbar" role="toolbar">
        <button data-view="angle" aria-pressed="true">${L('perspective')}</button><button data-view="front">${L('front')}</button><button data-view="side">${L('side')}</button><button data-view="top">${L('top')}</button>
        <button id="structureBtn" aria-pressed="false">${L('structure')}</button><button id="photoBtn">${L('photo')} ↓</button>
        <button data-zoom="1.12" aria-label="+">+</button><button data-zoom="0.9" aria-label="−">−</button>
        <button id="undoBtn">↶ ${L('undo')}</button><button id="redoBtn">↷ ${L('redo')}</button>
      </div>
      <form class="f-command" id="commandForm" autocomplete="off">
        <input id="command" type="text" maxlength="300" placeholder="${esc(L('commandPh'))}" aria-label="${esc(L('commandPh'))}">
        <button type="button" id="micBtn" class="f-mic" aria-label="${esc(L('listen'))}" title="${esc(L('listen'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2Z"/></svg></button>
        <button type="submit" class="f-primary">↵</button>
      </form>
      <p class="f-feedback" id="feedback" role="status" aria-live="polite"></p>
      <p class="f-hint">${L('rotateHint')} ${L('concept')}</p>
    </section>
    <aside class="f-editor">
      <nav class="f-tabs" role="tablist">${['style', 'parts', 'size', 'material', 'deliver'].map((k, i) => `<button role="tab" data-tab="${k}" aria-selected="${state.tab === k}"><span>${String(i + 1).padStart(2, '0')}</span>${L('tab' + k[0].toUpperCase() + k.slice(1))}</button>`).join('')}</nav>
      <div id="panel" class="f-panel"></div>
    </aside>
  </main>`;
  viewer?.dispose(); viewer = null;
  const host = $('#stage');
  import('./scene.js?v=20261017f').then(({createViewer}) => {
    viewer = createViewer(host);
    if (!viewer) host.innerHTML = `<p class="f-nogl">WebGL ${state.lang === 'tr' ? 'kullanılamıyor; teknik çizimler Teslim sekmesinde.' : 'is unavailable; technical drawings are in the Hand-off tab.'}</p>`;
    else viewer.setDesign(state.compiled, state.design.materials);
  }).catch(() => { host.innerHTML = '<p class="f-nogl">WebGL</p>'; });
  bindShell(); shellNav();
  renderCaption(); renderPanel();
}
function shellNav() {
  $('#families').innerHTML = [['seating', 'famSeating'], ['table', 'famTable'], ['bedroom', 'famBedroom']].map(([f, k]) => `<button data-family="${f}" aria-pressed="${state.design.family === f}">${esc(L(k))}</button>`).join('');
}

function renderCaption() {
  const d = state.design, c = state.compiled, issues = issuesOf(d, c);
  $('#eyebrow').textContent = `AURA · ${ui().brand} · ${styleName(d.style, state.lang).toUpperCase()}`;
  $('#designTitle').textContent = d.family === 'bedroom' ? `${L('bedroomSet')} · F-${String(d.seed % 100000).padStart(5, '0')}` : `${L(d.family === 'table' ? d.kind : c.meta.kind)} · F-${String(d.seed % 100000).padStart(5, '0')}`;
  $('#dims').textContent = ui().dims(c);
  const err = issues.filter(i => i.level === 'error'), warn = issues.filter(i => i.level === 'warn');
  const st = $('#status');
  st.dataset.level = err.length ? 'error' : warn.length ? 'warn' : 'ok';
  st.textContent = err.length || warn.length ? [...err, ...warn].map(i => L('issues.' + i.code)).join(' · ') : L('ok');
  $('#undoBtn').disabled = !state.history.length; $('#redoBtn').disabled = !state.future.length;
}
function feedback(text, level = 'info') { const f = $('#feedback'); f.textContent = text; f.dataset.level = level; }

// ---- Panels ---------------------------------------------------------------------------
function renderPanel() {
  for (const b of document.querySelectorAll('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === state.tab));
  $('#panel').innerHTML = {style: stylePanel, parts: partsPanel, size: sizePanel, material: materialPanel, deliver: deliverPanel}[state.tab]();
  if (state.tab === 'material') drawMaterialPreviews();
  if (state.tab === 'deliver') drawDeliverables();
}
const chip = (attrs, label, on, extra = '') => `<button class="f-chip" ${attrs} aria-pressed="${on}" ${extra}>${esc(label)}</button>`;

function stylePanel() {
  const d = state.design, fam = familyOf(d);
  return `<h2>${L('chooseStyle')}</h2><p class="f-lead">${L('styleHint')}</p>
  <h3>${L('kind')}</h3><div class="f-seg">${ui().kinds.map(k => chip(`data-kind="${k}"`, L(k), d.kind === k)).join('')}</div>
  <div class="f-styles">${fam.styles.map(s => `<button class="f-style" data-style="${s.id}" aria-pressed="${d.style === s.id}" ${state.avoid.includes(s.id) ? 'data-avoid="1"' : ''}><b>${esc(styleName(s.id, state.lang))}</b><small>${esc(ui().styleSub(s))}</small></button>`).join('')}</div>
  <div class="f-actions"><button class="f-primary" id="generateBtn">${L('generate')} →</button>
  ${d.family === 'seating' ? `<label class="f-secondary" id="imageLabel">${L('fromImage')} ↑<input id="imageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label>` : ''}</div>
  ${d.family === 'seating' ? `<p class="f-note">${L('imageHint')}${state.ai.vision ? '' : ' ' + L('aiOff')}</p>` : ''}`;
}

function enumGroup(key, labelKey, ns = key, options = familyOf(state.design).mod.ENUMS[key]) {
  return `<h3>${L(labelKey)}</h3><div class="f-chips">${options.map(v => chip(`data-enum="${key}" data-value="${v}"`, partName(ns, v, state.lang), state.design.params[key] === v)).join('')}</div>`;
}
const counter = (key, label, values) => `<h3>${L(label)}</h3><div class="f-seg">${values.map(n => chip(`data-count="${key}" data-value="${n}"`, String(n), state.design.params[key] === n)).join('')}</div>`;

function partsPanel() {
  const p = state.design.params;
  if (isBedroom()) return bedroomPartsPanel(p);
  if (!isTable()) {
    const legs = ['legs', 'frame'].includes(p.baseType);
    return `<h2>${L('tabParts')}</h2>${enumGroup('armType', 'arm')}${enumGroup('backType', 'back')}${enumGroup('seatType', 'seat')}${counter('seatCount', 'seats', [1, 2, 3, 4])}
    ${enumGroup('cushionEdge', 'cushionEdge')}${enumGroup('baseType', 'base')}${legs ? enumGroup('legType', 'legType') : ''}${enumGroup('welt', 'welt')}${counter('pillows', 'pillows', [0, 1, 2, 3, 4])}`;
  }
  const k = state.design.kind, legBases = ['legsApron', 'legsOnly', 'trestle', 'tripod'].includes(p.baseType);
  return `<h2>${L('tabParts')}</h2>${enumGroup('topShape', 'topShape')}${enumGroup('edge', 'edge')}${enumGroup('baseType', 'baseType', 'tBaseType')}
  ${legBases ? enumGroup('legType', 'legType', 'legTypeT') : ''}${['pedestal', 'doublePedestal'].includes(p.baseType) ? enumGroup('pedestalType', 'pedestalType') : ''}
  ${['legsApron', 'legsOnly'].includes(p.baseType) ? enumGroup('stretcher', 'stretcher') : ''}
  ${['coffee', 'side', 'console'].includes(k) && !['pedestal', 'doublePedestal', 'tripod', 'drum'].includes(p.baseType) ? enumGroup('shelf', 'shelf') : ''}
  ${['console', 'desk', 'side', 'coffee'].includes(k) && p.baseType === 'legsApron' ? counter('drawers', 'drawers', [0, 1, 2, 3, 4]) + (p.drawers ? enumGroup('drawerPull', 'drawerPull') : '') : ''}
  ${k === 'desk' ? enumGroup('backPanel', 'backPanel', 'stretcher', ['none', 'panel']).replace(/>panel</, `>${esc(L('backPanel'))}<`) : ''}
  ${k === 'dining' && !['round', 'boat'].includes(p.topShape) && !['pedestal', 'drum', 'tripod'].includes(p.baseType) ? counter('leaves', 'leaves', [0, 1, 2]) + (p.leaves ? `<div class="f-actions"><button class="f-secondary" data-enum="extended" data-value="${p.extended === 'open' ? 'closed' : 'open'}" aria-pressed="${p.extended === 'open'}">↔ ${L('showOpen')}</button></div>` : '') : ''}`;
}

function bedroomPartsPanel(p) {
  const B = familyOf(state.design).mod.ENUMS, k = focus(), LEG = ['round', 'roundTaper', 'squareTaper', 'square', 'cone', 'block'];
  // Header: which piece is being designed, set or single view, and whether the others follow.
  const head = `<h2>${L('tabParts')}</h2>
  <h3>${L('designPiece')}</h3><div class="f-seg">${UI.bedroom.kinds.map(x => chip(`data-kind="${x}"`, L(x), k === x)).join('')}</div>
  <div class="f-seg f-seg-small">${chip('data-enum="view" data-value="set"', L('showSet'), p.view === 'set')}${chip('data-enum="view" data-value="piece"', L('showPiece'), p.view === 'piece')}${chip(`data-enum="setMatch" data-value="${p.setMatch === 'on' ? 'off' : 'on'}"`, L('setMatch'), p.setMatch === 'on')}</div>
  <p class="f-note">${L(p.setMatch === 'on' ? 'setMatchOn' : 'setMatchOff')}</p>`;
  if (k === 'bed') {
    const size = `${p.mattressWidth / 10}x${p.mattressLength / 10}`;
    return `${head}<h3>${L('mattress')}</h3><div class="f-chips">${Object.keys(MATTRESS).map(m => chip(`data-mattress="${m}"`, m.replace('x', ' × '), size === m)).join('')}</div>
    ${enumGroup('headType', 'headboard')}${enumGroup('headShape', 'headShape')}${enumGroup('bedBase', 'bedBase')}
    ${p.bedBase === 'floating' ? '' : enumGroup('legType', 'legType', 'bLegType', B.legType.filter(v => !['frame', 'fourPoster'].includes(p.bedBase) || v !== 'hidden'))}
    ${enumGroup('footboard', 'footboard')}${enumGroup('storage', 'storage', 'storage', p.bedBase === 'baza' ? ['none', 'lift'] : ['frame', 'fourPoster', 'floating'].includes(p.bedBase) ? ['none', 'drawers'] : B.storage)}
    ${enumGroup('bedding', 'bedding')}`;
  }
  if (k === 'wardrobe') return `${head}${enumGroup('wdDoorType', 'wdDoorType')}${enumGroup('wdDoorStyle', 'wdDoorStyle')}${enumGroup('wdHandle', 'wdHandle')}
    ${enumGroup('wdNiche', 'wdNiche')}${enumGroup('wdBase', 'wdBase')}${p.wdBase === 'legs' ? enumGroup('legType', 'legType', 'bLegType', LEG) : ''}${enumGroup('caseEdge', 'caseEdge')}`;
  const pre = k === 'nightstand' ? 'ns' : 'dr', base = p[pre + 'Base'], layout = p[pre + 'Layout'];
  return `${head}${enumGroup(pre + 'Layout', 'caseLayout', 'caseLayout', B[pre + 'Layout'])}
  ${counter(pre + 'Rows', 'rows', k === 'nightstand' ? [1, 2, 3] : [2, 3, 4, 5, 6])}
  ${k === 'dresser' && ['split', 'topSplit'].includes(layout) ? counter('drColumns', 'columns', [2, 3]) : ''}
  ${enumGroup('frontStyle', 'frontStyle')}${enumGroup('pull', 'pull')}
  ${enumGroup(pre + 'Base', 'caseBase', 'caseBase', B[pre + 'Base'])}
  ${base === 'legs' ? enumGroup('legType', 'legType', 'bLegType', LEG) : ''}
  ${enumGroup('caseEdge', 'caseEdge')}${k === 'dresser' ? enumGroup('mirror', 'mirror') : ''}
  ${k === 'nightstand' ? `<p class="f-note">${L('setNote')}</p>` : ''}`;
}

const UNIT = {armTop: '', armFlare: '', armSlope: '', legTaper: '', backRake: '°', channelCount: '', seatCount: '', shapeN: '', boatBow: '', footSpread: '', legSplay: '°', scallops: '', graduation: '', mirrorWidth: ''};
function sizeGroups() {
  const d = state.design, p = d.params;
  if (isBedroom()) {
    const k = focus();
    if (k === 'bed') {
      const h = p.headType, g = [['general', ['mattressThickness', 'railHeight', 'legHeight', ...(['platform', 'floating'].includes(p.bedBase) ? ['border'] : [])]]];
      g.push(['headboard', ['headHeight', 'headThickness', 'headExtend', ...(['rounded', 'arch', 'capsule'].includes(p.headShape) ? ['headRadius'] : []), ...(p.headShape === 'scallop' ? ['scallops'] : []), ...(['channel', 'hChannel'].includes(h) ? ['channelCount'] : []), ...(h === 'tufted' ? ['tuftSpacing'] : []), ...(h === 'slats' ? ['slatWidth', 'slatGap'] : []), ...(h === 'wingback' ? ['wingDepth'] : []), ...(['framed', 'cane'].includes(h) ? ['frameWidth'] : [])]]);
      if (p.footboard !== 'none') g.push(['footboard', ['footHeight']]);
      g.push(['base', [...(p.legType === 'hidden' || p.bedBase === 'floating' ? ['plinthInset'] : ['legSize']), ...(['roundTaper', 'squareTaper', 'cone'].includes(p.legType) ? ['legTaper'] : []), ...(p.bedBase === 'fourPoster' ? ['postSize', 'postHeight'] : [])]]);
      return g;
    }
    if (k === 'wardrobe') return [['general', ['wdWidth', 'wdHeight', 'wdDepth', ...(p.wdNiche !== 'none' ? ['wdNicheWidth'] : [])]], ['base', ['topOverhang', ...(p.wdDoorStyle === 'slats' ? ['battenWidth', 'battenGap'] : []), ...(p.wdDoorStyle === 'fluted' ? ['fluteWidth'] : []), ...(p.wdBase === 'legs' ? ['caseBaseHeight'] : [])]]];
    if (k === 'nightstand') return [['general', ['nsWidth', 'nsDepth', 'nsHeightOffset']], ['base', ['topThickness', 'topOverhang', 'cornerRadius', 'graduation', ...(p.nsBase === 'legs' ? ['caseBaseHeight'] : []), ...(p.frontStyle === 'fluted' ? ['fluteWidth'] : [])]]];
    const g = [['general', ['drWidth', 'drDepth', 'drHeight']], ['base', ['topThickness', 'topOverhang', 'cornerRadius', 'graduation', ...(p.drBase === 'legs' ? ['caseBaseHeight'] : []), ...(p.frontStyle === 'fluted' ? ['fluteWidth'] : [])]]];
    if (p.mirror !== 'none') g.push(['mirror', ['mirrorHeight', 'mirrorWidth']]);
    return g;
  }
  if (!isTable()) {
    const g = [['general', ['width', 'depth', 'height', 'seatHeight']]];
    if (p.armType !== 'none') g.push(['arm', ['armHeight', 'armWidth', ...(p.armType === 'wood' ? [] : ['armTop', 'armFlare', 'armSlope']), 'armSet']]);
    g.push(['back', ['backRake', 'backThickness', ...(p.backType === 'camel' ? ['camel'] : []), ...(p.backType === 'channel' ? ['channelCount'] : []), ...(p.backType === 'tufted' ? ['tuftSpacing'] : [])]]);
    g.push(['cushions', ['cushionThickness', 'cushionCrown']]);
    g.push(['base', ['legHeight', ...(['legs', 'frame', 'sled'].includes(p.baseType) ? ['legSize'] : []), ...(['legs', 'frame'].includes(p.baseType) ? ['legTaper', 'legSplay', 'legInset'] : [])]]);
    return g;
  }
  const bt = p.baseType, g = [['general', ['length', ...(p.topShape === 'round' ? [] : ['width']), 'height'].filter(Boolean)]];
  g.push(['topShape', ['topThickness', ...(['rounded', 'boat'].includes(p.topShape) ? ['cornerRadius'] : []), ...(p.topShape === 'superellipse' ? ['shapeN'] : []), ...(p.topShape === 'boat' ? ['boatBow'] : []), 'edgeSize', 'overhang', 'sideOverhang']]);
  const base = [];
  if (['legsApron', 'legsOnly', 'trestle', 'tripod'].includes(bt)) base.push('legSize', 'legTaper', 'legSplay');
  if (bt === 'legsApron') base.push('apronHeight', 'apronThickness', 'apronSetback');
  if (p.stretcher !== 'none' || bt === 'trestle') base.push('stretcherHeight');
  if (['pedestal', 'doublePedestal'].includes(bt)) base.push('columnSize', 'footSpread');
  if (bt === 'slabEnds') base.push('panelThickness');
  if (['sled', 'xBase', 'hairpin'].includes(bt)) base.push('tubeSize');
  if (p.shelf !== 'none') base.push('shelfHeight', 'shelfThickness');
  if (p.leaves) base.push('leafLength');
  g.push(['baseType', base]);
  return g;
}
function sizePanel() {
  const fam = familyOf(state.design), p = state.design.params;
  return `<h2>${L('tabSize')}</h2>${sizeGroups().map(([g, keys]) => keys.length ? `<h3>${L(g)}</h3>${keys.map(k => { const [lo, hi, step] = fam.mod.RANGES[k], u = UNIT[k] ?? 'mm'; return `<div class="f-slider"><label for="r-${k}">${esc(partName('params', k, state.lang))}</label><input type="range" id="r-${k}" data-param="${k}" min="${lo}" max="${hi}" step="${step}" value="${p[k]}"><span class="f-num"><input type="number" data-num="${k}" min="${lo}" max="${hi}" step="${step}" value="${p[k]}" aria-label="${esc(partName('params', k, state.lang))}">${u}</span></div>`; }).join('')}` : '').join('')}
  <h3>${L('derived')}</h3><dl class="f-readout" id="readout">${readout()}</dl>`;
}
const readout = () => ui().readout(state.compiled.meta).map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('');
function refreshReadouts() { const r = $('#readout'); if (r) r.innerHTML = readout(); for (const i of document.querySelectorAll('[data-num]')) if (document.activeElement !== i) i.value = state.design.params[i.dataset.num]; }

function swatches(attr, current, {includeNone = false, groups = true} = {}) {
  const sw = keys => keys.map(k => `<button class="f-swatch" ${attr}="${k}" style="--c:${COLORS[k].hex}" aria-pressed="${current === k}" title="${esc(N(COLORS[k]))}"><span class="sr">${esc(N(COLORS[k]))}</span></button>`).join('');
  const market = Object.keys(COLORS).filter(k => colorGroup(k) === 'market'), heritage = Object.keys(COLORS).filter(k => colorGroup(k) !== 'market');
  return `${includeNone ? `<div class="f-swatches"><button class="f-swatch f-swatch-none" ${attr}="" aria-pressed="${!current}" title="${esc(L('sameAsFabric'))}">∅</button></div>` : ''}
  ${groups ? `<p class="f-sub">${L('marketColors')}</p>` : ''}<div class="f-swatches">${sw(market)}</div>${groups ? `<p class="f-sub">${L('heritageColors')}</p><div class="f-swatches">${sw(heritage)}</div>` : ''}`;
}
const woodChips = (slot, w) => `<div class="f-chips">${Object.keys(WOODS).map(k => `<button class="f-chip f-wood" data-mat="${slot}.species" data-value="${k}" aria-pressed="${w.species === k}" style="--c:${WOODS[k].base}">${esc(N(WOODS[k]))}</button>`).join('')}</div>`;
const stainChips = (slot, w) => `<div class="f-chips">${Object.keys(STAINS).map(k => `<button class="f-chip f-wood" data-mat="${slot}.stain" data-value="${k}" aria-pressed="${w.stain === k}" style="--c:${STAINS[k].hex || WOODS[w.species]?.base || '#d9b48f'}">${esc(N(STAINS[k]))}</button>`).join('')}</div>`;
const finishChips = (slot, w) => `<div class="f-chips">${Object.keys(FINISHES).map(k => chip(`data-mat="${slot}.finish" data-value="${k}"`, N(FINISHES[k]), w.finish === k)).join('')}</div>`;
const metalChips = (attr, cur) => `<div class="f-chips">${Object.keys(METALS).map(k => `<button class="f-chip f-wood" ${attr} data-value="${k}" aria-pressed="${cur === k}" style="--c:${METALS[k].hex}">${esc(N(METALS[k]))}</button>`).join('')}</div>`;

function materialPanel() { return isTable() ? tableMaterialPanel() : isBedroom() ? bedroomMaterialPanel() : seatingMaterialPanel(); }

function fabricSection(f) {
  const F = FIBERS[f.fiber], canPattern = f.fiber !== 'leather', motifs = MOTIF_CHOICES[f.pattern];
  return `<h3>1 · ${L('fiber')}</h3><div class="f-chips">${Object.keys(FIBERS).map(k => chip(`data-mat="fabric.fiber" data-value="${k}"`, N(FIBERS[k]), f.fiber === k)).join('')}</div>
  ${F.weave ? `<h3>${L('weave')}</h3><div class="f-weaves">${Object.keys(WEAVES).map(k => `<button class="f-weave" data-mat="fabric.weave" data-value="${k}" aria-pressed="${f.weave === k}"><canvas data-draft="${k}" width="64" height="64"></canvas><span>${esc(N(WEAVE_NAMES[k]))}</span></button>`).join('')}</div><p class="f-note">${L('weaveNote')}</p>` : ''}
  <h3>2 · ${L('color')}</h3>${swatches('data-color="fabric.color" data-value', f.color)}
  ${canPattern ? `<h3>3 · ${L('pattern')}</h3><div class="f-chips">${Object.keys(PATTERNS).map(k => chip(`data-mat="fabric.pattern" data-value="${k}"`, N(PATTERNS[k]), f.pattern === k)).join('')}</div>` : ''}
  ${motifs ? `<h3>${L('motif')}</h3><div class="f-chips">${motifs.map(k => chip(`data-mat="fabric.motif" data-value="${k}"`, N(MOTIF_NAMES[k]), f.motif === k)).join('')}</div>` : ''}
  ${canPattern && f.pattern !== 'none' ? `<h3>4 · ${L('density')}</h3><div class="f-slider"><label for="r-density">${L('sparse')} ↔ ${L('dense')}</label><input type="range" id="r-density" data-fabric-density min="1" max="6" step="1" value="${f.density}"><span class="f-num">${f.density} / 6</span></div>
  <h3>${L('color2')}</h3>${swatches('data-color="fabric.color2" data-value', f.color2)}` : ''}`;
}
const fabricPreview = (f, label) => `<div class="f-fabric-preview"><canvas id="fabricPreview" width="320" height="320" aria-label="${esc(label)}"></canvas><div><p class="f-eyebrow">${esc(label)}</p><p class="f-fabric-name">${esc(N(FIBERS[f.fiber]))}${FIBERS[f.fiber].weave ? ' · ' + esc(N(WEAVE_NAMES[f.weave])) : ''}<br>${esc(N(COLORS[f.color]))}${f.pattern !== 'none' ? ' · ' + esc(N(PATTERNS[f.pattern])) + (f.motif ? ' (' + esc(N(MOTIF_NAMES[f.motif])) + ')' : '') : ''}</p><p class="f-note" id="tileNote"></p></div></div>`;

function bedroomMaterialPanel() {
  const d = state.design, m = d.materials, p = d.params, bed = true; // the set always includes the bed
  const upholstered = bed && (['upholstered', 'channel', 'hChannel', 'tufted', 'panels', 'framed', 'wingback', 'split'].includes(p.headType) || ['baza', 'upholsteredFrame'].includes(p.bedBase));
  const woodVisible = true;
  return `<h2>${L('tabMaterial')}</h2>
  <div class="f-fabric-preview"><canvas id="surfacePreview" width="320" height="320" aria-label="${esc(L('caseMat'))}"></canvas><div><p class="f-eyebrow">${L('caseMat')}</p><p class="f-fabric-name">${esc(surfaceShort(m.case))}</p></div></div>
  <h3>${L('caseMat')}</h3><div class="f-chips">${['wood', 'veneer', 'lacquer'].map(k => chip(`data-mat="case.surface" data-value="${k}"`, N(SURFACES[k]), m.case.surface === k)).join('')}</div>
  ${surfaceOptions('case', m.case)}
  ${upholstered ? `<h2 class="f-h2-sub">${L('upholstery')}</h2>${fabricPreview(m.fabric, L('upholstery'))}${fabricSection(m.fabric)}` : ''}
  ${woodVisible ? `<h3>${L('solidWood')}</h3>${woodChips('wood', m.wood)}<h3>${L('stain')}</h3>${stainChips('wood', m.wood)}<h3>${L('finish')}</h3>${finishChips('wood', m.wood)}` : ''}
  <h3>${L('metal')}</h3>${metalChips('data-mat="metal.finish"', m.metal.finish)}
  ${bed && p.bedding === 'made' ? `<h3>${L('linen')}</h3><div class="f-swatches">${LINEN_COLORS.map(k => `<button class="f-swatch" data-color="linen.color" data-value="${k}" style="--c:${COLORS[k].hex}" aria-pressed="${m.linen.color === k}" title="${esc(N(COLORS[k]))}"><span class="sr">${esc(N(COLORS[k]))}</span></button>`).join('')}</div>` : ''}`;
}

function seatingMaterialPanel() {
  const m = state.design.materials, f = m.fabric, F = FIBERS[f.fiber], canPattern = f.fiber !== 'leather';
  const motifs = MOTIF_CHOICES[f.pattern];
  return `<h2>${L('tabMaterial')}</h2>
  <div class="f-fabric-preview"><canvas id="fabricPreview" width="320" height="320" aria-label="${esc(L('fabric'))}"></canvas><div><p class="f-eyebrow">${L('fabric')}</p><p class="f-fabric-name">${esc(N(F))}${F.weave ? ' · ' + esc(N(WEAVE_NAMES[f.weave])) : ''}<br>${esc(N(COLORS[f.color]))}${f.pattern !== 'none' ? ' · ' + esc(N(PATTERNS[f.pattern])) + (f.motif ? ' (' + esc(N(MOTIF_NAMES[f.motif])) + ')' : '') : ''}</p><p class="f-note" id="tileNote"></p></div></div>
  <h3>1 · ${L('fiber')}</h3><div class="f-chips">${Object.keys(FIBERS).map(k => chip(`data-mat="fabric.fiber" data-value="${k}"`, N(FIBERS[k]), f.fiber === k)).join('')}</div>
  ${F.weave ? `<h3>${L('weave')}</h3><div class="f-weaves">${Object.keys(WEAVES).map(k => `<button class="f-weave" data-mat="fabric.weave" data-value="${k}" aria-pressed="${f.weave === k}"><canvas data-draft="${k}" width="64" height="64"></canvas><span>${esc(N(WEAVE_NAMES[k]))}</span></button>`).join('')}</div><p class="f-note">${L('weaveNote')}</p>` : ''}
  <h3>2 · ${L('color')}</h3>${swatches('data-color="fabric.color" data-value', f.color)}
  ${canPattern ? `<h3>3 · ${L('pattern')}</h3><div class="f-chips">${Object.keys(PATTERNS).map(k => chip(`data-mat="fabric.pattern" data-value="${k}"`, N(PATTERNS[k]), f.pattern === k)).join('')}</div>` : ''}
  ${motifs ? `<h3>${L('motif')}</h3><div class="f-chips">${motifs.map(k => chip(`data-mat="fabric.motif" data-value="${k}"`, N(MOTIF_NAMES[k]), f.motif === k)).join('')}</div>` : ''}
  ${canPattern && f.pattern !== 'none' ? `<h3>4 · ${L('density')}</h3><div class="f-slider"><label for="r-density">${L('sparse')} ↔ ${L('dense')}</label><input type="range" id="r-density" data-fabric-density min="1" max="6" step="1" value="${f.density}"><span class="f-num">${f.density} / 6</span></div>
  <h3>${L('color2')}</h3>${swatches('data-color="fabric.color2" data-value', f.color2)}` : ''}
  ${state.design.params.welt !== 'none' || state.design.params.pillows ? `<h3>${L('weltColor')}</h3>${swatches('data-color="welt.color" data-value', m.welt.color, {includeNone: true, groups: false})}` : ''}
  <h3>${L('wood')} · ${esc(N(WOODS[m.wood.species]))}</h3><p class="f-note">${L('woodNote')}</p>
  <h3>${L('stain')}</h3>${stainChips('wood', m.wood)}
  <h3>${L('finish')}</h3>${finishChips('wood', m.wood)}
  <h3>${L('metal')}</h3>${metalChips('data-mat="metal.finish"', m.metal.finish)}`;
}

function surfaceOptions(slot, s, base = false) {
  if (s.surface === 'wood' || s.surface === 'veneer') return `<h3>${L('wood')}</h3>${woodChips(slot, s)}<h3>${L('stain')}</h3>${stainChips(slot, s)}<h3>${L('finish')}</h3>${finishChips(slot, s)}`;
  if (s.surface === 'stone') return `<h3>${L('stone')}</h3><div class="f-chips">${Object.keys(STONES).map(k => `<button class="f-chip f-wood" data-mat="${slot}.stone" data-value="${k}" aria-pressed="${s.stone === k}" style="--c:${STONES[k].base}">${esc(N(STONES[k]))}</button>`).join('')}</div><h3>${L('polish')}</h3><div class="f-chips">${['honed', 'polished'].map(k => chip(`data-mat="${slot}.polish" data-value="${k}"`, L(k), s.polish === k)).join('')}</div>`;
  if (s.surface === 'glass') return `<h3>${L('glass')}</h3><div class="f-chips">${Object.keys(GLASS).map(k => `<button class="f-chip f-wood" data-mat="${slot}.glass" data-value="${k}" aria-pressed="${s.glass === k}" style="--c:${GLASS[k].hex}">${esc(N(GLASS[k]))}</button>`).join('')}</div>`;
  if (s.surface === 'metal') return `<h3>${L('metal')}</h3>${metalChips(`data-mat="${slot}.metal"`, s.metal)}`;
  if (s.surface === 'lacquer') return `<h3>${L('lacquerColor')}</h3>${swatches(`data-color="${slot}.color" data-value`, s.color, {groups: false})}<h3>${L('finish')}</h3><div class="f-chips">${['matte', 'lacquer'].map(k => chip(`data-mat="${slot}.finish" data-value="${k}"`, N(FINISHES[k]), s.finish === k)).join('')}</div>`;
  return '';
}
function tableMaterialPanel() {
  const m = state.design.materials;
  const topKinds = ['wood', 'veneer', 'stone', 'glass', 'lacquer'], baseKinds = ['wood', 'metal', 'lacquer'];
  return `<h2>${L('tabMaterial')}</h2>
  <div class="f-fabric-preview"><canvas id="surfacePreview" width="320" height="320" aria-label="${esc(L('topMat'))}"></canvas><div><p class="f-eyebrow">${L('topMat')}</p><p class="f-fabric-name">${esc(surfaceShort(m.top))}</p><p class="f-note">${esc(L('baseMat'))}: ${esc(m.base.surface === 'metal' ? N(METALS[m.base.metal]) : surfaceShort(m.base))}</p></div></div>
  <h3>${L('topMat')}</h3><div class="f-chips">${topKinds.map(k => chip(`data-mat="top.surface" data-value="${k}"`, N(SURFACES[k]), m.top.surface === k)).join('')}</div>
  ${surfaceOptions('top', m.top)}
  <h3>${L('baseMat')}</h3><div class="f-chips">${chip(`data-base-same="1"`, L('sameAsTop'), false)}${baseKinds.map(k => chip(`data-mat="base.surface" data-value="${k}"`, N(SURFACES[k]), m.base.surface === k)).join('')}</div>
  ${surfaceOptions('base', m.base, true)}
  <h3>${L('hardware')}</h3>${metalChips('data-mat="hardware.metal"', m.hardware.metal)}`;
}

function deliverPanel() {
  const d = state.design, c = state.compiled, sent = state.sent, changed = sent && sent.key !== designKey(d);
  return `<h2>${L('tabDeliver')}</h2><p class="f-lead">${L('sendIntro')}</p>
  <h3>${L('yourDesign')}</h3><dl class="f-readout">
    <dt>${esc(d.family === 'bedroom' ? L('bedroomSet') : L(d.family === 'table' ? d.kind : c.meta.kind))}</dt><dd>${esc(styleName(d.style, state.lang))}</dd>
    ${d.family === 'bedroom' ? `<dt>${esc(L('setPieces'))}</dt><dd>${esc(L('setPiecesList'))}</dd>` : `<dt>${esc(L('overall'))}</dt><dd>${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm</dd>`}
    <dt>${esc(L(d.family === 'table' ? 'topMat' : d.family === 'bedroom' ? 'caseMat' : 'fabric'))}</dt><dd>${esc(d.family === 'table' ? surfaceShort(d.materials.top) : d.family === 'bedroom' ? surfaceShort(d.materials.case) : `${N(FIBERS[d.materials.fabric.fiber])} · ${N(COLORS[d.materials.fabric.color])}`)}</dd>
  </dl>
  ${sent ? `<div class="f-sent"><p>${L('sent')} <b>${esc(sent.id)}</b></p>${sent.pdf || !changed ? `<button class="f-primary" data-dl="sentPdf">${L('sentPdf')} ↓</button>` : ''}${changed ? `<p class="f-note">${L('changedAfterSend')}</p>` : ''}</div>` : ''}
  ${!sent || changed ? `<h3>${L('sendDesigner')}</h3>
  <form class="f-send" id="sendForm"><p class="f-note" id="sendState"></p>
    <label>${L('name')} *<input name="name" required maxlength="120"></label><label>${L('email')} *<input name="email" type="email" required maxlength="160"></label>
    <label>${L('phone')}<input name="phone" type="tel" maxlength="40"></label><label>${L('city')}<input name="city" maxlength="120"></label>
    <label class="full">${L('note')}<textarea name="note" rows="3" maxlength="1500"></textarea></label>
    <label class="f-check full"><input type="checkbox" name="consent" required><span>${L('consent')} <a href="proje-gizlilik.html?lang=${state.lang}" target="_blank" rel="noopener">↗</a></span></label>
    <button class="f-primary" type="submit">${L('send')} →</button></form>` : ''}`;
}

// ---- Panel drawing helpers ---------------------------------------------------------------------
function paintTile(canvas, maps, w, h, tileMmX, tileMmY, showMm = 60) {
  const g = canvas.getContext('2d'), tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  tmp.getContext('2d').putImageData(new ImageData(maps.albedo, w, h), 0, 0);
  const pattern = g.createPattern(tmp, 'repeat');
  pattern.setTransform(new DOMMatrix().scale(canvas.width / showMm * tileMmX / w, canvas.width / showMm * tileMmY / h));
  g.fillStyle = pattern; g.fillRect(0, 0, canvas.width, canvas.height);
}
function drawMaterialPreviews() {
  for (const c of document.querySelectorAll('[data-draft]')) {
    const g = c.getContext('2d'), grid = draft(c.dataset.draft, 8), s = c.width / 8;
    g.fillStyle = '#f4efe4'; g.fillRect(0, 0, c.width, c.height);
    grid.forEach((row, j) => row.forEach((up, i) => { if (up) { g.fillStyle = '#2f3a33'; g.fillRect(i * s + 0.5, j * s + 0.5, s - 1, s - 1); } }));
    g.strokeStyle = '#c9c3b6'; g.lineWidth = 0.5; for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s, c.height); g.moveTo(0, k * s); g.lineTo(c.width, k * s); g.stroke(); }
  }
  setTimeout(() => {
    const fab = $('#fabricPreview'), surf = $('#surfacePreview');
    if (fab?.isConnected) {
      const spec = state.design.materials.fabric, maps = fabricMaps(spec, {maxPx: 720});
      // Show a larger area when a motif repeats over a long distance.
      const show = Math.max(60, Math.min(400, maps.tileMm * 1.6));
      paintTile(fab, maps, maps.size, maps.size, maps.tileMm, maps.tileMm, show);
      const note = $('#tileNote'); if (note) note.textContent = `${Math.round(show)} × ${Math.round(show)} mm · ${state.lang === 'tr' ? 'rapor' : 'repeat'} ${maps.tileMm.toFixed(0)} mm`;
    }
    if (surf?.isConnected) {
      const s = state.design.materials.top || state.design.materials.case;
      if (s.surface === 'stone') { const m = stoneMaps(s.stone, s.polish, {size: 384}); paintTile(surf, m, 384, 384, 600, 600, 400); }
      else if (s.surface === 'wood' || s.surface === 'veneer') { const m = woodMaps(s.species, s.finish, {stain: s.stain, w: 192, h: 384}); paintTile(surf, m, 192, 384, 300, 600, 300); }
      else { const g = surf.getContext('2d'); g.fillStyle = s.surface === 'glass' ? GLASS[s.glass].hex : COLORS[s.color]?.hex || '#ccc'; g.fillRect(0, 0, surf.width, surf.height); }
    }
  }, 30);
}

function sheetLabels() {
  return {front: L('frontView'), side: L('sideView'), top: L('topView'), section: L('sectionView'), scale: L('scaleLabel'), units: L('units'), title: L(state.design.kind), note: L('concept'), seatDepth: L('seatDepth'), rake: L('rake'), status: L('status'), spec: L('spec'), knee: L('knee'), edgeDetail: L('edgeDetail'), mattressTop: L('mattressTop')};
}
function specRows(b) {
  const d = state.design, c = state.compiled, m = d.materials;
  if (d.family === 'bedroom') {
    const p = c.params, f = m.fabric, pc = c.meta.pieces, dim = a => a ? a.join(' × ') : '';
    return [
      [L('bed'), `${pc ? dim(pc.bed) + ' · ' : ''}${partName('headType', p.headType, state.lang)} · ${partName('headShape', p.headShape, state.lang)} · ${partName('bedBase', p.bedBase, state.lang)} · ${c.meta.mattress} cm`],
      [L('wardrobe'), `${pc ? dim(pc.wardrobe) + ' · ' : ''}${partName('wdDoorType', p.wdDoorType, state.lang)} · ${partName('wdDoorStyle', p.wdDoorStyle, state.lang)} · ${c.meta.wardrobeDoors} ${L('doorsN')}`],
      [L('dresser'), `${pc ? dim(pc.dresser) + ' · ' : ''}${c.meta.drawers} ${L('drawersN')}${p.mirror !== 'none' ? ' · ' + partName('mirror', p.mirror, state.lang) : ''}`],
      [L('nightstand'), `${pc ? dim(pc.nightstand) + ' × 2' : ''}`],
      [L('frontStyle'), `${partName('frontStyle', p.frontStyle, state.lang)} · ${partName('pull', p.pull, state.lang)} · ${N(METALS[m.metal.finish])}`],
      [L('caseMat'), surfaceShort(m.case)], [L('upholstery'), `${N(FIBERS[f.fiber])} · ${N(COLORS[f.color])}${f.pattern !== 'none' ? ' · ' + N(PATTERNS[f.pattern]) : ''}`],
      [L('mattressTop'), `${c.meta.mattressTop}`], ...(b.totals.fabricMetres ? [[L('fabricNeed'), `~${b.totals.fabricMetres} m (1400 mm)`]] : []), [L('weight'), `~${b.totals.weightKg} kg`]
    ];
  }
  const f = m.fabric;
  return [
    [L('overall'), `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height}`],
    [L('seatHeightL'), `${c.params.seatHeight}`], [L('seatDepth'), `${c.meta.seatDepth}`], ...(c.meta.armHeight ? [[L('armHeightL'), `${c.meta.armHeight}`]] : []),
    [L('rake'), `${c.params.backRake}°`], [L('arm'), partName('armType', c.params.armType, state.lang)], [L('back'), partName('backType', c.params.backType, state.lang)],
    [L('seat'), `${partName('seatType', c.params.seatType, state.lang)} · ${c.params.seatCount}`], [L('base'), `${partName('baseType', c.params.baseType, state.lang)}${['legs', 'frame'].includes(c.params.baseType) ? ' · ' + partName('legType', c.params.legType, state.lang) : ''}`],
    [L('fabric'), `${N(FIBERS[f.fiber])} · ${N(COLORS[f.color])}`], [L('pattern'), `${N(PATTERNS[f.pattern])}${f.motif ? ' · ' + N(MOTIF_NAMES[f.motif]) : ''}${f.pattern !== 'none' ? ' · ' + N(COLORS[f.color2]) : ''}`],
    [L('wood'), `${N(WOODS[m.wood.species])} · ${N(STAINS[m.wood.stain])} · ${N(FINISHES[m.wood.finish])}`], [L('metal'), N(METALS[m.metal.finish])],
    [L('fabricNeed'), `~${b.totals.fabricMetres} m (1400 mm)`]
  ];
}
function deliverables() {
  const key = JSON.stringify(state.design) + state.lang;
  if (state.drawingCache?.key === key) return state.drawingCache;
  const b = bom(state.compiled, state.design.materials, state.lang);
  state.drawingCache = {key, bom: b, get sheet() { return this._sheet ??= drawingSheet(state.compiled, sheetLabels(), {title: `${L(state.design.family === 'table' ? state.design.kind : state.compiled.meta.kind)} · ${styleName(state.design.style, state.lang)}`, style: styleName(state.design.style, state.lang), date: new Date().toISOString().slice(0, 10), id: projectId(), rows: specRows(b)}); }};
  return state.drawingCache;
}
const projectId = () => `F-${String(state.design.seed % 100000).padStart(5, '0')}`;

function drawDeliverables() {
  fetch('api/forma-submit.php', {cache: 'no-store'}).then(r => r.json()).catch(() => ({available: false})).then(s => {
    state.canSend = !!s.available;
    const ss = $('#sendState'); if (ss) ss.textContent = state.canSend ? '' : L('sendOff');
    const btn = $('#sendForm button[type=submit]'); if (btn) btn.disabled = !state.canSend;
  });
}

// ---- Package -------------------------------------------------------------------------------
async function packageFiles() {
  const dv = deliverables(), files = [];
  const project = {schema: SCHEMA, id: projectId(), created: new Date().toISOString(), language: state.lang, design: state.design, derived: state.compiled.meta, issues: issuesOf(state.design, state.compiled), bom: dv.bom, note: 'Concept design generated by AURA Forma. Requires review by an AURA designer before production.'};
  files.push({name: 'project.json', data: JSON.stringify(project, null, 2)});
  files.push({name: 'drawings.svg', data: dv.sheet.svg});
  files.push({name: 'drawings.dxf', data: drawingDxf(state.compiled)});
  files.push({name: 'parts.csv', data: bomCsv(dv.bom)});
  const pages = [await svgToJpeg(dv.sheet.svg)];
  if (viewer) { const shot = await viewer.photo(2); pages.unshift(await dataUrlJpeg(shot)); files.push({name: 'render.jpg', data: pages[0].data}); }
  files.push({name: 'drawings.pdf', data: jpegPdf(pages)});
  if (viewer) { try { files.push({name: 'model.glb', data: new Uint8Array(await viewer.exportGLB())}); } catch {} }
  files.push({name: 'README.txt', data: `AURA Forma ${projectId()} (${state.design.family}/${state.design.kind})\n\nproject.json  design parameters, materials, derived dimensions, checks, parts list\ndrawings.pdf  render + A3 drawing sheet (print at 100% for the stated scale)\ndrawings.svg  vector drawing sheet (paper mm)\ndrawings.dxf  views in model space, real millimetres (layers FRONT, SIDE, TOP, SECTION_A)\nparts.csv     grouped parts with cut sizes, materials and suggested build (TR/EN)\nmodel.glb     3D model (metres)\n\nConcept design. Dimensions, structure and build suggestions must be checked by the designer before production.\n`});
  return files;
}
async function downloadAs(kind) {
  // The only file a customer can take is the PDF of a design already sent to the designer.
  const sent = state.sent; if (kind !== 'sentPdf' || !sent) return;
  if (!sent.pdf && sent.key === designKey(state.design)) {
    const pages = [await svgToJpeg(deliverables().sheet.svg)];
    if (viewer) pages.unshift(await dataUrlJpeg(await viewer.photo(2)));
    sent.pdf = jpegPdf(pages);
  }
  if (sent.pdf) download(`AURA-${sent.id}.pdf`, sent.pdf, 'application/pdf');
}

// ---- Actions (shared by UI, commands and AI) ------------------------------------------------
const SPECIES_TO_STAIN = {oak: 'oak', ash: 'lightOak', beech: 'natural', walnut: 'walnut', cherry: 'cherry', teak: 'teak', smoked: 'darkWalnut', ebonized: 'black'};
function switchFamily(family, kind) {
  const prev = store.get('aura-forma-design-' + family);
  const next = prev?.schema === SCHEMA && (!kind || prev.kind === kind) ? prev : sample({family, style: state.design.style, kind, seed: state.design.seed});
  setDesign(next);
  const prevSent = store.get('aura-forma-sent-' + family); state.sent = prevSent?.key === designKey(state.design) ? prevSent : null;
}
function seatsToSize(d, n) {
  // Grow the top until the capacity rule (600 mm per person, 650 mm on curved perimeters) seats n people.
  const p = {...d.params, kind: 'dining'}, round = p.topShape === 'round', mod = FAMILIES.table.mod;
  if (n >= 6 && round) p.topShape = 'oval';
  if (!round || n >= 6) { p.width = Math.max(p.width, n >= 6 ? 900 : 800); p.length = Math.max(800, Math.ceil(n / 2) * 600 - 200); }
  else p.length = p.width = 800;
  for (let i = 0; i < 40; i++) {
    const c = mod.compile({...normalizeDesign({...d, params: p}).params, kind: 'dining'});
    if (c.meta.seats >= n) break;
    if (p.topShape === 'round') { p.length += 50; p.width = p.length; } else p.length += 50;
  }
  return p;
}
function applyActions(actions) {
  let d = structuredClone(state.design), changed = false, fam = familyOf(d); const notes = [];
  for (const a of actions) {
    if (a.type === 'command') {
      const v = {viewFront: 'front', viewSide: 'side', viewTop: 'top', viewAngle: 'angle'}[a.name];
      if (v) { viewer?.view(v); markView(v); notes.push(L(v === 'angle' ? 'perspective' : v)); }
      else if (a.name === 'undo') { undo(); return notes.concat(L('undo')); }
      else if (a.name === 'redo') { redo(); return notes.concat(L('redo')); }
      else if (a.name === 'structure') toggleStructure();
      else if (a.name === 'photo') savePhoto();
      else if (a.name === 'drawings' || a.name === 'send' || a.name === 'package') { state.tab = 'deliver'; renderPanel(); notes.push(L('tabDeliver')); }
      continue;
    }
    if (a.type === 'family') {
      if (a.value !== d.family) { const k = actions.find(x => x.type === 'kind' && FAMILIES[a.value].kinds[x.value])?.value; switchFamily(a.value, k); d = structuredClone(state.design); fam = familyOf(d); notes.push(L({table: 'famTable', bedroom: 'famBedroom', seating: 'famSeating'}[a.value])); }
      continue;
    }
    changed = true;
    let key = a.key;
    if (d.family === 'seating' && key === 'length') key = 'width';
    if (d.family === 'bedroom') key = setKey(d, key, a, actions);
    if (a.type === 'mattress') { if (d.family === 'bedroom') { d.kind = 'bed'; [d.params.mattressWidth, d.params.mattressLength] = a.value; notes.push(`${L('mattress')} ${a.value[0] / 10}×${a.value[1] / 10}`); } continue; }
    if (d.family === 'bedroom' && a.type === 'kind') { if (fam.kinds[a.value]) { d.kind = a.value; notes.push(L(a.value)); } else { const owner = Object.values(FAMILIES).find(f => f.kinds[a.value]); if (owner) { switchFamily(owner.id, a.value); d = structuredClone(state.design); fam = familyOf(d); notes.push(L(a.value)); } } continue; }
    if (d.family === 'table' && key === 'leaves' && a.value > 0) {
      if (['pedestal', 'drum', 'tripod'].includes(d.params.baseType)) d.params.baseType = 'doublePedestal';
      if (['round', 'boat'].includes(d.params.topShape)) d.params.topShape = 'oval';
    }
    if (a.type === 'set') { d.params[key] = a.value; notes.push(`${partName('params', key, state.lang)} ${Math.round(a.value)}`); }
    else if (a.type === 'delta') { const before = d.params[key]; d.params[key] = before + a.value; notes.push(`${partName('params', key, state.lang)} ${Math.round(before)} → ${Math.round(before + a.value)}`); }
    else if (a.type === 'enum') {
      // Bed-only and chest-only choices move the design to the right piece first.
      // Bedroom set: the edited piece becomes the one in focus, so the others follow it.
      if (d.family === 'bedroom' && !actions.some(x => x.type === 'kind')) { const owner = PIECE_OF[key]; if (owner && owner !== d.kind && !(owner === 'case' && ['dresser', 'nightstand'].includes(d.kind))) d.kind = owner === 'case' ? 'dresser' : owner; }
      d.params[key] = a.value; notes.push(partName(d.family === 'table' && key === 'baseType' ? 'tBaseType' : d.family === 'table' && key === 'legType' ? 'legTypeT' : d.family === 'bedroom' && key === 'legType' ? 'bLegType' : ({nsBase: 'caseBase', drBase: 'caseBase', nsLayout: 'caseLayout', drLayout: 'caseLayout'}[key] || key), a.value, state.lang)); }
    else if (a.type === 'seats') { if (d.family === 'table') { d.params = FAMILIES.table.repair({...seatsToSize(d, a.value), kind: 'dining'}, d.materials); d.kind = 'dining'; notes.push(`${a.value} ${L('persons')}`); } }
    else if (a.type === 'style') { d = sample({family: d.family, style: a.value, kind: d.kind, seed: d.seed}); notes.push(styleName(a.value, state.lang)); }
    else if (a.type === 'kind') {
      if (!fam.kinds[a.value]) { const owner = Object.values(FAMILIES).find(f => f.kinds[a.value]); if (owner) { switchFamily(owner.id, a.value); d = structuredClone(state.design); fam = familyOf(d); notes.push(L(a.value)); } continue; }
      if (a.value !== d.kind) { d = designForKind(d, a.value); notes.push(L(a.value)); }
    }
    else if (a.type === 'material') {
      let {slot, key: mk, value} = a;
      if (d.family === 'seating' && slot === 'wood' && mk === 'species' && value !== 'gurgen') { mk = 'stain'; value = SPECIES_TO_STAIN[value] || 'natural'; }
      if (d.family === 'seating' && (slot === 'top' || slot === 'base')) continue;
      if (d.family === 'table' && (slot === 'wood' || slot === 'fabric')) slot = 'top';
      if (d.family === 'bedroom') {
        if (slot === 'top' || slot === 'base') slot = 'case';
        // A wood species applies to the case (unless lacquered) and to the solid parts.
        if (mk === 'species') { d.materials.wood = {...d.materials.wood, species: value}; if (slot === 'wood') slot = 'case'; if (d.materials.case.surface === 'lacquer') d.materials.case.surface = 'veneer'; }
        if (slot === 'case' && mk === 'color') d.materials.case.surface = 'lacquer';
      }
      d.materials[slot] = {...d.materials[slot], [mk]: value};
      if (d.family === 'table' && mk === 'species' && !['wood', 'veneer'].includes(d.materials[slot].surface)) d.materials[slot].surface = 'wood';
      if (d.family === 'table' && mk === 'color' && !['lacquer'].includes(d.materials[slot].surface)) d.materials[slot].surface = 'lacquer';
      notes.push(materialLabel({slot, key: mk, value}));
    }
  }
  if (changed) setDesign(d);
  return notes;
}
/** Bedroom set: which piece a parameter belongs to, and generic command keys mapped to the piece in focus. */
const PIECE_OF = {headType: 'bed', headShape: 'bed', bedBase: 'bed', footboard: 'bed', storage: 'bed', bedding: 'bed', wdDoorType: 'wardrobe', wdDoorStyle: 'wardrobe', wdHandle: 'wardrobe', wdNiche: 'wardrobe', wdBase: 'wardrobe', mirror: 'dresser', drLayout: 'dresser', drBase: 'dresser', drRows: 'dresser', drColumns: 'dresser', nsLayout: 'nightstand', nsBase: 'nightstand', nsRows: 'nightstand', frontStyle: 'case', pull: 'case'};
function setKey(d, key, a, actions) {
  const k = actions.find(x => x.type === 'kind' && ['bed', 'wardrobe', 'dresser', 'nightstand'].includes(x.value))?.value || d.kind;
  const pre = k === 'nightstand' ? 'ns' : 'dr';
  if (k === 'wardrobe') { if (key === 'frontStyle') return 'wdDoorStyle'; if (key === 'pull') { a.value = {bar: 'bar', edge: 'edge', knob: 'knob', leather: 'leather', none: 'push', ring: 'knob'}[a.value] || 'bar'; return 'wdHandle'; } if (key === 'caseBase') { a.value = a.value === 'legs' ? 'legs' : 'recessed'; return 'wdBase'; } }
  const map = {bed: {width: 'mattressWidth', length: 'mattressLength', height: 'headHeight'}, wardrobe: {width: 'wdWidth', height: 'wdHeight', depth: 'wdDepth'}, dresser: {width: 'drWidth', height: 'drHeight', depth: 'drDepth', rows: 'drRows', columns: 'drColumns', caseBase: 'drBase', caseLayout: 'drLayout', baseHeight: 'caseBaseHeight'}, nightstand: {width: 'nsWidth', depth: 'nsDepth', rows: 'nsRows', caseBase: 'nsBase', caseLayout: 'nsLayout', baseHeight: 'caseBaseHeight'}}[k] || {};
  if (k === 'nightstand' && key === 'height') { if (a.type === 'set') a.value -= state.compiled.meta.mattressTop; return 'nsHeightOffset'; }
  if (k !== 'nightstand' && key === 'caseBase' && a.value === 'wall') a.value = 'recessed';
  void pre;
  return map[key] || key;
}
function materialLabel(a) {
  const tables = {fiber: FIBERS, weave: WEAVE_NAMES, pattern: PATTERNS, color: COLORS, color2: COLORS, species: WOODS, stain: STAINS, stone: STONES, glass: GLASS, surface: SURFACES, metal: METALS, motif: MOTIF_NAMES, finish: a.slot === 'metal' ? METALS : FINISHES};
  if (a.key === 'polish') return L(a.value);
  return N(tables[a.key]?.[a.value]) || a.value;
}

async function runCommand(text) {
  if (!text.trim()) return;
  const local = parse(text, {family: state.design.family});
  if (local.understood && local.actions.some(a => !(a.type === 'command' && ['variants', 'similar'].includes(a.name)))) { const notes = applyActions(local.actions); feedback(`${L('applied')}: ${notes.join(' · ')}`); return; }
  if (state.ai.available && state.design.family === 'seating') {
    feedback(L('working'));
    try { const actions = await interpret(text, state.design, state.lang); if (actions.length) { feedback(`${L('applied')}: ${applyActions(actions).join(' · ')}`); return; } } catch {}
  }
  feedback(L('notUnderstood'), 'warn');
}

function markView(v) { for (const b of document.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === v)); }
function toggleStructure() { state.structure = !state.structure; viewer?.structure(state.structure); $('#structureBtn').setAttribute('aria-pressed', String(state.structure)); }
async function savePhoto() { if (!viewer) return; download(`${projectId()}.jpg`, (await dataUrlJpeg(await viewer.photo(2))).data, 'image/jpeg'); }

// ---- Voice -----------------------------------------------------------------------------------
function listen() {
  const mic = $('#micBtn');
  startVoice({
    lang: state.lang,
    onText: (text, final) => { $('#command').value = text; if (final && text.trim()) runCommand(text); },
    onState: (s, info) => {
      if (s === 'listening' || s === 'recording') { mic.dataset.on = '1'; feedback(s === 'recording' ? L('voiceRecording') : L('listening')); }
      else if (s === 'loading') feedback(`${L('voiceLoading')} ${info?.total ? Math.round(info.loaded / info.total * 100) + '%' : ''}`);
      else if (s === 'working') { delete mic.dataset.on; feedback(L('voiceWorking')); }
      else if (s === 'error') { delete mic.dataset.on; feedback(L('voiceError'), 'warn'); }
      else delete mic.dataset.on;
    }
  });
}

// ---- Events ----------------------------------------------------------------------------------
function bindShell() {
  $('#lang').onchange = e => { state.lang = e.target.value; store.set('aura-forma-lang', state.lang); state.drawingCache = null; shell(); };
  $('#families').onclick = e => { const b = e.target.closest('[data-family]'); if (b && b.dataset.family !== state.design.family) switchFamily(b.dataset.family); };
  for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => { viewer?.view(b.dataset.view); markView(b.dataset.view); };
  for (const b of document.querySelectorAll('[data-zoom]')) b.onclick = () => viewer?.zoom(+b.dataset.zoom);
  $('#structureBtn').onclick = toggleStructure; $('#photoBtn').onclick = savePhoto;
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#commandForm').onsubmit = e => { e.preventDefault(); runCommand($('#command').value); };
  $('#micBtn').onclick = listen;
  for (const b of document.querySelectorAll('[data-tab]')) b.onclick = () => { state.tab = b.dataset.tab; renderPanel(); };

  const panel = $('#panel');
  panel.addEventListener('click', e => {
    const el = e.target.closest('button, [data-load]'); if (!el) return;
    const d = el.dataset;
    if (d.kind) { if (d.kind !== state.design.kind) setDesign(isBedroom() ? {...state.design, kind: d.kind, params: {...state.design.params, kind: d.kind}} : designForKind(state.design, d.kind)); }
    else if (d.style) { setDesign(sample({family: state.design.family, style: d.style, kind: state.design.kind, seed: state.design.seed})); }
    else if (el.id === 'generateBtn') { state.tab = 'parts'; renderPanel(); }
    else if (d.enum) setDesign(withParams({[d.enum]: d.value}));
    else if (d.count) setDesign(withParams({[d.count]: +d.value}));
    else if (d.mattress) { const [w, l] = MATTRESS[d.mattress]; setDesign(withParams({mattressWidth: w, mattressLength: l})); }
    else if (d.baseSame) { const top = state.design.materials.top; setDesign(withMaterial('base', top.surface === 'lacquer' ? {surface: 'lacquer', color: top.color, finish: top.finish} : {surface: 'wood', species: top.species, stain: top.stain, finish: top.finish})); }
    else if (d.mat) { const [slot, key] = d.mat.split('.'); setDesign(withMaterial(slot, {[key]: d.value})); }
    else if (d.color !== undefined) { const [slot, key] = d.color.split('.'); setDesign(withMaterial(slot, {[key]: d.value || null})); }
    else if (d.dl) downloadAs(d.dl);
  });
  panel.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.param) setDesign(withParams({[el.dataset.param]: +el.value}));
    else if (el.dataset.num) setDesign(withParams({[el.dataset.num]: +el.value}));
    else if (el.dataset.fabricDensity !== undefined) setDesign(withMaterial('fabric', {density: +el.value}));
    else if (el.id === 'imageFile') readImage(el.files[0]);
  });
  let pending = 0;
  panel.addEventListener('input', e => {
    const el = e.target; if (!el.dataset.param) return;
    const num = el.parentElement.querySelector('[data-num]'); if (num) num.value = el.value;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => { const next = normalizeDesign(withParams({[el.dataset.param]: +el.value})); state.compiled = compileOf(next); viewer?.setDesign(state.compiled, next.materials); });
  });
  panel.addEventListener('submit', async e => {
    if (e.target.id !== 'sendForm') return; e.preventDefault();
    const fd = new FormData(e.target), ss = $('#sendState');
    if (!state.canSend) { ss.textContent = L('sendOff'); return; }
    ss.textContent = L('working');
    try {
      const body = new FormData(), files = await packageFiles(), key = designKey(state.design);
      body.append('package', new Blob([zip(files)], {type: 'application/zip'}), `${projectId()}.zip`);
      body.append('meta', JSON.stringify({name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), city: fd.get('city'), note: fd.get('note'), consent: !!fd.get('consent'), lang: state.lang, summary: specRows(deliverables().bom).map(r => r.join(': ')).join(' | ')}));
      const r = await fetch('api/forma-submit.php', {method: 'POST', body}), j = await r.json();
      if (!j.ok) { ss.textContent = j.error || 'Error'; return; }
      state.sent = {id: j.id, key, pdf: files.find(f => f.name === 'drawings.pdf').data};
      store.set('aura-forma-sent-' + state.design.family, {id: j.id, key});
      renderPanel();
    } catch (err) { ss.textContent = String(err.message || err); }
  });
}

async function readImage(file) {
  if (!file) return;
  if (!state.ai.vision) { feedback(L('aiOff'), 'warn'); return; }
  feedback(L('reading'));
  const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
  const small = await shrink(url, 1400);
  try {
    const res = await designFromImage(small, state.lang);
    setDesign(res.design);
    feedback(`${L('applied')} · ${L('estimated')}: ${res.estimated.map(k => partName('params', k, state.lang)).join(', ')}${res.notes ? ' · ' + res.notes : ''}`);
  } catch (e) { feedback(String(e.message || e), 'error'); }
}
async function shrink(url, max) {
  const img = new Image(); await new Promise(r => { img.onload = r; img.src = url; });
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}

// ---- Start -----------------------------------------------------------------------------------
function initialDesign() {
  let family = FAMILIES[params.get('family')] ? params.get('family') : null, style = 'japandi', note = null;
  if (params.get('brief')) {
    try {
      const brief = JSON.parse(sessionStorage.getItem('aura-taste-handoff') || 'null');
      const ids = (brief?.styles || []).map(s => (typeof s === 'string' ? s : s?.id)).filter(id => FAMILIES.seating.byId[id]);
      state.avoid = (brief?.avoidStyleIds || []).filter(id => FAMILIES.seating.byId[id]);
      if (ids.length) { style = ids[0]; note = L('briefLoaded'); }
      if (brief?.category === 'tables') family = 'table';
      if (brief?.category === 'bedroom') family = 'bedroom';
    } catch {}
  }
  family ??= store.get('aura-forma-family') === 'table' ? 'table' : 'seating';
  if (params.get('style') && FAMILIES[family].byId[params.get('style')]) style = params.get('style');
  const kind = FAMILIES[family].kinds[params.get('kind')] ? params.get('kind') : undefined;
  const fromStore = store.get('aura-forma-design-' + family) || (family === 'seating' ? store.get('aura-forma-design') : null);
  if (!note && fromStore?.schema === SCHEMA && !params.get('style') && !kind) return {design: normalizeDesign({...fromStore, family})};
  return {design: sample({family, style, kind, seed: 1 + Math.floor(Math.random() * 1e6)}), note};
}

window.formaDebug = {state, get viewer() { return viewer; }};
const start = initialDesign();
state.design = start.design; state.compiled = compileOf(state.design);
store.set('aura-forma-design-' + state.design.family, state.design); store.set('aura-forma-family', state.design.family);
store.set('aura-forma-lang', state.lang);
{ const prev = store.get('aura-forma-sent-' + state.design.family); if (prev?.key === designKey(state.design)) state.sent = prev; }
shell();
if (start.note) { feedback(start.note); state.tab = 'parts'; renderPanel(); }
aiStatus().then(s => { state.ai = s; if (state.tab === 'style') renderPanel(); });
