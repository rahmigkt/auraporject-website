// AURA ev planı — studio products placed in the home: the same parametric designs as the studio (tasarla.html),
// compiled and drawn at their true size, with plan footprints for the drawing.
import {normalizeDesign, compileDesign} from '../forma/generate.js';
import * as bedroom from '../forma/bedroom.js';
import {normalizeBedroomMaterials} from '../forma/catalog.js';

export const LABEL = {sofa: 'Kanepe', armchair: 'Berjer', coffee: 'Orta sehpa', dining: 'Yemek masası', desk: 'Çalışma masası', side: 'Yan sehpa', console: 'Konsol', tvunit: 'TV ünitesi', wardrobe: 'Gardırop', bookcase: 'Kitaplık', sideboard: 'Konsol dolabı', dresser: 'Şifonyer', nightstand: 'Komodin', run: 'Mutfak', island: 'Mutfak adası', basin: 'Lavabo dolabı', bed: 'Yatak', vitrine: 'Vitrin', vanity: 'Makyaj masası'};
const cache = new Map();
LABEL.majlis = 'Meclis';
export function compileItem(item) {
  const key = JSON.stringify([item.design, item.design.kind === 'majlis' ? item.size_mm : null]); if (cache.has(key)) return cache.get(key);
  let out;
  if (item.design.kind === 'majlis') {
    const size = item.size_mm;
    if (!size || !['w', 'd', 'h'].every(k => Number.isFinite(size[k]) && size[k] > 0)) throw new Error('Meclis parçasının ölçüleri eksik.');
    const {w, d, h} = size;
    // Low measured seating volumes: no substitute sofa and no invented back/arm dimensions.
    out = {compiled: {meta: {overall: {width: w, depth: d, height: h}}, parts: [{id: 'majlis-seat', role: 'seat', mat: 'fabric', pos: [0, h / 2, 0], rot: [0, 0, 0], geom: {fn: 'box', w, h, d}}]}, materials: normalizeDesign({family: 'seating', materials: item.design.materials}).materials};
  } else if (item.design.family === 'bedroom') { const p = bedroom.normalize({...bedroom.DEFAULTS, ...item.design.params, kind: item.design.kind}); out = {compiled: bedroom.compile(p), materials: normalizeBedroomMaterials(item.design.materials || {})}; }
  else { const d = normalizeDesign(item.design); out = {compiled: compileDesign(d), materials: d.materials}; }
  const o = out.compiled.meta?.overall || {}; out.size = {w: o.width || 1000, d: o.depth || 600, h: o.height || 800};
  cache.set(key, out); return out;
}
// plan footprint corners (mm, plan y north). rot_deg turns the product; its front faces (sin θ, −cos θ) in plan.
export function footprint(item) {
  const {size} = compileItem(item), t = (item.rot_deg || 0) * Math.PI / 180, [x, y] = item.pos_xy_mm, c = Math.cos(t), s = Math.sin(t);
  const ax = [c, s], az = [s, -c]; // local x and local front (+z) in plan
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [x + ax[0] * size.w / 2 * i + az[0] * size.d / 2 * j, y + ax[1] * size.w / 2 * i + az[1] * size.d / 2 * j]);
}
export const itemName = item => item.name || LABEL[item.design.kind] || item.design.kind;
