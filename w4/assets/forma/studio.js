// AURA Forma seating studio: style → diverse proposals → part/dimension/material editing → designer package.
import {compile, validate, RANGES, ENUMS} from './sofa.js';
import {sample, variants, similar, blend, normalizeDesign, SCHEMA} from './generate.js';
import {STYLES, STYLE_BY_ID, styleName, KINDS} from './styles.js';
import {COLORS, FIBERS, WEAVES, WEAVE_NAMES, PATTERNS, WOODS, FINISHES, METALS, name as nm} from './catalog.js';
import {draft, fabricMaps} from './textile.js';
import {parse, SPEECH_LANG} from './commands.js';
import {aiStatus, interpret, designFromImage} from './ai.js';
import {drawingSheet, drawingDxf} from './drawing.js';
import {bom, bomCsv} from './bom.js';
import {zip, jpegPdf, svgToJpeg, dataUrlJpeg, download} from './package.js';
import {t, partName, UI_LANGS} from './i18n.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const store = {get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }};

const params = new URLSearchParams(location.search);
const browserLang = (navigator.language || 'en').slice(0, 2);
const state = {
  lang: UI_LANGS[params.get('lang')] ? params.get('lang') : UI_LANGS[store.get('aura-forma-lang')] ? store.get('aura-forma-lang') : UI_LANGS[browserLang] ? browserLang : 'tr',
  design: null, compiled: null, history: [], future: [], tab: 'style', proposals: [], round: 1, picked: [], structure: false, ai: {available: false, vision: false}, avoid: []
};
const L = k => t(k, state.lang);
let viewer = null;

// ---- Design state --------------------------------------------------------------
function setDesign(next, {record = true, keepPanel = false, quiet = false} = {}) {
  next = normalizeDesign(next);
  if (record && state.design) { state.history.push(state.design); if (state.history.length > 80) state.history.shift(); state.future = []; }
  state.design = next; state.compiled = compile(next.params);
  viewer?.setDesign(state.compiled, next.materials);
  store.set('aura-forma-design', next);
  renderCaption();
  if (!keepPanel) renderPanel(); else refreshReadouts();
  if (!quiet) state.drawingCache = null;
}
const undo = () => { if (!state.history.length) return; state.future.push(state.design); setDesign(state.history.pop(), {record: false}); };
const redo = () => { if (!state.future.length) return; state.history.push(state.design); setDesign(state.future.pop(), {record: false}); };
const withParams = patch => ({...state.design, params: {...state.design.params, ...patch}});
const withMaterial = (slot, patch) => ({...state.design, materials: {...state.design.materials, [slot]: {...state.design.materials[slot], ...patch}}});

// ---- Layout --------------------------------------------------------------------------
function shell() {
  document.documentElement.lang = state.lang;
  document.title = `AURA · ${L('title')}`;
  $('#app').innerHTML = `
  <header class="f-header">
    <a class="f-brand" href="index.html?lang=${state.lang}">AURA<small>PROJECT / STUDIO</small></a>
    <p class="f-header-title">VEREV · ${esc(L('title')).toUpperCase()}</p>
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
      <nav class="f-tabs" role="tablist">${['style', 'ideas', 'parts', 'size', 'material', 'deliver'].map((k, i) => `<button role="tab" data-tab="${k}" aria-selected="${state.tab === k}"><span>${String(i + 1).padStart(2, '0')}</span>${L('tab' + k[0].toUpperCase() + k.slice(1))}</button>`).join('')}</nav>
      <div id="panel" class="f-panel"></div>
      <div class="f-filebar"><button id="saveBtn">${L('save')} ↓</button><button id="openBtn">${L('open')} ↑</button><input id="openFile" type="file" accept=".json,application/json" hidden></div>
    </aside>
  </main>`;
  viewer?.dispose();
  const host = $('#stage');
  // three.js is loaded lazily so the panel works even if WebGL fails.
  import('./scene.js?v=20261016a').then(({createViewer}) => {
    viewer = createViewer(host);
    if (!viewer) host.innerHTML = `<p class="f-nogl">WebGL ${state.lang === 'tr' ? 'kullanılamıyor; teknik çizimler Teslim sekmesinde.' : 'is unavailable; technical drawings are in the Hand-off tab.'}</p>`;
    else viewer.setDesign(state.compiled, state.design.materials);
  }).catch(() => { host.innerHTML = '<p class="f-nogl">WebGL</p>'; });
  bindShell();
  renderCaption(); renderPanel();
}

