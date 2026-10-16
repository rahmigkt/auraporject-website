// Bill of materials for the designer: grouped parts, sizes, materials, suggested build specs and fabric need.
// Build specs are starting suggestions for the designer to confirm, not engineering approval.
import {buildMesh} from './build.js';
import {tableBom} from './table.js';
import {bedroomBom} from './bedroom.js';
import {bounds} from './mesh.js';
import {FIBERS, WEAVE_NAMES, PATTERNS, COLORS, WOODS, FINISHES, METALS, STAINS, STONES, GLASS, MOTIF_NAMES, name as nm} from './catalog.js';
import {yardage} from './textile.js';

const ROLE = {
  'seat-deck': ['Oturum tabanı', 'Seat deck', 'Elastik kemer veya zigzag yay tabanı, 25 mm köpük kaplama', 'Elastic webbing or sinuous springs, 25 mm foam wrap'],
  'seat-cushion': ['Oturum minderi', 'Seat cushion', 'HR 35 kg/m³ köpük + elyaf sargı, fermuarlı kılıf', 'HR 35 kg/m³ foam + fibre wrap, zipped cover'],
  'seat-tight': ['Sabit oturum', 'Tight seat', 'HR 35 kg/m³ köpük, gövdeye sabit döşeme', 'HR 35 kg/m³ foam, fixed upholstery'],
  'back-cushion': ['Sırt minderi', 'Back cushion', 'Elyaf / kuştüyü karışımı dolgu, bölmeli iç kılıf', 'Fibre / feather blend in a baffled inner case'],
  'back-frame': ['Sırt gövdesi', 'Back frame', 'Masif + kontrplak iskelet, 25 mm köpük, kumaş', 'Solid + ply frame, 25 mm foam, fabric'],
  'back-tight': ['Sabit sırt', 'Tight back', 'Kontrplak iskelet, kademeli köpük (HR 30), kumaş', 'Ply frame, layered foam (HR 30), fabric'],
  'back-channel': ['Kanal (dikey dilim)', 'Back channel', 'Dikişli kanal, HR 30 köpük dolgu', 'Stitched channel, HR 30 foam fill'],
  'arm': ['Kolçak', 'Arm', 'Kontrplak profil iskelet, 25–40 mm köpük, kumaş', 'Ply profile frame, 25–40 mm foam, fabric'],
  'arm-post': ['Kol dikmesi', 'Arm post', 'Masif ahşap, zıvana birleşim', 'Solid wood, mortise and tenon'],
  'arm-top': ['Kol tablası', 'Arm top', 'Masif ahşap, kenarlar yuvarlatılmış', 'Solid wood, eased edges'],
  'leg': ['Ayak', 'Leg', 'Masif gürgen (sağlamlık için), renk ayrıca boya/vernik; M8 dişli pim', 'Solid beech (gürgen) for strength, colour as a separate stain/lacquer; M8 threaded insert'],
  'plinth': ['Kaide', 'Plinth', 'Kontrplak kutu, kaplama veya lake', 'Ply box, veneered or lacquered'],
  'skirt': ['Etek', 'Skirt', 'Astarlı kumaş panel, köşe pileli', 'Lined fabric panel, corner pleats'],
  'sled': ['Kızak ayak', 'Sled base', 'Bükülmüş çelik boru, toz boya / kaplama', 'Bent steel tube, powder coat / plating'],
  'base-rail': ['Taban kayıtı', 'Base rail', 'Masif ahşap, görünür birleşim', 'Solid wood, visible joinery'],
  'welt': ['Biye', 'Welt / piping', 'Ø5 mm kordon üzerine kumaş biye', 'Fabric over Ø5 mm cord'],
  'tuft-button': ['Kapitone düğmesi', 'Tufting button', 'Kumaş kaplı düğme Ø18 mm', 'Fabric-covered button Ø18 mm'],
  'pillow': ['Kırlent', 'Throw pillow', 'Elyaf veya kuştüyü iç yastık', 'Fibre or feather insert'],
  'frame-rail': ['İskelet kayıtı (iç)', 'Frame rail (internal)', 'Kurutulmuş masif gürgen 30×90, kavela + tutkal', 'Kiln-dried solid beech (gürgen) 30×90, dowelled and glued'],
  'frame-stretcher': ['İskelet kuşağı (iç)', 'Frame stretcher (internal)', 'Masif gürgen 22×60', 'Solid beech (gürgen) 22×60']
};

