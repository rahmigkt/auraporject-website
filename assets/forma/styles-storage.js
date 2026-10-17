// Case goods (RİTMO) by style: each studio style has a front language (face, handle, base, edge, top) and a
// palette, and curated starting models for the wardrobe, bedside table, chest of drawers and vanity. Starting
// models are written out, not sampled, so every one is a real, buildable piece with clear lines.
import {STYLE_IDS} from './curated.js';
import {defaultsFor} from './storage.js';

const W = text => Object.fromEntries(text.trim().split(/\s+/).map(t => { const [k, v] = t.split(':'); return [k, Number(v ?? 1)]; }));

// ---- Layouts (bays → cells, bottom to top) -----------------------------------------------------------------
const C = (type, o = {}) => ({type, h: 1, mm: 0, n: 1, inside: 'shelves', k: 0, ...o});
const B = (cells, w = 1, mm = 0) => ({w, mm, cells});
const door = (inside = 'shelves', k = 4, o = {}) => C('door', {inside, k, ...o});
const LAYOUT = {
  // Wardrobes
  w3: {width: 1800, height: 2400, depth: 600, bays: [B([door('hang')]), B([door('shelves', 5)]), B([door('hangDrawers')])]},
  w4: {width: 2400, height: 2400, depth: 600, bays: [B([door('hang')]), B([C('drawers', {n: 2, mm: 420}), door('hang')]), B([C('drawers', {n: 2, mm: 420}), door('shelves', 4)]), B([door('shelves', 5)])]},
  wTop: {width: 2000, height: 2600, depth: 600, bays: [B([door('hang'), door('shelves', 0, {mm: 430})]), B([door('shelves', 5), door('shelves', 0, {mm: 430})]), B([door('hangDrawers'), door('shelves', 0, {mm: 430})])]},
  wSlide: {width: 2400, height: 2400, depth: 650, doorType: 'sliding', bays: [B([door('hang')]), B([door('shelves', 5)]), B([door('hangDrawers')])]},
  w2: {width: 1200, height: 2200, depth: 600, bays: [B([door('hang')]), B([C('drawers', {n: 2, mm: 360}), door('shelves', 3)])]},
  // Bedside tables
  n2: {width: 500, height: 520, depth: 400, bays: [B([C('drawers', {n: 2})])]},
  nNiche: {width: 500, height: 540, depth: 400, bays: [B([C('open'), C('drawers', {mm: 150})])]},
  nDoor: {width: 480, height: 560, depth: 400, bays: [B([door('shelves', 1), C('drawers', {mm: 140})])]},
  n3: {width: 460, height: 620, depth: 420, bays: [B([C('drawers', {n: 3})])]},
  nWall: {width: 520, height: 520, depth: 380, base: 'wall', legHeight: 330, bays: [B([C('drawers', {n: 1})])]},
  // Chests of drawers
  d2x3: {width: 1200, height: 860, depth: 470, bays: [B([C('drawers', {n: 3})]), B([C('drawers', {n: 3})])]},
  d1x4: {width: 800, height: 1040, depth: 460, bays: [B([C('drawers', {n: 4})])]},
  d2x4: {width: 1400, height: 1000, depth: 480, bays: [B([C('drawers', {n: 4})]), B([C('drawers', {n: 4})])]},
  d3: {width: 1600, height: 800, depth: 470, bays: [B([door('shelves', 1)]), B([C('drawers', {n: 4})], 1.1), B([door('shelves', 1)])]},
  dTop: {width: 1100, height: 900, depth: 470, bays: [B([C('drawers', {n: 3}), C('drawers', {n: 1, mm: 140})]), B([C('drawers', {n: 3}), C('drawers', {n: 1, mm: 140})])]},
  // Vanities
  vR: {width: 1100, height: 760, depth: 450, bays: [B([C('knee'), C('drawers', {mm: 110})], 2.2), B([C('drawers', {n: 3})])]},
  vC: {width: 1400, height: 760, depth: 460, bays: [B([C('drawers', {n: 3})]), B([C('knee'), C('drawers', {mm: 110})], 1.9), B([C('drawers', {n: 3})])]},
  vA: {width: 1000, height: 760, depth: 440, bays: [B([C('knee'), C('drawers', {mm: 110})])]},
  // TV units (wall-hung or standing; the open bay holds the devices, with a cable outlet in the back)
  tvA: {width: 1800, height: 600, depth: 420, base: 'wall', legHeight: 250, bays: [B([C('drawers', {n: 2})]), B([C('open')], 1.6), B([C('drawers', {n: 2})])]},
  tvB: {width: 2200, height: 520, depth: 450, base: 'plinth', plinthHeight: 60, bays: [B([C('door')]), B([C('open'), C('drawers', {mm: 150})], 1.4), B([C('open'), C('drawers', {mm: 150})], 1.4), B([C('door')])]},
  tvC: {width: 2000, height: 480, depth: 420, base: 'legs', legHeight: 180, bays: [B([C('door', {inside: 'empty'})]), B([C('open', {k: 1})], 1.2), B([C('door', {inside: 'empty'})])]},
  // Bookcases
  bkA: {width: 1800, height: 2100, depth: 350, base: 'plinth', plinthHeight: 60, bays: [B([C('door', {mm: 700}), C('open', {k: 3})]), B([C('door', {mm: 700}), C('open', {k: 3})]), B([C('door', {mm: 700}), C('open', {k: 3})])]},
  bkB: {width: 1600, height: 2000, depth: 330, base: 'plinth', plinthHeight: 60, bays: [B([C('open', {k: 4})]), B([C('open', {k: 4})])]},
  bkC: {width: 2400, height: 2200, depth: 350, base: 'plinth', plinthHeight: 60, bays: [B([C('drawers', {n: 2, mm: 560}), C('open', {k: 4})]), B([C('door', {mm: 560}), C('open', {k: 4})]), B([C('door', {mm: 560}), C('open', {k: 4})]), B([C('drawers', {n: 2, mm: 560}), C('open', {k: 4})])]},
  // Display cabinets
  vtA: {width: 900, height: 1900, depth: 420, base: 'plinth', plinthHeight: 80, led: 'on', bays: [B([C('door', {mm: 620}), C('glass', {inside: 'glassShelves', k: 3})]), B([C('door', {mm: 620}), C('glass', {inside: 'glassShelves', k: 3})])]},
  vtB: {width: 1400, height: 1300, depth: 420, base: 'legs', legHeight: 180, led: 'on', bays: [B([C('glass', {inside: 'glassShelves', k: 2})]), B([C('glass', {inside: 'glassShelves', k: 2})])]},
  // Sideboards
  sbA: {width: 1800, height: 780, depth: 460, base: 'legs', legHeight: 170, topType: 'slab', bays: [B([C('door', {k: 1})]), B([C('drawers', {n: 3})]), B([C('door', {k: 1})])]},
  sbB: {width: 2000, height: 760, depth: 460, base: 'plinth', plinthHeight: 70, topType: 'slab', bays: [B([C('door', {k: 1})]), B([C('door', {k: 1})]), B([C('door', {k: 1})]), B([C('door', {k: 1})])]}
};

