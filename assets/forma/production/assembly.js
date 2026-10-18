// Production: assembly booklet (montaj kitapçığı) from an approved design. The steps follow the panel build order
// (carcass with the back slid into its grooves, plinth / legs, wall fixing, drawers, doors, shelves, handles,
// fittings); each step names its parts by the cut-list codes and its hardware with quantities, and is illustrated
// by an exploded isometric view (this step's parts in colour, earlier parts in grey, later parts hidden).
// Text is in Turkish and English now; the other site languages fall back to English until translated.

const TXT = {
  tr: {
    title: 'Montaj kitapçığı', parts: 'Parça listesi', hardware: 'Bağlantı ve donanım', tools: 'Gerekli aletler', step: 'Adım', qty: 'Adet', code: 'Kod', size: 'Ölçü (mm)',
    toolsList: 'Akülü vidalama (PZ2 uç), 4 mm alyan, çekiç (lastik), su terazisi, metre, 8 mm beton/ahşap matkap ucu',
    safety: ['Montaj iki kişi ile yapılmalıdır.', 'Yüksek mobilyalar duvara sabitlenmeden kullanılmamalıdır (EN 14749).', 'Parçaları yumuşak bir zemin üzerinde, ön yüzleri aşağı bakmayacak şekilde serin.', 'Bağlantıları önce elle yerleştirin, sonra sıkın; aşırı sıkmayın.'],
    approved: 'Onaylayan', order: 'Sipariş adedi', link: 'Tasarımı aç',
    steps: {
      prepare: ['Hazırlık', 'Kutuları açın, parçaları kod etiketlerine göre ayırın ve listeyle karşılaştırın. Eksik ya da hasarlı parça varsa montaja başlamayın.'],
      carcass: ['Gövde: yanlar, alt tabla ve ara dikmeler', 'Kavelaları alt tabla ve ara dikmelerin deliklerine çakın. Bir yan dikmeyi yere yatırın, alt tablayı ve ara dikmeleri takın, minifix kilitlerini çeyrek tur çevirerek sıkın.'],
      back: ['Arkalık', '8 mm arkalık panellerini yan dikme ve alt tablanın kanallarına kaydırın. Arkalık gövdeyi gönyeye getirir; köşegenleri ölçerek kontrol edin.'],
      close: ['Gövdeyi kapatma: karşı yan, üst tabla ve sabit raflar', 'Karşı yan dikmeyi, üst tablayı ve sabit rafları takın; tüm minifixleri sıkın. Köşegenler eşit olmalıdır (fark ≤ 2 mm).'],
      base: ['Baza / ayaklar', 'Ayarlı ayakları veya ayakları vidalayın. Gövdeyi kaldırıp yerine koyun ve su terazisiyle ayarlayın. Baza önü, kapakların 50 mm gerisine klipslenir.'],
      join: ['Modülleri birleştirme', 'Yan yana gelen modülleri hizalayın ve birleştirme vidalarıyla (4 adet / yükseklik) birbirine bağlayın.'],
      wall: ['Duvara sabitleme', 'Devrilme önleyici aparatı gövdenin üst arkasına ve duvara takın. Dübeli duvar tipine göre seçin.'],
      drawers: ['Çekmeceler', 'Rayların gövde parçalarını işaretli deliklere vidalayın. Çekmece kutularını (yan, ön/arka, kanallı taban) birleştirin, ray yarılarını takın, çekmeceleri yerine itin ve önleri ayar vidalarıyla 2 mm derze getirin.'],
      doors: ['Kapaklar', 'Menteşe kaplarını kapaklara, montaj tabanlarını gövdeye takın. Kapakları geçirin; menteşelerin üç yönlü ayarıyla aralıkları 2 mm eşitleyin.'],
      sliding: ['Sürgü kapaklar', 'Üst ve alt rayları takın, kapak tekerleklerini yerleştirin; önce arka raydaki, sonra ön raydaki kanatları asın ve fren ayarını yapın.'],
      shelves: ['Raflar', 'Raf pimlerini istenen yüksekliğe takın ve rafları yerleştirin. Cam raflar kenar koruyucularıyla takılır.'],
      handles: ['Kulplar', 'Kulpları şablona göre delinmiş deliklere M4 vidalarla takın. Bas-aç kullanılıyorsa mekanizmayı kapak arkasına takın.'],
      interior: ['İç donanım', 'Askı borusunu uç yuvalarına, LED şeridi ve trafosunu yerine takın. Elektrik bağlantısını yetkili kişi yapmalıdır.'],
      top: ['Üst tabla ve ayna', 'Üst tablayı gövdeye alttan vidalayın. Aynayı tabla ve duvar bağlantılarıyla sabitleyin.'],
      worktop: ['Tezgah, evye ve cihazlar', 'Tezgahı modüllerin üstüne yerleştirip alttan sabitleyin; evye ve ocak kesimleri fabrikada açılmıştır. Evye, batarya ve cihazların bağlantısını yetkili servis yapmalıdır.'],
      finish: ['Son kontrol', 'Tüm kapak ve çekmece aralıklarını kontrol edin (2 mm). Koruyucu filmleri çıkarın. Yüzeyleri nemli bezle silin.']
    }
  },
  en: {
    title: 'Assembly instructions', parts: 'Parts list', hardware: 'Fittings and hardware', tools: 'Tools needed', step: 'Step', qty: 'Qty', code: 'Code', size: 'Size (mm)',
    toolsList: 'Cordless screwdriver (PZ2 bit), 4 mm hex key, rubber mallet, spirit level, tape measure, 8 mm drill bit',
    safety: ['Two people are needed for assembly.', 'Tall furniture must be fixed to the wall before use (EN 14749).', 'Lay the parts on a soft surface, fronts facing up.', 'Fit fixings by hand first, then tighten; do not overtighten.'],
    approved: 'Approved by', order: 'Order quantity', link: 'Open design',
    steps: {
      prepare: ['Preparation', 'Unpack and sort the parts by their code labels; check them against the list. Do not start if anything is missing or damaged.'],
      carcass: ['Carcass: sides, bottom and dividers', 'Tap the dowels into the bottom and dividers. Lay one side down, fit the bottom and dividers and turn the cam locks a quarter turn.'],
      back: ['Back panel', 'Slide the 8 mm backs into the grooves of the side and bottom. The back squares the carcass: check the diagonals.'],
      close: ['Close the carcass: other side, top and fixed shelves', 'Fit the other side, the top and fixed shelves; tighten all cams. Diagonals must match (≤ 2 mm).'],
      base: ['Plinth / legs', 'Screw on the adjustable feet or legs. Stand the carcass in place and level it. The plinth clips on 50 mm behind the fronts.'],
      join: ['Join the modules', 'Align neighbouring modules and connect them with connector screws (4 per height).'],
      wall: ['Fix to the wall', 'Fit the anti-tip bracket to the top back of the carcass and to the wall. Choose plugs for the wall type.'],
      drawers: ['Drawers', 'Screw the runner bodies to the marked holes. Assemble the drawer boxes (sides, ends, grooved bottom), fit the runner halves, push the drawers in and set the fronts to a 2 mm reveal.'],
      doors: ['Doors', 'Fit the hinge cups to the doors and the mounting plates to the carcass. Clip the doors on and adjust the hinges in three directions to even 2 mm gaps.'],
      sliding: ['Sliding doors', 'Fit the top and bottom tracks and the rollers; hang the back-track leaves first, then the front ones, and set the soft-close.'],
      shelves: ['Shelves', 'Push the shelf pins in at the chosen heights and lay the shelves. Glass shelves go on pins with edge guards.'],
      handles: ['Handles', 'Fix the handles with M4 screws through the drilled holes. For push-to-open, fit the latch behind the front.'],
      interior: ['Interior fittings', 'Fit the hanging rail into its end cups and the LED strip and driver. Electrical connection by a qualified person.'],
      top: ['Top and mirror', 'Screw the top to the carcass from below. Fix the mirror to the top and the wall.'],
      worktop: ['Worktop, sink and appliances', 'Lay the worktop on the modules and fix it from below; sink and hob cut-outs are factory made. Sink, tap and appliances to be connected by a qualified installer.'],
      finish: ['Final check', 'Check all door and drawer gaps (2 mm). Remove protective films. Wipe the surfaces with a damp cloth.']
    }
  }
};
export const BOOKLET_LANGS = Object.keys(TXT);
const txt = lang => TXT[lang] || TXT.en;