function meshArea(m) {
  let a = 0; const p = m.positions, idx = m.indices;
  for (let t = 0; t < idx.length; t += 3) {
    const i = idx[t] * 3, j = idx[t + 1] * 3, k = idx[t + 2] * 3;
    const ux = p[j] - p[i], uy = p[j + 1] - p[i + 1], uz = p[j + 2] - p[i + 2], vx = p[k] - p[i], vy = p[k + 1] - p[i + 1], vz = p[k + 2] - p[i + 2];
    a += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }
  return a;
}

function materialText(mat, materials, lang) {
  const f = materials.fabric, tr = lang === 'tr', n = e => (tr ? e.tr : e.en);
  if (mat === 'fabric') return `${n(FIBERS[f.fiber])} · ${FIBERS[f.fiber].weave ? n(WEAVE_NAMES[f.weave]) + ' · ' : ''}${n(COLORS[f.color])}${f.pattern !== 'none' ? ' · ' + n(PATTERNS[f.pattern]) + (f.motif ? ' (' + n(MOTIF_NAMES[f.motif]) + ')' : '') + ' / ' + n(COLORS[f.color2]) + ' · ' + (tr ? 'sıklık ' : 'density ') + f.density + '/6' : ''}`;
  if (mat === 'welt') return `${n(FIBERS[f.fiber])} · ${n(COLORS[materials.welt.color || f.color2])}`;
  if (mat === 'wood') return woodText(materials.wood, lang);
  if (mat === 'metal') return n(METALS[materials.metal.finish]);
  if (mat === 'dark') return tr ? 'Siyah mat yüzey' : 'Black matt finish';
  return tr ? 'Gürgen masif' : 'Solid beech (gürgen)';
}

const woodText = (w, lang) => `${nm(WOODS[w.species], lang)} · ${w.stain && w.stain !== 'natural' ? nm(STAINS[w.stain], lang) + ' · ' : ''}${nm(FINISHES[w.finish], lang)}`;

/** Localized text for a table surface slot. */
export function surfaceText(spec, lang) {
  if (!spec) return '';
  const tr = lang === 'tr';
  if (spec.surface === 'wood') return woodText(spec, lang) + (tr ? ' (masif)' : ' (solid)');
  if (spec.surface === 'veneer') return woodText(spec, lang) + (tr ? ' (kaplama)' : ' (veneer)');
  if (spec.surface === 'stone') return `${nm(STONES[spec.stone], lang)} · ${spec.polish === 'polished' ? (tr ? 'parlak' : 'polished') : (tr ? 'honlu (mat)' : 'honed')}`;
  if (spec.surface === 'glass') return nm(GLASS[spec.glass], lang);
  if (spec.surface === 'metal') return nm(METALS[spec.metal], lang);
  return `${tr ? 'Lake' : 'Lacquer'} · ${nm(COLORS[spec.color], lang)} · ${spec.finish === 'lacquer' ? (tr ? 'parlak' : 'gloss') : (tr ? 'mat' : 'matt')}`;
}