function renderCaption() {
  const d = state.design, c = state.compiled, issues = validate(c);
  $('#eyebrow').textContent = `AURA · VEREV · ${styleName(d.style, state.lang).toUpperCase()}`;
  $('#designTitle').textContent = `${L(c.meta.kind)} · F-${String(d.seed % 100000).padStart(5, '0')}`;
  $('#dims').textContent = `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height} mm · ${L('seatHeightL')} ${c.params.seatHeight} mm`;
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
  const p = $('#panel');
  p.innerHTML = {style: stylePanel, ideas: ideasPanel, parts: partsPanel, size: sizePanel, material: materialPanel, deliver: deliverPanel}[state.tab]();
  if (state.tab === 'ideas') drawThumbnails();
  if (state.tab === 'material') drawMaterialPreviews();
  if (state.tab === 'deliver') drawDeliverables();
}

const chip = (attrs, label, on, extra = '') => `<button class="f-chip" ${attrs} aria-pressed="${on}" ${extra}>${esc(label)}</button>`;

function stylePanel() {
  const d = state.design;
  return `<h2>${L('chooseStyle')}</h2><p class="f-lead">${L('styleHint')}</p>
  <h3>${L('kind')}</h3><div class="f-seg">${Object.keys(KINDS).map(k => chip(`data-kind="${k}"`, L(k), d.kind === k)).join('')}</div>
  <div class="f-styles">${STYLES.map(s => `<button class="f-style" data-style="${s.id}" aria-pressed="${d.style === s.id}" ${state.avoid.includes(s.id) ? 'data-avoid="1"' : ''}><b>${esc(styleName(s.id, state.lang))}</b><small>${esc(Object.keys(s.enums.armType).slice(0, 2).map(a => partName('armType', a, state.lang)).join(' · '))}</small></button>`).join('')}</div>
  <div class="f-actions"><button class="f-primary" id="generateBtn">${L('generate')} →</button>
  <label class="f-secondary" id="imageLabel">${L('fromImage')} ↑<input id="imageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label></div>
  <p class="f-note">${L('imageHint')}${state.ai.vision ? '' : ' ' + L('aiOff')}</p>`;
}

function ideasPanel() {
  if (!state.proposals.length) state.proposals = variants({style: state.design.style, kind: state.design.kind, round: state.round});
  return `<h2>${L('tabIdeas')}</h2><p class="f-lead">${L('ideasHint')}</p>
  <div class="f-actions"><button class="f-secondary" id="roundBtn">↻ ${L('newRound')}</button><button class="f-secondary" id="similarBtn">≈ ${L('similar')}</button><button class="f-secondary" id="blendBtn" ${state.picked.length === 2 ? '' : 'disabled'}>⊕ ${L('blend')}</button></div>
  <p class="f-note">${L('blendHint')}</p>
  <div class="f-cards">${state.proposals.map((d, i) => `<div class="f-card" data-card="${i}" aria-current="${d.seed === state.design.seed}"><button class="f-card-main" data-load="${i}"><span class="f-thumb" id="thumb${i}"></span><span class="f-card-text">${esc(partName('armType', d.params.armType, state.lang))} · ${esc(partName('backType', d.params.backType, state.lang))} · ${esc(partName('baseType', d.params.baseType, state.lang))}<small>${d.params.width} × ${d.params.depth} · ${esc(nm(COLORS[d.materials.fabric.color], state.lang))} ${esc(nm(FIBERS[d.materials.fabric.fiber], state.lang).toLowerCase())}</small></span></button><label class="f-pick"><input type="checkbox" data-pick="${i}" ${state.picked.includes(i) ? 'checked' : ''}><span class="sr">${L('blend')}</span></label></div>`).join('')}</div>`;
}

function enumGroup(key, labelKey, options = ENUMS[key]) {
  return `<h3>${L(labelKey)}</h3><div class="f-chips">${options.map(v => chip(`data-enum="${key}" data-value="${v}"`, partName(key, v, state.lang), state.design.params[key] === v)).join('')}</div>`;
}

function partsPanel() {
  const p = state.design.params, legs = ['legs', 'frame'].includes(p.baseType);
  return `<h2>${L('tabParts')}</h2>
  ${enumGroup('armType', 'arm')}${enumGroup('backType', 'back')}${enumGroup('seatType', 'seat')}
  <h3>${L('seats')}</h3><div class="f-seg">${[1, 2, 3, 4].map(n => chip(`data-seats="${n}"`, String(n), p.seatCount === n)).join('')}</div>
  ${enumGroup('cushionEdge', 'cushionEdge')}${enumGroup('baseType', 'base')}${legs ? enumGroup('legType', 'legType') : ''}${enumGroup('welt', 'welt')}
  <h3>${L('pillows')}</h3><div class="f-seg">${[0, 1, 2, 3, 4].map(n => chip(`data-pillows="${n}"`, String(n), p.pillows === n)).join('')}</div>`;
}

