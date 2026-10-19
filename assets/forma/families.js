// Family registry: each furniture family supplies its grammar, styles, kinds and sampling rules.
import * as seating from './sofa.js';
import * as table from './table.js';
import * as bedroom from './bedroom.js';
import * as set from './set.js';
import * as storage from './storage.js';
import * as kitchen from './kitchen.js';
import * as bath from './bath.js';
import {STORAGE_STYLES, STORAGE_STYLE_BY_ID, STORAGE_STARTS, recipeParams} from './styles-storage.js';
import {BEDROOM_STYLES, BEDROOM_STYLE_BY_ID, ROOM_STYLE} from './styles-bedroom.js';
import {STYLES as SEAT_STYLES, STYLE_BY_ID as SEAT_BY_ID, KINDS as SEAT_KINDS} from './styles.js';
import {TABLE_STYLES, TABLE_STYLE_BY_ID} from './styles-table.js';
import {HIDES, normalizeMaterials, normalizeTableMaterials, normalizeBedroomMaterials, normalizeStorageMaterials, normalizeKitchenMaterials, MARKET_NEAR} from './catalog.js';
import {buildMesh} from './build.js';
// Line details start empty: the user draws them in.
const LINE_KEYS = ['stitch', 'inlay', 'caseLine'];

/** Stain tone that keeps the style's intended wood colour on a gürgen (beech) frame. */
const STAIN_FOR = {oak: 'oak', ash: 'lightOak', beech: 'natural', gurgen: 'natural', walnut: 'walnut', cherry: 'cherry', teak: 'teak', smoked: 'darkWalnut', ebonized: 'black'};
/** Extra pattern ideas per style so upholstery is not always plain. */
const PATTERN_HINTS = {rococo_revival: 'trellis:3 stripe:2 argyle:1', tropical_resort: 'stripe:2 trellis:1 tweed:1', memphis: 'polka:2 geometric:2 chevron:1', scandinavian_pastel: 'polka:2 check:1 pinstripe:1', dark_academia: 'plaid:2 houndstooth:2 windowpane:1', neo_classical_restrained: 'stripe:2 trellis:2 pinstripe:1', mid_century_modern: 'geometric:2 houndstooth:1 tweed:1', industrial: 'houndstooth:1 tweed:1', japandi: 'stripe:1 pinstripe:1', aura: 'check:1 houndstooth:1 windowpane:1', neo_gothic: 'argyle:2 trellis:2', hollywood_regency: 'stripe:2 geometric:1', art_deco: 'geometric:2 chevron:1', wabi_sabi_rustic: 'stripe:1 check:1'};
const weights = text => Object.fromEntries(text.split(' ').map(t => { const [k, v] = t.split(':'); return [k, +v]; }));

/** Sensible sampling ranges for table parameters a style does not set. */
const TABLE_SAMPLE_RANGES = {sideOverhang: [20, 90], overhang: [60, 220], legSplay: [0, 4], apronSetback: [5, 15], stretcherHeight: [120, 200], shelfHeight: [100, 200], shelfThickness: [18, 25], panelThickness: [30, 50], tubeSize: [25, 40], edgeSize: [4, 14], cornerRadius: [10, 80], shapeN: [3, 5], boatBow: [0.05, 0.15], columnSize: [140, 260], footSpread: [0.6, 0.75], legSize: [40, 60], legTaper: [0.55, 0.8], apronHeight: [60, 90], apronThickness: [20, 25], topThickness: [25, 35], leafLength: [400, 500]};