/** Grouped BOM rows plus totals. */
export function bom(compiled, materials, lang = 'tr') {
  if (compiled.family === 'table') {
    const text = slot => slot === 'top' ? surfaceText(materials.top, lang) : slot === 'base' ? surfaceText(materials.base.surface === 'same' ? materials.top : materials.base, lang) : slot === 'metal' ? nm(METALS[materials.base.surface === 'metal' ? materials.base.metal : materials.hardware.metal], lang) : slot === 'dark' ? (lang === 'tr' ? 'Siyah mat' : 'Black matt') : (lang === 'tr' ? 'Huş kontrplak / masif (iç)' : 'Birch ply / solid (internal)');
    return tableBom(compiled, materials, lang, buildMesh, text);
  }
  if (compiled.family === 'bedroom') {
    const tr = lang === 'tr';
    const text = mat => mat === 'case' ? surfaceText(materials.case, lang) : mat === 'fabric' || mat === 'welt' || mat === 'wood' || mat === 'metal' ? materialText(mat, materials, lang) : mat === 'cane' ? (tr ? 'Rattan hasır (Viyana örgüsü)' : 'Rattan cane (Vienna weave)') : mat === 'mirror' ? (tr ? 'Ayna 5 mm' : 'Mirror 5 mm') : mat === 'leather' ? (tr ? 'Deri' : 'Leather') : mat === 'dark' || mat === 'shadow' ? (tr ? 'Siyah mat' : 'Black matt') : (tr ? 'Huş kontrplak / masif (iç)' : 'Birch ply / solid (internal)');
    return bedroomBom(compiled, materials, lang, buildMesh, text);
  }
  const groups = new Map();
  let fabricArea = 0, weltLength = 0, buttons = 0;
  for (const part of compiled.parts) {
    const m = buildMesh(part), b = bounds(m.positions), size = b.size.map(v => Math.round(v)).sort((a, c) => c - a);
    if (part.mat === 'fabric' || part.mat === 'welt') {
      if (part.role === 'welt') weltLength += 2 * (part.geom.w + part.geom.d);
      else if (part.role === 'tuft-button') buttons += part.qty || 0;
      else fabricArea += meshArea(m) * (part.role === 'seat-deck' ? 0.55 : 1);
    }
    const key = `${part.role}|${part.mat}|${size.join('x')}`;
    const g = groups.get(key) || {role: part.role, mat: part.mat, size, qty: 0, ids: [], internal: !!part.internal};
    g.qty += part.role === 'tuft-button' ? part.qty : 1; g.ids.push(part.id); groups.set(key, g);
  }
  const rows = [...groups.values()].map((g, i) => {
    const r = ROLE[g.role] || [g.role, g.role, '', ''];
    return {code: `P${String(i + 1).padStart(2, '0')}`, ids: g.ids, nameTr: r[0], nameEn: r[1], qty: g.qty, size: g.size, material: materialText(g.mat, materials, lang), specTr: r[2], specEn: r[3], internal: g.internal};
  });
  const metres = yardage(fabricArea, {pattern: materials.fabric.pattern});
  return {rows, totals: {fabricAreaM2: +(fabricArea / 1e6).toFixed(2), fabricMetres: metres, weltMetres: +(weltLength / 1000).toFixed(1), buttons}};
}

export const csvCell = v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function bomCsv(b) {
  const head = ['Kod / Code', 'Parça', 'Part', 'Adet / Qty', 'Ölçü mm / Size mm', 'Malzeme / Material', 'Öneri yapım', 'Suggested build', 'İç parça / Internal'];
  const lines = [head, ...b.rows.map(r => [r.code, r.nameTr, r.nameEn, r.qty, r.size.join(' × '), r.material, r.specTr, r.specEn, r.internal ? 'x' : ''])];
  lines.push([]);
  if (b.totals.fabricAreaM2 !== undefined) lines.push(['Kumaş alanı / Fabric area m²', b.totals.fabricAreaM2], ['Tahmini kumaş (1400 mm top) / Est. fabric (1400 mm roll) m', b.totals.fabricMetres], ['Biye / Welt m', b.totals.weltMetres], ['Düğme / Buttons', b.totals.buttons]);
  if (b.totals.weightKg !== undefined && b.totals.topKg !== undefined) lines.push(['Tahmini ağırlık / Est. weight kg', b.totals.weightKg], ['Tabla ağırlığı / Top weight kg', b.totals.topKg], ['Kişi kapasitesi / Seats', b.totals.seats], ['Tabla alanı / Top area m²', b.totals.areaM2]);
  else if (b.totals.weightKg !== undefined) lines.push(['Tahmini ağırlık / Est. weight kg', b.totals.weightKg], ...(b.totals.mattress ? [['Yatak ölçüsü / Mattress cm', b.totals.mattress]] : []), ...(b.totals.drawers ? [['Çekmece / Drawers', b.totals.drawers]] : []));
  return '﻿' + lines.map(l => l.map(csvCell).join(';')).join('\r\n');
}
