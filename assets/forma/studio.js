// AURA Forma design studio: family → style (one starting form) → parts / dimensions / materials → send to the designer.
// No ready-made proposal gallery: people build their own piece. Drawings, parts list and files never leave the
// browser before sending; afterwards the customer can download the PDF of the design they sent.
// Families: seating (sofa, loveseat, armchair), tables (dining, coffee, side, console, desk) and RİTMO case goods
// (wardrobe, bedside table, chest of drawers, vanity) built from panels with fixed production rules. The earlier
// bedroom set (bed-led) is kept only so older saved designs still open.
import {sample, normalizeDesign, SCHEMA} from './generate.js';
import {FAMILIES, familyOf} from './families.js';
import {buildMesh} from './build.js';
import {styleName} from './styles.js';
import {STARTS} from './starts.js';
import {HIDES, COLORS, FIBERS, WEAVES, WEAVE_NAMES, PATTERNS, MOTIF_CHOICES, MOTIF_NAMES, WOODS, FINISHES, STAINS, METALS, STONES, GLASS, SURFACES, LINEN_COLORS, colorGroup, name as nm} from './catalog.js';
import {MATTRESS} from './bedroom.js';
import {harmonize} from './set.js';
import {EDIT_TYPES as CELL_TYPES, INSIDE, leafCount} from './storage.js';
import {designLink, projectLink, readLink, linkPage, urlShortcut} from './link.js';
import {account} from './account.js';
import {ROOM_TYPES, suggestRoom, misfits, itemKind, footprint, arrange, worldCenter, shell as roomShell} from './room.js';
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
// Browser storage; with an account every change is also saved to it (debounced), so work survives other devices.
const store = {get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} account.schedule(); }};

const params = new URLSearchParams(location.search);
const browserLang = (navigator.language || 'en').slice(0, 2);
const state = {
  lang: UI_LANGS[params.get('lang')] ? params.get('lang') : UI_LANGS[store.get('aura-forma-lang')] ? store.get('aura-forma-lang') : UI_LANGS[browserLang] ? browserLang : 'tr',
  design: null, compiled: null, history: [], future: [], tab: 'parts', sketch: true, inspire: false, sent: null, project: {items: []}, editing: null, justAdded: false, room: null, structure: false, ai: {available: false, vision: false}, avoid: []
};
const L = k => t(k, state.lang);
const N = entry => nm(entry, state.lang);
let viewer = null, sceneModule = null;

