// AURA ev planı — wall paints and floor finishes as suggestions (AURA does not supply them; the customer's painter and
// flooring contractor do). Floors are procedural canvas textures at real size (planks, herringbone, tiles, terrazzo,
// micro-concrete, marble), so a 20 cm plank reads as 20 cm in every room.
import * as THREE from '../vendor/three.module.js?v=20261016b';

export const PAINTS = [
  ['kirik-beyaz', 'Kırık beyaz', '#f1ede4'], ['sicak-beyaz', 'Sıcak beyaz', '#efe6d6'], ['kum', 'Kum', '#e3d6bf'], ['greige', 'Greige', '#d5ccbf'],
  ['tas-gri', 'Taş gri', '#c4c0b6'], ['adacayi', 'Adaçayı', '#c3cbb6'], ['zeytin', 'Zeytin', '#9fa085'], ['sis-mavisi', 'Sis mavisi', '#c6d0d3'],
  ['gece-mavisi', 'Gece mavisi', '#4c5a66'], ['terrakota', 'Terrakota', '#c98d6f'], ['kil', 'Kil pembesi', '#dfc0ad'], ['okaliptus', 'Okaliptüs', '#8fa39a'],
  ['kahve', 'Koyu kahve', '#6b5546'], ['antrasit', 'Antrasit', '#4a4a48']
];
export const FLOORS = {
  'mese-dogal': {name: 'Meşe parke · doğal', kind: 'plank', base: '#c9a476', var: 0.06, w: 0.19, l: 1.4},
  'mese-acik': {name: 'Meşe parke · açık', kind: 'plank', base: '#dcc29b', var: 0.05, w: 0.19, l: 1.4},
  'ceviz': {name: 'Ceviz parke', kind: 'plank', base: '#7b5a41', var: 0.07, w: 0.16, l: 1.2},
  'balikkilcigi': {name: 'Balıksırtı meşe', kind: 'herring', base: '#c7a072', var: 0.06, w: 0.09, l: 0.54},
  'seramik-acik': {name: 'Seramik 60×60 · açık', kind: 'tile', base: '#e7e2d9', grout: '#cfc8bc', size: 0.6},
  'seramik-gri': {name: 'Seramik 60×120 · gri', kind: 'tile', base: '#b9b6b0', grout: '#9f9b95', size: 0.6, size2: 1.2},
  'karo-desen': {name: 'Çimento karo 20×20', kind: 'pattern', base: '#ece5d8', ink: '#5d6b6c', size: 0.2},
  'terrazzo': {name: 'Terrazzo', kind: 'terrazzo', base: '#e8e2d6', size: 1.0},
  'mikro-beton': {name: 'Mikro beton', kind: 'concrete', base: '#bdb8b0', size: 2.0},
  'mermer': {name: 'Mermer · Carrara', kind: 'marble', base: '#eceae6', size: 1.2}
};
// Suggested schemes: wall colour and floor per room function. A starting point for the conversation, not a rule.
export const SCHEMES = {
  iskandinav: {name: 'İskandinav · açık', walls: {_: 'kirik-beyaz', bedroom: 'sis-mavisi'}, floors: {_: 'mese-acik', bath: 'seramik-acik', wc: 'seramik-acik', kitchen: 'seramik-acik', balcony: 'seramik-gri'}},
  toprak: {name: 'Toprak tonları', walls: {_: 'kum', living: 'kil', bedroom: 'greige'}, floors: {_: 'mese-dogal', bath: 'terrazzo', wc: 'terrazzo', kitchen: 'karo-desen', balcony: 'seramik-gri'}},
  akdeniz: {name: 'Akdeniz', walls: {_: 'sicak-beyaz', living: 'terrakota', kitchen: 'sicak-beyaz', bedroom: 'adacayi'}, floors: {_: 'terrazzo', bedroom: 'mese-dogal', bath: 'karo-desen', wc: 'karo-desen'}},
  klasik: {name: 'Klasik · sıcak', walls: {_: 'greige', living: 'zeytin', bedroom: 'kum'}, floors: {_: 'balikkilcigi', bath: 'mermer', wc: 'mermer', kitchen: 'mermer', balcony: 'seramik-gri'}},
  modern: {name: 'Modern · koyu vurgu', walls: {_: 'tas-gri', living: 'gece-mavisi', bedroom: 'antrasit'}, floors: {_: 'mikro-beton', bedroom: 'ceviz', bath: 'seramik-gri', wc: 'seramik-gri'}}
};
export const paintHex = id => (PAINTS.find(p => p[0] === id) || PAINTS[0])[2];
export const paintName = id => (PAINTS.find(p => p[0] === id) || PAINTS[0])[1];