const SIZE_GROUPS = d => {
  const p = d.params, g = [['general', ['width', 'depth', 'height', 'seatHeight']]];
  if (p.armType !== 'none') g.push(['arm', ['armHeight', 'armWidth', ...(p.armType === 'wood' ? [] : ['armTop', 'armFlare', 'armSlope']), 'armSet']]);
  g.push(['back', ['backRake', 'backThickness', ...(p.backType === 'camel' ? ['camel'] : []), ...(p.backType === 'channel' ? ['channelCount'] : []), ...(p.backType === 'tufted' ? ['tuftSpacing'] : [])]]);
  g.push(['cushions', ['cushionThickness', 'cushionCrown']]);
  g.push(['base', ['legHeight', ...(['legs', 'frame', 'sled'].includes(p.baseType) ? ['legSize'] : []), ...(['legs', 'frame'].includes(p.baseType) ? ['legTaper', 'legSplay', 'legInset'] : [])]]);
  return g;
};
const UNIT = {armTop: '', armFlare: '', armSlope: '', legTaper: '', backRake: '°', channelCount: '', seatCount: ''};

function sizePanel() {
  const p = state.design.params, m = state.compiled.meta;
  return `<h2>${L('tabSize')}</h2>${SIZE_GROUPS(state.design).map(([g, keys]) => `<h3>${L(g)}</h3>${keys.map(k => { const [lo, hi, step] = RANGES[k], u = UNIT[k] ?? 'mm'; return `<div class="f-slider"><label for="r-${k}">${esc(partName('params', k, state.lang))}</label><input type="range" id="r-${k}" data-param="${k}" min="${lo}" max="${hi}" step="${step}" value="${p[k]}"><span class="f-num"><input type="number" data-num="${k}" min="${lo}" max="${hi}" step="${step}" value="${p[k]}" aria-label="${esc(partName('params', k, state.lang))}">${u}</span></div>`; }).join('')}`).join('')}
  <h3>${L('derived')}</h3><dl class="f-readout" id="readout">${readout(m)}</dl>`;
}
function readout(m) { return `<dt>${L('seatDepth')}</dt><dd>${m.seatDepth} mm</dd><dt>${L('innerWidth')}</dt><dd>${m.innerWidth} mm</dd><dt>${L('seatWidth')}</dt><dd>${m.seatWidthEach} mm</dd>`; }
function refreshReadouts() { const r = $('#readout'); if (r) r.innerHTML = readout(state.compiled.meta); for (const i of document.querySelectorAll('[data-num]')) if (document.activeElement !== i) i.value = state.design.params[i.dataset.num]; }

function swatches(attr, current, includeNone = false) {
  return `<div class="f-swatches">${includeNone ? `<button class="f-swatch f-swatch-none" ${attr}="" aria-pressed="${!current}" title="${esc(L('sameAsFabric'))}">∅</button>` : ''}${Object.entries(COLORS).map(([k, c]) => `<button class="f-swatch" ${attr}="${k}" style="--c:${c.hex}" aria-pressed="${current === k}" title="${esc(nm(c, state.lang))}"><span class="sr">${esc(nm(c, state.lang))}</span></button>`).join('')}</div>`;
}

function materialPanel() {
  const m = state.design.materials, f = m.fabric, F = FIBERS[f.fiber];
  return `<h2>${L('tabMaterial')}</h2>
  <div class="f-fabric-preview"><canvas id="fabricPreview" width="320" height="320" aria-label="${esc(L('fabric'))}"></canvas><div><p class="f-eyebrow">${L('fabric')}</p><p class="f-fabric-name">${esc(nm(F, state.lang))}${F.weave ? ' · ' + esc(nm(WEAVE_NAMES[f.weave], state.lang)) : ''}<br>${esc(nm(COLORS[f.color], state.lang))}${f.pattern !== 'none' ? ' · ' + esc(nm(PATTERNS[f.pattern], state.lang)) : ''}</p><p class="f-note" id="tileNote"></p></div></div>
  <h3>${L('fiber')}</h3><div class="f-chips">${Object.keys(FIBERS).map(k => chip(`data-mat="fabric.fiber" data-value="${k}"`, nm(FIBERS[k], state.lang), f.fiber === k)).join('')}</div>
  ${F.weave ? `<h3>${L('weave')}</h3><div class="f-weaves">${Object.keys(WEAVES).map(k => `<button class="f-weave" data-mat="fabric.weave" data-value="${k}" aria-pressed="${f.weave === k}"><canvas data-draft="${k}" width="64" height="64"></canvas><span>${esc(nm(WEAVE_NAMES[k], state.lang))}</span></button>`).join('')}</div><p class="f-note">${L('weaveNote')}</p>` : ''}
  ${F.weave ? `<h3>${L('pattern')}</h3><div class="f-chips">${Object.keys(PATTERNS).map(k => chip(`data-mat="fabric.pattern" data-value="${k}"`, nm(PATTERNS[k], state.lang), f.pattern === k)).join('')}</div>` : ''}
  <h3>${L('color')}</h3>${swatches('data-color="fabric.color" data-value', f.color)}
  ${f.pattern !== 'none' ? `<h3>${L('color2')}</h3>${swatches('data-color="fabric.color2" data-value', f.color2)}<div class="f-slider"><label for="r-scale">${L('scale')}</label><input type="range" id="r-scale" data-fabric-scale min="0.5" max="3" step="0.1" value="${f.scale}"><span class="f-num">${f.scale}×</span></div>` : ''}
  ${state.design.params.welt !== 'none' || state.design.params.pillows ? `<h3>${L('weltColor')}</h3>${swatches('data-color="welt.color" data-value', m.welt.color, true)}` : ''}
  <h3>${L('wood')}</h3><div class="f-chips">${Object.keys(WOODS).map(k => `<button class="f-chip f-wood" data-mat="wood.species" data-value="${k}" aria-pressed="${m.wood.species === k}" style="--c:${WOODS[k].base}">${esc(nm(WOODS[k], state.lang))}</button>`).join('')}</div>
  <h3>${L('finish')}</h3><div class="f-chips">${Object.keys(FINISHES).map(k => chip(`data-mat="wood.finish" data-value="${k}"`, nm(FINISHES[k], state.lang), m.wood.finish === k)).join('')}</div>
  <h3>${L('metal')}</h3><div class="f-chips">${Object.keys(METALS).map(k => `<button class="f-chip f-wood" data-mat="metal.finish" data-value="${k}" aria-pressed="${m.metal.finish === k}" style="--c:${METALS[k].hex}">${esc(nm(METALS[k], state.lang))}</button>`).join('')}</div>`;
}