const ROLE_STEP = {
  side: 'carcass', bottom: 'carcass', divider: 'carcass', back: 'back', top: 'close', 'shelf-fixed': 'close', 'case-top': 'top',
  plinth: 'base', 'plinth-end': 'base', leg: 'base', 'wall-rail': 'wall', 'box-side': 'drawers', 'box-end': 'drawers', 'box-bottom': 'drawers', runner: 'drawers', 'drawer-front': 'drawers', 'inner-front': 'drawers', spacer: 'drawers',
  door: 'doors', hinge: 'doors', 'front-frame': 'doors', 'front-slat': 'doors', reeds: 'doors', mirror: 'doors', 'sliding-door': 'sliding', track: 'sliding', 'dw-front': 'worktop',
  'shelf-adj': 'shelves', 'shelf-glass': 'shelves', pull: 'handles', rail: 'interior', 'rail-cup': 'interior', led: 'interior', cable: 'interior',
  'mirror-frame': 'top', worktop: 'worktop', backsplash: 'worktop', sink: 'worktop', tap: 'worktop', hob: 'worktop', hood: 'worktop', appliance: 'worktop', 'appliance-door': 'worktop', 'appliance-handle': 'worktop', 'end-panel': 'close'
};
const ORDER = ['prepare', 'carcass', 'back', 'close', 'base', 'join', 'wall', 'drawers', 'doors', 'sliding', 'shelves', 'handles', 'interior', 'top', 'worktop', 'finish'];
/** Exploded offset per step (mm): where the parts come from. */
const EXPLODE = {carcass: [0, 0, 0], back: [0, 0, -260], close: [0, 220, 0], base: [0, -160, 0], drawers: [0, 0, 320], doors: [0, 0, 260], sliding: [0, 0, 260], shelves: [0, 0, 220], handles: [0, 0, 120], interior: [0, 0, 160], top: [0, 220, 0], worktop: [0, 260, 0]};

