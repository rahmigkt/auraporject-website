import {KNOWLEDGE} from './fde-knowledge-data.js?v=20261016q';
const STYLE_PROFILES=KNOWLEDGE.styles;
export const CATEGORIES=[{id:'seating',tr:'Koltuk ve oturma',en:'Seating',description:'Kanepe, köşe koltuk, berjer ve sandalye.'},{id:'tables',tr:'Masa ve sehpalar',en:'Tables',description:'Yemek, çalışma ve günlük kullanım için.'},{id:'storage',tr:'Dolap ve depolama',en:'Storage',description:'Kitaplık, konsol, gardırop ve TV ünitesi.'},{id:'bedroom',tr:'Yatak ve yatak odası',en:'Bedroom',description:'Yatak, başlık ve tamamlayıcı mobilyalar.'},{id:'kitchen',tr:'Mutfak',en:'Kitchen',description:'Dolap, tezgâh ve ada için proje geliştirme.'},{id:'other',tr:'Özel bir proje',en:'Bespoke project',description:'Henüz adını koyamadığınız bir fikirle başlayın.'}];
// AURA editorial working directions, not historical certification or trained weights.
const drafts=[
 ['wabi_sabi','Wabi-Sabi','Doğal doku, sakin yüzeyler ve ölçülü asimetri.','Ahşap damarını ve mat bitişi öne çıkar; dekoratif kusur üretme.'],
 ['de_stijl','De Stijl','Geometrik düzlemler ve kontrollü renk blokları.','Taşıyıcı yapı ile renkli yüzeyleri ayır; temel renkleri sınırlı alanlarda kullan.'],
 ['memphis','Memphis','Oyunlu geometri ve cesur renk karşıtlıkları.','Özgün oran ve renk kombinasyonları öner; kumaşlar düz kalsın.'],
 ['high_tech','High-Tech','Teknik detayların görünür olduğu hafif bir yapı.','Bağlantı ve malzeme geçişlerini işlevle gerekçelendir.'],
 ['scandinavian_modern','İskandinav Modern','Açık ahşap, sıcak nötrler ve hafif oranlar.','Yalın birleşimler, rahat oturum ve temizlenebilir yüzeyler öner.'],
 ['neo_gothic','Neo-Gotik','Dikey ritim ve kemer fikriyle gelişen bir yorum.','Kemer ve oyma geometrisini mevcut stüdyonun çizemediği yerde açıkça tasarımcı işi olarak bırak.'],
 ['dark_academia','Dark Academia','Koyu ahşap, derin renkler ve kitaplık etrafında kurulan sıcaklık.','Depolama işlevini koru; ağır süslemeyi kullanıcı istemeden ekleme.'],
 ['industrial','Endüstriyel','Ahşap ve metalin okunabilir birleşimi.','Metal kesit, birleşim ve yüzey korumasını ayrı kararlar olarak ele al.'],
 ['mid_century_modern','Mid-Century Modern','Yükseltilmiş gövde, incelen ayaklar ve sıcak ahşap.','Ayağı, oturum açısını ve gövde hafifliğini ayrı ayrı değerlendir.'],
 ['minimalism','Minimalizm','Az sayıda belirgin çizgi, sakin yüzeyler ve net işlev.','Gereksiz parçaları azalt; ergonomi ve taşıyıcıları görünüm uğruna kaldırma.'],
 ['streamline_moderne','Streamline Moderne','Akıcı köşeler ve yatay hareket fikri.','Eğrisel geometrileri şablon hazır değilse üretilmiş gibi gösterme.'],
 ['wabi_sabi_rustic','Rustik Wabi-Sabi','Dokulu ahşap ve yalın, yere yakın kütleler.','Gerçek malzeme numunesi iste; yüzey kusuru ile işçilik hatasını ayır.'],
 ['rococo_revival','Rococo Revival','Kavis, oyma ve zarif süsleme üzerine gelişen proje.','Oyma parçalar için ayrı modelleme ve üretim incelemesi gerektiğini belirt.'],
 ['tropical_resort','Tropical Resort','Hafif ahşap, doğal tonlar ve ferah boşluklar.','İç/dış kullanım, nem ve bakım gereksinimlerini önce netleştir.'],
 ['scandinavian_pastel','İskandinav Pastel','Açık ahşap ve küçük pastel renk alanları.','Pasteli gövdeyi ağırlaştırmadan, sınırlı ön yüzlerde kullan.'],
 ['hollywood_regency','Hollywood Regency','Parlak detay, simetri ve belirgin kontrast.','Yansıtıcı yüzeyi ve metal ayrıntıyı güvenli, üretilebilir parçalar olarak tanımla.'],
 ['streamliner','Streamliner','Yatay ritim ve akıcı köşe yaklaşımı.','Streamline Moderne ile birlikte değerlendir; ayrı bir doğrulanmış stil puanı üretme.'],
 ['neo_classical_restrained','Sade Neo-Klasik','Dengeli simetri, çerçeveli yüzeyler ve az süsleme.','Profil, çıta ve bağlantı detayını düz bir kapakla aynı kabul etme.'],
 ['high_gloss_contemporary','Parlak Çağdaş','Düz yüzey, parlak bitiş ve temiz hacimler.','Yansıma, parmak izi ve bakım beklentisini sor.'],
 ['muji_modern','Sade Doğal','Gündelik işlev, açık ahşap ve sakin tonlar.','Marka veya model kopyası değil, özgün ve işlevli bir yorum geliştir.'],
 ['craft_modern','Zanaat Odaklı Modern','Çağdaş form içinde görünür işçilik ve birleşim.','Birleşim, ahşap yönü ve kenar bitişini ayrı tasarım kararları yap.']
];
export const STYLE_DIRECTIONS=[...STYLE_PROFILES.map(p=>({id:p.style_id,name:p.name_tr,en:p.name,description:p.description_tr,principles:p.core_principles.slice(0,3).map(x=>x.statement_tr),status:'source-profile',source:'workspace.tar.gz',needsCalibration:true})),...drafts.map(([id,name,description,principle])=>({id,name,en:name,description,principles:[principle],status:'editorial-working-draft',source:'AURA editorial continuation of supplied roadmap',needsCalibration:true}))];
export const direction=id=>STYLE_DIRECTIONS.find(p=>p.id===id);