const compileOf = d => familyOf(d).mod.compile({...d.params, kind: d.kind});
/** What the viewer shows: case goods may be shown with doors and drawers open (drawings and files stay closed). */
const shown = (d = state.design) => ['storage', 'kitchen', 'bath'].includes(d.family) && state.openFronts ? familyOf(d).mod.compile({...d.params, kind: d.kind, openFronts: true}) : (d === state.design ? state.compiled : compileOf(d));
const issuesOf = (d, c) => d.family !== 'seating' ? familyOf(d).mod.validate(c, d.materials, buildMesh) : familyOf(d).mod.validate(c);
const isTable = () => state.design.family === 'table';
const isBedroom = () => state.design.family === 'bedroom';
const isBed = () => isBedroom() && state.design.kind === 'bed';
const isStorage = () => state.design.family === 'storage';
const isKitchen = () => state.design.family === 'kitchen';
const isBath = () => state.design.family === 'bath';
/** Panel furniture (case goods and kitchens) shares fronts, materials and the open view. */
const isPanel = () => isStorage() || isKitchen() || isBath();
/** Families offered in the studio (the old bed-led bedroom set is not offered any more). */
const FAMILY_NAV = [['seating', 'famSeating'], ['table', 'famTable'], ['storage', 'famStorage'], ['kitchen', 'famKitchen'], ['bath', 'famBath']];
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
  state.design = next; state.compiled = compileOf(next); state.room = null; delete document.body.dataset.room;
  viewer?.setDesign(shown(next), next.materials);
  store.set('aura-forma-design-' + next.family, next); store.set('aura-forma-family', next.family); store.set(`aura-forma-kind-${next.family}-${next.kind}`, next);
  state.drawingCache = null;
  if (familyChanged) shellNav();
  { const ob = $('#openBtn'); if (ob) ob.hidden = !['storage', 'kitchen', 'bath'].includes(next.family); }
  renderCaption();
  if (!keepPanel) renderPanel(); else refreshReadouts();
}
const undo = () => { if (!state.history.length) return; state.future.push(state.design); setDesign(state.history.pop(), {record: false}); };
const redo = () => { if (!state.future.length) return; state.history.push(state.design); setDesign(state.future.pop(), {record: false}); };
/** The customer's own piece of another kind in the same family (e.g. back from the chest to the bed), else a new start in the same style. */
function designForKind(d, kind) {
  const prev = store.get(`aura-forma-kind-${d.family}-${kind}`);
  if (prev?.schema === SCHEMA && prev.family === d.family) return structuredClone(prev);
  // A new kind opens on a curated model of the same style when there is one.
  const list = startList(d.family, kind), e = list.find(x => x.style === d.style) || list[0];
  if (e) return {...startDesign(e, d.family, kind), materials: d.materials};
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
  },
  kitchen: {
    brand: 'MUTFAK', kinds: ['run', 'island'],
    dims: c => `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm · ${L('worktopHeightL').toLowerCase()} ${c.params.worktopHeight}`,
    readout: m => [[L('kModules'), String(m.moduleCount)], [L('carcassBoard'), `${m.board} mm`], [L('drawerCount'), String(m.drawers)], [L('leaves'), String(m.leaves)], [L('hingesN'), String(m.hinges)], [L('weight'), `~${weightOf()} kg`]]
  },
  bath: {
    brand: 'BANYO', kinds: ['basin', 'column', 'mirror'],
    dims: c => `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm${c.meta.basinRim ? ` · ${partName('bParams', 'mountHeight', state.lang).toLowerCase()} ${c.meta.basinRim}` : ''}`,
    readout: m => [[L('carcassBoard'), `${m.board} mm`], [L('drawerCount'), String(m.drawers)], [L('leaves'), String(m.leaves)], [L('weight'), `~${weightOf()} kg`]]
  },
  storage: {
    brand: 'RİTMO', kinds: ['wardrobe', 'nightstand', 'dresser', 'vanity', 'tvunit', 'bookcase', 'vitrine', 'sideboard'],
    dims: c => `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm · ${c.meta.board} mm ${L(c.params.board === 'solid' ? 'boardSolid' : 'boardMdf')}`,
    readout: m => [[L('carcassBoard'), `${m.board} mm`], [L('innerDepth'), `${m.innerDepth} mm`], [L('drawerCount'), String(m.drawers)], [L('leaves'), String(m.leaves)], [L('hingesN'), String(m.hinges)], [L('modulesN'), `${m.modules} · ${m.moduleWidths.join(' + ')} mm`], [L('weight'), `~${weightOf()} kg`]]
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
    <a class="f-brand" href="index.html?lang=${state.lang}">AURA</a>
    <nav class="f-families" id="families" aria-label="${esc(L('title'))}"></nav>
    <button class="f-guide-btn" id="guideBtn" type="button">${L('guide')}</button>
    <button class="f-account" id="accountBtn" type="button"></button>
    <label class="f-lang"><span class="sr">Language</span><select id="lang">${Object.entries(UI_LANGS).map(([k, v]) => `<option value="${k}" ${k === state.lang ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  </header>
  <main class="f-layout">
    <section class="f-visual" aria-label="3D">
      <div class="f-caption"><div><p class="f-eyebrow" id="eyebrow"></p><h1 id="designTitle"></h1><p class="f-dims" id="dims"></p></div><p class="f-status" id="status"></p></div>
      <div class="f-stage" id="stage" aria-label="${esc(L('perspective'))}"></div>
      <div class="f-toolbar" role="toolbar">
        <button data-view="angle" aria-pressed="true">${L('perspective')}</button><button data-view="front">${L('front')}</button><button data-view="side">${L('side')}</button><button data-view="top">${L('top')}</button>
        <button id="modeBtn" aria-pressed="${!state.sketch}">${L(state.sketch ? 'modeRender' : 'modeSketch')}</button><button id="structureBtn" aria-pressed="false">${L('structure')}</button><button id="openBtn" aria-pressed="${!!state.openFronts}" ${['storage', 'kitchen', 'bath'].includes(state.design.family) ? '' : 'hidden'}>${L('openFronts')}</button><button id="photoBtn">${L('photo')} ↓</button>
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
      <nav class="f-tabs" role="tablist">${['parts', 'size', 'material', 'deliver'].map((k, i) => `<button role="tab" data-tab="${k}" aria-selected="${state.tab === k}"><span>${String(i + 1).padStart(2, '0')}</span>${L(k === 'deliver' ? 'tabProject' : 'tab' + k[0].toUpperCase() + k.slice(1))}</button>`).join('')}</nav>
      <div id="panel" class="f-panel"></div>
    </aside>
  </main>`;
  viewer?.dispose(); viewer = null;
  const host = $('#stage');
  import('./scene.js?v=20261019a').then(mod => { sceneModule = mod; const {createViewer} = mod;
    viewer = createViewer(host);
    if (!viewer) host.innerHTML = `<p class="f-nogl">WebGL ${state.lang === 'tr' ? 'kullanılamıyor; teknik çizimler Teslim sekmesinde.' : 'is unavailable; technical drawings are in the Hand-off tab.'}</p>`;
    else { viewer.mode(state.sketch ? 'sketch' : 'render'); viewer.setDesign(shown(), state.design.materials); if (state.room) showRoom(); }
  }).catch(() => { host.innerHTML = '<p class="f-nogl">WebGL</p>'; });
  bindShell(); shellNav();
  renderCaption(); renderPanel();
}
function shellNav() {
  $('#families').innerHTML = FAMILY_NAV.map(([f, k]) => `<button data-family="${f}" aria-pressed="${state.design.family === f}">${esc(L(k))}</button>`).join('');
}

function renderCaption() {
  const d = state.design, c = state.compiled, issues = issuesOf(d, c);
  $('#eyebrow').textContent = `F-${String(d.seed % 100000).padStart(5, '0')} · ${L(state.sketch ? 'modeSketch' : 'modeRender')}`;
  renderStartLabel();
  $('#designTitle').textContent = d.family === 'bedroom' ? (d.params.view === 'set' ? L('bedroomSet') : L(d.kind)) : L(d.family === 'seating' ? c.meta.kind : d.kind);
  $('#dims').textContent = ui().dims(c);
  const err = issues.filter(i => i.level === 'error'), warn = issues.filter(i => i.level === 'warn');
  const st = $('#status');
  st.dataset.level = err.length ? 'error' : warn.length ? 'warn' : 'ok';
  st.textContent = err.length || warn.length ? [...err, ...warn].map(i => L('issues.' + i.code).replace('{v}', Math.round(i.value))).join(' · ') : L('ok');
  $('#undoBtn').disabled = !state.history.length; $('#redoBtn').disabled = !state.future.length;
}
function feedback(text, level = 'info') { const f = $('#feedback'); f.textContent = text; f.dataset.level = level; }

// ---- Panels ---------------------------------------------------------------------------
function renderPanel() {
  for (const b of document.querySelectorAll('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === state.tab));
  $('#panel').innerHTML = { parts: partsPanel, size: sizePanel, material: materialPanel, deliver: projectPanel}[state.tab]();
  if (state.tab === 'material') drawMaterialPreviews();
  if (state.tab === 'deliver') drawDeliverables();
}
const chip = (attrs, label, on, extra = '') => `<button class="f-chip" ${attrs} aria-pressed="${on}" ${extra}>${esc(label)}</button>`;

// Starting models: curated, on-style forms (reviewed by eye) shown full size in the sketch; the user browses them
// with ‹ › on the drawing or picks a style here, then shapes the piece further.
const startList = (family = state.design.family, kind = state.design.kind) => FAMILIES[family]?.starts?.[kind] || STARTS[family]?.[family === 'bedroom' ? 'bed' : kind] || [];
function startDesign(e, family = state.design.family, kind = state.design.kind) {
  const d = sample({family, style: e.style, kind, seed: e.seed}), mod = FAMILIES[family].mod;
  return normalizeDesign({...d, kind, params: {...(mod.defaultsFor ? mod.defaultsFor(kind) : mod.DEFAULTS), ...structuredClone(e.p), kind}, materials: e.m ? {...d.materials, ...structuredClone(e.m)} : d.materials});
}
const startIndex = () => startList().findIndex(e => e.style === state.design.style && e.seed === state.design.seed);
function stepStart(dir) {
  const list = startList(); if (!list.length) return;
  const i = startIndex(), next = list[((i < 0 ? (dir > 0 ? -1 : 0) : i) + dir + list.length) % list.length];
  setDesign(startDesign(next)); feedback(`${styleName(next.style, state.lang)} · ${L('startModel')}`);
}
function startSection() {
  const d = state.design, list = startList(), styles = [...new Set(list.map(e => e.style))];
  if (!styles.length) return '';
  return `<section class="f-starts"><h3>${L('startModel')}</h3><div class="f-chips">${styles.map(id => chip(`data-start-style="${id}"`, styleName(id, state.lang), d.style === id)).join('')}</div>
  <p class="f-note">${L('startHint')}</p>
  ${d.family === 'seating' ? `<div class="f-actions"><label class="f-secondary" id="imageLabel">${L('fromImage')} ↑<input id="imageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label></div>${state.ai.vision ? '' : `<p class="f-note">${L('aiOff')}</p>`}` : ''}</section>`;
}
function renderStartLabel() {
  const el = $('#startLabel'); if (!el) return;
  const list = startList(), i = startIndex(), d = state.design;
  const mine = list.filter(e => e.style === d.style), j = mine.findIndex(e => e.seed === d.seed);
  el.innerHTML = `<b>${esc(styleName(d.style, state.lang))}</b>${i >= 0 ? `<span>${j + 1} / ${mine.length}</span>` : ''}`;
}
// Line details: the simple lines that make a form one's own (stitching, inlay, groove), drawn in red in the sketch.
function linesSection() {
  const d = state.design, p = d.params;
  let body = '';
  if (d.family === 'seating') body = enumGroup('stitch', 'stitchLine');
  else if (d.family === 'table') body = enumGroup('inlay', 'inlayLine');
  else if (['storage', 'kitchen', 'bath'].includes(d.family)) body = enumGroup('caseLine', 'caseLineLbl') + (p.frontStyle !== 'flat' ? `<p class="f-note">${L('caseLineNote')}</p>` : '');
  else {
    const soft = ['upholstered', 'wingback', 'framed'].includes(p.headType) || p.bedBase === 'baza';
    body = (soft ? enumGroup('stitch', 'stitchLine') : '') + enumGroup('caseLine', 'caseLineLbl') + (p.frontStyle !== 'flat' || p.wdDoorStyle !== 'flat' ? `<p class="f-note">${L('caseLineNote')}</p>` : '');
  }
  return `<section class="f-lines"><h2 class="f-h2-sub">${L('lineDetails')}</h2><p class="f-note">${L('lineHint')}</p>${body}</section>`;
}
const kindRow = () => isBedroom() ? '' : `<div class="f-kinds">${ui().kinds.map(k => chip(`data-kind="${k}"`, L(k), state.design.kind === k)).join('')}</div>`;

function enumGroup(key, labelKey, ns = key, options = familyOf(state.design).mod.ENUMS[key]) {
  return `<h3>${L(labelKey)}</h3><div class="f-chips">${options.map(v => chip(`data-enum="${key}" data-value="${v}"`, partName(ns, v, state.lang), state.design.params[key] === v)).join('')}</div>`;
}
const counter = (key, label, values) => `<h3>${L(label)}</h3><div class="f-seg">${values.map(n => chip(`data-count="${key}" data-value="${n}"`, String(n), state.design.params[key] === n)).join('')}</div>`;

function partsPanel() {
  const head = `<h2>${L('tabParts')}</h2>`, body = partsBody();
  return body.replace(head, head + kindRow() + startSection()) + linesSection();
}
function partsBody() {
  const p = state.design.params;
  if (isBedroom()) return bedroomPartsPanel(p);
  if (isStorage()) return storagePartsPanel(p);
  if (isKitchen()) return kitchenPartsPanel(p);
  if (isBath()) return bathPartsPanel(p);
  if (!isTable()) {
    const legs = ['legs', 'frame'].includes(p.baseType);
    return `<h2>${L('tabParts')}</h2>${enumGroup('armType', 'arm')}${enumGroup('backType', 'back')}${enumGroup('seatType', 'seat')}${counter('seatCount', 'seats', [1, 2, 3, 4])}
    ${enumGroup('cushionEdge', 'cushionEdge')}${enumGroup('baseType', 'base')}${legs ? enumGroup('legType', 'legType') : ''}${enumGroup('welt', 'welt')}${counter('pillows', 'pillows', [0, 1, 2, 3, 4])}${p.pillows ? enumGroup('pillowType', 'pillowType') : ''}`;
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

// ---- RİTMO case goods: layout (bays → cells) and front language --------------------------------------
const CELL_COLORS = ['white', 'cream', 'sand', 'greige', 'taupe', 'mink', 'silver', 'anthracite', 'black', 'sage', 'olive', 'petrol', 'navy', 'iceBlue', 'dustyRose', 'coral', 'mustard', 'camel', 'chocolate', 'cherryRed', 'emerald'];
const selCell = () => { const p = state.design.params, s = state.sel || {b: 0, c: 0}; const b = Math.min(s.b, p.bays.length - 1), c = Math.min(s.c, p.bays[b].cells.length - 1); return {b, c}; };
function storagePartsPanel(p) {
  const k = state.design.kind, E = familyOf(state.design).mod.ENUMS;
  return `<h2>${L('tabParts')}</h2>${layoutEditor(p)}
  ${k === 'wardrobe' ? enumGroup('doorType', 'doorType') : ''}
  ${p.doorType === 'sliding' ? '' : enumGroup('frontFit', 'frontFit')}
  ${enumGroup('frontStyle', 'frontStyle')}${enumGroup('pull', 'pull')}
  ${enumGroup('base', 'caseBase', 'sBase', k === 'wardrobe' ? ['plinth', 'legs'] : E.base)}
  ${p.base === 'legs' ? enumGroup('legType', 'legType', 'sLegType') : ''}
  ${p.doorType === 'sliding' ? '' : enumGroup('topType', 'topType')}
  ${enumGroup('caseEdge', 'caseEdge')}
  ${['dresser', 'vanity', 'sideboard'].includes(k) ? enumGroup('mirror', 'mirror') : ''}
  ${['bookcase', 'tvunit', 'vitrine', 'sideboard'].includes(k) ? enumGroup('backPanel', 'backPanelL') + enumGroup('led', 'ledL') : ''}`;
}
/** Front elevation of the layout (clickable cells) and the controls of the selected cell and bay. */
function layoutEditor(p) {
  const g = state.compiled.meta.grid; if (!g) return '';
  const {b: sb, c: sc} = selCell(), W = g.W, H = g.H, pad = W * 0.04, sw = Math.max(W, H) / 260, fs = Math.min(W / 20, H / 12, 64);
  const out = [`<rect x="${-W / 2}" y="${-H}" width="${W}" height="${H - g.yB}" fill="#fff" stroke="#1f2420" stroke-width="${sw * 1.4}"/>`, `<line x1="${-W / 2 - pad}" y1="0" x2="${W / 2 + pad}" y2="0" stroke="#1f2420" stroke-width="${sw}"/>`];
  g.bays.forEach((bay, i) => bay.cells.forEach((cg, j) => {
    const c = p.bays[i].cells[j], x0 = bay.x0, x1 = bay.x1, y0 = cg.y0, y1 = cg.y1, w = x1 - x0, h = y1 - y0, on = i === sb && j === sc;
    const fill = c.color && c.type !== 'open' && c.type !== 'knee' ? COLORS[c.color].hex : {door: '#f3eee4', glass: '#e8f0f2', mirror: '#dfe7ea', drawers: '#ece5d8', open: '#fbfaf6', knee: 'none'}[c.type];
    out.push(`<g data-cell="${i}:${j}" style="cursor:pointer"><rect x="${x0}" y="${-y1}" width="${w}" height="${h}" fill="${fill === 'none' ? 'rgba(0,0,0,0)' : fill}" stroke="#1f2420" stroke-width="${sw}" ${c.type === 'knee' ? `stroke-dasharray="${sw * 6} ${sw * 4}"` : ''}/>`);
    if (c.type === 'drawers') for (let m = 1; m < c.n; m++) out.push(`<line x1="${x0}" y1="${-(y0 + h * m / c.n)}" x2="${x1}" y2="${-(y0 + h * m / c.n)}" stroke="#1f2420" stroke-width="${sw}"/>`);
    if (['door', 'glass', 'mirror'].includes(c.type)) {
      const leaves = leafCount(w + g.T), lw = w / leaves;
      for (let l = 0; l < leaves; l++) { const a = x0 + l * lw, side = leaves === 1 ? (p.bays.length === 1 || i % 2 === 0 ? 1 : -1) : l % 2 === 0 ? 1 : -1, hx = side > 0 ? a : a + lw, ox = side > 0 ? a + lw : a;
        if (l) out.push(`<line x1="${a}" y1="${-y0}" x2="${a}" y2="${-y1}" stroke="#1f2420" stroke-width="${sw}"/>`);
        out.push(`<polyline points="${hx},${-y1} ${ox},${-(y0 + h / 2)} ${hx},${-y0}" fill="none" stroke="#8b8577" stroke-width="${sw * 0.8}" stroke-dasharray="${sw * 5} ${sw * 3}"/>`); }
    }
    if (['door', 'glass', 'mirror', 'open'].includes(c.type) && c.inside === 'shelves') for (let m = 1; m <= c.k; m++) out.push(`<line x1="${x0 + w * 0.06}" y1="${-(y0 + h * m / (c.k + 1))}" x2="${x1 - w * 0.06}" y2="${-(y0 + h * m / (c.k + 1))}" stroke="#b9b2a3" stroke-width="${sw * 0.8}"/>`);
    if (['hang', 'double', 'hangDrawers'].includes(c.inside) && c.type !== 'drawers') for (const yy of c.inside === 'double' ? [y1 - 60, y0 + h / 2 - 60] : [y1 - 60]) out.push(`<line x1="${x0 + w * 0.08}" y1="${-yy}" x2="${x1 - w * 0.08}" y2="${-yy}" stroke="#8b8577" stroke-width="${sw * 2}" stroke-linecap="round"/>`);
    const label = c.type === 'drawers' ? `${c.n} × ${partName('cellType', 'drawers', state.lang)}` : partName('cellType', c.type, state.lang) + (['door', 'glass', 'mirror', 'open'].includes(c.type) && c.inside !== 'shelves' && c.inside !== 'empty' ? ` · ${partName('inside', c.inside, state.lang)}` : '');
    if (h > fs * 1.4) out.push(`<text x="${(x0 + x1) / 2}" y="${-(y0 + h / 2) + fs * 0.35}" font-size="${Math.min(fs, w / Math.max(6, label.length * 0.62))}" text-anchor="middle" fill="#5c625a" style="pointer-events:none">${esc(label)}</text>`);
    if (on) out.push(`<rect x="${x0 + sw * 2}" y="${-y1 + sw * 2}" width="${w - sw * 4}" height="${h - sw * 4}" fill="none" stroke="#a24a2a" stroke-width="${sw * 3}" style="pointer-events:none"/>`);
    out.push('</g>');
  }));
  const svg = `<svg class="f-layout-svg" viewBox="${-W / 2 - pad} ${-H - pad} ${W + 2 * pad} ${H + 2 * pad}" role="img" aria-label="${esc(L('layout'))}">${out.join('')}</svg>`;
  // Controls of the selected cell / bay.
  const k = state.design.kind, bay = p.bays[sb], c = bay.cells[sc], gb = g.bays[sb], cellH = Math.round(gb.cells[sc].y1 - gb.cells[sc].y0), bayW = Math.round(gb.x1 - gb.x0);
  const types = CELL_TYPES.filter(t => t !== 'knee' || (k === 'vanity' && sc === 0));
  const insides = (k === 'wardrobe' ? INSIDE : ['shelves', 'glassShelves', 'empty']).filter(t => t !== 'glassShelves' || ['glass', 'open', 'mirror'].includes(c.type));
  const interiorH = Math.round(g.top - (bay.cells[0].type === 'knee' ? 0 : g.yB + g.T)), maxCell = Math.max(120, interiorH - (bay.cells.length - 1) * (120 + g.T));
  const maxBay = Math.max(260, Math.round(W - (p.bays.length - 1) * 260 - (p.bays.length + 1) * g.T));
  const slider = (attr, label, lo, hi, v, autoAttr, isAuto) => `<div class="f-slider"><label>${esc(label)}${isAuto ? ` · <small>${L('auto')}</small>` : ''}</label><input type="range" ${attr} min="${lo}" max="${hi}" step="5" value="${Math.min(hi, Math.max(lo, v))}"><span class="f-num">${v} mm</span></div>${isAuto ? '' : `<div class="f-actions f-actions-tight"><button class="f-link" ${autoAttr}>${L('auto')}</button></div>`}`;
  const nb = p.bays.length;
  return `<section class="f-layoutbox"><h3>${L('layout')}</h3>
  <div class="f-seg">${L('bayCount')}: ${chip('data-baycount="' + Math.max(1, nb - 1) + '"', '−', false, nb <= 1 ? 'disabled' : '')}<b class="f-count">${nb}</b>${chip('data-baycount="' + Math.min(12, nb + 1) + '"', '+', false, nb >= 12 ? 'disabled' : '')}</div>${svg}<p class="f-note">${L('layoutHint')}</p>
  <h3>${L('bayN')} ${sb + 1} · ${L('cellType')} ${sc + 1}</h3>
  <div class="f-chips">${types.map(t => chip(`data-celltype="${t}"`, partName('cellType', t, state.lang), c.type === t)).join('')}</div>
  ${c.type === 'drawers' ? `<h3>${L('drawerCount')}</h3><div class="f-seg">${[1, 2, 3, 4, 5, 6].map(n => chip(`data-cellset="n" data-value="${n}"`, String(n), c.n === n)).join('')}</div>` : ''}
  ${['door', 'drawers', 'mirror'].includes(c.type) ? `<h3>${L('cellColor')}</h3><div class="f-swatches"><button class="f-swatch f-swatch-none" data-cellcolor="" aria-pressed="${!c.color}" title="${esc(L('frontMat'))}">∅</button>${CELL_COLORS.map(k => `<button class="f-swatch" data-cellcolor="${k}" style="--c:${COLORS[k].hex}" aria-pressed="${c.color === k}" title="${esc(N(COLORS[k]))}"><span class="sr">${esc(N(COLORS[k]))}</span></button>`).join('')}</div>` : ''}
  ${['door', 'glass', 'mirror', 'open'].includes(c.type) ? `<h3>${L('inside')}</h3><div class="f-chips">${insides.map(t => chip(`data-cellset="inside" data-value="${t}"`, partName('inside', t, state.lang), c.inside === t)).join('')}</div>
    ${c.inside === 'shelves' ? `<h3>${L('shelvesN')}</h3><div class="f-seg">${[0, 1, 2, 3, 4, 5, 6].map(n => chip(`data-cellset="k" data-value="${n}"`, String(n), c.k === n)).join('')}</div>` : ''}` : ''}
  ${bay.cells.length > 1 ? slider('data-cellmm', L('cellHeight'), 100, maxCell, cellH, 'data-cellauto="1"', !c.mm) : ''}
  ${p.bays.length > 1 ? slider('data-baymm', L('bayWidth'), 260, maxBay, bayW, 'data-bayauto="1"', !bay.mm) : ''}
  <div class="f-actions"><button class="f-secondary" data-cellop="split" ${bay.cells.length >= 8 || cellH < 260 ? 'disabled' : ''}>${L('splitCell')}</button><button class="f-secondary" data-cellop="merge" ${sc >= bay.cells.length - 1 ? 'disabled' : ''}>${L('mergeCell')}</button></div>
  <div class="f-actions"><button class="f-secondary" data-bayop="add" ${p.bays.length >= 8 ? 'disabled' : ''}>+ ${L('addBay')}</button><button class="f-secondary" data-bayop="remove" ${p.bays.length <= 1 ? 'disabled' : ''}>− ${L('removeBay')}</button></div></section>`;
}
/** Apply a layout edit to the selected cell / bay. */
function layoutAction(d) {
  const p = state.design.params, bays = structuredClone(p.bays), {b, c} = selCell(), bay = bays[b], cell = bay.cells[c];
  if (d.baycount) {
    // Any number of bays (1–12): new bays copy the last one; widths are shared until the customer sets them.
    const n = +d.baycount; while (bays.length < n) bays.push({...structuredClone(bays.at(-1)), mm: 0}); bays.length = n;
    for (const x of bays) x.mm = 0;
    // Wider pieces for many bays: keep a door about 450–600 mm.
    // The piece grows or shrinks with the bays so each keeps its width (door about the same as before).
    const [lo, hi] = familyOf(state.design).mod.rangeFor('width', p), width = Math.round(Math.min(hi, Math.max(lo, p.width / p.bays.length * n)) / 10) * 10;
    state.sel = {b: Math.min(b, n - 1), c: 0};
    setDesign(withParams({bays, width})); return true;
  }
  if (d.cellcolor !== undefined) cell.color = d.cellcolor || null;
  else if (d.celltype) { cell.type = d.celltype; if (cell.type === 'drawers' && !cell.n) cell.n = 2; if (cell.type === 'open' && !['shelves', 'empty'].includes(cell.inside)) cell.inside = 'shelves'; }
  else if (d.cellset) cell[d.cellset] = d.cellset === 'inside' ? d.value : +d.value;
  else if (d.cellauto) cell.mm = 0;
  else if (d.bayauto) bay.mm = 0;
  else if (d.cellop === 'split') { const h = (cell.h || 1) / 2; bay.cells.splice(c, 1, {...cell, h, mm: 0}, {...structuredClone(cell), h, mm: 0}); }
  else if (d.cellop === 'merge' && c < bay.cells.length - 1) { const up = bay.cells[c + 1]; cell.h = (cell.h || 1) + (up.h || 1); cell.mm = cell.mm && up.mm ? cell.mm + up.mm : 0; if (cell.type === 'drawers' && up.type === 'drawers') cell.n = Math.min(6, cell.n + up.n); bay.cells.splice(c + 1, 1); }
  else if (d.bayop === 'add') { bays.splice(b + 1, 0, structuredClone({...bay, mm: 0})); state.sel = {b: b + 1, c: 0}; }
  else if (d.bayop === 'remove' && bays.length > 1) { bays.splice(b, 1); state.sel = {b: Math.max(0, b - 1), c: 0}; }
  else return false;
  setDesign(withParams({bays}));
  return true;
}

// ---- Bathroom: vanity unit with its top and basin, tall column, mirror or mirror cabinet ----------------
function bathPartsPanel(p) {
  const k = p.kind, cab = k !== 'mirror' || p.mirrorCabinet === 'cabinet';
  return `<h2>${L('tabParts')}</h2>
  ${k === 'mirror' ? enumGroup('mirrorCabinet', 'bMirrorCabinet', 'bMirrorCabinet') : ''}
  ${k === 'mirror' && !cab ? enumGroup('mirror', 'mirror') + enumGroup('mirrorLight', 'bMirrorLight', 'bMirrorLight') : ''}
  ${k === 'basin' ? enumGroup('basinType', 'bBasinType', 'bBasinType') + enumGroup('basinShape', 'bBasinShape', 'bBasinShape') + (p.width >= 1100 ? enumGroup('basins', 'bBasins', 'bBasins') : '') + enumGroup('tap', 'bTap', 'bTap') : ''}
  ${cab ? layoutEditor(p) : ''}
  ${cab ? enumGroup('frontStyle', 'frontStyle') + enumGroup('pull', 'pull') : ''}
  ${k !== 'mirror' ? enumGroup('base', 'caseBase', 'sBase') + (p.base === 'legs' ? enumGroup('legType', 'legType', 'sLegType') : '') : ''}
  ${cab ? enumGroup('caseEdge', 'caseEdge') : ''}
  ${k === 'basin' ? `<p class="f-note">${L('bathNote')}</p>` : ''}`;
}

// ---- Kitchen: modules along the run ---------------------------------------------------------------
const KTYPES = ['drawers', 'doors', 'drawerDoor', 'sink', 'hob', 'oven', 'dishwasher', 'open', 'tallFridge', 'tallOven', 'pantry'];
const KWIDTHS = {dishwasher: [450, 600], oven: [600], tallFridge: [600], tallOven: [600], hob: [600, 800, 900, 1000, 1200], sink: [450, 500, 600, 800, 900, 1000, 1200]};
const kSel = () => Math.min(state.ksel || 0, state.design.params.modules.length - 1);
function kitchenPartsPanel(p) {
  const g = state.compiled.meta.grid, i = kSel(), m = p.modules[i], run = p.kind === 'run', tall = ['tallFridge', 'tallOven', 'pantry'].includes(m.type);
  const W = g.total, H = run ? g.tallTop + 120 : g.baseTop + 120, pad = W * 0.03, sw = Math.max(W, H) / 300, fs = Math.min(70, H / 14);
  const out = [`<line x1="${-W / 2 - pad}" y1="0" x2="${W / 2 + pad}" y2="0" stroke="#1f2420" stroke-width="${sw}"/>`];
  g.modules.forEach((x, k) => {
    const t = ['tallFridge', 'tallOven', 'pantry'].includes(x.type), top = t ? g.tallTop : g.baseTop + 30, on = k === i;
    out.push(`<g data-mod="${k}" style="cursor:pointer"><rect x="${x.x0}" y="${-top}" width="${x.x1 - x.x0}" height="${top - g.plinth}" fill="${x.type === 'dishwasher' ? '#e6e8e8' : '#f3eee4'}" stroke="#1f2420" stroke-width="${sw}"/>`);
    if (run && x.wall !== 'none' && !t) out.push(`<rect x="${x.x0}" y="${-g.tallTop}" width="${x.x1 - x.x0}" height="${g.tallTop - g.wallY0}" fill="${x.wall === 'hood' ? '#e2e5e6' : x.wall === 'glass' ? '#e8f0f2' : '#f7f3ea'}" stroke="#1f2420" stroke-width="${sw}"/>`);
    const label = partName('kBase', x.type, state.lang);
    out.push(`<text x="${(x.x0 + x.x1) / 2}" y="${-(g.plinth + (top - g.plinth) / 2)}" font-size="${Math.min(fs, (x.x1 - x.x0) / Math.max(5, label.length * 0.6))}" text-anchor="middle" fill="#5c625a" style="pointer-events:none">${esc(label)}</text>`);
    if (on) out.push(`<rect x="${x.x0 + sw * 2}" y="${-(run && !t && x.wall !== 'none' ? g.tallTop : top) + sw * 2}" width="${x.x1 - x.x0 - sw * 4}" height="${(run && !t && x.wall !== 'none' ? g.tallTop : top) - g.plinth - sw * 4}" fill="none" stroke="#a24a2a" stroke-width="${sw * 3}" style="pointer-events:none"/>`);
    out.push('</g>');
  });
  const svg = `<svg class="f-layout-svg" viewBox="${-W / 2 - pad} ${-H} ${W + 2 * pad} ${H + pad}">${out.join('')}</svg>`;
  const types = KTYPES.filter(t => run || !['tallFridge', 'tallOven', 'pantry'].includes(t)), widths = KWIDTHS[m.type] || [150, 300, 400, 450, 500, 600, 800, 900, 1000, 1200];
  return `<h2>${L('tabParts')}</h2><section class="f-layoutbox"><h3>${L('kModules')} · ${p.modules.length} · ${g.total} mm</h3>${svg}<p class="f-note">${L('kHint')}</p>
  <h3>${L('kModule')} ${i + 1} · ${L('kBaseType')}</h3><div class="f-chips">${types.map(t => chip(`data-mtype="${t}"`, partName('kBase', t, state.lang), m.type === t)).join('')}</div>
  <h3>${L('width')}</h3><div class="f-seg">${widths.map(w => chip(`data-mw="${w}"`, String(w), m.w === w)).join('')}</div>
  ${run && !tall ? `<h3>${L('kWallType')}</h3><div class="f-chips">${['doors', 'glass', 'open', 'flap', 'hood', 'none'].map(t => chip(`data-mwall="${t}"`, partName('kWall', t, state.lang), m.wall === t)).join('')}</div>` : ''}
  <div class="f-actions"><button class="f-secondary" data-mop="left" ${i === 0 ? 'disabled' : ''}>← ${L('moveLeft')}</button><button class="f-secondary" data-mop="right" ${i >= p.modules.length - 1 ? 'disabled' : ''}>${L('moveRight')} →</button></div>
  <div class="f-actions"><button class="f-secondary" data-mop="add" ${p.modules.length >= 16 ? 'disabled' : ''}>+ ${L('addModule')}</button><button class="f-secondary" data-mop="remove" ${p.modules.length <= 1 ? 'disabled' : ''}>− ${L('removeModule')}</button></div></section>
  ${enumGroup('sink', 'sinkL')}${p.sink === 'drainer' ? '' : enumGroup('sinkMount', 'sinkMountL')}${enumGroup('tap', 'tapL')}${enumGroup('hob', 'hobL')}
  ${run ? enumGroup('hood', 'hoodL') + enumGroup('backsplash', 'backsplashL') : ''}
  ${enumGroup('frontStyle', 'frontStyle')}${enumGroup('frontFit', 'frontFit')}${enumGroup('pull', 'pull')}${enumGroup('caseEdge', 'caseEdge')}`;
}
function kitchenAction(d) {
  const p = state.design.params, mods = structuredClone(p.modules), i = kSel(), m = mods[i];
  if (d.mod !== undefined) { state.ksel = +d.mod; renderPanel(); return; }
  if (d.mtype) { m.type = d.mtype; if (KWIDTHS[m.type] && !KWIDTHS[m.type].includes(m.w)) m.w = KWIDTHS[m.type].includes(600) ? 600 : KWIDTHS[m.type][0]; if (['tallFridge', 'tallOven', 'pantry'].includes(m.type)) m.wall = 'none'; else if (m.type === 'hob' && p.kind === 'run') m.wall = 'hood'; else if (m.wall === 'none' && p.kind === 'run') m.wall = 'doors'; }
  else if (d.mw) m.w = +d.mw;
  else if (d.mwall) m.wall = d.mwall;
  else if (d.mop === 'left' && i > 0) { [mods[i - 1], mods[i]] = [mods[i], mods[i - 1]]; state.ksel = i - 1; }
  else if (d.mop === 'right' && i < mods.length - 1) { [mods[i + 1], mods[i]] = [mods[i], mods[i + 1]]; state.ksel = i + 1; }
  else if (d.mop === 'add') { mods.splice(i + 1, 0, structuredClone(m)); state.ksel = i + 1; }
  else if (d.mop === 'remove' && mods.length > 1) { mods.splice(i, 1); state.ksel = Math.max(0, i - 1); }
  setDesign(withParams({modules: mods}));
}

const UNIT = {armTop: '', armFlare: '', armSlope: '', legTaper: '', backRake: '°', channelCount: '', seatCount: '', shapeN: '', boatBow: '', footSpread: '', legSplay: '°', scallops: '', graduation: '', mirrorWidth: ''};
function sizeGroups() {
  const d = state.design, p = d.params;
  if (isKitchen()) {
    const g = [['general', ['worktopHeight', 'topThickness', 'topDepth', 'plinthHeight']]];
    if (p.kind === 'run') g.push(['wallUnits', ['wallGap', 'wallHeight', 'wallDepth']]);
    const con = [...(['grooved', 'fluted', 'slats'].includes(p.frontStyle) ? ['fluteWidth'] : []), ...(p.board === 'solid' || p.frontBoard === 'solid' ? ['solidThickness'] : [])];
    if (con.length) g.push(['construction', con]);
    return g;
  }
  if (isBath()) {
    const con = [...(p.kind === 'basin' ? ['topThickness'] : []), ...(['grooved', 'fluted', 'slats'].includes(p.frontStyle) ? ['fluteWidth'] : []), ...(p.board === 'solid' || p.frontBoard === 'solid' ? ['solidThickness'] : [])];
    return [['general', ['width', 'height', 'depth', 'mountHeight']], ...(con.length ? [['construction', con]] : [])];
  }
  if (isStorage()) {
    const g = [['general', ['width', 'height', 'depth']]];
    g.push(['base', p.base === 'plinth' ? ['plinthHeight'] : p.base === 'legs' ? ['legHeight', 'legSize'] : ['legHeight']]);
    const con = [...(p.topType === 'slab' ? ['topThickness', 'topOverhang'] : []), ...(['grooved', 'fluted', 'slats'].includes(p.frontStyle) ? ['fluteWidth'] : []), ...(p.board === 'solid' || p.frontBoard === 'solid' ? ['solidThickness'] : [])];
    if (con.length) g.push(['construction', con]);
    if (p.mirror !== 'none') g.push(['mirror', ['mirrorHeight', 'mirrorWidth']]);
    return g;
  }
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
    g.push(['cushions', ['cushionThickness', 'cushionCrown', ...(p.pillows ? ['pillowSize'] : [])]]);
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
/** Parameter label (case goods have their own wording for a few shared keys). */
const paramName = k => { if (isBath()) { const n = partName('bParams', k, state.lang); if (n !== k) return n; } if (isKitchen()) { const n = partName('kParams', k, state.lang); if (n !== k) return n; } if (isPanel()) { const n = partName('sParams', k, state.lang); if (n !== k) return n; } return partName('params', k, state.lang); };
function sizePanel() {
  const fam = familyOf(state.design), p = state.design.params;
  const note = isPanel() ? `<p class="f-note">${esc(L('constructionNote').replace('{T}', state.compiled.meta.board))}</p>` : '';
  return `<h2>${L('tabSize')}</h2>${note}${sizeGroups().map(([g, keys]) => keys.length ? `<h3>${L(g)}</h3>${keys.map(k => { const [lo, hi, step] = fam.mod.rangeFor ? fam.mod.rangeFor(k, p) : fam.mod.RANGES[k], u = UNIT[k] ?? 'mm'; return `<div class="f-slider"><label for="r-${k}">${esc(paramName(k))}</label><input type="range" id="r-${k}" data-param="${k}" min="${lo}" max="${hi}" step="${step}" value="${p[k]}"><span class="f-num"><input type="number" data-num="${k}" min="${lo}" max="${hi}" step="${step}" value="${p[k]}" aria-label="${esc(paramName(k))}">${u}</span></div>`; }).join('')}` : '').join('')}
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

function materialPanel() { return isTable() ? tableMaterialPanel() : isPanel() ? storageMaterialPanel() : isBedroom() ? bedroomMaterialPanel() : seatingMaterialPanel(); }
const sameFront = m => JSON.stringify(m.front) === JSON.stringify(m.case);
function storageMaterialPanel() {
  const d = state.design, m = d.materials, p = d.params, same = sameFront(m), kinds = ['wood', 'veneer', 'lacquer'];
  const glass = p.bays ? p.bays.some(b => b.cells.some(c => c.type === 'glass')) : p.modules.some(x => x.wall === 'glass');
  return `<h2>${L('tabMaterial')}</h2>
  <div class="f-fabric-preview"><div class="f-swatchpair"><figure><canvas id="surfacePreview" width="320" height="320" aria-label="${esc(L('carcassMat'))}"></canvas><figcaption>${L('carcassMat')}</figcaption></figure><figure><canvas id="frontPreview" width="320" height="320" aria-label="${esc(L('frontMat'))}"></canvas><figcaption>${L('frontMat')}</figcaption></figure></div>
  <div><p class="f-eyebrow">${L('carcassMat')} · ${state.compiled.meta.board} mm</p><p class="f-fabric-name">${esc(surfaceShort(m.case))}</p><p class="f-eyebrow">${L('frontMat')} · ${state.compiled.meta.front} mm</p><p class="f-fabric-name">${esc(surfaceShort(m.front))}</p></div></div>
  <h3>${L('carcassMat')}</h3><div class="f-chips">${kinds.map(k => chip(`data-mat="case.surface" data-value="${k}"`, N(SURFACES[k]), m.case.surface === k)).join('')}</div>
  ${surfaceOptions('case', m.case)}
  <h2 class="f-h2-sub">${L('frontMat')}</h2><div class="f-chips">${chip('data-front-same="1"', L('sameAsCase'), same)}${kinds.map(k => chip(`data-mat="front.surface" data-value="${k}"`, N(SURFACES[k]), !same && m.front.surface === k)).join('')}</div>
  ${same ? '' : surfaceOptions('front', m.front)}
  ${p.base === 'legs' && p.legType !== 'metal' ? `<h3>${L('legWood')}</h3>${woodChips('wood', m.wood)}<h3>${L('stain')}</h3>${stainChips('wood', m.wood)}` : ''}
  <h3>${L('metal')}</h3>${metalChips('data-mat="metal.finish"', m.metal.finish)}
  ${m.top ? `<h2 class="f-h2-sub">${L('worktopMat')}</h2><div class="f-chips">${['stone', 'wood', 'lacquer'].map(k => chip(`data-mat="top.surface" data-value="${k}"`, N(SURFACES[k]), m.top.surface === k)).join('')}</div>${surfaceOptions('top', m.top)}
  <h3>${L('sinkFinish')}</h3><div class="f-chips">${['steel', 'black', 'grey', 'white'].map(k => chip(`data-mat="sink.finish" data-value="${k}"`, partName('sinkFinish', k, state.lang), m.sink.finish === k)).join('')}</div>` : ''}
  ${glass ? `<h3>${L('glassKind')}</h3><div class="f-chips">${Object.keys(GLASS).map(k => `<button class="f-chip f-wood" data-mat="glass.glass" data-value="${k}" aria-pressed="${m.glass.glass === k}" style="--c:${GLASS[k].hex}">${esc(N(GLASS[k]))}</button>`).join('')}</div>` : ''}`;
}

function fabricSection(f) {
  const F = FIBERS[f.fiber], canPattern = !HIDES.includes(f.fiber), motifs = MOTIF_CHOICES[f.pattern];
  return `<h3>1 · ${L('fiber')}</h3><div class="f-chips">${Object.keys(FIBERS).map(k => chip(`data-mat="fabric.fiber" data-value="${k}"`, N(FIBERS[k]), f.fiber === k)).join('')}</div>
  ${F.weave ? `<h3>${L('weave')}</h3><div class="f-weaves">${Object.keys(WEAVES).map(k => `<button class="f-weave" data-mat="fabric.weave" data-value="${k}" aria-pressed="${f.weave === k}"><canvas data-draft="${k}" width="64" height="64"></canvas><span>${esc(N(WEAVE_NAMES[k]))}</span></button>`).join('')}</div><p class="f-note">${L('weaveNote')}</p>` : ''}
  <h3>2 · ${L('color')}</h3>${swatches('data-color="fabric.color" data-value', f.color)}
  ${canPattern ? `<h3>3 · ${L('pattern')}</h3><div class="f-chips">${Object.keys(PATTERNS).map(k => chip(`data-mat="fabric.pattern" data-value="${k}"`, N(PATTERNS[k]), f.pattern === k)).join('')}</div>` : ''}
  ${motifs ? `<h3>${L('motif')}</h3><div class="f-chips">${motifs.map(k => chip(`data-mat="fabric.motif" data-value="${k}"`, N(MOTIF_NAMES[k]), f.motif === k)).join('')}</div>` : ''}
  ${canPattern && f.pattern !== 'none' ? `<h3>4 · ${L('density')}</h3><div class="f-slider"><label for="r-density">${L('sparse')} ↔ ${L('dense')}</label><input type="range" id="r-density" data-fabric-density min="1" max="6" step="1" value="${f.density}"><span class="f-num">${f.density} / 6</span></div>
  <h3>${L('color2')}</h3>${swatches('data-color="fabric.color2" data-value', f.color2)}` : ''}`;
}
const fabricPreview = (f, label) => `<div class="f-fabric-preview"><div class="f-swatchpair"><figure><canvas id="fabricMacro" width="320" height="320" aria-label="${esc(label)}"></canvas><figcaption>${L('macro')}</figcaption></figure><figure><canvas id="fabricPreview" width="320" height="320" aria-label="${esc(label)}"></canvas><figcaption id="tileNote"></figcaption></figure></div><div><p class="f-eyebrow">${esc(label)}</p><p class="f-fabric-name">${esc(N(FIBERS[f.fiber]))}${FIBERS[f.fiber].weave ? ' · ' + esc(N(WEAVE_NAMES[f.weave])) : ''}<br>${esc(N(COLORS[f.color]))}${f.pattern !== 'none' ? ' · ' + esc(N(PATTERNS[f.pattern])) + (f.motif ? ' (' + esc(N(MOTIF_NAMES[f.motif])) + ')' : '') : ''}</p></div></div>`;

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
  const m = state.design.materials, f = m.fabric, F = FIBERS[f.fiber], canPattern = !HIDES.includes(f.fiber);
  const motifs = MOTIF_CHOICES[f.pattern];
  return `<h2>${L('tabMaterial')}</h2>
  <div class="f-fabric-preview"><div class="f-swatchpair"><figure><canvas id="fabricMacro" width="320" height="320" aria-label="${esc(L('fabric'))}"></canvas><figcaption>${L('macro')}</figcaption></figure><figure><canvas id="fabricPreview" width="320" height="320" aria-label="${esc(L('fabric'))}"></canvas><figcaption id="tileNote"></figcaption></figure></div><div><p class="f-eyebrow">${L('fabric')}</p><p class="f-fabric-name">${esc(N(F))}${F.weave ? ' · ' + esc(N(WEAVE_NAMES[f.weave])) : ''}<br>${esc(N(COLORS[f.color]))}${f.pattern !== 'none' ? ' · ' + esc(N(PATTERNS[f.pattern])) + (f.motif ? ' (' + esc(N(MOTIF_NAMES[f.motif])) + ')' : '') : ''}</p></div></div>
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

// ---- Panel drawing helpers ---------------------------------------------------------------------
/** Albedo lit by the normal map with a low raking light, so the weave relief (not only colour) reads on screen. */
function litAlbedo(maps, w, h, strength = 1) {
  const out = new Uint8ClampedArray(maps.albedo.length), L = [-0.55, 0.62, 0.56], ll = Math.hypot(...L);
  for (let k = 0; k < w * h * 4; k += 4) {
    const nx = maps.normal[k] / 127.5 - 1, ny = maps.normal[k + 1] / 127.5 - 1, nz = maps.normal[k + 2] / 127.5 - 1;
    const d = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ll), f = 1 + strength * (0.55 + 0.75 * d - 1);
    out[k] = maps.albedo[k] * f; out[k + 1] = maps.albedo[k + 1] * f; out[k + 2] = maps.albedo[k + 2] * f; out[k + 3] = 255;
  }
  return out;
}
function paintTile(canvas, maps, w, h, tileMmX, tileMmY, showMm = 60, lit = 0) {
  const g = canvas.getContext('2d'), tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  tmp.getContext('2d').putImageData(new ImageData(lit && maps.normal ? litAlbedo(maps, w, h, lit) : maps.albedo, w, h), 0, 0);
  g.imageSmoothingQuality = 'high';
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
      const show = spec.pattern === 'none' ? 32 : Math.max(60, Math.min(400, maps.tileMm * 1.6));
      paintTile(fab, maps, maps.size, maps.size, maps.tileMm, maps.tileMm, show, 0.6);
      // Close-up: about twelve threads across, lit from the side, so plain, twill, basket, herringbone and satin differ.
      const macro = $('#fabricMacro'), F = FIBERS[spec.fiber];
      if (macro) { const mm = F?.weave ? Math.max(8, F.thread * 14) : 18; paintTile(macro, maps, maps.size, maps.size, maps.tileMm, maps.tileMm, mm, 0.95); macro.dataset.mm = Math.round(mm); const cap = macro.nextElementSibling; if (cap) cap.textContent = `${L('macro')} · ${Math.round(mm)} mm`; }
      const note = $('#tileNote'); if (note) note.textContent = `${Math.round(show)} × ${Math.round(show)} mm · ${state.lang === 'tr' ? 'rapor' : 'repeat'} ${maps.tileMm.toFixed(0)} mm`;
    }
    const paintSurface = (cv, s) => {
      if (!cv?.isConnected || !s) return;
      if (s.surface === 'stone') { const m = stoneMaps(s.stone, s.polish, {size: 384}); paintTile(cv, m, 384, 384, 600, 600, 400); }
      else if (s.surface === 'wood' || s.surface === 'veneer') { const m = woodMaps(s.species, s.finish, {stain: s.stain, w: 192, h: 384}); paintTile(cv, m, 192, 384, 300, 600, 300); }
      else { const g = cv.getContext('2d'); g.fillStyle = s.surface === 'glass' ? GLASS[s.glass].hex : COLORS[s.color]?.hex || '#ccc'; g.fillRect(0, 0, cv.width, cv.height); }
    };
    paintSurface(surf, state.design.materials.top || state.design.materials.case);
    paintSurface($('#frontPreview'), state.design.materials.front);
  }, 30);
}

function sheetLabels() {
  return {front: L('frontView'), side: L('sideView'), top: L('topView'), section: L('sectionView'), scale: L('scaleLabel'), units: L('units'), title: L(state.design.kind), note: L('concept'), seatDepth: L('seatDepth'), rake: L('rake'), status: L('status'), spec: L('spec'), knee: L('knee'), edgeDetail: L('edgeDetail'), mattressTop: L('mattressTop'), link: L('designLink')};
}
function specRows(b) {
  const d = state.design, c = state.compiled, m = d.materials;
  if (d.family === 'kitchen') {
    const p = c.params, mm = c.meta, o = mm.overall, pn = (g, v) => partName(g, v, state.lang);
    return [
      [L('overall'), `${o.width} × ${o.depth} × ${o.height}`], [L('worktopHeightL'), `${p.worktopHeight} · ${surfaceShort(m.top)} ${p.topThickness} mm`],
      [L('construction'), `${mm.board} mm ${L(p.board === 'solid' ? 'boardSolid' : 'boardMdf')} · 8 mm · 2 mm`], [L('kModules'), `${p.modules.length} · ${p.modules.map(x => x.w).join(' + ')}`],
      [L('frontStyle'), `${pn('frontStyle', p.frontStyle)} · ${pn('pull', p.pull)}`], [L('carcassMat'), surfaceShort(m.case)], [L('frontMat'), surfaceShort(m.front)],
      [L('sinkL'), `${pn('sink', p.sink)} · ${pn('sinkMount', p.sinkMount)} · ${pn('tap', p.tap)}`], [L('appliances'), mm.appliances.map(a => pn('appliance', a.kind)).join(', ')],
      [L('drawerCount'), `${mm.drawers}`], [L('leaves'), `${mm.leaves} · ${mm.hinges} ${L('hingesN').toLowerCase()}`], [L('weight'), `~${b.totals.weightKg} kg`]
    ];
  }
  if (d.family === 'bath') {
    const p = c.params, mm = c.meta, o = mm.overall, pn = (g, v) => partName(g, v, state.lang);
    return [
      [L('overall'), `${o.width} × ${o.depth} × ${o.height}`],
      ...(p.kind === 'basin' ? [[L('bBasinType'), `${pn('bBasinType', p.basinType)} · ${pn('bBasinShape', p.basinShape)} · ${pn('bBasins', p.basins)} · ${pn('bTap', p.tap)}`], [partName('bParams', 'mountHeight', state.lang), `${p.mountHeight}`], [L('worktopMat'), `${surfaceShort(m.top)} · ${p.topThickness} mm`]] : []),
      ...(p.kind === 'mirror' ? [[L('mirror'), `${pn('mirror', p.mirror)} · ${pn('bMirrorLight', p.mirrorLight)} · ${pn('bMirrorCabinet', p.mirrorCabinet)}`]] : []),
      ...(mm.bays ? [[L('construction'), `${mm.board} mm ${L(p.board === 'solid' ? 'boardSolid' : 'boardMdf')} · 8 mm · 2 mm`], [L('frontStyle'), `${pn('frontStyle', p.frontStyle)} · ${pn('pull', p.pull)}`], [L('carcassMat'), surfaceShort(m.case)], [L('frontMat'), surfaceShort(m.front)], [L('drawerCount'), `${mm.drawers}`], [L('leaves'), `${mm.leaves} · ${mm.hinges} ${L('hingesN').toLowerCase()}`]] : []),
      [L('weight'), `~${b.totals.weightKg} kg`]
    ];
  }
  if (d.family === 'storage') {
    const p = c.params, mm = c.meta, o = mm.overall, pn = (g, v) => partName(g, v, state.lang);
    return [
      [L('overall'), `${o.width} × ${o.depth} × ${o.height}`],
      [L('construction'), `${mm.board} mm ${L(p.board === 'solid' ? 'boardSolid' : 'boardMdf')} · ${state.lang === 'tr' ? 'arkalık' : 'back'} 8 mm · ${state.lang === 'tr' ? 'derz' : 'reveal'} 2 mm`],
      [L('layout'), `${mm.bays} ${L('bayN').toLowerCase()} · ${mm.modules} ${L('modulesN').toLowerCase()} (${mm.moduleWidths.join(' + ')})`],
      [L('frontStyle'), `${pn('frontStyle', p.frontStyle)} · ${pn('pull', p.pull)}`], [L('frontFit'), pn('frontFit', p.frontFit)],
      [L('caseBase'), `${pn('sBase', p.base)}${p.base === 'legs' ? ' · ' + pn('sLegType', p.legType) : ''}`],
      [L('carcassMat'), surfaceShort(m.case)], [L('frontMat'), surfaceShort(m.front)],
      [L('drawerCount'), `${mm.drawers}${mm.runner ? ` · ${mm.runner} mm` : ''}`], [L('leaves'), `${mm.leaves} · ${mm.hinges} ${L('hingesN').toLowerCase()}`],
      [L('innerDepth'), `${mm.innerDepth}`], [L('weight'), `~${b.totals.weightKg} kg`]
    ];
  }
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
  state.drawingCache = {key, bom: b, get sheet() { return this._sheet ??= drawingSheet(state.compiled, sheetLabels(), {title: `${L(state.design.family === 'table' ? state.design.kind : state.compiled.meta.kind)} · ${styleName(state.design.style, state.lang)}`, style: styleName(state.design.style, state.lang), date: new Date().toISOString().slice(0, 10), id: projectId(), rows: specRows(b), link: state.sheetLink || null}); }};
  return state.drawingCache;
}
const projectId = () => `F-${String(state.design.seed % 100000).padStart(5, '0')}`;

function drawDeliverables() {
  mountPlateControls();
  fetch('api/forma-submit.php', {cache: 'no-store'}).then(r => r.json()).catch(() => ({available: false})).then(s => {
    state.canSend = !!s.available;
    const ss = $('#sendState'); if (ss) ss.textContent = state.canSend ? '' : L('sendOff');
    const btn = $('#sendForm button[type=submit]'); if (btn) btn.disabled = !state.canSend;
  });
}

// ---- Project: add and continue -----------------------------------------------------------------
// The studio is not a four-step form that ends: the customer adds a piece to the project and keeps going — the same
// design in another size, a different piece, another family — then sees everything together in a room and sends
// the whole project to the designer.
const itemName = d => d.family === 'bedroom' ? L('bedroomSet') : L(d.family === 'seating' ? FAMILIES.seating.mod.compile({...d.params, kind: d.kind}).meta.kind : d.kind);
const itemDims = d => { const o = compileOf(d).meta.overall; return `${o.width} × ${o.depth} × ${o.height} mm`; };
const projectKey = () => state.project.items.map(i => designKey(i.design) + '×' + (i.qty || 1)).join('|');
function saveProject() { store.set('aura-forma-project', state.project); store.set('aura-forma-editing', state.editing); }
function addToProject() {
  const items = state.project.items, d = structuredClone(state.design), i = items.findIndex(x => x.id === state.editing);
  if (i >= 0) items[i] = {...items[i], design: d};
  else { const id = 'U' + (1 + Math.max(0, ...items.map(x => +x.id.slice(1) || 0))); items.push({id, design: d}); state.editing = id; }
  state.justAdded = true; saveProject();
  feedback(`${itemName(d)} · ${L(i >= 0 ? 'projectUpdated' : 'projectAdded')}`);
  renderPanel();
}
/** The same design language in another size of the family (sofa → loveseat / armchair; dining → coffee table …). */
function sameDesign(d, kind) {
  if (d.family === 'seating') {
    const seats = {sofa: Math.max(3, d.params.seatCount), loveseat: 2, armchair: 1}[kind], from = d.params.seatCount || 1;
    const seatW = (d.params.width - 2 * (d.params.armWidth || 0)) / from;
    const width = Math.round(2 * (d.params.armWidth || 0) + seatW * seats + (kind === 'armchair' ? 40 : 0));
    return normalizeDesign({...d, kind, params: {...d.params, kind, seatCount: seats, width, pillows: kind === 'armchair' ? Math.min(1, d.params.pillows) : Math.min(kind === 'loveseat' ? 2 : 4, d.params.pillows)}});
  }
  if (d.family === 'table') {
    const fresh = sample({family: 'table', style: d.style, kind, seed: d.seed, locks: {materials: d.materials}}), keep = ['topShape', 'edge', 'baseType', 'legType', 'pedestalType', 'stretcher', 'inlay', 'drawerPull'];
    const p = {...fresh.params, ...Object.fromEntries(keep.map(k => [k, d.params[k]])), kind};
    return normalizeDesign({...fresh, materials: structuredClone(d.materials), params: FAMILIES.table.repair(FAMILIES.table.mod.normalize(p), d.materials)});
  }
  if (d.family === 'kitchen') {
    const list = startList('kitchen', kind), e = list.find(x => x.style === d.style) || list[0], base = startDesign(e, 'kitchen', kind);
    const keep = ['frontStyle', 'pull', 'frontFit', 'caseEdge', 'caseLine', 'fluteWidth', 'solidThickness', 'sink', 'sinkMount', 'tap', 'hob', 'worktopHeight', 'topThickness', 'plinthHeight'];
    return normalizeDesign({...base, style: d.style, params: {...base.params, ...Object.fromEntries(keep.map(k => [k, d.params[k]])), kind}, materials: structuredClone(d.materials)});
  }
  if (d.family === 'bath') {
    const list = startList('bath', kind), e = list.find(x => x.style === d.style) || list[0], base = startDesign(e, 'bath', kind);
    const keep = ['frontStyle', 'pull', 'frontFit', 'caseEdge', 'caseLine', 'fluteWidth', 'solidThickness'];
    return normalizeDesign({...base, style: d.style, params: {...base.params, ...Object.fromEntries(keep.map(k => [k, d.params[k]])), kind}, materials: structuredClone(d.materials)});
  }
  if (d.family === 'storage') {
    // Same front language (face, handle, fitting, base, edge, materials) on the other piece's layout.
    const list = startList('storage', kind), e = list.find(x => x.style === d.style) || list[0], base = startDesign(e, 'storage', kind);
    const keep = ['frontStyle', 'pull', 'frontFit', 'base', 'legType', 'legSize', 'caseEdge', 'caseLine', 'topType', 'topThickness', 'fluteWidth', 'solidThickness'];
    const params = {...base.params, ...Object.fromEntries(keep.map(k => [k, d.params[k]])), kind};
    if (kind === 'wardrobe') { if (params.base === 'wall') params.base = 'plinth'; params.topType = 'flush'; }
    if (params.base === 'legs' && kind !== 'wardrobe') params.legHeight = base.params.base === 'legs' ? base.params.legHeight : 150;
    return normalizeDesign({...base, style: d.style, params, materials: structuredClone(d.materials)});
  }
  return d;
}
function startNew(d, note) { state.editing = null; state.justAdded = false; state.room = null; saveProject(); state.tab = 'parts'; setSketch(true); setDesign(d); feedback(note); }
function projectPanel() {
  const items = state.project.items, d = state.design, fam = d.family;
  // Back on a design that is already in the project (undo, reopening): it is that item, not a new one.
  if (!items.some(i => i.id === state.editing)) { const same = items.find(i => designKey(i.design) === designKey(d)); state.editing = same ? same.id : null; }
  const editing = items.find(i => i.id === state.editing);
  const changed = editing && designKey(editing.design) !== designKey(d);
  const others = fam === 'bedroom' ? [] : ui().kinds.filter(k => k !== d.kind);
  const next = state.justAdded && !changed ? `<section class="f-next"><h3>${L('whatNext')}</h3>
    ${others.map(k => `<div class="f-nextrow"><b>${esc(L(k))}</b><span><button class="f-link" data-act="same" data-kind="${k}">${L('withThisDesign')}</button><button class="f-link" data-act="fresh" data-kind="${k}">${L('designSeparately')}</button></span></div>`).join('')}
    <div class="f-nextrow"><b>${L('anotherProduct')}</b><span>${FAMILY_NAV.map(([f, k]) => `<button class="f-link" data-act="family" data-family="${f}">${esc(L(k))}</button>`).join('')}</span></div></section>` : '';
  const list = items.length ? `<h3>${L('projectItems')} · ${items.length}</h3><ol class="f-items">${items.map((it, n) => `<li ${it.id === state.editing ? 'aria-current="true"' : ''}><span class="f-n">${String(n + 1).padStart(2, '0')}</span><span><b>${esc(itemName(it.design))}</b><small>${esc(styleName(it.design.style, state.lang))} · ${esc(itemDims(it.design))}</small>
    <span class="f-qty">${L('quantity')} <button class="f-link" data-act="qty" data-item="${it.id}" data-d="-1" ${(it.qty || 1) <= 1 ? 'disabled' : ''}>−</button><b>${it.qty || 1}</b><button class="f-link" data-act="qty" data-item="${it.id}" data-d="1">+</button></span></span><span class="f-itemacts"><button class="f-link" data-act="edit" data-item="${it.id}">${L('edit')}</button><button class="f-link" data-act="remove" data-item="${it.id}">${L('remove')}</button></span></li>`).join('')}</ol>` : `<p class="f-note">${L('projectEmpty')}</p>`;
  const room = items.length ? roomSection() : '';
  const sent = state.sent, sentChanged = sent && sent.key !== projectKey();
  const send = `<h2 class="f-h2-sub">${L('sendDesigner')}</h2><p class="f-lead">${L('sendIntro')}</p>
  ${sent ? `<div class="f-sent"><p>${L('sent')} <b>${esc(sent.id)}</b></p>${sent.pdf ? `<button class="f-primary" data-dl="sentPdf">${L('sentPdf')} ↓</button>` : ''}${sentChanged ? `<p class="f-note">${L('changedAfterSend')}</p>` : ''}</div>` : ''}
  ${!sent || sentChanged ? `<form class="f-send" id="sendForm"><p class="f-note" id="sendState">${items.length ? '' : L('addFirst')}</p>
    <label>${L('name')} *<input name="name" required maxlength="120"></label><label>${L('email')} *<input name="email" type="email" required maxlength="160"></label>
    <label>${L('phone')}<input name="phone" type="tel" maxlength="40"></label><label>${L('city')}<input name="city" maxlength="120"></label>
    <label class="full">${L('note')}<textarea name="note" rows="3" maxlength="1500"></textarea></label>
    <label class="f-check full"><input type="checkbox" name="consent" required><span>${L('consent')} <a href="proje-gizlilik.html?lang=${state.lang}" target="_blank" rel="noopener">↗</a></span></label>
    <button class="f-primary" type="submit" ${items.length ? '' : 'disabled'}>${L('sendProject')} →</button></form>` : ''}`;
  return `<h2>${L('tabProject')}</h2><p class="f-lead">${L('projectIntro')}</p>
  <div class="f-current"><div><b>${esc(itemName(d))}</b><small>${esc(styleName(d.style, state.lang))} · ${esc(fam === 'bedroom' ? L('setPiecesList') : itemDims(d))}</small></div>
  <button class="f-primary" data-act="add" ${editing && !changed ? 'disabled' : ''}>${editing ? (changed ? L('saveChanges') : L('inProject')) : L('addContinue')} ${editing && !changed ? '✓' : '+'}</button></div>
  ${next}${list}${room}<div id="projectPlateHost"></div>${send}`;
}

let plateController;
async function mountPlateControls(){
  plateController?.abort();
  const host=$('#projectPlateHost');if(!host)return;
  const {plateControls,renderPlate}=await import('./scene-plates.js');
  if(!host.isConnected)return;
  const choices=state.project.items.length?state.project.items:[{id:'current',design:state.design}];
  host.innerHTML=`<label>Ürün <select id="plateProduct">${choices.map(it=>`<option value="${it.id}">${esc(itemName(it.design))} · ${esc(itemDims(it.design))}</option>`).join('')}</select></label>`+plateControls(choices[0].design.style);
  const selection=state.project.atmosphere||{};
  for(const [id,key] of [['plateTexture','texture'],['plateLight','light'],['plateCamera','camera']])if(selection[key]&&[...$('#'+id,host).options].some(o=>o.value===selection[key]))$('#'+id,host).value=selection[key];
  const render=async()=>{
    plateController?.abort();const controller=new AbortController();plateController=controller;
    const status=$('#plateStatus',host),canvas=$('#plateCanvas',host),design=choices.find(it=>it.id===$('#plateProduct',host).value).design;
    status.textContent='Görüntü hazırlanıyor…';canvas.hidden=true;
    try{await renderPlate({compiled:compileOf(design),materials:design.materials,family:design.family,texture:$('#plateTexture',host).value,light:$('#plateLight',host).value,camera:$('#plateCamera',host).value,canvas,signal:controller.signal});if(!controller.signal.aborted){canvas.hidden=false;status.textContent='';}}
    catch(error){if(error.name!=='AbortError')status.textContent=error.message;}
  };
  $('#plateRender',host).onclick=render;
  for(const select of host.querySelectorAll('select'))select.onchange=()=>{state.project.atmosphere={texture:$('#plateTexture',host).value,light:$('#plateLight',host).value,camera:$('#plateCamera',host).value};saveProject();render();};
}

// ---- Room: the whole project placed in a lit room ---------------------------------------------------
const ROOM_MATERIALS = {wall: {color: 'cream'}, floor: {surface: 'lacquer', color: 'stone', finish: 'matte'}, rug: {color: 'oat'}};
function roomSection() {
  const r = state.room, items = state.project.items, type = r?.type || suggestRoom(items), out = misfits(items, type);
  return `<section class="f-roombox"><h3>${L('room')}</h3>
  <div class="f-chips">${Object.keys(ROOM_TYPES).map(k => chip(`data-act="roomtype" data-type="${k}"`, L('room_' + k), type === k)).join('')}</div>
  ${out.length ? `<div class="f-warn">${out.map(it => `<p>${esc(L('notInRoom').replace('{item}', itemName(it.design)).replace('{room}', L('room_' + type).toLocaleLowerCase(state.lang)))} ${r?.allow?.includes(it.id) ? `<b>${L('placedAnyway')}</b>` : `<button class="f-link" data-act="allow" data-item="${it.id}">${L('placeAnyway')}</button>`}</p>`).join('')}</div>` : ''}
  <div class="f-actions"><button class="f-primary" data-act="room">${r ? L('otherLayout') + ' ↻' : L('placeInRoom') + ' →'}</button>${r ? `<button class="f-secondary" data-act="leaveRoom">${L('backToDesign')}</button>` : ''}</div>
  ${r ? `<p class="f-note">${L('layout')} ${r.layout + 1} / 3 · ${L('roomHint')}</p>` : ''}</section>`;
}
function showRoom() {
  const r = state.room; if (!r || !viewer) return;
  const items = state.project.items.filter(it => ROOM_TYPES[r.type].fits.includes(itemKind(it.design)) || r.allow.includes(it.id));
  const prepared = items.map(it => { const c = compileOf(it.design); return {id: it.id, kind: itemKind(it.design), fp: footprint(c), compiled: c, materials: it.design.materials}; });
  const plan = arrange(prepared, r.type, r.layout);
  // A rug under the seating group (centred on the coffee table) or under the dining table.
  const find = k => prepared.find(p => p.kind === k), centreOf = it => it && worldCenter(it.fp, plan.placed.find(p => p.id === it.id));
  const seat = find('sofa') || find('loveseat'), table = find('coffee') || find('dining'), c = centreOf(table) || centreOf(seat);
  let rug = null;
  if (c && r.type !== 'bedroom') {
    const along = r.type === 'dining' ? (table?.fp.w || 1600) + 1300 : Math.max((seat?.fp.w || 1800) + 600, 2000), across = r.type === 'dining' ? (table?.fp.d || 900) + 1300 : 2300;
    const turned = (centreOf(seat) || c).turned;
    rug = {x: c.x, z: c.z, w: Math.min(plan.W - 400, turned ? across : along), d: Math.min(plan.D - 400, turned ? along : across)};
  }
  document.body.dataset.room = r.type;
  viewer.setRoom({shell: roomShell(plan.W, plan.D, {rug, bed: r.type === 'bedroom' ? plan.bed : null}), roomMaterials: ROOM_MATERIALS, items: plan.placed.map(pl => { const it = prepared.find(p => p.id === pl.id); return {compiled: it.compiled, materials: it.materials, x: pl.x, z: pl.z, rot: pl.rot}; })});
  $('#designTitle').textContent = `${L('room_' + r.type)} · ${items.length} ${L('pieces')}`;
  $('#dims').textContent = `${(plan.W / 1000).toFixed(1)} × ${(plan.D / 1000).toFixed(1)} m · ${L('layout')} ${r.layout + 1} / 3`;
}
function projectAction(el) {
  const a = el.dataset.act, items = state.project.items;
  if (a === 'add') addToProject();
  else if (a === 'same') startNew(sameDesign(state.design, el.dataset.kind), `${L(el.dataset.kind)} · ${L('withThisDesign')}`);
  else if (a === 'fresh') { const list = startList(state.design.family, el.dataset.kind), e = list.find(x => x.style !== state.design.style) || list[0]; startNew(e ? startDesign(e, state.design.family, el.dataset.kind) : designForKind(state.design, el.dataset.kind), `${L(el.dataset.kind)} · ${L('designSeparately')}`); }
  else if (a === 'family') { state.editing = null; state.justAdded = false; state.room = null; saveProject(); state.tab = 'parts'; setSketch(true); switchFamily(el.dataset.family); }
  else if (a === 'edit') { const it = items.find(i => i.id === el.dataset.item); if (it) { state.editing = it.id; state.justAdded = false; state.room = null; saveProject(); state.tab = 'parts'; setSketch(true); setDesign(structuredClone(it.design)); } }
  else if (a === 'qty') { const it = items.find(i => i.id === el.dataset.item); if (it) { it.qty = Math.max(1, Math.min(999, (it.qty || 1) + +el.dataset.d)); saveProject(); renderPanel(); } }
  else if (a === 'remove') { state.project.items = items.filter(i => i.id !== el.dataset.item); if (state.editing === el.dataset.item) state.editing = null; saveProject(); if (state.room) showRoom(); renderPanel(); }
  else if (a === 'roomtype') { state.room = {type: el.dataset.type, layout: 0, allow: state.room?.allow || []}; setSketch(false); showRoom(); renderPanel(); }
  else if (a === 'allow') { state.room ??= {type: suggestRoom(items), layout: 0, allow: []}; state.room.allow.push(el.dataset.item); setSketch(false); showRoom(); renderPanel(); }
  else if (a === 'room') { state.room = state.room ? {...state.room, layout: (state.room.layout + 1) % 3} : {type: suggestRoom(items), layout: 0, allow: []}; setSketch(false); showRoom(); renderPanel(); }
  else if (a === 'leaveRoom') { delete document.body.dataset.room; state.room = null; viewer?.setRoom(null); viewer?.setDesign(shown(), state.design.materials); renderCaption(); renderPanel(); }
}

// ---- Account ------------------------------------------------------------------------------------------
function renderAccountBtn() {
  const b = $('#accountBtn'); if (!b) return;
  const u = account.user; b.textContent = u ? (u.user_metadata?.name || u.email).split(/[ @]/)[0] : L('signIn');
  b.dataset.on = u ? '1' : ''; b.title = u ? u.email : L('signIn');
}
function openAccount(first = false) {
  document.querySelector('.f-modal')?.remove();
  const u = account.user, m = document.createElement('div');
  m.className = 'f-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  const form = mode => `<form class="f-send f-auth" data-mode="${mode}">
      ${mode === 'up' ? `<label class="full">${L('name')}<input name="name" maxlength="120" autocomplete="name"></label>` : ''}
      <label class="full">${L('email')} *<input name="email" type="email" required maxlength="160" autocomplete="email"></label>
      ${mode !== 'reset' ? `<label class="full">${L('password')} *<input name="password" type="password" required minlength="8" maxlength="72" autocomplete="${mode === 'up' ? 'new-password' : 'current-password'}"></label>` : ''}
      <p class="f-note full" id="authState"></p>
      <button class="f-primary full" type="submit">${L(mode === 'up' ? 'createAccount' : mode === 'in' ? 'signIn' : 'sendReset')} →</button></form>`;
  const body = u ? `<h2>${L('account')}</h2><p class="f-lead">${esc(u.email)}</p><p class="f-note">${L('accountSaved')}</p>
      <div class="f-actions"><button class="f-secondary" data-auth="out">${L('signOut')}</button><button class="f-primary" data-auth="close">${L('continue')}</button></div>`
    : `<h2>${L(first ? 'welcomeTitle' : 'account')}</h2><p class="f-lead">${L('accountWhy')}</p>
      <nav class="f-authtabs"><button class="f-link" data-auth="up" aria-pressed="true">${L('createAccount')}</button><button class="f-link" data-auth="in">${L('signIn')}</button></nav>
      <div id="authForm">${form('up')}</div>
      <p class="f-note"><button class="f-link" data-auth="reset">${L('forgot')}</button></p>
      <div class="f-actions"><button class="f-secondary" data-auth="skip">${L('continueWithout')}</button></div>
      <p class="f-note">${L('withoutNote')}</p>`;
  m.innerHTML = `<div class="f-modal-box"><button class="f-modal-x" data-auth="close" aria-label="×">×</button>${body}</div>`;
  document.body.appendChild(m);
  const close = () => m.remove();
  m.addEventListener('click', async e => {
    const b = e.target.closest('[data-auth]'); if (!b) { if (e.target === m) close(); return; }
    const a = b.dataset.auth;
    if (a === 'close') close();
    else if (a === 'skip') { try { localStorage.setItem('aura-forma-account-skip', '1'); } catch {} close(); }
    else if (a === 'out') { await account.signOut(); for (const k of Object.keys(localStorage)) if (k.startsWith('aura-forma-') && k !== 'aura-forma-lang') localStorage.removeItem(k); location.reload(); }
    else { m.querySelector('#authForm').innerHTML = form(a); for (const t of m.querySelectorAll('.f-authtabs [data-auth]')) t.setAttribute('aria-pressed', String(t.dataset.auth === a)); }
  });
  m.addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, fd = new FormData(f), st = m.querySelector('#authState'), mode = f.dataset.mode;
    st.textContent = L('working');
    try {
      if (mode === 'up') { const r = await account.signUp(fd.get('email'), fd.get('password'), fd.get('name') || ''); if (r.confirm) { st.textContent = L('confirmEmail'); return; } }
      else if (mode === 'in') await account.signIn(fd.get('email'), fd.get('password'));
      else { await account.reset(fd.get('email')); st.textContent = L('resetSent'); return; }
      st.textContent = L('syncing');
      const changed = await account.pull(designKey); close();
      if (changed) location.reload(); else { renderAccountBtn(); feedback(L('accountSaved')); }
    } catch (err) { st.textContent = authError(err); }
  });
}
function authError(err) {
  const m = String(err?.message || err);
  if (/failed to fetch|network/i.test(m)) return L('authOffline');
  if (/invalid login/i.test(m)) return L('authWrong');
  if (/already registered|already exists/i.test(m)) return L('authExists');
  if (/password/i.test(m)) return L('authPassword');
  if (/rate limit|too many/i.test(m)) return L('authRate');
  return m;
}

// ---- Package -------------------------------------------------------------------------------
/** The whole project for the designer: per product a folder (design, drawings, parts list, render), one PDF with
 * the room view (when shown), every render and every drawing sheet, and a project summary. */
async function projectPackage() {
  const items = state.project.items, files = [], pages = [], summary = [], keep = {design: state.design, compiled: state.compiled, cache: state.drawingCache};
  // Links that open the work again in the studio: one for the whole project, one per product.
  const pLink = await projectLink(items, state.room, state.lang), links = [];
  const sheetLink = [12 / 420, (297 - 12 - 6) / 297, 0.62, (297 - 12 + 1) / 297];
  if (state.room && viewer) { const shot = await dataUrlJpeg(await viewer.photo(2)); pages.push(shot); files.push({name: 'room.jpg', data: shot.data}); }
  try {
    for (const [n, it] of items.entries()) {
      const link = await designLink(it.design, state.lang); links.push(link);
      state.design = it.design; state.compiled = compileOf(it.design); state.drawingCache = null; state.sheetLink = link;
      const dv = deliverables(), dir = `${String(n + 1).padStart(2, '0')}-${it.design.family}-${it.design.kind}/`, title = `AURA · ${itemName(it.design)}`;
      files.push({name: dir + 'design.json', data: JSON.stringify({schema: SCHEMA, link, quantity: it.qty || 1, design: it.design, derived: state.compiled.meta, issues: issuesOf(it.design, state.compiled), bom: dv.bom}, null, 2)});
      files.push({name: dir + 'drawings.svg', data: dv.sheet.svg}, {name: dir + 'drawings.dxf', data: drawingDxf(state.compiled)}, {name: dir + 'parts.csv', data: bomCsv(dv.bom)});
      files.push({name: dir + 'open-design.html', data: linkPage(link, title)}, {name: dir + 'open-design.url', data: urlShortcut(link)});
      const url = sceneModule?.renderThumbnail(state.compiled, it.design.materials, {width: 1600, height: 1000});
      if (url) { const j = await dataUrlJpeg(url); pages.push(j); files.push({name: dir + 'render.jpg', data: j.data}); }
      pages.push({...await svgToJpeg(dv.sheet.svg), link: {url: link, rect: sheetLink}});
      summary.push(`${n + 1}. ${itemName(it.design)} × ${it.qty || 1} — ${specRows(dv.bom).map(r => r.join(': ')).join(' | ')}\n   ${link}`);
    }
  } finally { state.design = keep.design; state.compiled = keep.compiled; state.drawingCache = keep.cache; state.sheetLink = null; }
  files.push({name: 'project.json', data: JSON.stringify({schema: SCHEMA, created: new Date().toISOString(), language: state.lang, link: pLink, items: items.map((i, n) => ({id: i.id, qty: i.qty || 1, family: i.design.family, kind: i.design.kind, style: i.design.style, link: links[n]})), room: state.room, note: 'Concept project generated by AURA Forma. Requires review by an AURA designer before production.'}, null, 2)});
  files.push({name: 'drawings.pdf', data: jpegPdf(pages)});
  files.push({name: 'open-project.html', data: linkPage(pLink, `AURA · ${items.length} ${L('pieces')}`)}, {name: 'open-project.url', data: urlShortcut(pLink)});
  files.push({name: 'README.txt', data: `AURA Forma project (${items.length} products)\n\nOpen the whole project in the studio:\n${pLink}\n\n${items.map((it, n) => `${n + 1}. ${itemName(it.design)} × ${it.qty || 1}\n   ${links[n]}`).join('\n')}\n\nopen-project.html     opens the whole project in the studio (double-click)\nroom.jpg              the products placed in a room (if shown)\nNN-family-kind/       per product: design.json, drawings.svg/.dxf, parts.csv (cut list), render.jpg, open-design.html\ndrawings.pdf          room view, renders and A3 drawing sheets of every product (the link on each sheet opens that design)\nproject.json          list of products, links and the room layout\n\nConcept design. Dimensions, structure and build suggestions must be checked by the designer before production.\n`});
  return {files, summary: `${summary.join('\n')}\n\n${L('designLink')}: ${pLink}`};
}
async function downloadAs(kind) {
  // The only file a customer can take is the PDF of a design already sent to the designer.
  const sent = state.sent; if (kind !== 'sentPdf' || !sent) return;
  if (!sent.pdf && sent.key === projectKey()) sent.pdf = (await projectPackage()).files.find(f => f.name === 'drawings.pdf').data;
  if (sent.pdf) download(`AURA-${sent.id}.pdf`, sent.pdf, 'application/pdf');
}

// ---- Actions (shared by UI, commands and AI) ------------------------------------------------
const SPECIES_TO_STAIN = {oak: 'oak', ash: 'lightOak', beech: 'natural', walnut: 'walnut', cherry: 'cherry', teak: 'teak', smoked: 'darkWalnut', ebonized: 'black'};
function switchFamily(family, kind) {
  const prev = store.get('aura-forma-design-' + family);
  const k = FAMILIES[family].kinds[kind] ? kind : FAMILIES[family].defaultKind, list = startList(family, k), e = list.find(x => x.style === state.design.style) || list[0];
  const next = prev?.schema === SCHEMA && (!kind || prev.kind === kind) ? prev : e ? startDesign(e, family, k) : sample({family, style: state.design.style, kind, seed: state.design.seed});
  setDesign(next);
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
      else if (a.name === 'addProject') { addToProject(); notes.push(L('projectAdded')); }
      else if (a.name === 'roomView') { if (state.project.items.length) { state.tab = 'deliver'; state.room = {type: suggestRoom(state.project.items), layout: 0, allow: []}; setSketch(false); showRoom(); renderPanel(); notes.push(L('placeInRoom')); } else notes.push(L('addFirst')); }
      else if (a.name === 'drawings' || a.name === 'send' || a.name === 'package') { state.tab = 'deliver'; renderPanel(); notes.push(L('tabDeliver')); }
      continue;
    }
    if (a.type === 'family') {
      if (a.value !== d.family) { const k = actions.find(x => x.type === 'kind' && FAMILIES[a.value].kinds[x.value])?.value; switchFamily(a.value, k); d = structuredClone(state.design); fam = familyOf(d); notes.push(L({table: 'famTable', bedroom: 'famBedroom', seating: 'famSeating', storage: 'famStorage', kitchen: 'famKitchen'}[a.value])); }
      continue;
    }
    changed = true;
    let key = a.key;
    if (d.family === 'seating' && key === 'length') key = 'width';
    if (d.family === 'bedroom') key = setKey(d, key, a, actions);
    if (a.type === 'drawers' && d.family === 'storage') {
      // "3 drawers": the selected drawer cell, else the first one, else the selected cell becomes drawers.
      const {b, c} = selCell(), all = d.params.bays.flatMap((bay, i) => bay.cells.map((cell, j) => ({cell, i, j}))), sel = d.params.bays[b]?.cells[c];
      const target = sel?.type === 'drawers' ? sel : all.find(x => x.cell.type === 'drawers')?.cell || sel;
      if (target) { target.type = 'drawers'; target.n = Math.max(1, Math.min(6, a.value)); notes.push(`${a.value} ${L('drawersN')}`); }
      continue;
    }
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
      d.params[key] = a.value; notes.push(partName(d.family === 'storage' ? ({base: 'sBase', legType: 'sLegType'}[key] || key) : d.family === 'table' && key === 'baseType' ? 'tBaseType' : d.family === 'table' && key === 'legType' ? 'legTypeT' : d.family === 'bedroom' && key === 'legType' ? 'bLegType' : ({nsBase: 'caseBase', drBase: 'caseBase', nsLayout: 'caseLayout', drLayout: 'caseLayout'}[key] || key), a.value, state.lang)); }
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
      if (['storage', 'kitchen', 'bath'].includes(d.family)) {
        // Case goods: wood words go to the carcass (and to the fronts when they match it); a colour means lacquer.
        if ((d.family === 'kitchen' || d.family === 'bath') && slot === 'top') { const patch = {[mk]: value}; if (mk === 'stone') patch.surface = 'stone'; if (mk === 'species') patch.surface = 'wood'; d.materials.top = {...d.materials.top, ...patch}; notes.push(materialLabel({slot, key: mk, value})); if (state.sketch) setSketch(false); continue; }
        if (['top', 'base', 'fabric'].includes(slot) || (slot === 'wood' && mk !== 'finish')) slot = 'case';
        if (slot === 'case' || slot === 'front') {
          const same = sameFront(d.materials), patch = {[mk]: value};
          if (mk === 'species' && d.materials[slot].surface === 'lacquer') patch.surface = 'veneer';
          if (mk === 'color') patch.surface = 'lacquer';
          d.materials[slot] = {...d.materials[slot], ...patch}; if (slot === 'case' && same) d.materials.front = {...d.materials.case};
        } else d.materials[slot] = {...d.materials[slot], [mk]: value};
        notes.push(materialLabel({slot, key: mk, value})); if (state.sketch) setSketch(false);
        continue;
      }
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
      if (state.sketch) setSketch(false);
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
/** Sketch (line drawing) while forming and sizing; colour and material appear from the material step on. */
function setSketch(on) {
  state.sketch = on; viewer?.mode(on ? 'sketch' : 'render');
  const b = $('#modeBtn'); if (b) { b.setAttribute('aria-pressed', String(!on)); b.textContent = L(on ? 'modeRender' : 'modeSketch'); }
  document.body.dataset.mode = on ? 'sketch' : 'render'; renderCaption();
}
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
  $('#accountBtn').onclick = () => openAccount();
  $('#guideBtn').onclick = () => openGuide();
  renderAccountBtn();
  $('#lang').onchange = e => { state.lang = e.target.value; store.set('aura-forma-lang', state.lang); state.drawingCache = null; shell(); };
  $('#families').onclick = e => { const b = e.target.closest('[data-family]'); if (b && b.dataset.family !== state.design.family) switchFamily(b.dataset.family); };
  for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => { viewer?.view(b.dataset.view); markView(b.dataset.view); };
  for (const b of document.querySelectorAll('[data-zoom]')) b.onclick = () => viewer?.zoom(+b.dataset.zoom);
  $('#structureBtn').onclick = toggleStructure;
  $('#openBtn').onclick = () => { state.openFronts = !state.openFronts; $('#openBtn').setAttribute('aria-pressed', String(state.openFronts)); viewer?.setDesign(shown(), state.design.materials); }; $('#photoBtn').onclick = savePhoto;
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#commandForm').onsubmit = e => { e.preventDefault(); runCommand($('#command').value); };
  $('#micBtn').onclick = listen;
  for (const b of document.querySelectorAll('[data-tab]')) b.onclick = () => { state.tab = b.dataset.tab; if (state.room && state.tab !== 'deliver') { state.room = null; delete document.body.dataset.room; viewer?.setDesign(shown(), state.design.materials); } setSketch(!['material', 'deliver'].includes(state.tab)); renderPanel(); };
  $('#modeBtn').onclick = () => setSketch(!state.sketch);

  const panel = $('#panel');
  panel.addEventListener('click', e => {
    const modEl = e.target.closest('[data-mod]');
    if (modEl) { state.ksel = +modEl.dataset.mod; renderPanel(); return; }
    const cellEl = e.target.closest('[data-cell]');
    if (cellEl) { const [b, c] = cellEl.dataset.cell.split(':').map(Number); state.sel = {b, c}; renderPanel(); return; }
    const el = e.target.closest('button, [data-load]'); if (!el) return;
    const d = el.dataset;
    if (d.act) { projectAction(el); return; }
    if (isStorage() && (d.baycount || d.cellcolor !== undefined || d.celltype || d.cellset || d.cellop || d.bayop || d.cellauto || d.bayauto)) { layoutAction(d); return; }
    if (d.frontSame) { setDesign({...state.design, materials: {...state.design.materials, front: {...state.design.materials.case}}}); return; }
    if (isKitchen() && (d.mtype || d.mw || d.mwall || d.mop)) { kitchenAction(d); return; }
    if (isPanel() && d.mat?.startsWith('case.') && sameFront(state.design.materials)) { const [, key] = d.mat.split('.'); const c = {...state.design.materials.case, [key]: d.value}; setDesign({...state.design, materials: {...state.design.materials, case: c, front: {...c}}}); return; }
    if (isPanel() && d.color?.startsWith('case.') && sameFront(state.design.materials)) { const [, key] = d.color.split('.'); const c = {...state.design.materials.case, [key]: d.value}; setDesign({...state.design, materials: {...state.design.materials, case: c, front: {...c}}}); return; }
    if (d.kind) { if (d.kind !== state.design.kind) setDesign(isBedroom() ? {...state.design, kind: d.kind, params: {...state.design.params, kind: d.kind}} : designForKind(state.design, d.kind)); }
    else if (d.startStyle) { const e = startList().find(x => x.style === d.startStyle); if (e) setDesign(startDesign(e)); }
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
    if (el.dataset.cellmm !== undefined || el.dataset.baymm !== undefined) {
      const bays = structuredClone(state.design.params.bays), {b, c} = selCell();
      if (el.dataset.cellmm !== undefined) bays[b].cells[c].mm = +el.value; else bays[b].mm = +el.value;
      setDesign(withParams({bays})); return;
    }
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
    pending = requestAnimationFrame(() => { const next = normalizeDesign(withParams({[el.dataset.param]: +el.value})); state.compiled = compileOf(next); viewer?.setDesign(shown(next), next.materials); });
  });
  panel.addEventListener('submit', async e => {
    if (e.target.id !== 'sendForm') return; e.preventDefault();
    const fd = new FormData(e.target), ss = $('#sendState');
    if (!state.canSend) { ss.textContent = L('sendOff'); return; }
    ss.textContent = L('working');
    try {
      if (!state.project.items.length) { ss.textContent = L('addFirst'); return; }
      const body = new FormData(), {files, summary} = await projectPackage(), key = projectKey();
      body.append('package', new Blob([zip(files)], {type: 'application/zip'}), `AURA-project-${state.project.items.length}.zip`);
      body.append('meta', JSON.stringify({name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), city: fd.get('city'), note: fd.get('note'), consent: !!fd.get('consent'), lang: state.lang, summary}));
      const r = await fetch('api/forma-submit.php', {method: 'POST', body}), j = await r.json();
      if (!j.ok) { ss.textContent = j.error || 'Error'; return; }
      state.sent = {id: j.id, key, pdf: files.find(f => f.name === 'drawings.pdf').data};
      store.set('aura-forma-sent-project', {id: j.id, key});
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

// ---- First-visit guide: six illustrated steps (an infographic), shown once and from the header button ------------
const GUIDE_ICONS = [
  // 1 choose: chair, table, cabinet — the cabinet picked
  '<path d="M6 40V26h10v14M6 30h10M8 26v-8h6v8"/><path d="M22 28h16M24 28v12M36 28v12"/><rect x="44" y="14" width="14" height="26" class="r"/><path d="M51 14v26M48 26h1M53 26h1" class="r"/>',
  // 2 shape: a front with cells, one tapped
  '<rect x="10" y="6" width="44" height="36"/><path d="M32 6v36M10 24h22M32 18h22M32 30h22"/><rect x="33.5" y="19.5" width="19" height="9" class="r"/><circle cx="46" cy="36" r="5" class="r"/>',
  // 3 sizes: a box with dimension lines
  '<rect x="14" y="10" width="30" height="26"/><path d="M14 42h30M14 40v4M44 40v4M50 10v26M48 10h4M48 36h4" class="r"/>',
  // 4 material: three swatches
  '<circle cx="16" cy="24" r="9"/><circle cx="32" cy="24" r="9" class="f"/><circle cx="48" cy="24" r="9" class="r"/><path d="M11 20l9 9M13 17l7 7" />',
  // 5 project and room: a plan with pieces
  '<rect x="6" y="6" width="52" height="36"/><rect x="10" y="9" width="20" height="7" class="r"/><rect x="36" y="9" width="10" height="6"/><rect x="18" y="26" width="18" height="10"/><path d="M50 30h4M52 28v4"/>',
  // 6 send: a sheet and an arrow
  '<path d="M12 6h22l8 8v28H12z"/><path d="M34 6v8h8M17 20h18M17 26h18M17 32h10"/><path d="M40 34h16M50 28l6 6-6 6" class="r"/>'
];
let guideThen = null;
const guideDue = () => !store.get('aura-forma-guide-seen');
function openGuide() {
  document.querySelector('.f-modal')?.remove();
  const m = document.createElement('div');
  m.className = 'f-modal f-guide'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', L('guideTitle'));
  const steps = [1, 2, 3, 4, 5, 6].map(i => `<li><svg viewBox="0 0 64 48" aria-hidden="true">${GUIDE_ICONS[i - 1]}</svg><span class="f-guide-n">${String(i).padStart(2, '0')}</span><b>${esc(L('guideS' + i))}</b><p>${esc(L('guideS' + i + 't'))}</p></li>`).join('');
  m.innerHTML = `<div class="f-modal-box"><button class="f-modal-x" data-guide="close" aria-label="×">×</button><p class="f-eyebrow">AURA · ${esc(L('guide'))}</p><h2>${esc(L('guideTitle'))}</h2><p class="f-note">${esc(L('guideLead'))}</p>
  <ol class="f-guide-steps">${steps}</ol><p class="f-guide-tip">${esc(L('guideTip'))}</p><div class="f-actions"><button class="f-primary" data-guide="close">${esc(L('guideStart'))} →</button></div></div>`;
  const close = () => { store.set('aura-forma-guide-seen', 1); m.remove(); const t = guideThen; guideThen = null; t?.(); };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-guide="close"]')) close(); });
  m.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.body.append(m); m.querySelector('.f-primary').focus({preventScroll: true});
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
      if (brief?.category === 'bedroom' || brief?.category === 'storage') family = 'storage';
    } catch {}
  }
  if (family === 'bedroom') family = 'storage'; // the bed-led set is no longer offered
  const storedFamily = store.get('aura-forma-family');
  family ??= ['table', 'storage', 'kitchen', 'bath'].includes(storedFamily) ? storedFamily : storedFamily === 'bedroom' ? 'storage' : 'seating';
  if (params.get('style') && FAMILIES[family].byId[params.get('style')]) style = params.get('style');
  const kind = FAMILIES[family].kinds[params.get('kind')] ? params.get('kind') : undefined;
  const fromStore = store.get('aura-forma-design-' + family) || (family === 'seating' ? store.get('aura-forma-design') : null);
  if (!note && fromStore?.schema === SCHEMA && !params.get('style') && !kind) return {design: normalizeDesign({...fromStore, family})};
  // A fresh visit opens on a curated starting model (the requested style when given, otherwise the first: AURA).
  const k = kind || FAMILIES[family].defaultKind, list = startList(family, k);
  const e = list.find(x => x.style === style && (params.get('style') || note)) || (params.get('style') || note ? null : list[0]);
  if (e) return {design: startDesign(e, family, k), note};
  return {design: sample({family, style, kind, seed: 1 + Math.floor(Math.random() * 1e6)}), note};
}

window.formaDebug = {state, get viewer() { return viewer; }, projectPackage};
const start = initialDesign();
state.design = start.design; state.compiled = compileOf(state.design);
store.set('aura-forma-design-' + state.design.family, state.design); store.set('aura-forma-family', state.design.family);
store.set('aura-forma-lang', state.lang);
{ // The project (products added so far) and which of them is being edited.
  const pr = store.get('aura-forma-project'); if (pr?.items?.length) state.project = {atmosphere:pr.atmosphere,items: pr.items.filter(i => i?.design?.schema === SCHEMA).map(i => ({...i, design: normalizeDesign(i.design)}))};
  const ed = store.get('aura-forma-editing'); state.editing = state.project.items.some(i => i.id === ed) ? ed : null;
  const prev = store.get('aura-forma-sent-project'); if (prev?.key && prev.key === projectKey()) state.sent = prev; }
shell();
// Account: restore the session; a returning signed-in customer gets the saved work; others are invited once.
account.init().then(async u => {
  renderAccountBtn();
  account.onChange(() => renderAccountBtn());
  if (u) { try { if (await account.pull(designKey)) location.reload(); } catch {} }
  else if (!store.get('aura-forma-account-skip') && !location.hash.includes('access_token')) { if (!guideDue() && !document.querySelector('.f-modal')) openAccount(true); } // not on top of the first-visit guide
}).catch(() => {});
if (guideDue() && !location.hash.includes('access_token')) openGuide();
window.addEventListener('pagehide', () => { account.flush(); });
if (start.note) { feedback(start.note); state.tab = 'parts'; renderPanel(); }
// A link from a PDF or package (#d= one design, #p= a whole project) opens that work.
const openFromLink = () => readLink().then(r => {
  if (!r) return;
  history.replaceState(null, '', location.pathname + location.search);
  state.tab = 'parts'; state.room = null; setSketch(true);
  if (r.design) { setDesign(normalizeDesign(r.design)); feedback(L('linkOpened')); return; }
  const have = new Set(state.project.items.map(i => designKey(i.design)));
  let next = 1 + Math.max(0, ...state.project.items.map(x => +x.id.slice(1) || 0));
  const added = r.items.map(i => ({id: 'U' + next++, qty: i.qty || 1, design: normalizeDesign(i.design)})).filter(i => !have.has(designKey(i.design)));
  state.project.items.push(...added); state.editing = added[0]?.id || null; saveProject();
  if (r.items[0]) setDesign(normalizeDesign(r.items[0].design));
  feedback(L('projectOpened'));
}).catch(() => {});
openFromLink();
window.addEventListener('hashchange', openFromLink);
aiStatus().then(s => { state.ai = s; if (state.tab === 'parts') renderPanel(); });