export const FAMILIES = {
  seating: {
    id: 'seating', mod: seating, styles: SEAT_STYLES, byId: SEAT_BY_ID, kinds: SEAT_KINDS, defaultKind: 'sofa',
    featureWeights: {armType: 1.4, backType: 1.4, baseType: 1.1, seatType: 0.8, legType: 0.7, cushionEdge: 0.6, welt: 0.3},
    similarEnums: ['armType', 'backType', 'baseType', 'legType', 'cushionEdge', 'seatType'], fixedKeys: ['seatCount', 'pillows', 'channelCount'],
    normalizeMaterials,
    sampleParams(st, kind, r, locks) {
      const {RANGES, ENUMS} = seating, k = SEAT_KINDS[kind] || SEAT_KINDS.sofa, p = {};
      for (const key of Object.keys(ENUMS)) p[key] = LINE_KEYS.includes(key) ? 'none' : st.enums[key] ? r.weighted(st.enums[key]) : r.pick(ENUMS[key]);
      for (const key of Object.keys(RANGES)) { if (key.startsWith('body') || key === 'caseHeight') { p[key] = seating.DEFAULTS[key]; continue; } const [lo, hi] = st.ranges[key] || RANGES[key]; p[key] = r.range(lo, hi); } // body form: designer choice, not sampled
      p.width = r.range(...k.width); p.depth += k.depthAdd; p.seatCount = r.int(...k.seats);
      if (kind !== 'armchair' && p.seatType === 'split' && p.width > 2300 && r.next() < 0.5) p.seatCount = 3;
      if (p.armType === 'wood' && !['frame', 'legs'].includes(p.baseType)) p.baseType = 'frame';
      if (p.baseType === 'sled' && ['rolled', 'scroll'].includes(p.armType)) p.armType = 'square';
      if (p.backType === 'tufted' && p.seatType === 'split' && kind === 'armchair') p.seatType = 'tight';
      if (kind === 'armchair') { p.pillows = Math.min(1, Math.round(p.pillows)); p.armWidth = Math.min(p.armWidth, 170); }
      p.pillows = Math.round(p.pillows);
      Object.assign(p, locks.params || {});
      if (!locks.params?.depth) { const [lo, hi] = st.ranges.seatDepth || [510, 600]; Object.assign(p, seating.fitSeatDepth(p, r.range(lo, hi))); }
      return p;
    },
    sampleMaterials(st, r) {
      const m = st.mats, fiber = r.weighted(m.fiber);
      let pattern = r.weighted(m.pattern);
      if (pattern === 'none' && PATTERN_HINTS[st.id] && r.next() < 0.35) pattern = r.weighted(weights(PATTERN_HINTS[st.id]));
      let color = r.weighted(m.color), color2 = r.weighted(m.color);
      if (r.next() < 0.55) color = MARKET_NEAR[color] || color; // everyday market tones most of the time
      if (color2 === color || MARKET_NEAR[color2] === color) color2 = r.pick(['white', 'cream', 'anthracite', 'navy', 'mustard']);
      if (pattern !== 'none' && r.next() < 0.5) color2 = MARKET_NEAR[color2] || color2;
      const woodPick = r.weighted(m.wood);
      return normalizeMaterials({
        fabric: {fiber, weave: r.weighted(m.weave), color, pattern: HIDES.includes(fiber) ? 'none' : pattern, color2, scale: 1, density: r.int(2, 4)},
        welt: {color: r.next() < 0.6 ? color2 : null},
        // Seating frames and legs are gürgen (beech) for strength; the colour is a separate stain.
        wood: {species: 'gurgen', stain: STAIN_FOR[woodPick] || 'natural', finish: r.weighted(m.finish)},
        metal: {finish: r.weighted(m.metal)}
      });
    }
  },
  table: {
    id: 'table', mod: table, styles: TABLE_STYLES, byId: TABLE_STYLE_BY_ID, kinds: table.KINDS, defaultKind: 'dining',
    featureWeights: {topShape: 1.4, baseType: 1.5, legType: 0.8, edge: 0.7, pedestalType: 0.6, stretcher: 0.4, shelf: 0.4, drawerPull: 0.2, backPanel: 0.1, extended: 0},
    similarEnums: ['topShape', 'edge', 'baseType', 'legType', 'pedestalType', 'stretcher'], fixedKeys: ['drawers', 'leaves', 'leafLength'],
    normalizeMaterials: normalizeTableMaterials,
    sampleParams(st, kind, r, locks) {
      const {RANGES, ENUMS, KINDS} = table, k = KINDS[kind] || KINDS.dining, p = {kind};
      for (const key of Object.keys(ENUMS)) p[key] = LINE_KEYS.includes(key) ? 'none' : st.enums[key] ? r.weighted(st.enums[key]) : r.pick(ENUMS[key]);
      for (const key of Object.keys(RANGES)) { const [lo, hi] = st.ranges[key] || TABLE_SAMPLE_RANGES[key] || RANGES[key]; p[key] = r.range(lo, hi); }
      // Shapes and bases that suit each kind.
      if (kind === 'console' || kind === 'desk') { if (!['rect', 'rounded', 'racetrack', 'boat'].includes(p.topShape)) p.topShape = r.pick(['rect', 'rounded']); if (['pedestal', 'tripod', 'drum', 'doublePedestal'].includes(p.baseType)) p.baseType = r.pick(['legsApron', 'slabEnds', 'sled', 'legsOnly']); }
      if (kind === 'side') { if (['trestle', 'doublePedestal'].includes(p.baseType)) p.baseType = r.pick(['pedestal', 'legsOnly', 'drum']); if (r.next() < 0.5) p.topShape = r.pick(['round', 'superellipse', 'round']); }
      if (kind === 'coffee' && p.baseType === 'doublePedestal') p.baseType = 'drum';
      if (p.baseType === 'tripod' && !['round', 'oval'].includes(p.topShape)) p.topShape = 'round';
      const round = p.topShape === 'round';
      p.length = round && k.round[1] ? r.range(...k.round) : r.range(...k.length);
      p.width = round ? p.length : r.range(...k.width);
      if (p.topShape === 'superellipse' && kind !== 'dining' && r.next() < 0.5) p.width = p.length;
      p.height = r.range(...k.height);
      if (kind !== 'dining') { const s = kind === 'side' ? 0.45 : kind === 'coffee' ? 0.65 : 0.8; for (const key of ['topThickness', 'legSize', 'columnSize', 'panelThickness', 'tubeSize']) p[key] *= key === 'topThickness' ? Math.max(0.6, s + 0.2) : s; p.overhang *= s; p.apronHeight *= kind === 'coffee' || kind === 'side' ? 0.6 : 1; }
      p.drawers = kind === 'console' ? r.int(0, 3) : kind === 'desk' ? r.int(0, 2) : kind === 'side' ? r.int(0, 1) : 0;
      if (p.drawers && p.baseType !== 'legsApron') p.drawers = r.next() < 0.6 ? (p.baseType = 'legsApron', p.drawers) : 0;
      p.leaves = kind === 'dining' && r.next() < 0.35 ? r.int(1, 2) : 0;
      p.shelf = ['coffee', 'side', 'console'].includes(kind) ? p.shelf : 'none';
      p.backPanel = kind === 'desk' && r.next() < 0.3 ? 'panel' : 'none';
      p.extended = 'closed';
      Object.assign(p, locks.params || {});
      return p;
    },
    sampleMaterials(st, r) {
      const m = st.mats, surface = r.weighted(m.top), baseSurface = r.weighted(m.base);
      const wood = {species: r.weighted(m.species), stain: r.weighted(m.stain), finish: r.weighted(m.finish)};
      const top = {surface, ...wood, stone: r.weighted(m.stone), glass: r.weighted(m.glass), color: r.weighted(m.lacquer), polish: r.next() < 0.5 ? 'polished' : 'honed'};
      const base = baseSurface === 'same' && (surface === 'wood' || surface === 'veneer') ? {surface: 'wood', ...wood} : baseSurface === 'same' && surface === 'lacquer' ? {surface: 'lacquer', color: top.color} : baseSurface === 'same' ? {surface: 'wood', ...wood} : baseSurface === 'metal' ? {surface: 'metal', metal: r.weighted(m.metal)} : baseSurface === 'lacquer' ? {surface: 'lacquer', color: r.weighted(m.baseLacquer)} : {surface: 'wood', ...wood};
      return normalizeTableMaterials({top, base: {...wood, ...base}, hardware: {metal: r.weighted(m.metal)}});
    },
    /** Raise stability when a light base would tip: widen the foot or change to four legs. */
    repair(p, materials) {
      for (let i = 0; i < 18; i++) {
        const issues = table.validate(table.compile(p), materials, buildMesh), has = code => issues.some(x => x.code === code && x.level === 'error');
        if (!has('tipping') && !has('topThin') && !has('sag') && !has('kneeRoom')) return p;
        if (has('kneeRoom')) { if (p.topThickness > 30) p.topThickness = 30; else if (p.height < 760) p.height = 760; else p.drawers = 0; }
        if (has('topThin')) p.topThickness = Math.max(p.topThickness, {glass: 12, stone: 20}[materials.top.surface] || 25);
        if (has('sag')) p.topThickness = Math.min(80, Math.round(p.topThickness * 1.3));
        if (has('tipping')) {
          if (['pedestal', 'doublePedestal'].includes(p.baseType) && p.footSpread < 0.9) p.footSpread = Math.min(0.95, p.footSpread + 0.15);
          else if (p.sideOverhang > 30 || p.overhang > 40) { p.sideOverhang = Math.max(15, p.sideOverhang * 0.5); p.overhang = Math.max(25, p.overhang * 0.6); }
          else if (!['legsOnly', 'legsApron'].includes(p.baseType)) p.baseType = 'legsOnly';
          else if ((p.legSplay || 0) < 7 && p.legType !== 'square' && p.legType !== 'blade') p.legSplay = 8;
          else if (p.legSize < 40) p.legSize = Math.min(55, p.legSize + 15);
          else if (p.topThickness < 45) p.topThickness = Math.min(60, p.topThickness + 10);
          else { const k = table.KINDS[p.kind]; p.width = Math.min(k.width[1], p.width + 60); if (p.topShape === 'round') p.length = p.width; }
        }
      }
      return p;
    }
  },
  storage: {
    // RİTMO case goods: wardrobe, bedside table, chest of drawers, vanity — panel construction with fixed rules.
    id: 'storage', mod: storage, styles: STORAGE_STYLES, byId: STORAGE_STYLE_BY_ID, kinds: storage.KINDS, defaultKind: 'wardrobe', starts: STORAGE_STARTS,
    featureWeights: {frontStyle: 1.4, pull: 0.8, base: 1, frontFit: 0.6, legType: 0.5, topType: 0.5, caseEdge: 0.4, doorType: 0.8, board: 0, frontBoard: 0},
    similarEnums: ['frontStyle', 'pull', 'base', 'caseEdge'], fixedKeys: ['solidThickness'],
    normalizeMaterials: normalizeStorageMaterials,
    /** Solid-wood surfaces mean solid panels (thickness from solidThickness); veneer and lacquer are on 18 mm MDF. */
    couple(d) { d.params.board = d.materials.case.surface === 'wood' ? 'solid' : 'mdf'; d.params.frontBoard = d.materials.front.surface === 'wood' ? 'solid' : 'mdf'; return d; },
    sampleParams(st, kind, r, locks) {
      const list = st.starts[kind]?.length ? st.starts[kind] : STORAGE_STYLES[0].starts[kind];
      return {...recipeParams(st, kind, r.pick(list)), ...(locks.params || {})};
    },
    sampleMaterials(st, r) {
      const m = st.mats, species = r.weighted(m.species), stain = r.weighted(m.stain), finish = r.weighted(m.finish), color = r.weighted(m.color);
      const surf = s => ({surface: s, species, stain, finish: s === 'lacquer' ? 'matte' : finish, color});
      return normalizeStorageMaterials({case: surf(r.weighted(m.caseSurface)), front: surf(r.weighted(m.frontSurface)), wood: {species, stain, finish: 'oil'}, metal: {finish: r.weighted(m.metal)}});
    }
  },
  kitchen: {
    // Kitchen: a run or an island of RİTMO modules with worktop, sink, hob, hood and built-in appliances.
    id: 'kitchen', mod: kitchen, styles: STORAGE_STYLES, byId: STORAGE_STYLE_BY_ID, kinds: kitchen.KINDS, defaultKind: 'run', starts: null,
    featureWeights: {frontStyle: 1.4, pull: 0.8, frontFit: 0.6, caseEdge: 0.4, sink: 0.5, hob: 0.4, hood: 0.4, backsplash: 0.3, board: 0, frontBoard: 0},
    similarEnums: ['frontStyle', 'pull', 'caseEdge'], fixedKeys: ['solidThickness'],
    normalizeMaterials: normalizeKitchenMaterials,
    couple(d) { d.params.board = d.materials.case.surface === 'wood' ? 'solid' : 'mdf'; d.params.frontBoard = d.materials.front.surface === 'wood' ? 'solid' : 'mdf'; return d; },
    sampleParams(st, kind, r, locks) {
      const list = KITCHEN_STARTS[kind].filter(e => e.style === st.id);
      return {...structuredClone(r.pick(list.length ? list : KITCHEN_STARTS[kind]).p), ...(locks.params || {})};
    },
    sampleMaterials(st, r) { const m = FAMILIES.storage.sampleMaterials(st, r); return normalizeKitchenMaterials({...m, top: {surface: 'stone', stone: r.pick(['carrara', 'travertine', 'concrete', 'terrazzo']), polish: 'honed'}}); }
  },
  bath: {
    // Bathroom: special vanity units with their top and basin, tall columns and shaped (lit) mirrors or mirror cabinets.
    id: 'bath', mod: bath, styles: STORAGE_STYLES, byId: STORAGE_STYLE_BY_ID, kinds: bath.KINDS, defaultKind: 'basin', starts: null,
    featureWeights: {frontStyle: 1.4, pull: 0.8, basinType: 1, basinShape: 0.6, tap: 0.4, base: 0.6, mirror: 1, mirrorLight: 0.4, board: 0, frontBoard: 0},
    similarEnums: ['frontStyle', 'pull', 'basinType', 'mirror'], fixedKeys: ['solidThickness'],
    normalizeMaterials: m => normalizeKitchenMaterials({...m, sink: m?.sink || {finish: 'white'}}),
    couple(d) { d.params.board = d.materials.case.surface === 'wood' ? 'solid' : 'mdf'; d.params.frontBoard = d.materials.front.surface === 'wood' ? 'solid' : 'mdf'; return d; },
    sampleParams(st, kind, r, locks) {
      const list = BATH_STARTS[kind].filter(e => e.style === st.id);
      return {...structuredClone(r.pick(list.length ? list : BATH_STARTS[kind]).p), ...(locks.params || {})};
    },
    sampleMaterials(st, r) { const m = FAMILIES.storage.sampleMaterials(st, r); return normalizeKitchenMaterials({...m, top: {surface: 'stone', stone: r.pick(['travertine', 'carrara', 'terrazzo', 'concrete']), polish: 'honed'}, sink: {finish: 'white'}}); }
  }

};