function deliverPanel() {
  return `<h2>${L('tabDeliver')}</h2><p class="f-lead">${L('sendIntro')}</p>
  <h3>${L('drawings')}</h3><div class="f-sheet" id="sheet"><p class="f-note">${L('working')}</p></div>
  <h3>${L('bom')}</h3><div class="f-bom" id="bomTable"></div>
  <h3>${L('downloads')}</h3><div class="f-downloads">
    <button class="f-primary" data-dl="zip">${L('packageZip')} ↓</button>
    <button class="f-secondary" data-dl="pdf">PDF ↓</button><button class="f-secondary" data-dl="svg">SVG ↓</button><button class="f-secondary" data-dl="dxf">DXF ↓</button>
    <button class="f-secondary" data-dl="csv">CSV ↓</button><button class="f-secondary" data-dl="glb">GLB (3D) ↓</button><button class="f-secondary" data-dl="json">JSON ↓</button></div>
  <h3>${L('sendDesigner')}</h3>
  <form class="f-send" id="sendForm"><p class="f-note" id="sendState"></p>
    <label>${L('name')} *<input name="name" required maxlength="120"></label><label>${L('email')}<input name="email" type="email" maxlength="160"></label>
    <label>${L('phone')}<input name="phone" type="tel" maxlength="40"></label><label>${L('city')}<input name="city" maxlength="120"></label>
    <label class="full">${L('note')}<textarea name="note" rows="3" maxlength="1500"></textarea></label>
    <label class="f-check full"><input type="checkbox" name="consent" required><span>${L('consent')} <a href="proje-gizlilik.html?lang=${state.lang}" target="_blank" rel="noopener">↗</a></span></label>
    <button class="f-primary" type="submit">${L('send')} →</button></form>`;
}

// ---- Panel drawing helpers ---------------------------------------------------------------------
let thumbJob = 0;
async function drawThumbnails() {
  const job = ++thumbJob, {renderThumbnail} = await import('./scene.js?v=20261016a');
  for (let i = 0; i < state.proposals.length; i++) {
    await new Promise(r => setTimeout(r, 0));
    if (job !== thumbJob) return;
    const slot = $(`#thumb${i}`); if (!slot) return;
    const d = state.proposals[i], url = renderThumbnail(compile(d.params), d.materials);
    slot.innerHTML = url ? `<img src="${url}" alt="">` : '';
  }
}