/** Steps of the build for a compiled design. */
export function assemblySteps(compiled, bom, lang = 'tr') {
  const t = txt(lang), byStep = new Map();
  for (const q of compiled.parts) { if (q.line || q.decor || q.role === 'seam') continue; const s = q.role === 'side' && /side-R/.test(q.id) ? 'close' : ROLE_STEP[q.role]; if (!s) continue; (byStep.get(s) || byStep.set(s, []).get(s)).push(q); }
  const p = compiled.params, multi = (compiled.meta.modules || 1) > 1;
  const hw = bom.rows.filter(r => r.code[0] === 'H' || r.code[0] === 'A');
  const hwFor = {carcass: /Bağlantı|Connectors/, base: /ayak|foot/i, wall: /Devrilme|Anti-tip|Duvar askı|Wall hanging/, drawers: /rayı|runners/i, doors: /Menteşe|Hinge/, sliding: /Sürgü|Sliding/, shelves: /Raf pimi|Shelf pin/, handles: /kulp|Kulp|Handle|pull|tutamak|Bas-aç|Push/i, interior: /Askı|rail|LED|Kablo|grommet/i, worktop: /Evye|Sink|Batarya|Tap|fırın|oven|Buzdolabı|fridge|Bulaşık|Dish|Davlumbaz|hood|ocak|hob|aspiratör|microwave|Mikrodalga/i};
  const steps = [];
  for (const id of ORDER) {
    if (id === 'prepare' || id === 'finish') { steps.push({id, title: t.steps[id][0], text: t.steps[id][1], parts: [], hardware: []}); continue; }
    if (id === 'join' && !multi) continue;
    if (id === 'wall' && !(p.height >= 1000 || ['wardrobe', 'dresser', 'bookcase', 'vitrine'].includes(p.kind) || p.base === 'wall' || compiled.family !== 'storage')) continue;
    const parts = byStep.get(id) || [];
    if (!parts.length && !['join', 'wall'].includes(id)) continue;
    const codes = [...new Set(bom.rows.filter(r => r.code[0] === 'K' && parts.some(q => matches(r, q))).map(r => r.code))];
    steps.push({id, title: t.steps[id][0], text: t.steps[id][1], parts, codes, hardware: hw.filter(r => hwFor[id]?.test(r.nameTr + ' ' + r.nameEn)).map(r => ({name: lang === 'tr' ? r.nameTr : r.nameEn, qty: r.qty, spec: lang === 'tr' ? r.specTr : r.specEn}))});
  }
  return steps;
}
const ROLE_NAME_HINT = {side: 'Yan', bottom: 'Alt', top: 'Üst tabla', divider: 'Ara', back: 'Arkalık', 'shelf-fixed': 'Sabit raf', 'shelf-adj': 'Ayarlı raf', 'shelf-glass': 'Cam raf', door: 'Kapak', 'drawer-front': 'Çekmece önü', 'box-side': 'kutusu yanı', 'box-end': 'ön/arka', 'box-bottom': 'tabanı', plinth: 'Baza', 'plinth-end': 'Baza', 'case-top': 'Üst tabla', worktop: 'Tezgah', 'inner-front': 'İç çekmece', spacer: 'takozu', 'mirror-frame': 'Ayna çerçevesi', 'end-panel': 'Kapama', 'dw-front': 'Bulaşık'};
function matches(row, q) { const h = ROLE_NAME_HINT[q.role]; if (!h || !row.nameTr.includes(h)) return false; const d = (q.cut || [q.geom.w, q.geom.h, q.geom.d]).map(Math.round).sort((a, b) => b - a); return Math.abs(row.size[0] - d[0]) <= 1 && Math.abs(row.size[1] - d[1]) <= 1; }

