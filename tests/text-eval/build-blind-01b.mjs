// Formats individually written passages; does not generate or rewrite prose.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomInt} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const base=path.join(root,'knowledge/aura-ses/denemeler');
const out=path.join(base,'01b');
const oldBytes=Buffer.from(fs.readFileSync(path.join(base,'metinler.jsonl'),'utf8').replaceAll('\r\n','\n'));
const old=oldBytes.toString('utf8').trim().split('\n').map(JSON.parse);
const prose=JSON.parse(fs.readFileSync(path.join(out,'yeniden-yazimlar.json'),'utf8'));
const newRows=old.map(row=>({...row,
  tanik:prose[row.id],
  ilkeler:[...row.ilkeler,'K11'],
  yorum_siniri:'Olgular etkin tasarım verisine bağlıdır. İmge, ritim ve anlatımın kesinliği serbesttir; imgesel sahne gerçek müşteri geçmişi veya ölçülmüş sonuç iddiası değildir.',
  yazan:'Codex; D3 ve karar sahibinin açık aşama 1b talimatıyla tek tek yeniden yazıldı',
  durum:'denetim_bekliyor',onaylayan_model:null,insan_secimi:null
}));
if(newRows.some(x=>!x.tanik))throw new Error('Missing individually written passage');
fs.writeFileSync(path.join(out,'metinler.jsonl'),newRows.map(x=>JSON.stringify(x)).join('\n')+'\n');

// Keep the first allocation stable across rebuilds. The key is separate from both reading artifacts.
const keyPath=path.join(out,'inceleme-anahtari.json');
let key;
if(fs.existsSync(keyPath))key=JSON.parse(fs.readFileSync(keyPath,'utf8'));
else{
  const order=Array.from({length:30},(_,i)=>i<15?'A':'B');
  for(let i=order.length-1;i>0;i--){const j=randomInt(i+1);[order[i],order[j]]=[order[j],order[i]];}
  key={schema:'aura.blind-reading-key/1',baseline_sha256:createHash('sha256').update(oldBytes).digest('hex'),
    pairs:old.map((r,i)=>({pair:`P${String(i+1).padStart(2,'0')}`,record:r.id,design:r.tasarim,new_side:order[i]}))};
  fs.writeFileSync(keyPath,JSON.stringify(key,null,2)+'\n');
}
const byId=new Map(newRows.map(x=>[x.id,x]));
const pairs=key.pairs.map((k,i)=>({id:k.pair,dil:old[i].dil,ad:old[i].ad,iz:old[i].iz,
  A:k.new_side==='A'?byId.get(k.record).tanik:old[i].tanik,
  B:k.new_side==='B'?byId.get(k.record).tanik:old[i].tanik}));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const md=['# AURA — karşılaştırmalı okuma\n\nHer eşleşmede aynı nesneye ait iki anlatım bulunur. A ve B konumları dengeli biçimde karıştırılmıştır.\nYazar ve sürüm bilgisi verilmez. A, B, eşit, ikisi de değil veya kararsız olarak işaretleyin.\nOlgusal iz iki anlatım için ortaktır. Seçimler önceden doldurulmamıştır.\n\n'];