function drawMaterialPreviews() {
  for (const c of document.querySelectorAll('[data-draft]')) {
    const g = c.getContext('2d'), grid = draft(c.dataset.draft, 8), s = c.width / 8;
    g.fillStyle = '#f4efe4'; g.fillRect(0, 0, c.width, c.height);
    grid.forEach((row, j) => row.forEach((up, i) => { if (up) { g.fillStyle = '#2f3a33'; g.fillRect(i * s + 0.5, j * s + 0.5, s - 1, s - 1); } }));
    g.strokeStyle = '#c9c3b6'; g.lineWidth = 0.5; for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(k * s, 0); g.lineTo(k * s, c.height); g.moveTo(0, k * s); g.lineTo(c.width, k * s); g.stroke(); }
  }
  const canvas = $('#fabricPreview'); if (!canvas) return;
  const spec = state.design.materials.fabric;
  setTimeout(() => {
    if (!canvas.isConnected) return;
    const maps = fabricMaps(spec, {maxPx: 640}), g = canvas.getContext('2d');
    const img = new ImageData(maps.albedo, maps.size, maps.size), tmp = document.createElement('canvas'); tmp.width = tmp.height = maps.size; tmp.getContext('2d').putImageData(img, 0, 0);
    // Show 60 × 60 mm of fabric (true-scale tiles).
    const px = canvas.width / 60 * maps.tileMm, pattern = g.createPattern(tmp, 'repeat');
    pattern.setTransform(new DOMMatrix().scale(px / maps.size));
    g.fillStyle = pattern; g.fillRect(0, 0, canvas.width, canvas.height);
    const note = $('#tileNote'); if (note) note.textContent = `60 × 60 mm · ${state.lang === 'tr' ? 'rapor' : 'repeat'} ${maps.tileMm.toFixed(0)} mm`;
  }, 30);
}

function sheetLabels() {
  return {front: L('frontView'), side: L('sideView'), top: L('topView'), section: L('sectionView'), scale: L('scaleLabel'), units: L('units'), title: L(state.compiled.meta.kind), note: L('concept'), seatDepth: L('seatDepth'), rake: L('rake'), status: L('status'), spec: L('spec')};
}
function specRows(b) {
  const d = state.design, c = state.compiled, m = d.materials, f = m.fabric;
  return [
    [L('overall'), `${c.meta.overall.width} × ${c.meta.overall.depth} × ${c.meta.overall.height}`],
    [L('seatHeightL'), `${c.params.seatHeight}`], [L('seatDepth'), `${c.meta.seatDepth}`], ...(c.meta.armHeight ? [[L('armHeightL'), `${c.meta.armHeight}`]] : []),
    [L('rake'), `${c.params.backRake}°`], [L('arm'), partName('armType', c.params.armType, state.lang)], [L('back'), partName('backType', c.params.backType, state.lang)],
    [L('seat'), `${partName('seatType', c.params.seatType, state.lang)} · ${c.params.seatCount}`], [L('base'), `${partName('baseType', c.params.baseType, state.lang)}${['legs', 'frame'].includes(c.params.baseType) ? ' · ' + partName('legType', c.params.legType, state.lang) : ''}`],
    [L('fabric'), `${nm(FIBERS[f.fiber], state.lang)} · ${nm(COLORS[f.color], state.lang)}`], [L('weave'), FIBERS[f.fiber].weave ? nm(WEAVE_NAMES[f.weave], state.lang) : '—'], [L('pattern'), nm(PATTERNS[f.pattern], state.lang)],
    [L('wood'), `${nm(WOODS[m.wood.species], state.lang)} · ${nm(FINISHES[m.wood.finish], state.lang)}`], [L('metal'), nm(METALS[m.metal.finish], state.lang)],
    [L('fabricNeed'), `~${b.totals.fabricMetres} m (1400 mm)`]
  ];
}
function deliverables() {
  if (state.drawingCache?.key === JSON.stringify(state.design) + state.lang) return state.drawingCache;
  const b = bom(state.compiled, state.design.materials, state.lang);
  const sheet = drawingSheet(state.compiled, sheetLabels(), {title: `${L(state.compiled.meta.kind)} · ${styleName(state.design.style, state.lang)}`, style: styleName(state.design.style, state.lang), date: new Date().toISOString().slice(0, 10), id: projectId(), rows: specRows(b)});
  state.drawingCache = {key: JSON.stringify(state.design) + state.lang, sheet, bom: b};
  return state.drawingCache;
}
const projectId = () => `F-${String(state.design.seed % 100000).padStart(5, '0')}`;

function drawDeliverables() {
  setTimeout(async () => {
    const {sheet, bom: b} = deliverables();
    const host = $('#sheet'); if (!host) return;
    host.innerHTML = sheet.svg;
    $('#bomTable').innerHTML = `<table><thead><tr><th>#</th><th>${state.lang === 'tr' ? 'Parça' : 'Part'}</th><th>×</th><th>mm</th><th>${L('tabMaterial')}</th></tr></thead><tbody>${b.rows.filter(r => !r.internal).map(r => `<tr><td>${r.code}</td><td>${esc(state.lang === 'tr' ? r.nameTr : r.nameEn)}</td><td>${r.qty}</td><td>${r.size.join(' × ')}</td><td>${esc(r.material)}</td></tr>`).join('')}</tbody></table><p class="f-note">${L('fabricNeed')}: ~${b.totals.fabricMetres} m · ${b.totals.fabricAreaM2} m²${b.totals.weltMetres ? ` · ${L('welt')} ${b.totals.weltMetres} m` : ''}</p>`;
    const s = await fetch('api/forma-submit.php', {cache: 'no-store'}).then(r => r.json()).catch(() => ({available: false}));
    state.canSend = !!s.available;
    const ss = $('#sendState'); if (ss) ss.textContent = state.canSend ? '' : L('sendOff');
  }, 20);
}