// ---- procedural floor textures (one canvas per finish, repeated at real size) --------------------------------
const rnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * (1 + k))))); return `rgb(${c.join(',')})`; };
const cache = new Map();
export function floorTexture(id) {
  if (cache.has(id)) return cache.get(id);
  const F = FLOORS[id] || FLOORS['mese-dogal'], N = 1024, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), R = rnd(id.length * 7919 + id.charCodeAt(0)); let metres = 1;
  const grain = (x, y, w, h, base, horiz) => { // a plank with its own tone and fine grain lines
    g.fillStyle = shade(base, (R() - 0.5) * 2 * F.var); g.fillRect(x, y, w, h);
    g.globalAlpha = 0.18; g.strokeStyle = shade(base, -0.35);
    for (let i = 0; i < (horiz ? h : w) / 3; i++) { g.lineWidth = 0.6 + R(); g.beginPath(); const o = R() * (horiz ? h : w), a = R() * 6;
      if (horiz) { g.moveTo(x, y + o); for (let t = 0; t <= w; t += 16) g.lineTo(x + t, y + o + Math.sin(t / 60 + a) * 2); } else { g.moveTo(x + o, y); for (let t = 0; t <= h; t += 16) g.lineTo(x + o + Math.sin(t / 60 + a) * 2, y + t); }
      g.stroke(); }
    g.globalAlpha = 1; g.strokeStyle = shade(base, -0.45); g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  };
  if (F.kind === 'plank') { metres = F.l * 2; const pw = N * F.w / metres, pl = N * F.l / metres;
    for (let r = 0; r * pw < N; r++) { const off = (R() * pl) % pl; for (let x = -off; x < N; x += pl) grain(x, r * pw, pl, pw, F.base, true); } }
  else if (F.kind === 'herring') { metres = F.l * 2; const w = N * F.w / metres, l = N * F.l / metres;
    for (let y = -l; y < N + l; y += w * 2) for (let x = -l; x < N + l; x += l + 0) { // two directions, stepped
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4); grain(0, 0, l, w, F.base, true); g.restore();
      g.save(); g.translate(x + l * 0.7071, y + l * 0.7071 - w * 1.414); g.rotate(-Math.PI / 4); grain(0, 0, l, w, F.base, true); g.restore(); } }
  else if (F.kind === 'tile' || F.kind === 'pattern') { metres = F.kind === 'pattern' ? 0.8 : 2.4; const sx = N * F.size / metres, sy = N * (F.size2 || F.size) / metres;
    for (let y = 0; y < N; y += sy) for (let x = 0; x < N; x += sx) { g.fillStyle = shade(F.base, (R() - 0.5) * 0.04); g.fillRect(x, y, sx, sy);
      if (F.kind === 'pattern') { g.fillStyle = F.ink; g.globalAlpha = 0.85; const m = sx / 2; g.beginPath(); g.moveTo(x + m, y + sx * 0.12); g.lineTo(x + sx * 0.88, y + m); g.lineTo(x + m, y + sx * 0.88); g.lineTo(x + sx * 0.12, y + m); g.closePath(); g.fill();
        g.fillStyle = F.base; g.beginPath(); g.arc(x + m, y + m, sx * 0.16, 0, 7); g.fill(); g.globalAlpha = 1; } }
    g.strokeStyle = F.grout || '#c9c2b6'; g.lineWidth = F.kind === 'pattern' ? 1.5 : 3; for (let y = 0; y <= N; y += sy) { g.beginPath(); g.moveTo(0, y); g.lineTo(N, y); g.stroke(); } for (let x = 0; x <= N; x += sx) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, N); g.stroke(); } }
  else { metres = F.size; g.fillStyle = F.base; g.fillRect(0, 0, N, N);
    if (F.kind === 'terrazzo') for (let i = 0; i < 2600; i++) { g.fillStyle = ['#b9a58f', '#8f8a83', '#d9cbb5', '#a5643f', '#6f7a7a', '#f6f3ec'][Math.floor(R() * 6)]; const r = 2 + R() * R() * 14; g.beginPath(); g.ellipse(R() * N, R() * N, r, r * (0.5 + R() * 0.5), R() * 3, 0, 7); g.fill(); }
    if (F.kind === 'concrete') for (let i = 0; i < 9000; i++) { g.fillStyle = shade(F.base, (R() - 0.5) * 0.18); g.globalAlpha = 0.25; g.fillRect(R() * N, R() * N, 2 + R() * 20, 2 + R() * 20); g.globalAlpha = 1; }
    if (F.kind === 'marble') { g.strokeStyle = '#9b9a98'; for (let v = 0; v < 14; v++) { g.globalAlpha = 0.15 + R() * 0.3; g.lineWidth = 0.5 + R() * 2.5; g.beginPath(); let x = R() * N, y = 0; g.moveTo(x, y); while (y < N) { x += (R() - 0.45) * 40; y += 12 + R() * 20; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / metres, 1 / metres); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  cache.set(id, t); return t;
}