// ---- Exploded isometric view (SVG) -------------------------------------------------------------------------
const ISO = (x, y, z) => [(x - z) * 0.866, -y + (x + z) * 0.5];
function boxFaces(q, off = [0, 0, 0]) {
  if (q.geom?.fn !== 'cushion' && q.geom?.fn !== 'box' && !q.cut) return null;
  const [w, h, d] = q.geom?.fn === 'cushion' || q.geom?.fn === 'box' ? [q.geom.w, q.geom.h, q.geom.d] : [q.cut[0], q.cut[2], q.cut[1]];
  const [cx, cy, cz] = [q.pos[0] + off[0], q.pos[1] + off[1], q.pos[2] + off[2]], x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  // Visible faces from the front-right-top: +z (front), +x (right), +y (top).
  return {depth: cx + cz + cy * 0.2 + Math.max(w, d) * 0.01, faces: [
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map(v => ISO(...v)),
    [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]].map(v => ISO(...v)),
    [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]].map(v => ISO(...v))
  ]};
}
/** SVG (in model units) of all parts up to this step; this step's parts coloured and pulled out. */
export function stepSvg(compiled, steps, k, {w = 170, h = 120, neutral = false} = {}) {
  const done = new Set(steps.slice(0, k).flatMap(s => s.parts)), now = new Set(steps[k].parts), off = EXPLODE[steps[k].id] || [0, 0, 0];
  const list = [];
  for (const q of compiled.parts) {
    const isNow = now.has(q), isDone = done.has(q); if (!isNow && !isDone) continue;
    const f = boxFaces(q, isNow && !neutral ? off : [0, 0, 0]); if (f) list.push({...f, isNow: isNow && !neutral});
  }
  if (!list.length) return '';
  list.sort((a, b) => a.depth - b.depth);
  const pts = list.flatMap(l => l.faces.flat()), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const s = Math.min(w / (maxX - minX || 1), h / (maxY - minY || 1)) * 0.92, tx = (w - (maxX - minX) * s) / 2 - minX * s, ty = (h - (maxY - minY) * s) / 2 - minY * s;
  const shade = [['#f7f4ee', '#e9e4da', '#fbfaf6'], ['#e7b9a3', '#d79c80', '#f0cdbd']];
  const out = list.map(l => l.faces.map((f, i) => `<path d="M${f.map(([x, y]) => `${(x * s + tx).toFixed(2)} ${(y * s + ty).toFixed(2)}`).join('L')}Z" fill="${shade[l.isNow ? 1 : 0][i]}" stroke="${l.isNow ? '#a24a2a' : '#8b8577'}" stroke-width="${l.isNow ? 0.28 : 0.15}" stroke-linejoin="round"/>`).join('')).join('');
  return `<g>${out}</g>`;
}

// ---- Booklet pages (A4 portrait SVG) -------------------------------------------------------------------------
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
function wrap(text, n) { const words = String(text).split(' '), lines = []; let cur = ''; for (const w of words) { if ((cur + ' ' + w).trim().length > n) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; } if (cur.trim()) lines.push(cur.trim()); return lines; }
const page = (body, n, total, footer) => `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297" font-family="Helvetica, Arial, sans-serif"><rect width="210" height="297" fill="#fff"/>${body}<line x1="14" y1="284" x2="196" y2="284" stroke="#d8d4ca" stroke-width="0.2"/><text x="14" y="289" font-size="2.6" fill="#5c625a">${esc(footer)}</text><text x="196" y="289" font-size="2.6" fill="#5c625a" text-anchor="end">${n} / ${total}</text></svg>`;