// ---- Package -------------------------------------------------------------------------------
async function packageFiles() {
  const {sheet, bom: b} = deliverables();
  const files = [];
  const project = {schema: SCHEMA, id: projectId(), created: new Date().toISOString(), language: state.lang, design: state.design, derived: state.compiled.meta, issues: validate(state.compiled), bom: b, note: 'Concept design generated by AURA Forma. Requires review by an AURA designer before production.'};
  files.push({name: 'project.json', data: JSON.stringify(project, null, 2)});
  files.push({name: 'drawings.svg', data: sheet.svg});
  files.push({name: 'drawings.dxf', data: drawingDxf(state.compiled)});
  files.push({name: 'parts.csv', data: bomCsv(b)});
  const pages = [await svgToJpeg(sheet.svg)];
  if (viewer) { const shot = await viewer.photo(2); pages.unshift(await dataUrlJpeg(shot)); files.push({name: 'render.jpg', data: pages[0].data}); }
  files.push({name: 'drawings.pdf', data: jpegPdf(pages)});
  if (viewer) { try { files.push({name: 'model.glb', data: new Uint8Array(await viewer.exportGLB())}); } catch {} }
  files.push({name: 'README.txt', data: `AURA Forma ${projectId()}\n\nproject.json  design parameters, materials, derived dimensions, checks, parts list\ndrawings.pdf  render + A3 drawing sheet (print at 100% for the stated scale)\ndrawings.svg  vector drawing sheet (paper mm)\ndrawings.dxf  views in model space, real millimetres (layers FRONT, SIDE, TOP, SECTION_A)\nparts.csv     grouped parts with sizes, materials and suggested build (TR/EN)\nmodel.glb     3D model (metres)\n\nConcept design. Dimensions and build suggestions must be checked by the designer before production.\n`});
  return files;
}
async function downloadAs(kind) {
  feedback(L('working'));
  const {sheet, bom: b} = deliverables(), id = projectId();
  try {
    if (kind === 'svg') download(`${id}-drawings.svg`, sheet.svg, 'image/svg+xml');
    else if (kind === 'dxf') download(`${id}-drawings.dxf`, drawingDxf(state.compiled), 'application/dxf');
    else if (kind === 'csv') download(`${id}-parts.csv`, bomCsv(b), 'text/csv');
    else if (kind === 'json') download(`${id}.json`, JSON.stringify(state.design, null, 2), 'application/json');
    else if (kind === 'glb' && viewer) download(`${id}.glb`, await viewer.exportGLB(), 'model/gltf-binary');
    else if (kind === 'pdf') { const pages = [await svgToJpeg(sheet.svg)]; if (viewer) pages.unshift(await dataUrlJpeg(await viewer.photo(2))); download(`${id}.pdf`, jpegPdf(pages), 'application/pdf'); }
    else if (kind === 'zip') download(`${id}-designer-package.zip`, zip(await packageFiles()), 'application/zip');
    feedback(L('applied'));
  } catch (e) { feedback(String(e.message || e), 'error'); }
}

// ---- Actions (shared by UI, commands and AI) ------------------------------------------------
function applyActions(actions) {
  let d = structuredClone(state.design), changed = false; const notes = [];
  for (const a of actions) {
    if (a.type === 'command') {
      const v = {viewFront: 'front', viewSide: 'side', viewTop: 'top', viewAngle: 'angle'}[a.name];
      if (v) { viewer?.view(v); markView(v); notes.push(L(v === 'angle' ? 'perspective' : v)); }
      else if (a.name === 'undo') { undo(); return notes.concat(L('undo')); }
      else if (a.name === 'redo') { redo(); return notes.concat(L('redo')); }
      else if (a.name === 'structure') toggleStructure();
      else if (a.name === 'photo') savePhoto();
      else if (a.name === 'variants') { state.round++; state.proposals = []; state.tab = 'ideas'; renderPanel(); notes.push(L('tabIdeas')); }
      else if (a.name === 'similar') { state.proposals = similar(state.design, {round: ++state.round}); state.tab = 'ideas'; renderPanel(); notes.push(L('similar')); }
      else if (a.name === 'drawings' || a.name === 'send' || a.name === 'package') { state.tab = 'deliver'; renderPanel(); notes.push(L('tabDeliver')); }
      continue;
    }
    changed = true;
    if (a.type === 'set') { d.params[a.key] = a.value; notes.push(`${partName('params', a.key, state.lang)} ${Math.round(a.value)}`); }
    else if (a.type === 'delta') { const before = d.params[a.key]; d.params[a.key] = before + a.value; notes.push(`${partName('params', a.key, state.lang)} ${Math.round(before)} → ${Math.round(before + a.value)}`); }
    else if (a.type === 'enum') { d.params[a.key] = a.value; notes.push(partName(a.key, a.value, state.lang)); }
    else if (a.type === 'style') { d = sample({style: a.value, kind: d.kind, seed: d.seed, locks: {materials: undefined}}); notes.push(styleName(a.value, state.lang)); }
    else if (a.type === 'kind') { if (a.value !== d.kind) { const w = KINDS[a.value].width; d.kind = a.value; d.params.width = (w[0] + w[1]) / 2; d.params.seatCount = KINDS[a.value].seats[1]; notes.push(L(a.value)); } }
    else if (a.type === 'material') { d.materials[a.slot] = {...d.materials[a.slot], [a.key]: a.value}; notes.push(materialLabel(a)); }
  }
  if (changed) setDesign(d);
  return notes;
}
function materialLabel(a) {
  const tables = {fiber: FIBERS, weave: WEAVE_NAMES, pattern: PATTERNS, color: COLORS, color2: COLORS, species: WOODS, finish: a.slot === 'metal' ? METALS : FINISHES};
  return nm(tables[a.key]?.[a.value], state.lang) || a.value;
}

