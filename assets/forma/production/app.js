import {manufacturingReport,manufacturingCsv,manufacturingOperationsCsv} from './manufacturing.js';
// Production page: open an approved design (link or file), record the approval, then produce the cutting plan
// and the assembly booklet for each panel product. Nothing here is offered to customers.
import {normalizeDesign, compileDesign} from '../generate.js';
import {silhouetteDxf} from '../overrides.js';
import {familyOf} from '../families.js';
import {bom} from '../bom.js';
import {readLink, designLink} from '../link.js';
import {cuttingPlan, cuttingCsv, sheetSvg} from './nesting.js';
import {bookletPages} from './assembly.js';
import {zip, jpegPdf, svgToJpeg, download} from '../package.js';
import {t, partName} from '../i18n.js';

const $ = s => document.querySelector(s);
const PANEL = ['storage', 'kitchen', 'bath'];
let items = [];

function quantity(value = 1) {
  const n = Number(value);
  if (!['number', 'string'].includes(typeof value) || !Number.isInteger(n) || n < 1 || n > 999) throw new Error('Adet 1 ile 999 arasında tam sayı olmalı.');
  return n;
}
function setItems(list) {
  items = list.map((it, i) => ({id: it.id || `U${i + 1}`, qty: quantity(it.qty ?? 1), design: normalizeDesign(it.design)}));
  $('#loadState').textContent = items.length ? `${items.length} ürün yüklendi.` : 'Tasarım bulunamadı.';
  render();
}
function render() {
  $('#items').innerHTML = items.map((it, i) => {
    const d = it.design, panel = PANEL.includes(d.family), c = compileDesign(d), o = c.meta.overall;
    return `<li><span><b>${t(d.kind, 'tr')}</b><small>${d.style} · ${o.width} × ${o.depth} × ${o.height} mm${panel ? '' : ' · bu aile için ebatlama/montaj henüz yok'}</small></span>
      <span class="p-acts"><label class="p-note">Adet <input type="number" min="1" max="999" value="${it.qty}" data-qty="${i}" style="width:64px"></label>
      ${panel ? `<button class="f-secondary" data-cut="${i}" ${ready() ? '' : 'disabled'}>Ebatlama ↓</button><button class="f-secondary" data-book="${i}" ${ready() ? '' : 'disabled'}>Kitapçık ↓</button>` : ''}</span></li>`;
  }).join('');
  $('#all').disabled = !ready() || !items.some(it => PANEL.includes(it.design.family) || it.design.overrides?.length);
  $('#approveState').textContent = items.length && !ready() ? 'Dosyalar için onaylayan adı ve onay kutusu gerekli.' : '';
}
const ready = () => items.length && $('#approve').checked && $('#approver').value.trim().length >= 2;
const rules = () => ({kerf: +$('#kerf').value || 4.4, trim: +$('#trim').value || 10, band: +$('#band').value || 0});
const stamp = () => ({approvedBy: $('#approver').value.trim(), date: new Date().toISOString().slice(0, 10), lang: $('#lang').value});
const nameOf = r => { const R = {side: 'Yan dikme', top: 'Üst tabla', 'case-top': 'Üst tabla', bottom: 'Alt tabla', divider: 'Ara dikme', 'shelf-fixed': 'Sabit raf', 'shelf-adj': 'Ayarlı raf', back: 'Arkalık', plinth: 'Baza', 'plinth-end': 'Baza yanı', door: 'Kapak', 'drawer-front': 'Çekmece önü', 'inner-front': 'İç çekmece önü', 'box-side': 'Çekmece yanı', 'box-end': 'Çekmece ön/arka', 'box-bottom': 'Çekmece tabanı', spacer: 'Menteşe takozu', 'dw-front': 'Bulaşık makinesi kapağı', 'end-panel': 'Kapama paneli', worktop: 'Tezgah', backsplash: 'Tezgah arası', 'shelf-glass': 'Cam raf', mirror: 'Ayna', 'mirror-frame': 'Ayna çerçevesi', 'sliding-door': 'Sürgü kapak'}; return R[r.role] || r.role; };

