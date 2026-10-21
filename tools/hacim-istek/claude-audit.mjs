// Independent Codex review of the new Claude motor, not approval of Codex data.
import fs from 'node:fs';import crypto from 'node:crypto';
import {execFileSync}from'node:child_process';
import{uygula}from'../studyo-motoru/motor.mjs';
const boundary=[[0,0],[6000,0],[6000,8000],[0,8000]];
const state={plan:{walls:boundary.map((p,i)=>({id:'w'+i,from_xy_mm:p,to_xy_mm:boundary[(i+1)%4],thickness:220})),openings:[],spaces:[{id:'room',kind:'living',boundary_xy_mm:boundary}],items:[]}};
const upper=[{katman:'ev',type:'kat_ekle',id:'k1',yukseklik:2800},{katman:'ev',type:'oda_tanimla',kat:'k1',id:'upper',tur:'living',kose:boundary}];
const stair={katman:'ev',type:'merdiven',alt:'k0',ust:'k1',konum:[3000,1000],en:900};
const cases=[
 ['default-stair',upper.concat(stair),'accept'],
 ['custom-too-high-riser-and-short-going',upper.concat({...stair,basamak_sayisi:14,basamak_derinlik:230}),'reject'],
 ['negative-floor-height',[{katman:'ev',type:'kat_ekle',id:'bad',yukseklik:-2800}],'reject'],
 ['narrow-stair',upper.concat({...stair,en:600}),'reject'],
 ['short-landing',upper.concat({...stair,sahanlik:500}),'reject']
];
const results=cases.map(([id,operations,expected])=>{const r=uygula(state,operations);return{id,expected,accepted:r.rapor.gecti,pass:expected==='accept'?r.rapor.gecti:!r.rapor.gecti,operations,report:r.rapor,stairs:r.state.merdivenler||null};});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const evidence={reviewer:'Codex',producer:'Claude',source_main:'b8caa7c',source_tree_sha256:hash(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'])),scope:'Five independent floor/stair probes only; not a blanket review of any training rows or majlis geometries.',results};
const base=new URL('../../knowledge/ai-egitim/inceleme/',import.meta.url);fs.mkdirSync(base,{recursive:true});
fs.writeFileSync(new URL('codex-motor-184-denetim.json',base),JSON.stringify(evidence,null,2)+'\n');
const decisions={aciklama:'Codex cross-review of Claude motor change #184. These IDs identify code probes, not approval of any training row. Codex-authored H1 still awaits Claude.',kararlar:{'claude-motor-kat-merdiven-184':{karar:results.every(r=>r.pass)?'uygun':'düzeltilmeli',not:'Varsayılan merdiven, dar en ve kısa sahanlık kontrolleri geçiyor. Ancak 2800 mm kat / 14 rıht / 230 mm basamak, rıhtı 200 mm yapmasına rağmen kabul ediliyor (riserMax 190, goingMin 250 sınırları özel değerlerde uygulanmıyor). Negatif kat yüksekliği de kabul ediliyor. Sınırları doğrulayıp negatif/fractional/sıfır girdiler için negatif test ekleyin. Beş bağımsız probun girdileri ve motor çıktıları codex-motor-184-denetim.json içinde. Bu bir eğitim kaydı onayı değildir.',denetci:'Codex',zaman:new Date().toISOString()}}};
fs.writeFileSync(new URL('codex-kararlari.json',base),JSON.stringify(decisions,null,2)+'\n');
console.log(JSON.stringify({cases:results.length,passed:results.filter(r=>r.pass).length,failures:results.filter(r=>!r.pass).map(r=>r.id),decision:decisions.kararlar['claude-motor-kat-merdiven-184'].karar}));
