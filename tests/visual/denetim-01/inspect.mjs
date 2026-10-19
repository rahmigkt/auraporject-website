// Evidence-only inspection summary: does not modify assets or captured photographs.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compileDesign} from '../../../assets/forma/generate.js';
import {worldPositions} from '../../../assets/forma/build.js';
const dir='tests/visual/denetim-01',manifest=JSON.parse(readFileSync(dir+'/manifest.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const findings=[
 {id:'G01',priority:2,category:'texture',cases:['table-1','table-2','table-3','table-6','storage-2','kitchen-3','bath-1','bath-4'],observation:'Ahşapta üst üste çaprazlanan ve parça ölçeğine göre fazla geniş dalgalanan damarlar; yakın karelerde görünür. Estetik doku değerlendirmesi, anatomik ölçüm değil.'},
 {id:'G02',priority:1,category:'geometry',cases:['kitchen-4'],observation:'Üç dik kulp tezgahın üst düzlemini aşıyor; mesh sınırında kulp üstü967.5mm, tezgah900mm, fark67.5mm.'},
 {id:'G03',priority:1,category:'occlusion_or_material',cases:['bath-4'],observation:'Undermount ve sink.finish=white girdisine rağmen lavabo açıklığında beyaz derin hazne yerine ahşap yüzey görülüyor. Kök neden malzeme veya kabin parçası örtüşmesi olabilir; çözülmedi.'},
 {id:'G04',priority:2,category:'photo_context',cases:['storage-5','bath-3','bath-6'],observation:'Duvara asılı ürün fotoğrafında taşıyıcı duvar okunmuyor; zeminden kopuk gölgeyle ürün havada görünüyor. Ürünün ayaklı olması gerektiği iddiası değil; fotoğraf bağlamı eksik.'},
 {id:'G05',priority:2,category:'contrast',cases:['table-5','kitchen-5'],observation:'Açık lake/tezgah ile açık arka plan arasındaki sınırlar zayıf; profil ve birleşim okunurluğu düşük. Kalibre renk veya kesin kanal clipping ölçümü değil.'},
 {id:'G06',priority:3,category:'edge_review_limit',cases:['bath-6'],observation:'İnce ayna çevresinde noktalı/dişli kenar izi var; düşük örnekleme aliası mı geometri mi, daha yüksek örneklemli kontrolle ayrılmalı.'}
];
const observations={
 'table-1':'G01; ön tabla kenarı ile üst yüzeyin damar ölçeği geçişi sert.',
 'table-2':'G01; tabla ve alt raf üzerinde çapraz tekrar çok belirgin.',
 'table-3':'G01; tabla/çekmece önünde dalga ve çapraz lif izi.',
 'table-4':'Bu iki karede belirgin yeni çakışma veya havada parça saptanmadı; metal ayak ankrajı ayrıca görünmüyor.',
 'table-5':'G05; beyaz tabla/kayıt sınırı fonla karışıyor.',
 'table-6':'G01; yan panelde yatay lif görülüyor, grain kararıyla karşılaştırılmalı; otomatik yanlış yön hükmü yok.',
 'storage-1':'Kapak bölünmesi/kulplar görünür; bu iki karede belirgin yeni geometri hatası saptanmadı.',
 'storage-2':'G01; slat ön yüzde yatay/çapraz lif; lif yönü kararı ve kenar eşlemesi ayrıca incelenmeli.',
 'storage-3':'Mavi lake tutarlı görünüyor; fiziksel/kalibre renk referansı yok.',
 'storage-4':'Çekmece yüzü ve yan yüz arasında damar ölçeği belirgin farklı; malzeme yön/ölçek kuralıyla karşılaştırılmalı.',
 'storage-5':'G04; askılı gövde için duvar/ankraj bağlamı eksik.',
 'storage-6':'Raf-gövde birleşimleri görünür; bu açılarda belirgin yeni boşluk/çakışma saptanmadı.',
 'kitchen-1':'Evye, ocak ve dolap yerleşimi okunuyor; içteki geçmeler bu iki görünüşle denetlenemez.',
 'kitchen-2':'Yivli cephe/tezgah birleşimi görünür; açık evye içinin derinlik okunurluğu sınırlı.',
 'kitchen-3':'G01; ön cephe ahşapta geniş dalga/çapraz izler.',
 'kitchen-4':'G02; kulplar tezgah üstüne çıkıyor, nicel mesh sınırı kanıtı var.',
 'kitchen-5':'G05; açık lake/duvar/tezgah ayrımı düşük; küçük açıklıklar zor okunuyor.',
 'kitchen-6':'Yiv/tezgah birleşimi görünür; bu karelerde belirgin yeni geometri hatası saptanmadı.',
 'bath-1':'G01; yivli cephede çapraz doku. Çanak yakın karede kesiliyor; haznenin tamamı genel karede.',
 'bath-2':'Kolonun ön ve yan yüzleri okunuyor; bu karelerde belirgin havada/çakışan parça saptanmadı.',
 'bath-3':'G04; ayna duvar yerine boşlukta ve zemin gölgesiyle sunuluyor.',
 'bath-4':'G01 + G03; beyaz tezgah altı haznesi yerine ahşap yüzey görülüyor.',
 'bath-5':'Askılı kolon duvarla ilişkili okunuyor; montaj taşıma hesabı görüntüyle doğrulanmaz.',
 'bath-6':'G04 + G06; duvarsız ayna ve çevrede noktalı kenar; düz mavi/gri ayna ortam yansımasını da zayıf gösteriyor.'
};
function box(q){const xyz=worldPositions(q),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<xyz.length;i++){const k=i%3;min[k]=Math.min(min[k],xyz[i]);max[k]=Math.max(max[k],xyz[i]);}return {min,max};}
const kitchen=compileDesign(manifest.records.find(r=>r.id==='kitchen-4').design);
const measurements={kitchen4:kitchen.parts.filter(p=>['pull','worktop'].includes(p.role)).map(p=>({id:p.id,role:p.role,boundsMm:box(p)}))};
const assessment={source:manifest.source,reviewer:'Codex visual inspection; not owner approval',count:manifest.records.length,findings,measurements,
 records:manifest.records.map(r=>({id:r.id,observation:observations[r.id],imageSha256:Object.fromEntries(Object.entries(r.images).map(([key,name])=>[key,sha(readFileSync(dir+'/'+name))]))}))};