async function files(i) {
  const it = items[i], d = it.design, c = compileDesign(d), s = stamp(), name = t(d.kind, s.lang), id = `F-${String(d.seed % 100000).padStart(5, '0')}`;
  const b = bom(c, d.materials, s.lang === 'tr' ? 'tr' : 'en'), link = await designLink(d, s.lang), dir = `${String(i + 1).padStart(2, '0')}-${d.kind}`;
  // Cutting plan.
  const cp = cuttingPlan(c, d, it.qty, rules()), sheetPages = [];
  if(!cp.complete) throw Error('Kesim paketi eksik: levhaya sığmayan parça var. Onaylı ek tasarımı veya uygun levha seçilmeden üretim çıktısı hazırlanamaz.');
  for (const bd of cp.plan) for (const [k, sh] of bd.sheets.entries()) if (sh.placed.length) sheetPages.push(await svgToJpeg(sheetSvg(bd, sh, k, {title: `${name} × ${it.qty}`, note: `${id} · Onay: ${s.approvedBy} ${s.date}`}), 2480));
  // Booklet.
  const o = c.meta.overall, pages = bookletPages(c, b, {title: name, id, qty: it.qty, approvedBy: s.approvedBy, date: s.date, link, lang: s.lang, dims: `${o.width} × ${o.depth} × ${o.height} mm`});
  const bookletJpgs = []; for (const pg of pages) bookletJpgs.push(await svgToJpeg(pg, 1754));
  const assessment=manufacturingReport(c,d,{band:rules().band});
  return [
    {name: `${dir}/ebatlama.csv`, data: cuttingCsv(cp, nameOf)},
    {name: `${dir}/levha-plani.pdf`, data: jpegPdf(sheetPages.length ? sheetPages : [await svgToJpeg(sheetSvg({board: {label: '-'}, sheet: {label: '-'}, sheetCount: 0}, {sheet: {l: 2800, w: 2100}, placed: [], used: 0}, 0), 1200)])},
    {name: `${dir}/montaj-kitapcigi.pdf`, data: jpegPdf(bookletJpgs.map((j, k) => k ? j : {...j, link: {url: link, rect: [0.06, 0.78, 0.5, 0.81]}}))},
    {name: `${dir}/onay.json`, data: JSON.stringify({approval_scope:'user_design_confirmation_only',manufacturing_approved:false,approvedBy: s.approvedBy, date: s.date, language: s.lang, quantity: it.qty, link, design: d, sheets: cp.plan.map(p => ({board: p.board.label, sheet: p.sheet.label, count: p.sheetCount, yield: Math.round(p.yield * 100)}))}, null, 2)},
    ...assessmentFiles(dir,assessment,it.qty),
    ...(c.meta.shaped ? [{name: `${dir}/cnc-siluetler.dxf`, data: silhouetteDxf(c)}] : [])
  ];
}
function assessmentFiles(dir,report,quantity=1){return [{name:dir+'/manufacturing-review.json',data:JSON.stringify(report,null,2)},{name:dir+'/manufacturing-blanks.csv',data:manufacturingCsv(report,quantity)},{name:dir+'/machining-review.csv',data:manufacturingOperationsCsv(report,quantity)}];}
/** Free-form (designer-shaped) pieces of families without a panel cut list: CNC outlines and the approval record. */
async function shapedFiles(i) {
  const it = items[i], d = it.design, c = compileDesign(d), s = stamp(), link = await designLink(d, s.lang), dir = `${String(i + 1).padStart(2, '0')}-${d.kind}`;
  return [{name: `${dir}/cnc-siluetler.dxf`, data: silhouetteDxf(c)}, {name: `${dir}/onay.json`, data: JSON.stringify({approvedBy: s.approvedBy, date: s.date, quantity: it.qty, link, design: d}, null, 2)}];
}

$('#items').addEventListener('change', e => { const q = e.target.dataset.qty; if (q !== undefined) { try { items[+q].qty = quantity(e.target.value); $('#outState').textContent = ''; } catch (err) { e.target.value = String(items[+q].qty); $('#outState').textContent = err.message; } } });
$('#items').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || !ready()) return;
  const i = +(b.dataset.cut ?? b.dataset.book); $('#outState').textContent = 'Hazırlanıyor…';
  try {
    const f = await files(i);
    if (b.dataset.cut !== undefined) { download(f[0].name.split('/').pop(), f[0].data, 'text/csv'); download(f[1].name.split('/').pop(), f[1].data, 'application/pdf'); }
    else download(f[2].name.split('/').pop(), f[2].data, 'application/pdf');
    $('#outState').textContent = 'Hazır.';
  } catch (err) { $('#outState').textContent = String(err.message || err); }
});
$('#all').onclick = async () => {
  if (!ready()) return; $('#outState').textContent = 'Hazırlanıyor…';
  try { const all = []; for (const [i, it] of items.entries()) { if (PANEL.includes(it.design.family)) all.push(...await files(i)); else { all.push(...assessmentFiles(String(i+1).padStart(2,'0')+'-'+it.design.kind,manufacturingReport(compileDesign(it.design),it.design),it.qty));if(it.design.overrides?.length)all.push(...await shapedFiles(i)); } } download(`AURA-uretim-${new Date().toISOString().slice(0, 10)}.zip`, zip(all), 'application/zip'); $('#outState').textContent = 'Hazır.'; }
  catch (err) { $('#outState').textContent = String(err.message || err); }
};
for (const el of ['#approve', '#approver']) $(el).addEventListener('input', render);
$('#link').addEventListener('change', async e => { try { const u = e.target.value.trim(), h = u.slice(u.indexOf('#')); const r = await readLink(h); if (!r) { $('#loadState').textContent = 'Bağlantı okunamadı.'; return; } setItems(r.design ? [{design: r.design}] : r.items); } catch { $('#loadState').textContent = 'Bağlantı okunamadı.'; } });
$('#file').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (j.design) setItems([{design: j.design, qty: j.quantity}]); else if (j.link) { const r = await readLink(j.link.slice(j.link.indexOf('#'))); setItems(r?.design ? [{design: r.design}] : r?.items || []); } else setItems([]); }
  catch { $('#loadState').textContent = 'Dosya okunamadı.'; }
});
readLink().then(r => { if (r) setItems(r.design ? [{design: r.design}] : r.items); }).catch(() => { $('#loadState').textContent = 'Bağlantı okunamadı.'; });
void partName;