/** Room-level sampling ranges. */
const ROOM_SAMPLE_RANGES = {nsWidth: [440, 540], nsDepth: [360, 420], nsRows: [1, 2], nsHeightOffset: [0, 60], wdDepth: [580, 620], wdHeight: [2200, 2400], wdNicheWidth: [900, 1200], battenWidth: [30, 50], battenGap: [12, 22], panelDado: [1150, 1350], drWidth: [1000, 1400], drDepth: [430, 480], drHeight: [760, 860], drRows: [3, 4], drColumns: [2, 3], caseBaseHeight: [100, 180], topThickness: [18, 28], topOverhang: [0, 12], graduation: [0.2, 0.5], fluteWidth: [18, 28], mirrorHeight: [700, 950], mirrorWidth: [0.5, 0.75]};
/** Sensible sampling ranges for bedroom parameters a style does not set. */
const BEDROOM_SAMPLE_RANGES = {legHeight: [60, 160], railHeight: [180, 300], border: [40, 140], plinthInset: [100, 200], headHeight: [1050, 1300], headThickness: [80, 130], headExtend: [0, 0], headRadius: [60, 300], scallops: [3, 4], channelCount: [8, 12], tuftSpacing: [160, 210], slatWidth: [45, 80], slatGap: [12, 30], wingDepth: [180, 260], frameWidth: [50, 80], footHeight: [350, 600], postSize: [50, 70], postHeight: [1900, 2100], legSize: [40, 60], legTaper: [0.6, 0.8], nightWidth: [420, 520], topThickness: [18, 30], topOverhang: [0, 15], cornerRadius: [0, 40], graduation: [0.2, 0.6], fluteWidth: [18, 30], mirrorHeight: [700, 1000], mirrorWidth: [0.5, 0.8]};

const KITCHEN_STARTS = kitchen.kitchenStarts(STORAGE_STYLES);
FAMILIES.kitchen.starts = KITCHEN_STARTS;
const BATH_STARTS = bath.bathStarts(STORAGE_STYLES);
FAMILIES.bath.starts = BATH_STARTS;
export const familyOf = d => FAMILIES[d?.family] || FAMILIES.seating;