/** All booklet pages. info: {title, id, qty, approvedBy, date, link, lang, dims}. */
export function bookletPages(compiled, bom, info) {
  const t = txt(info.lang), steps = assemblySteps(compiled, bom, info.lang), pages = [];
  const footer = `AURA · ${info.title} · ${info.id}${info.approvedBy ? ` · ${t.approved}: ${info.approvedBy} (${info.date})` : ''}`;
  // Cover: whole piece, size, order, safety.
  const all = {id: 'all', parts: compiled.parts.filter(q => !q.internal && !q.line && !q.decor)};
  const cover = [`<text x="14" y="24" font-size="9" font-weight="700" letter-spacing="1">AURA</text><text x="14" y="34" font-size="6">${esc(t.title)}</text><text x="14" y="44" font-size="5" font-weight="600">${esc(info.title)}</text><text x="14" y="51" font-size="3.4" fill="#5c625a">${esc(info.dims)} · ${esc(t.order)}: ${info.qty}</text>`,
    `<g transform="translate(20 62)">${stepSvg(compiled, [all], 0, {w: 170, h: 120, neutral: true})}</g>`,
    `<g font-size="3.2">${t.safety.map((l, i) => `<text x="14" y="${200 + i * 7}">⚠ ${esc(l)}</text>`).join('')}</g>`,
    info.link ? `<a href="${esc(info.link)}"><text x="14" y="236" font-size="3" fill="#a24a2a">↗ ${esc(t.link)}</text></a>` : '',
    `<text x="14" y="248" font-size="3.4" font-weight="600">${esc(t.tools)}</text>${wrap(t.toolsList, 95).map((l, i) => `<text x="14" y="${254 + i * 5}" font-size="3">${esc(l)}</text>`).join('')}`];
  pages.push(cover.join(''));
  // Parts and hardware tables (may run over several pages).
  const rows = bom.rows.filter(r => r.code[0] === 'K').map(r => [r.code, info.lang === 'tr' ? r.nameTr : r.nameEn, r.size.join(' × '), r.qty * info.qty]);
  const hwRows = bom.rows.filter(r => r.code[0] !== 'K').map(r => [r.code, info.lang === 'tr' ? r.nameTr : r.nameEn, (info.lang === 'tr' ? r.specTr : r.specEn) || '', r.qty * info.qty]);
  const table = (title, head, data, y0) => { const o = [`<text x="14" y="${y0}" font-size="5" font-weight="600">${esc(title)}</text>`]; let y = y0 + 8; o.push(`<g font-size="2.8" fill="#5c625a"><text x="14" y="${y}">${esc(head[0])}</text><text x="30" y="${y}">${esc(head[1])}</text><text x="120" y="${y}">${esc(head[2])}</text><text x="196" y="${y}" text-anchor="end">${esc(head[3])}</text></g>`); for (const r of data) { y += 5.4; o.push(`<g font-size="2.9"><text x="14" y="${y}" font-weight="600">${esc(r[0])}</text><text x="30" y="${y}">${esc(String(r[1]).slice(0, 52))}</text><text x="120" y="${y}">${esc(String(r[2]).slice(0, 44))}</text><text x="196" y="${y}" text-anchor="end">${r[3]}</text></g><line x1="14" y1="${y + 1.6}" x2="196" y2="${y + 1.6}" stroke="#ebe7de" stroke-width="0.15"/>`); } return o.join(''); };
  for (let i = 0; i < rows.length; i += 42) pages.push(table(t.parts, [t.code, '', t.size, t.qty], rows.slice(i, i + 42), 22));
  for (let i = 0; i < hwRows.length; i += 42) pages.push(table(t.hardware, [t.code, '', '', t.qty], hwRows.slice(i, i + 42), 22));
  // Steps: two per page.
  const real = steps.filter(s => s.id !== 'prepare' && s.id !== 'finish');
  const blocks = steps.map(s => {
    const k = real.indexOf(s), figure = k >= 0 ? stepSvg(compiled, real, k, {w: 120, h: 86}) : '';
    return (y0, n) => `<text x="14" y="${y0}" font-size="4.6" font-weight="600"><tspan fill="#a24a2a" font-weight="700">${n}</tspan>  ·  ${esc(s.title)}</text>
      ${wrap(s.text, 105).map((l, i) => `<text x="14" y="${y0 + 8 + i * 4.6}" font-size="3.1">${esc(l)}</text>`).join('')}
      ${figure ? `<g transform="translate(14 ${y0 + 22})">${figure}</g>` : ''}
      <g font-size="2.9">${(s.codes || []).length ? `<text x="140" y="${y0 + 26}" fill="#5c625a">${esc(t.parts)}</text><text x="140" y="${y0 + 31}">${esc(s.codes.join(', ')).slice(0, 60)}</text>` : ''}
      ${(s.hardware || []).map((h, i) => `<text x="140" y="${y0 + 40 + i * 5}">${esc(h.name)} × ${h.qty * info.qty}</text>`).join('')}</g>`;
  });
  for (let i = 0; i < blocks.length; i += 2) pages.push(blocks.slice(i, i + 2).map((b, j) => b(22 + j * 130, `${t.step} ${i + j + 1}`)).join(''));
  return pages.map((body, i) => page(body, i + 1, pages.length, footer));
}