async function runCommand(text) {
  if (!text.trim()) return;
  const local = parse(text, state.design);
  if (local.understood) { const notes = applyActions(local.actions); feedback(`${L('applied')}: ${notes.join(' · ')}`); return; }
  if (state.ai.available) {
    feedback(L('working'));
    try { const actions = await interpret(text, state.design, state.lang); if (actions.length) { feedback(`${L('applied')}: ${applyActions(actions).join(' · ')}`); return; } } catch {}
  }
  feedback(L('notUnderstood'), 'warn');
}

function markView(v) { for (const b of document.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === v)); }
function toggleStructure() { state.structure = !state.structure; viewer?.structure(state.structure); $('#structureBtn').setAttribute('aria-pressed', String(state.structure)); }
async function savePhoto() { if (!viewer) return; download(`${projectId()}.jpg`, (await dataUrlJpeg(await viewer.photo(2))).data, 'image/jpeg'); }

// ---- Voice -----------------------------------------------------------------------------------
let recognition = null;
function listen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { feedback(L('noSpeech'), 'warn'); return; }
  if (recognition) { recognition.stop(); return; }
  recognition = new SR(); recognition.lang = SPEECH_LANG[state.lang] || 'en-GB'; recognition.interimResults = true; recognition.maxAlternatives = 1;
  const mic = $('#micBtn'); mic.dataset.on = '1'; feedback(L('listening'));
  recognition.onresult = e => { const r = e.results[e.results.length - 1], text = r[0].transcript; $('#command').value = text; if (r.isFinal) runCommand(text); };
  recognition.onerror = () => feedback(L('noSpeech'), 'warn');
  recognition.onend = () => { recognition = null; delete mic.dataset.on; };
  recognition.start();
}