// ---- Styles --------------------------------------------------------------------------------------------------
// look: front language. mats: palette weights. starts: per kind [layout, look tweaks, material overrides].
const wood = (species, stain = 'natural', finish = 'oil') => ({surface: 'wood', species, stain, finish});
const ven = (species, stain = 'natural', finish = 'matte') => ({surface: 'veneer', species, stain, finish});
const lac = (color, finish = 'matte') => ({surface: 'lacquer', color, finish});
const S = (id, look, mats, starts) => ({id, look, enums: {}, ranges: {}, mats: Object.fromEntries(Object.entries(mats).map(([k, v]) => [k, W(v)])), starts});

const ALL = [
  S('aura', {frontStyle: 'flat', pull: 'cutout', frontFit: 'overlay', caseEdge: 'eased', base: 'plinth', legType: 'taper', topType: 'slab', topThickness: 26},
    {caseSurface: 'veneer:3 lacquer:2', frontSurface: 'lacquer:3 veneer:2', species: 'oak:5 walnut:1', stain: 'natural:4 lightOak:2', finish: 'matte:3 oil:2', color: 'greige:3 sand:2 cream:2 taupe:1', metal: 'bronze:2 brass:1'},
    {wardrobe: [['w3', {pull: 'edge', topType: 'flush'}, {case: ven('oak'), front: lac('greige')}], ['w4', {frontStyle: 'fluted', fluteWidth: 28, topType: 'flush'}, {case: ven('oak'), front: ven('oak')}], ['wTop', {pull: 'edge', topType: 'flush'}, {case: lac('sand'), front: lac('sand')}]],
      nightstand: [['nNiche', {base: 'legs', legHeight: 170, legSize: 36}, {case: ven('oak'), front: ven('oak'), wood: wood('oak')}], ['nWall', {frontStyle: 'fluted', fluteWidth: 26}, {case: ven('oak'), front: lac('greige')}], ['n2', {base: 'legs', legHeight: 150, pull: 'edge'}, {case: lac('sand'), front: lac('sand'), wood: wood('oak')}]],
      dresser: [['d2x3', {frontStyle: 'fluted', fluteWidth: 28}, {case: ven('oak'), front: ven('oak')}], ['dTop', {base: 'legs', legHeight: 160, legSize: 40}, {case: lac('greige'), front: lac('greige'), wood: wood('oak')}], ['d2x4', {pull: 'edge'}, {case: ven('walnut'), front: ven('walnut')}]],
      vanity: [['vR', {base: 'legs', legHeight: 160, mirror: 'arch', mirrorHeight: 760, mirrorWidth: 0.55}, {case: ven('oak'), front: lac('greige'), wood: wood('oak')}], ['vA', {base: 'legs', legHeight: 160, frontStyle: 'fluted', mirror: 'capsule', mirrorHeight: 800, mirrorWidth: 0.5}, {case: ven('oak'), front: ven('oak'), wood: wood('oak')}], ['vC', {mirror: 'rect', mirrorHeight: 700, mirrorWidth: 0.6}, {case: lac('sand'), front: lac('sand')}]]}),
  S('japandi', {frontStyle: 'grooved', pull: 'cutout', frontFit: 'overlay', caseEdge: 'eased', base: 'legs', legType: 'block', topType: 'slab', topThickness: 26, fluteWidth: 40},
    {caseSurface: 'veneer:3 wood:2', frontSurface: 'veneer:3 wood:2', species: 'oak:4 ash:3', stain: 'natural:5 lightOak:2', finish: 'oil:4 matte:2', color: 'sand:2 cream:2', metal: 'black:2 bronze:1'},
    {wardrobe: [['w3', {base: 'plinth', topType: 'flush'}, {case: ven('oak'), front: ven('oak')}], ['wSlide', {frontStyle: 'slats', base: 'plinth', fluteWidth: 44}, {case: ven('ash'), front: ven('ash')}], ['w2', {base: 'plinth', topType: 'flush', pull: 'leather'}, {case: ven('oak'), front: ven('oak')}]],
      nightstand: [['nNiche', {legHeight: 120, legSize: 50}, {case: wood('oak'), front: wood('oak'), wood: wood('oak')}], ['n2', {frontStyle: 'slats', legHeight: 140, legSize: 50, pull: 'none'}, {case: ven('ash'), front: ven('ash'), wood: wood('ash')}], ['nWall', {pull: 'leather'}, {case: ven('oak'), front: ven('oak')}]],
      dresser: [['d2x3', {legHeight: 140, legSize: 50}, {case: ven('oak'), front: ven('oak'), wood: wood('oak')}], ['d3', {frontStyle: 'slats', base: 'plinth', fluteWidth: 44, pull: 'none'}, {case: ven('ash'), front: ven('ash')}], ['d1x4', {legHeight: 140, legSize: 50, pull: 'leather'}, {case: wood('oak'), front: wood('oak'), wood: wood('oak')}]],
      vanity: [['vA', {legHeight: 140, legSize: 50, mirror: 'round', mirrorHeight: 600, mirrorWidth: 0.6}, {case: wood('oak'), front: wood('oak'), wood: wood('oak')}], ['vR', {legHeight: 140, legSize: 50, mirror: 'capsule', mirrorHeight: 760, mirrorWidth: 0.45}, {case: ven('ash'), front: ven('ash'), wood: wood('ash')}]]}),
  S('scandinavian_modern', {frontStyle: 'flat', pull: 'knob', frontFit: 'overlay', caseEdge: 'eased', base: 'legs', legType: 'taper', legSize: 36, topType: 'slab', topThickness: 22},
    {caseSurface: 'lacquer:3 veneer:2', frontSurface: 'lacquer:4 veneer:1', species: 'oak:4 ash:2 beech:1', stain: 'natural:3 lightOak:3', finish: 'matte:3 oil:2', color: 'white:4 cream:2 greige:1 iceBlue:1 sage:1', metal: 'brass:2 chrome:1'},
    {wardrobe: [['w3', {base: 'plinth', topType: 'flush'}, {case: lac('white'), front: lac('white')}], ['w2', {base: 'legs', legHeight: 140, topType: 'flush'}, {case: lac('white'), front: lac('cream'), wood: wood('oak')}], ['wTop', {base: 'plinth', topType: 'flush', pull: 'cutout'}, {case: lac('white'), front: lac('white')}]],
      nightstand: [['n2', {legHeight: 180}, {case: lac('white'), front: lac('white'), wood: wood('oak')}], ['nNiche', {legHeight: 180, pull: 'cutout'}, {case: ven('oak', 'lightOak'), front: lac('white'), wood: wood('oak')}], ['nDoor', {legHeight: 170}, {case: lac('sage'), front: lac('sage'), wood: wood('oak')}]],
      dresser: [['d2x3', {legHeight: 160}, {case: lac('white'), front: lac('white'), wood: wood('oak')}], ['d1x4', {legHeight: 160, pull: 'cutout'}, {case: ven('oak', 'lightOak'), front: ven('oak', 'lightOak'), wood: wood('oak')}], ['dTop', {legHeight: 160}, {case: lac('cream'), front: lac('cream'), wood: wood('oak')}]],
      vanity: [['vR', {legHeight: 180, mirror: 'round', mirrorHeight: 620, mirrorWidth: 0.6}, {case: lac('white'), front: lac('white'), wood: wood('oak')}], ['vA', {legHeight: 180, mirror: 'arch', mirrorHeight: 760, mirrorWidth: 0.6}, {case: ven('oak', 'lightOak'), front: lac('white'), wood: wood('oak')}]]}),
  S('mid_century_modern', {frontStyle: 'flat', pull: 'edge', frontFit: 'overlay', caseEdge: 'eased', base: 'legs', legType: 'taper', legSize: 38, legHeight: 200, topType: 'slab', topThickness: 22, topOverhang: 10},
    {caseSurface: 'veneer:5', frontSurface: 'veneer:4 lacquer:1', species: 'walnut:5 teak:3 oak:1', stain: 'natural:4 teak:2', finish: 'oil:3 satin:2', color: 'mustard:1 petrol:1 cream:1', metal: 'brass:3 black:1'},
    {wardrobe: [['w2', {topType: 'flush'}, {case: ven('walnut'), front: ven('walnut'), wood: wood('walnut')}], ['w3', {base: 'plinth', topType: 'flush', frontStyle: 'grooved', fluteWidth: 32}, {case: ven('teak'), front: ven('teak')}]],
      nightstand: [['nNiche', {legHeight: 200}, {case: ven('walnut'), front: ven('walnut'), wood: wood('walnut')}], ['n2', {legHeight: 200, pull: 'cutout'}, {case: ven('teak'), front: ven('teak'), wood: wood('teak')}], ['nDoor', {legHeight: 200, pull: 'knob'}, {case: ven('walnut'), front: lac('mustard'), wood: wood('walnut')}]],
      dresser: [['d3', {legHeight: 200}, {case: ven('walnut'), front: ven('walnut'), wood: wood('walnut')}], ['d2x3', {legHeight: 200, frontStyle: 'grooved', fluteWidth: 30}, {case: ven('teak'), front: ven('teak'), wood: wood('teak')}], ['d1x4', {legHeight: 200}, {case: ven('walnut'), front: ven('walnut'), wood: wood('walnut')}]],
      vanity: [['vR', {legHeight: 200, mirror: 'round', mirrorHeight: 640, mirrorWidth: 0.6}, {case: ven('walnut'), front: ven('walnut'), wood: wood('walnut')}], ['vC', {legHeight: 200, mirror: 'rect', mirrorHeight: 700, mirrorWidth: 0.5}, {case: ven('teak'), front: ven('teak'), wood: wood('teak')}]]}),
  S('minimalism', {frontStyle: 'flat', pull: 'none', frontFit: 'overlay', caseEdge: 'square', base: 'plinth', plinthHeight: 60, topType: 'flush'},
    {caseSurface: 'lacquer:5', frontSurface: 'lacquer:5', species: 'oak:3', stain: 'natural:3', finish: 'matte:5', color: 'white:4 greige:3 silver:2 anthracite:1', metal: 'chrome:2 black:2'},
    {wardrobe: [['w3', {}, {case: lac('white'), front: lac('white')}], ['wSlide', {}, {case: lac('greige'), front: lac('greige')}], ['w4', {}, {case: lac('silver'), front: lac('silver')}]],
      nightstand: [['nWall', {}, {case: lac('white'), front: lac('white')}], ['n2', {}, {case: lac('greige'), front: lac('greige')}]],
      dresser: [['d2x3', {}, {case: lac('white'), front: lac('white')}], ['d2x4', {}, {case: lac('greige'), front: lac('greige')}]],
      vanity: [['vA', {base: 'wall', legHeight: 610, mirror: 'rect', mirrorHeight: 800, mirrorWidth: 0.8}, {case: lac('white'), front: lac('white')}], ['vR', {mirror: 'rect', mirrorHeight: 760, mirrorWidth: 0.7}, {case: lac('greige'), front: lac('greige')}]]}),
  S('wabi_sabi', {frontStyle: 'slats', pull: 'leather', frontFit: 'overlay', caseEdge: 'eased', base: 'legs', legType: 'block', legSize: 60, legHeight: 110, topType: 'slab', topThickness: 30, fluteWidth: 48},
    {caseSurface: 'wood:4 veneer:2', frontSurface: 'wood:4', species: 'oak:4 ash:2 smoked:1', stain: 'natural:4 greige:2', finish: 'oil:5', color: 'oat:2 sand:2', metal: 'bronze:2 black:1'},
    {wardrobe: [['w2', {base: 'plinth', topType: 'flush', height: 2200}, {case: wood('oak', 'greige'), front: wood('oak', 'greige')}], ['w3', {base: 'plinth', topType: 'flush', frontStyle: 'grooved', height: 2200}, {case: wood('ash'), front: wood('ash')}]],
      nightstand: [['nNiche', {}, {case: wood('oak', 'greige'), front: wood('oak', 'greige'), wood: wood('oak', 'greige')}], ['n2', {frontStyle: 'grooved'}, {case: wood('smoked'), front: wood('smoked'), wood: wood('smoked')}]],
      dresser: [['d2x3', {}, {case: wood('oak', 'greige'), front: wood('oak', 'greige'), wood: wood('oak', 'greige')}], ['d3', {base: 'plinth'}, {case: wood('ash'), front: wood('ash')}]],
      vanity: [['vA', {height: 770, mirror: 'round', mirrorHeight: 600, mirrorWidth: 0.6}, {case: wood('oak', 'greige'), front: wood('oak', 'greige'), wood: wood('oak', 'greige')}]]}),
  S('industrial', {frontStyle: 'flat', pull: 'bar', frontFit: 'overlay', caseEdge: 'square', base: 'legs', legType: 'metal', legSize: 25, legHeight: 160, topType: 'slab', topThickness: 30},
    {caseSurface: 'lacquer:3 wood:2', frontSurface: 'lacquer:3 wood:2', species: 'oak:3 smoked:2', stain: 'darkWalnut:2 oak:2', finish: 'oil:3 matte:2', color: 'anthracite:4 black:2 olive:1', metal: 'black:5'},
    {wardrobe: [['wTop', {base: 'plinth', topType: 'flush'}, {case: lac('anthracite'), front: lac('anthracite')}], ['w2', {topType: 'flush'}, {case: lac('black'), front: wood('oak', 'darkWalnut')}]],
      nightstand: [['nNiche', {}, {case: lac('anthracite'), front: wood('oak', 'darkWalnut')}], ['n2', {}, {case: lac('black'), front: lac('black')}]],
      dresser: [['d2x3', {}, {case: lac('anthracite'), front: wood('oak', 'darkWalnut')}], ['d1x4', {}, {case: lac('black'), front: lac('black')}]],
      vanity: [['vR', {mirror: 'rect', mirrorHeight: 700, mirrorWidth: 0.6}, {case: lac('anthracite'), front: wood('oak', 'darkWalnut')}]]}),
  S('bauhaus', {frontStyle: 'flat', pull: 'bar', frontFit: 'inset', caseEdge: 'square', base: 'legs', legType: 'metal', legSize: 22, legHeight: 180, topType: 'flush'},
    {caseSurface: 'lacquer:5', frontSurface: 'lacquer:5', species: 'oak:2 beech:2', stain: 'natural:2', finish: 'satin:3 matte:2', color: 'white:3 black:2 cherryRed:1 navy:1 mustard:1', metal: 'chrome:5'},
    {wardrobe: [['w3', {base: 'plinth', frontFit: 'overlay'}, {case: lac('white'), front: lac('white')}], ['w2', {}, {case: lac('black'), front: lac('white')}]],
      nightstand: [['n2', {}, {case: lac('white'), front: lac('navy')}], ['nNiche', {}, {case: lac('black'), front: lac('cherryRed')}]],
      dresser: [['d2x3', {}, {case: lac('white'), front: lac('white')}], ['dTop', {}, {case: lac('black'), front: lac('mustard')}]],
      vanity: [['vR', {mirror: 'round', mirrorHeight: 600, mirrorWidth: 0.55}, {case: lac('white'), front: lac('white')}]]}),
  S('art_deco', {frontStyle: 'fluted', pull: 'knob', frontFit: 'inset', caseEdge: 'bullnose', base: 'plinth', plinthHeight: 90, topType: 'slab', topThickness: 30, fluteWidth: 24},
    {caseSurface: 'veneer:3 lacquer:2', frontSurface: 'veneer:3 lacquer:2', species: 'walnut:4 cherry:1', stain: 'darkWalnut:2 natural:2', finish: 'lacquer:3 satin:2', color: 'black:2 emerald:1 navy:1 cream:1', metal: 'brass:5'},
    {wardrobe: [['w3', {frontFit: 'overlay', topType: 'flush'}, {case: ven('walnut', 'darkWalnut', 'satin'), front: ven('walnut', 'darkWalnut', 'satin')}], ['wTop', {frontFit: 'overlay', topType: 'flush', frontStyle: 'shaker'}, {case: lac('black', 'lacquer'), front: lac('black', 'lacquer')}]],
      nightstand: [['n2', {}, {case: ven('walnut', 'natural', 'satin'), front: ven('walnut', 'natural', 'satin')}], ['nDoor', {}, {case: lac('emerald', 'lacquer'), front: lac('emerald', 'lacquer')}]],
      dresser: [['d2x3', {mirror: 'arch', mirrorHeight: 900, mirrorWidth: 0.55}, {case: ven('walnut', 'darkWalnut', 'satin'), front: ven('walnut', 'darkWalnut', 'satin')}], ['d3', {}, {case: lac('black', 'lacquer'), front: lac('black', 'lacquer')}]],
      vanity: [['vC', {mirror: 'arch', mirrorHeight: 900, mirrorWidth: 0.5}, {case: ven('walnut', 'natural', 'satin'), front: ven('walnut', 'natural', 'satin')}], ['vR', {mirror: 'round', mirrorHeight: 640, mirrorWidth: 0.6}, {case: lac('navy', 'lacquer'), front: lac('navy', 'lacquer')}]]}),
  S('brutalism', {frontStyle: 'grooved', pull: 'cutout', frontFit: 'overlay', caseEdge: 'square', base: 'plinth', plinthHeight: 100, topType: 'slab', topThickness: 40, fluteWidth: 60},
    {caseSurface: 'wood:3 lacquer:2', frontSurface: 'wood:3 lacquer:2', species: 'oak:3 smoked:2', stain: 'darkWalnut:2 wenge:1 anthracite:1', finish: 'oil:3 matte:2', color: 'stone:2 anthracite:2 taupe:1', metal: 'black:3 bronze:1'},
    {wardrobe: [['w3', {topType: 'flush', height: 2200}, {case: wood('oak', 'wenge'), front: wood('oak', 'wenge')}], ['w2', {topType: 'flush', frontStyle: 'flat'}, {case: lac('stone'), front: lac('stone')}]],
      nightstand: [['nNiche', {}, {case: wood('oak', 'wenge'), front: wood('oak', 'wenge')}], ['n2', {frontStyle: 'flat'}, {case: lac('stone'), front: lac('stone')}]],
      dresser: [['d2x3', {}, {case: wood('oak', 'wenge'), front: wood('oak', 'wenge')}], ['d1x4', {frontStyle: 'flat'}, {case: lac('anthracite'), front: lac('anthracite')}]],
      vanity: [['vA', {base: 'plinth', height: 775, mirror: 'rect', mirrorHeight: 800, mirrorWidth: 0.7}, {case: wood('oak', 'wenge'), front: wood('oak', 'wenge')}]]})
];

