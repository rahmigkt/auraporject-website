// AURA — rugs at true size, shared by the home plan and the studio. Construction (flat-weave, jute, cut pile, loop,
// cut-and-loop, long pile), pattern, edge and colour are independent (Codex PERDE-HALI-ARASTIRMA-02): a kilim is a
// construction, not a diamond print. Pile height sets the thickness; the texture is drawn at a fixed mm scale, so a
// stripe is as wide on a 160×230 rug as on a 240×340. Seeded: the same project draws the same rug.
import * as THREE from '../vendor/three.module.js?v=20261016b';
import {RUGS, hex, seeded} from './tekstil.js?v=20261021e';

const cache = new Map();
function rugTexture(w, d, r) {
  const key = [w, d, r.construction, r.pattern, r.edge, r.color].join('|'); if (cache.has(key)) return cache.get(key);
  const k = 0.25, W = Math.max(64, Math.round(w * k)), D = Math.max(64, Math.round(d * k)), c = document.createElement('canvas'); c.width = W; c.height = D;
  const g = c.getContext('2d'), R = seeded(w * 31 + d * 17 + r.construction.length * 101 + r.pattern.length), base = new THREE.Color(hex(r.color));
  const tone = f => { const q = base.clone().multiplyScalar(f); return `rgb(${Math.min(255, q.r * 255) | 0},${Math.min(255, q.g * 255) | 0},${Math.min(255, q.b * 255) | 0})`; };
  g.fillStyle = tone(1); g.fillRect(0, 0, W, D);
  // pattern first (motif colours), then the construction's surface on top
  const m = 90 * k, dark = tone(0.62), light = tone(1.18);
  if (r.pattern === 'serit') for (let y = m * 1.5, i = 0; y < D - m; y += 160 * k, i++) { g.fillStyle = i % 2 ? light : dark; g.fillRect(m, y, W - 2 * m, 45 * k); }
  if (r.pattern === 'baklava') { const s = 260 * k; g.fillStyle = dark; for (let y = m + s / 2; y < D - m; y += s) for (let x = m + s / 2; x < W - m; x += s) { g.beginPath(); g.moveTo(x, y - s * 0.42); g.lineTo(x + s * 0.3, y); g.lineTo(x, y + s * 0.42); g.lineTo(x - s * 0.3, y); g.closePath(); g.fill(); g.fillStyle = light; g.fillRect(x - s * 0.05, y - s * 0.05, s * 0.1, s * 0.1); g.fillStyle = dark; } }
  if (r.pattern === 'kare') { g.strokeStyle = dark; g.lineWidth = 14 * k; const s = 300 * k; for (let x = m; x <= W - m + 1; x += s) { g.beginPath(); g.moveTo(x, m); g.lineTo(x, D - m); g.stroke(); } for (let y = m; y <= D - m + 1; y += s) { g.beginPath(); g.moveTo(m, y); g.lineTo(W - m, y); g.stroke(); } }
  const n = W * D;
  switch (r.construction) {
    case 'duz-dokuma': for (let y = 0; y < D; y += 2.5 * k * 4) { g.globalAlpha = 0.10; g.fillStyle = '#000'; g.fillRect(0, y, W, 1); } break;            // weft ribs
    case 'jut': for (let i = 0; i < n / 30; i++) { g.globalAlpha = 0.16; g.fillStyle = R() < 0.5 ? '#3b2a12' : '#fff6dc'; g.fillRect(R() * W, R() * D, 6 * k * 4 * R() + 2, 2); } break; // coarse yarn
    case 'kisa-hav': for (let i = 0; i < n / 6; i++) { g.globalAlpha = 0.07; g.fillStyle = R() < 0.5 ? '#000' : '#fff'; g.fillRect(R() * W, R() * D, 1, 1); } break;     // velvet-like speckle
    case 'bukle': for (let i = 0; i < n / 22; i++) { g.globalAlpha = 0.14; g.strokeStyle = R() < 0.5 ? '#000' : '#fff'; g.lineWidth = 1; g.beginPath(); g.arc(R() * W, R() * D, 1.6, 0, 7); g.stroke(); } break; // loops
    case 'rolyef': for (let y = 0; y < D; y += 40 * k) for (let x = 0; x < W; x += 40 * k) if ((Math.floor(x / (40 * k)) + Math.floor(y / (40 * k))) % 3 === 0) { g.globalAlpha = 0.13; g.fillStyle = '#000'; g.fillRect(x, y, 40 * k, 40 * k); } for (let i = 0; i < n / 8; i++) { g.globalAlpha = 0.06; g.fillStyle = '#fff'; g.fillRect(R() * W, R() * D, 1, 1); } break;
    case 'uzun-hav': for (let i = 0; i < n / 3; i++) { g.globalAlpha = 0.09; g.strokeStyle = R() < 0.5 ? '#000' : '#fff'; g.lineWidth = 1; const x = R() * W, y = R() * D, a = R() * 6.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); g.stroke(); } break; // shag
  }
  g.globalAlpha = 1;
  if (r.edge === 'biye') { g.strokeStyle = tone(0.55); g.lineWidth = 30 * k; g.strokeRect(15 * k, 15 * k, W - 30 * k, D - 30 * k); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(key, t); return t;
}
// a rug w × d mm lying on the floor, centred at the origin, long side along local z when d > w
export function rugMesh(w, d, r) {
  const C = RUGS[r.construction] || RUGS['duz-dokuma'], th = C.thick / 1000, G = new THREE.Group();
  const top = new THREE.MeshStandardMaterial({map: rugTexture(w, d, r), roughness: C.pile > 20 ? 1 : 0.95}), side = new THREE.MeshStandardMaterial({color: hex(r.color), roughness: 1});
  const m = new THREE.Mesh(new THREE.BoxGeometry(w / 1000, th, d / 1000), [side, side, top, side, side, side]); m.position.y = th / 2 + 0.001; m.receiveShadow = true; G.add(m);
  if (r.edge === 'sacak') { const R = seeded(w + d), fm = new THREE.MeshStandardMaterial({color: new THREE.Color(hex('kirik-beyaz')), roughness: 1});
    for (const s of [-1, 1]) for (let x = -w / 2 + 15; x < w / 2; x += 18) { const l = 0.06 + R() * 0.012, f = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, l), fm); f.position.set(x / 1000, 0.002, s * (d / 2000 + l / 2)); G.add(f); } }
  G.userData = {thickness_mm: C.thick}; return G;
}