for(const p of pairs)md.push(`## ${p.id} — ${p.ad} (${p.dil})\n\n**Ortak iz:** ${p.iz}\n\n| A | B |\n| --- | --- |\n| ${p.A.replaceAll('|','\\|')} | ${p.B.replaceAll('|','\\|')} |\n\nTercih: ______  Not: ____________________\n\n`);
fs.writeFileSync(path.join(out,'KOR-OKUMA.md'),md.join('').trimEnd()+'\n');
const cards=pairs.map(p=>`<section class="pair" id="${p.id}" data-pair="${p.id}">
<div class="pair-heading"><p class="index">${p.id} · ${p.dil.toUpperCase()}</p><h2>${esc(p.ad)}</h2></div>
<p class="trace"><span>Ortak iz</span> ${esc(p.iz)}</p>
<div class="texts"><article lang="${p.dil}" aria-labelledby="${p.id}-A"><h3 id="${p.id}-A">A</h3><p>${esc(p.A)}</p></article><article lang="${p.dil}" aria-labelledby="${p.id}-B"><h3 id="${p.id}-B">B</h3><p>${esc(p.B)}</p></article></div>
<fieldset><legend>Bu eşleşmedeki tercihin</legend>${[['A','A'],['B','B'],['equal','Eşit'],['neither','İkisi de değil'],['undecided','Kararsız']].map(([value,label])=>`<label><input type="radio" name="${p.id}" value="${value}"><span>${label}</span></label>`).join('')}</fieldset>
<label class="note-label" for="${p.id}-note">Notun</label><textarea id="${p.id}-note" rows="2" placeholder="Hangi ifade kaldı, hangisi uzaklaştı?"></textarea>
</section>`).join('\n');
const html=`<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AURA — karşılaştırmalı okuma</title>
<style>
:root{color-scheme:light;--paper:#f4f1e9;--ink:#282c28;--muted:#62685e;--rule:#c9cbbf;--accent:#304b3b}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 Georgia,'Times New Roman',serif}main{max-width:1180px;margin:auto;padding:56px 36px 100px}header{max-width:760px;margin-bottom:58px}.eyebrow,.index,.trace span,legend,button,.note-label{font-family:system-ui,sans-serif}.eyebrow{letter-spacing:.22em;font-size:12px}h1{font-weight:400;font-size:clamp(30px,5vw,47px);line-height:1.2;margin:14px 0 20px}header p{color:var(--muted)}.pair{border-top:1px solid var(--rule);padding:30px 0 46px;break-inside:avoid}.pair-heading{display:flex;gap:20px;align-items:baseline;flex-wrap:wrap}.index{font-size:12px;letter-spacing:.12em;color:var(--muted);margin:0}h2{font-weight:400;font-size:28px;margin:0}h3{font:500 13px system-ui,sans-serif;letter-spacing:.12em;margin:0 0 15px}.trace{font-size:15px;color:var(--muted);margin:16px 0 25px}.trace span{font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin-right:12px}.texts{display:grid;grid-template-columns:1fr 1fr;gap:40px}.texts article+article{border-left:1px solid var(--rule);padding-left:40px}.texts p{margin:0;text-wrap:pretty}fieldset{border:0;padding:0;margin:30px 0 12px;display:flex;gap:10px;flex-wrap:wrap}legend{font-size:12px;color:var(--muted);margin-bottom:10px}fieldset label{cursor:pointer}fieldset input{position:absolute;opacity:0}fieldset span{display:block;border:1px solid var(--rule);padding:6px 14px;font:13px/1.5 system-ui,sans-serif;border-radius:3px}input:checked+span{background:var(--accent);border-color:var(--accent);color:white}input:focus-visible+span{outline:3px solid #9b7548;outline-offset:3px}.note-label{display:block;font-size:12px;color:var(--muted);margin:15px 0 5px}textarea{resize:vertical;width:100%;border:1px solid var(--rule);background:#fbfaf5;font:15px/1.5 system-ui,sans-serif;padding:10px;color:var(--ink)}textarea:focus-visible,button:focus-visible{outline:3px solid #9b7548;outline-offset:3px}.toolbar{position:sticky;bottom:0;padding:14px 20px;border-top:1px solid var(--rule);background:#f4f1e9f5;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;font:13px system-ui,sans-serif}.toolbar p{margin:0;color:var(--muted)}button{border:1px solid var(--accent);border-radius:3px;background:var(--accent);color:white;cursor:pointer;padding:10px 16px;font-size:13px}.privacy{font:12px/1.6 system-ui,sans-serif;color:var(--muted)}@media(max-width:700px){main{padding:30px 20px 80px}.texts{grid-template-columns:1fr;gap:25px}.texts article+article{border-left:0;border-top:1px solid var(--rule);padding:20px 0 0}.pair{padding-top:25px}.pair-heading{gap:10px}h2{font-size:25px}}@media print{body{background:white;font-size:11pt}main{padding:0}.toolbar{display:none}.texts{gap:20px}.texts article+article{padding-left:20px}textarea{height:55px}fieldset span{font-size:9pt;padding:3px 8px}.pair{break-before:auto}}
</style></head><body><main><header><p class="eyebrow">AURA · OKUMA</p><h1>Aynı nesne.<br>İki anlatım.</h1><p>Her eşleşmeyi yan yana oku. Sende kalan anlatımı seç; istersen kısa bir not bırak. A ve B konumları dengeli biçimde karıştırıldı. Yazar ve sürüm bilgisi gösterilmez.</p><p class="privacy">Seçimler bu sekmede kalır. Hiçbir yere gönderilmez. Bitirdiğinde dosya olarak indir; sekmeyi kapatmadan önce kaydet.</p></header>
${cards}</main><footer class="toolbar"><p id="progress" role="status" aria-live="polite">0 / 30 eşleşme işaretlendi</p><button type="button" id="save">Seçimlerimi indir</button><p class="privacy" id="save-status" role="status" aria-live="polite"></p></footer>
<script>
const sections=[...document.querySelectorAll('.pair')];
function answers(){return sections.map(s=>({pair:s.dataset.pair,choice:s.querySelector('input:checked')?.value??null,note:s.querySelector('textarea').value}));}
document.addEventListener('change',()=>{document.getElementById('progress').textContent=answers().filter(a=>a.choice!==null).length+' / 30 eşleşme işaretlendi';});
document.getElementById('save').addEventListener('click',()=>{const result={schema:'aura.blind-reading/1',responses:answers()};const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='aura-okuma-secimleri.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('save-status').textContent='Seçim dosyası indirilmeye hazırlandı.';});
</script></body></html>\n`;
fs.writeFileSync(path.join(out,'okuma.html'),html);
console.log('30 pairs formatted; A/B balanced; key excluded from reading artifacts.');