writeFileSync(dir+'/inspection.json',JSON.stringify(assessment,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const cards=manifest.records.map(r=>`<section id="${r.id}"><h2>${r.id} · ${esc(r.kind)} · ${esc(r.style)}</h2><p>${esc(observations[r.id])}</p><div><a href="${r.images.general}"><img src="${r.images.general}" alt="${r.id} genel"></a><a href="${r.images.close}"><img src="${r.images.close}" alt="${r.id} yakın"></a></div><p>Yakın hedef: ${esc(r.closeTarget.partId)} / ${esc(r.closeTarget.role)}. <a href="${r.id}.json">Girdi ve kamera</a></p></section>`).join('');
writeFileSync(dir+'/index.html','<!doctype html><html lang="tr"><meta charset="utf-8"><title>Aile kalite denetimi:24 model</title><style>body{font:17px system-ui;margin:25px auto;max-width:1500px}section{padding:20px 0;border-top:1px solid #aaa}section div{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%}p{max-width:1000px}</style><h1>24 model /48 gerçek fotoğraf</h1><p>Kaynak '+manifest.source+'. Her ailede6 model. Yerel studioPhoto yolu; çoğu1000×667/6 örnek, table-1 ise1200×800/12 örnek. Kusurlar düzeltildi veya karar sahibi onayladı anlamına gelmez. Genel ve yakın fotoğrafı tam boy açmak için tıklayın.</p>'+cards+'</html>');
const header=`# Aile aile yakın plan denetimi 01\n\n19 Ekim 2026 · ATOLYE-CODEX-02 / iş3. Kaynak: \`${manifest.source}\`.\n\n**24 başlangıç modeli,48 gerçek JPEG: masa/dolap/mutfak/banyo ×6, her biri genel+yakın.**\n[Yan yana galeri](../../tests/visual/denetim-01/index.html); ham görüntüler ve girdiler aynı klasörde.\nOturma kapsam dışı. Altı seed ve aile içindeki farklı kind/style'lar kullanıldı; rastgele tüm ürün uzayını kapsamaz.\n\n## Yöntem ve sınırlar\n\nMevcut tests/visual/foto/foto.html → createViewer → photo/studioPhoto yolu kullanıldı.\nFotoğraf test yanıtına bellekte kind/gözlem kancası eklendi; assets dosyası değişmedi.\nYerel Playwright+Edge; dış ağ engelli. Yazılımsal rasterizer ilk denemesi ağır olduğu\niçin bırakıldı, Direct3D11 ile devam edildi. Aynı kaynaklı başarılı kareler korundu.\nÇoğu kare1000×667/6 örnek; table-1 çiftinde1200×800/12 örnek korunmuştur. Bunlar final2400px katalog kareleri değil. Her modelde gerçek girdi,\nseed/style/kind, hedef parça ve odak kaydedildi. CSG/uygulama düzeltmesi yapılmadı.\n\nGörseller Codex tarafından incelendi; karar sahibi onayı değildir. Doku/kenar/renk,\nhavada parça ve görünür iç içelik değerlendirildi. Kapalı iç bölmeler, bütün\nmontaj açıları, gerçek dünyadaki ölçek/kalibre renk veya mukavemet iki kareyle\nonaylanamaz. Belirgin hata görülmeyen örnek hatasız sertifikası almaz.\n\n## Bulunan kusurlar\n\n| Kimlik | Öncelik | Kanıt / gözlem | Claude için sonraki denetim |\n|---|---|---|---|\n| G01 | P2 | Özellikle table-2/3, storage-2, bath-4 yakınlarında çapraz/dalgalı ahşap | Üst/yan/uç lif koordinatları, doku ölçeği ve parça grain değeri; doğal lif referansı |\n| G02 | P1 | kitchen-4: üç kulp y üstü967,5mm; tezgah üstü900mm; **67,5mm taşma** | Kapak ölçüsüne göre kulp konumu/uzunluğu; tezgah çarpışması. Ölçüm inspection.json |\n| G03 | P1 | bath-4: undermount, sink.finish=white fakat açıklıkta ahşap yüzey | Hazne/gövde/çekmece-top geometrisi örtüşmesi ve sink materyal yolu; kök neden henüz kanıtlanmadı |\n| G04 | P2 | storage-5, bath-3/6: duvar ürünü zeminden kopuk boşlukta | Fotoğraf duvar algısı dünya geometrisinden kurulmalı; askılı tasarıma ayak ekleme önerisi değil |\n| G05 | P2 | table-5/kitchen-5 açık lake ile fon arasında sınır kaybı | Beyaz fon/pozlama/dolgu ve küçük temas gölgeleri; kalibre renk ölçümü değil |\n| G06 | P3 | bath-6 ince çevrede noktalı/dişli kenar | Daha yüksek örnek/tessellation karşılaştırması; raster aliası ile geometriyi ayır |\n\n## Model bazında gözlem ve dosyalar\n\n| Model | Tür / tarz | Gözlem | Genel / yakın |\n|---|---|---|---|\n`;
const table=manifest.records.map(r=>`| ${r.id} | ${r.kind} / ${r.style} | ${observations[r.id]} | [Genel](../../tests/visual/denetim-01/${r.images.general}) · [Yakın](../../tests/visual/denetim-01/${r.images.close}) |`).join('\n');
writeFileSync('knowledge/atolye/DENETIM-AILE-01.md',header+table+'\n\nKayıtlar: manifest.json,24 ayrı girdi JSON,inspection.json (kusurlar+mesh ölçümü+görüntü hash).\nDoğrulama:24 başarılı kayıt, aile başına6,48 benzersiz JPEG ve her kayıttaki boyutla eşleşme;\npageerror kayıtları boş. Bu ifade console/WebGL uyarılarının tamamını ölçtüğümüz anlamına gelmez.\nDüzeltme yapılmadı. Claude düzeltmelerinden sonra aynı girdiler/kameralarla yeniden karşılaştırılmalı.\n');
console.log('Inspection/gallery/report generated for',manifest.records.length,'cases');