// ---- Events ----------------------------------------------------------------------------------
function bindShell() {
  $('#lang').onchange = e => { state.lang = e.target.value; store.set('aura-forma-lang', state.lang); state.drawingCache = null; shell(); };
  for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => { viewer?.view(b.dataset.view); markView(b.dataset.view); };
  for (const b of document.querySelectorAll('[data-zoom]')) b.onclick = () => viewer?.zoom(+b.dataset.zoom);
  $('#structureBtn').onclick = toggleStructure; $('#photoBtn').onclick = savePhoto;
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#commandForm').onsubmit = e => { e.preventDefault(); runCommand($('#command').value); };
  $('#micBtn').onclick = listen;
  for (const b of document.querySelectorAll('[data-tab]')) b.onclick = () => { state.tab = b.dataset.tab; renderPanel(); };
  $('#saveBtn').onclick = () => download(`${projectId()}.json`, JSON.stringify(state.design, null, 2), 'application/json');
  $('#openBtn').onclick = () => $('#openFile').click();
  $('#openFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); setDesign(d.design || d); } catch { feedback('JSON', 'error'); } e.target.value = ''; };

  const panel = $('#panel');
  panel.addEventListener('click', e => {
    const el = e.target.closest('button, [data-load]'); if (!el) return;
    const d = el.dataset;
    if (d.kind) { state.proposals = []; setDesign(sample({style: state.design.style, kind: d.kind, seed: state.design.seed})); }
    else if (d.style) { state.proposals = []; state.round = 1; setDesign(sample({style: d.style, kind: state.design.kind, seed: state.design.seed})); }
    else if (el.id === 'generateBtn') { state.proposals = []; state.tab = 'ideas'; renderPanel(); }
    else if (d.load !== undefined) { setDesign(state.proposals[+d.load], {keepPanel: true}); for (const c of document.querySelectorAll('.f-card')) c.setAttribute('aria-current', String(c.dataset.card === d.load)); }
    else if (el.id === 'roundBtn') { state.round++; state.proposals = []; state.picked = []; renderPanel(); }
    else if (el.id === 'similarBtn') { state.proposals = similar(state.design, {round: ++state.round}); state.picked = []; renderPanel(); }
    else if (el.id === 'blendBtn' && state.picked.length === 2) { const [a, b] = state.picked.map(i => state.proposals[i]); setDesign(blend(a, b, 0.5, state.round)); state.proposals = similar(state.design, {round: ++state.round}); state.picked = []; renderPanel(); }
    else if (d.enum) setDesign(withParams({[d.enum]: d.value}));
    else if (d.seats) setDesign(withParams({seatCount: +d.seats}));
    else if (d.pillows !== undefined) setDesign(withParams({pillows: +d.pillows}));
    else if (d.mat) { const [slot, key] = d.mat.split('.'); setDesign(withMaterial(slot, {[key]: d.value})); }
    else if (d.color) { const [slot, key] = d.color.split('.'); setDesign(withMaterial(slot, {[key]: d.value || null})); }
    else if (d.dl) downloadAs(d.dl);
  });
  panel.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.pick !== undefined) { const i = +el.dataset.pick; state.picked = el.checked ? [...state.picked.filter(x => x !== i), i].slice(-2) : state.picked.filter(x => x !== i); for (const c of document.querySelectorAll('[data-pick]')) c.checked = state.picked.includes(+c.dataset.pick); $('#blendBtn').disabled = state.picked.length !== 2; }
    else if (el.dataset.param) setDesign(withParams({[el.dataset.param]: +el.value}), {keepPanel: false});
    else if (el.dataset.num) setDesign(withParams({[el.dataset.num]: +el.value}));
    else if (el.dataset.fabricScale !== undefined) setDesign(withMaterial('fabric', {scale: +el.value}));
    else if (el.id === 'imageFile') readImage(el.files[0]);
  });
  // Live slider preview without flooding history; committed on change.
  let pending = 0;
  panel.addEventListener('input', e => {
    const el = e.target; if (!el.dataset.param) return;
    const num = el.parentElement.querySelector('[data-num]'); if (num) num.value = el.value;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => { const next = normalizeDesign(withParams({[el.dataset.param]: +el.value})); state.compiled = compile(next.params); viewer?.setDesign(state.compiled, next.materials); });
  });
  panel.addEventListener('submit', async e => {
    if (e.target.id !== 'sendForm') return; e.preventDefault();
    const fd = new FormData(e.target), ss = $('#sendState');
    if (!state.canSend) { ss.textContent = L('sendOff'); downloadAs('zip'); return; }
    ss.textContent = L('working');
    try {
      const body = new FormData();
      body.append('package', new Blob([zip(await packageFiles())], {type: 'application/zip'}), `${projectId()}.zip`);
      body.append('meta', JSON.stringify({name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), city: fd.get('city'), note: fd.get('note'), consent: !!fd.get('consent'), lang: state.lang, summary: specRows(deliverables().bom).map(r => r.join(': ')).join(' | ')}));
      const r = await fetch('api/forma-submit.php', {method: 'POST', body}), j = await r.json();
      ss.textContent = j.ok ? `${L('sent')} ${j.id}` : (j.error || 'Error');
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
  const fromStore = store.get('aura-forma-design');
  let style = 'japandi', note = null;
  if (params.get('brief')) {
    try {
      const brief = JSON.parse(sessionStorage.getItem('aura-taste-handoff') || 'null');
      const ids = (brief?.styles || []).map(s => (typeof s === 'string' ? s : s?.id)).filter(id => STYLE_BY_ID[id]);
      state.avoid = (brief?.avoidStyleIds || []).filter(id => STYLE_BY_ID[id]);
      if (ids.length) { style = ids[0]; note = L('briefLoaded'); }
    } catch {}
  }
  if (params.get('style') && STYLE_BY_ID[params.get('style')]) style = params.get('style');
  const kind = KINDS[params.get('kind')] ? params.get('kind') : 'sofa';
  if (!note && fromStore?.schema === SCHEMA && !params.get('style') && !params.get('kind')) return {design: normalizeDesign(fromStore)};
  return {design: sample({style, kind, seed: 1 + Math.floor(Math.random() * 1e6)}), note};
}

window.formaDebug = {state, get viewer() { return viewer; }};
const start = initialDesign();
state.design = start.design; state.compiled = compile(state.design.params);
shell();
if (start.note) { feedback(start.note); state.tab = 'ideas'; renderPanel(); }
aiStatus().then(s => { state.ai = s; if (state.tab === 'style') renderPanel(); });