export const STORAGE_STYLES = STYLE_IDS.map(id => ALL.find(s => s.id === id)).filter(Boolean);
export const STORAGE_STYLE_BY_ID = Object.fromEntries(ALL.map(s => [s.id, s]));

/** Parameters of one recipe: kind defaults ← style look ← layout ← tweaks. */
export function recipeParams(st, kind, [layout, tweaks = {}]) {
  const L = structuredClone(LAYOUT[layout]), look = {...st.look};
  if (['wardrobe', 'bookcase', 'vitrine', 'tvunit'].includes(kind) && look.topType === 'slab') look.topType = 'flush';
  if (kind === 'wardrobe' && look.base === 'legs' && !tweaks.base) look.base = 'plinth';
  if (look.legHeight && kind === 'wardrobe') delete look.legHeight;
  return {...defaultsFor(kind), ...look, ...L, ...tweaks, kind};
}

/** Layouts for the living-room pieces, chosen per style so each style reads differently. */
const LIVING = {
  aura: {tvunit: ['tvA', 'tvC'], bookcase: ['bkA', 'bkB'], vitrine: ['vtA'], sideboard: ['sbA', 'sbB']},
  japandi: {tvunit: ['tvC', 'tvB'], bookcase: ['bkB', 'bkA'], vitrine: ['vtB'], sideboard: ['sbB', 'sbA']},
  scandinavian_modern: {tvunit: ['tvC', 'tvA'], bookcase: ['bkA'], vitrine: ['vtB', 'vtA'], sideboard: ['sbA']},
  mid_century_modern: {tvunit: ['tvC'], bookcase: ['bkC', 'bkB'], vitrine: ['vtB'], sideboard: ['sbA', 'sbB']},
  minimalism: {tvunit: ['tvA', 'tvB'], bookcase: ['bkB'], vitrine: ['vtA'], sideboard: ['sbB']},
  wabi_sabi: {tvunit: ['tvB'], bookcase: ['bkB'], vitrine: ['vtB'], sideboard: ['sbB']},
  industrial: {tvunit: ['tvC'], bookcase: ['bkC'], vitrine: ['vtA'], sideboard: ['sbA']},
  bauhaus: {tvunit: ['tvC'], bookcase: ['bkB'], vitrine: ['vtB'], sideboard: ['sbA']},
  art_deco: {tvunit: ['tvB'], bookcase: ['bkA'], vitrine: ['vtA', 'vtB'], sideboard: ['sbB', 'sbA']},
  brutalism: {tvunit: ['tvB'], bookcase: ['bkC'], vitrine: ['vtA'], sideboard: ['sbB']}
};
for (const st of ALL) for (const [kind, list] of Object.entries(LIVING[st.id] || {})) {
  // Same front language and materials as the style's chest of drawers.
  const mats = st.starts.dresser?.[0]?.[2] || null, tw = st.starts.dresser?.[0]?.[1] || {};
  const look = Object.fromEntries(['frontStyle', 'pull', 'frontFit', 'fluteWidth'].filter(k => tw[k] !== undefined).map(k => [k, tw[k]]));
  st.starts[kind] = list.map(l => [l, {...look, ...(kind === 'vitrine' ? {frontFit: 'overlay'} : {}), ...(LAYOUT[l].base ? {base: LAYOUT[l].base} : {})}, mats]);
}

/** Curated starting models: {style, seed, p, m} per kind. */
export const STORAGE_STARTS = Object.fromEntries(['wardrobe', 'nightstand', 'dresser', 'vanity', 'tvunit', 'bookcase', 'vitrine', 'sideboard'].map(kind => [kind, STORAGE_STYLES.flatMap(st => (st.starts[kind] || []).map((r, i) => ({style: st.id, seed: i + 1, p: recipeParams(st, kind, r), m: r[2] || null})))]));
