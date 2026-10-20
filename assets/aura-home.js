import {STYLE_DIRECTIONS} from './style-directions.js?v=20261016s';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---- Language (shared with the studio) -------------------------------------------------------------
const LANGS={tr:'Türkçe',en:'English',de:'Deutsch',fr:'Français',nl:'Nederlands',da:'Dansk',es:'Español',it:'Italiano',ar:'العربية'};
const ORDER=Object.keys(LANGS);
const stored=()=>{try{return JSON.parse(localStorage.getItem('aura-forma-lang'));}catch{return null;}};
export const pageLang=()=>{const q=new URLSearchParams(location.search).get('lang');if(LANGS[q])return q;const s=stored();if(LANGS[s])return s;const b=(navigator.language||'tr').slice(0,2);return LANGS[b]?b:'tr';};
const T={
 design:['Tasarla','Design','Entwerfen','Concevoir','Ontwerpen','Design','Diseñar','Progetta','صمّم'],
 ai:['AURA AI','AURA AI','AURA AI','AURA AI','AURA AI','AURA AI','AURA AI','AURA AI','AURA AI'],
 eye:['AURA · MOBİLYA TASARIM STÜDYOSU','AURA · FURNITURE DESIGN STUDIO','AURA · MÖBELDESIGN-STUDIO','AURA · STUDIO DE DESIGN DE MOBILIER','AURA · MEUBELONTWERPSTUDIO','AURA · MØBELDESIGNSTUDIE','AURA · ESTUDIO DE DISEÑO DE MUEBLES','AURA · STUDIO DI DESIGN DI MOBILI','AURA · استوديو تصميم الأثاث'],
 h1:['Mobilyanızı<br>kendiniz çizin.','Draw your<br>own furniture.','Zeichnen Sie<br>Ihr Möbel selbst.','Dessinez<br>votre meuble.','Teken je<br>eigen meubel.','Tegn dit<br>eget møbel.','Dibuje<br>su propio mueble.','Disegna<br>il tuo mobile.','ارسم<br>أثاثك بنفسك.'],
 lead:['Bir eskizle başlarsınız: parçaları seçer, ölçüleri verir, dikiş ve kakma gibi ince çizgileri eklersiniz. Renk ve malzeme en son gelir. Tasarımınız AURA tasarımcısına gider; üretime o hazırlar.','You start from a sketch: choose the parts, set the dimensions, add fine lines such as stitching and inlay. Colour and material come last. Your design goes to an AURA designer, who prepares it for making.','Sie beginnen mit einer Skizze: Teile wählen, Maße festlegen, feine Linien wie Nähte und Intarsien hinzufügen. Farbe und Material kommen zuletzt. Ihr Entwurf geht an eine AURA-Designerin, die ihn für die Fertigung vorbereitet.','Vous partez d’une esquisse : choisissez les éléments, fixez les dimensions, ajoutez des lignes fines comme surpiqûres et incrustations. Couleur et matière viennent en dernier. Votre projet part chez un designer AURA qui le prépare pour la fabrication.','Je begint met een schets: kies de onderdelen, bepaal de maten, voeg fijne lijnen toe zoals stiksels en inleg. Kleur en materiaal komen als laatste. Je ontwerp gaat naar een AURA-ontwerper, die het klaarmaakt voor productie.','Du starter med en skitse: vælg delene, angiv målene, tilføj fine linjer som stikninger og indlæg. Farve og materiale kommer til sidst. Dit design går til en AURA-designer, der gør det klar til produktion.','Empieza con un boceto: elija las piezas, fije las medidas, añada líneas finas como pespuntes y marquetería. El color y el material llegan al final. Su diseño va a un diseñador de AURA, que lo prepara para fabricar.','Si parte da uno schizzo: scegli le parti, fissa le misure, aggiungi linee sottili come impunture e intarsi. Colore e materiale arrivano per ultimi. Il progetto va a un designer AURA, che lo prepara per la produzione.','تبدأ من رسم أولي: تختار الأجزاء، وتحدد المقاسات، وتضيف خطوطًا دقيقة مثل الخياطة والتطعيم. يأتي اللون والخامة في النهاية. يذهب تصميمك إلى مصمم من AURA يجهّزه للتصنيع.'],
 pick:['Ne çizmek istersiniz?','What will you draw?','Was möchten Sie zeichnen?','Que voulez-vous dessiner ?','Wat wil je tekenen?','Hvad vil du tegne?','¿Qué quiere dibujar?','Cosa vuoi disegnare?','ماذا تريد أن ترسم؟'],
 seating:['Oturma grubu','Seating','Sitzmöbel','Assises','Zitmeubelen','Siddemøbler','Asientos','Sedute','الجلسات'],
 seatingSub:['üçlü, ikili koltuk, berjer','sofa, loveseat, armchair','Sofa, Zweisitzer, Sessel','canapé, deux places, fauteuil','bank, tweezits, fauteuil','sofa, toperson, lænestol','sofá, dos plazas, sillón','divano, due posti, poltrona','كنبة، كنبة مقعدين، كرسي بذراعين'],
 table:['Masa ve sehpa','Tables','Tische','Tables','Tafels','Borde','Mesas','Tavoli','الطاولات'],
 tableSub:['yemek, orta, yan sehpa, konsol, çalışma','dining, coffee, side, console, desk','Ess-, Couch-, Beistelltisch, Konsole, Schreibtisch','repas, basse, d’appoint, console, bureau','eet-, salon-, bijzettafel, wandtafel, bureau','spise-, sofa-, sidebord, konsol, skrivebord','comedor, centro, auxiliar, consola, escritorio','pranzo, caffè, servizio, consolle, scrivania','طعام، قهوة، جانبية، كونسول، مكتب'],
 bedroom:['Yatak odası','Bedroom','Schlafzimmer','Chambre','Slaapkamer','Soveværelse','Dormitorio','Camera da letto','غرفة النوم'],
 bedroomSub:['gardırop, karyola, şifonyer, komodin — takım olarak','wardrobe, bed, chest, bedside — as a set','Schrank, Bett, Kommode, Nachttisch — als Set','armoire, lit, commode, chevet — en ensemble','kast, bed, ladekast, nachtkastje — als set','garderobe, seng, kommode, natbord — som sæt','armario, cama, cómoda, mesita — en conjunto','armadio, letto, cassettiera, comodino — coordinati','خزانة، سرير، خزانة أدراج، كومودينو — كطقم'],
 storage:['Dolap ve kitaplık','Storage & shelving','Schränke & Regale','Rangements','Kasten & boekenkasten','Skabe & reoler','Armarios y librerías','Armadi e librerie','الخزائن والرفوف'],
 kitchen:['Mutfak','Kitchen','Küche','Cuisine','Keuken','Køkken','Cocina','Cucina','المطبخ'],
 kitchenSub:['tezgah altı ve üstü dolaplar, evye, ocak, ankastre','base and wall units, sink, hob, built-ins','Unter- und Oberschränke, Spüle, Kochfeld','meubles bas et hauts, évier, plaque','onder- en bovenkasten, spoelbak, kookplaat','under- og overskabe, vask, kogeplade','muebles bajos y altos, fregadero, placa','basi e pensili, lavello, piano cottura','وحدات سفلية وعلوية، حوض، موقد، أجهزة مدمجة'],
 bath:['Banyo','Bathroom','Bad','Salle de bain','Badkamer','Badeværelse','Baño','Bagno','الحمّام'],
 bathSub:['lavabo dolabı, tezgah, ayna, boy dolabı','vanity unit, top, mirror, tall cabinet','Waschtisch, Platte, Spiegel, Hochschrank','meuble vasque, plan, miroir, colonne','wastafelmeubel, blad, spiegel, kolomkast','vaskeskab, plade, spejl, højskab','mueble de lavabo, encimera, espejo, columna','mobile lavabo, top, specchio, colonna','وحدة مغسلة، سطح، مرآة، خزانة طويلة'],
 storageSub:['gardırop, şifonyer, komodin, TV ünitesi, kitaplık, vitrin','wardrobe, chest, bedside, TV unit, bookcase, display','Schrank, Kommode, Nachttisch, TV, Regal, Vitrine','armoire, commode, chevet, meuble TV, bibliothèque','kast, ladekast, nachtkast, tv-meubel, boekenkast','garderobe, kommode, natbord, TV, reol, vitrine','armario, cómoda, mesita, TV, librería, vitrina','armadio, cassettiera, comodino, TV, libreria, vetrina','خزانة ملابس، خزانة أدراج، كومودينو، وحدة تلفاز، مكتبة، خزانة عرض'],
 steps:[['Eskiz','Ölçü','Malzeme ve renk','Tasarımcıya gönder'],['Sketch','Dimensions','Material and colour','Send to the designer'],['Skizze','Maße','Material und Farbe','An die Designerin senden'],['Esquisse','Dimensions','Matière et couleur','Envoyer au designer'],['Schets','Maten','Materiaal en kleur','Naar de ontwerper'],['Skitse','Mål','Materiale og farve','Send til designeren'],['Boceto','Medidas','Material y color','Enviar al diseñador'],['Schizzo','Misure','Materiale e colore','Invia al designer'],['رسم أولي','المقاسات','الخامة واللون','أرسل إلى المصمم']],
 aiTitle:['Ya da anlatın.','Or just describe it.','Oder beschreiben Sie es.','Ou décrivez-le.','Of beschrijf het.','Eller beskriv det.','O descríbalo.','Oppure raccontalo.','أو صِفه لنا.'],
 aiText:['AURA AI ile konuşarak başlayın; ne istediğinizi birlikte netleştirelim.','Start by talking to AURA AI; we work out together what you want.','Beginnen Sie im Gespräch mit AURA AI; gemeinsam klären wir, was Sie möchten.','Commencez par une conversation avec AURA AI ; nous précisons ensemble votre idée.','Begin met een gesprek met AURA AI; samen maken we je idee concreet.','Start med en samtale med AURA AI; sammen gør vi idéen klar.','Empiece hablando con AURA AI; juntos concretamos lo que quiere.','Inizia parlando con AURA AI; insieme chiariamo cosa desideri.','ابدأ بالحديث مع AURA AI؛ ونوضّح معًا ما تريده.'],
 aiCta:['AURA AI ile konuş ↗','Talk to AURA AI ↗','Mit AURA AI sprechen ↗','Parler à AURA AI ↗','Praat met AURA AI ↗','Tal med AURA AI ↗','Hablar con AURA AI ↗','Parla con AURA AI ↗','تحدّث مع AURA AI ↗'],
 note:['Çizimler örnektir; her açılışta stüdyodan yeni bir eskiz.','Drawings are examples: a fresh sketch from the studio each visit.','Die Zeichnungen sind Beispiele: bei jedem Besuch eine neue Skizze aus dem Studio.','Dessins d’exemple : une nouvelle esquisse du studio à chaque visite.','Tekeningen zijn voorbeelden: elk bezoek een nieuwe schets uit de studio.','Tegningerne er eksempler: en ny skitse fra studiet ved hvert besøg.','Los dibujos son ejemplos: un boceto nuevo del estudio en cada visita.','I disegni sono esempi: uno schizzo nuovo dallo studio a ogni visita.','الرسومات أمثلة: رسم جديد من الاستوديو في كل زيارة.'],
 foot:['AURA PROJECT · Türkiye’de tasarım ve üretim.','AURA PROJECT · Designed and made in Türkiye.','AURA PROJECT · Entworfen und gefertigt in der Türkei.','AURA PROJECT · Conçu et fabriqué en Turquie.','AURA PROJECT · Ontworpen en gemaakt in Turkije.','AURA PROJECT · Designet og fremstillet i Tyrkiet.','AURA PROJECT · Diseñado y fabricado en Turquía.','AURA PROJECT · Progettato e prodotto in Turchia.','AURA PROJECT · تصميم وتصنيع في تركيا.'],
 contact:['İletişim','Contact','Kontakt','Contact','Contact','Kontakt','Contacto','Contatti','تواصل معنا'],
 privacy:['Gizlilik','Privacy','Datenschutz','Confidentialité','Privacy','Privatliv','Privacidad','Privacy','الخصوصية']
};
const t=(k,l)=>{const r=T[k];return r?r[Math.max(0,ORDER.indexOf(l))]??r[1]:k;};

export const siteHeader=(lang='tr',{switcher=false}={})=>`<header class="a-header"><a class="a-brand" href="index.html">AURA</a><nav class="a-nav" aria-label="Menu"><a href="tasarla.html?lang=${lang}">${t('design',lang)}</a><a href="sohbet.html">${t('ai',lang)}</a>${switcher?`<select id="homeLang" aria-label="Language">${ORDER.map(k=>`<option value="${k}" ${k===lang?'selected':''}>${LANGS[k]}</option>`).join('')}</select>`:''}</nav></header>`;
export const siteFooter=(lang='tr')=>`<footer class="a-footer"><span>${t('foot',lang)}</span><span><a href="iletisim.html">${t('contact',lang)}</a> · <a href="proje-gizlilik.html">${t('privacy',lang)}</a></span></footer>`;

// ---- Home: a drawing table, not a catalogue --------------------------------------------------------
function home(){
 const lang=pageLang();document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 const fams=[['seating','tasarla.html?family=seating'],['table','tasarla.html?family=table'],['storage','tasarla.html?family=storage'],['kitchen','tasarla.html?family=kitchen'],['bath','tasarla.html?family=bath']];
 document.getElementById('main').innerHTML=siteHeader(lang,{switcher:true})+`<section class="h-hero"><div class="h-text"><p class="h-eye">${t('eye',lang)}</p><h1>${t('h1',lang)}</h1><p class="h-lead">${t('lead',lang)}</p>
 <ol class="h-steps">${t('steps',lang).map((s,i)=>`<li><span>0${i+1}</span>${esc(s)}</li>`).join('')}</ol></div>
 <figure class="h-sheet"><a href="tasarla.html?lang=${lang}" aria-label="${esc(t('design',lang))}"><div id="homeSketch" class="h-sketch" aria-hidden="true"></div></a><figcaption>${t('note',lang)}</figcaption></figure></section>
 <section class="h-pick"><h2>${t('pick',lang)}</h2><ul>${fams.map(([f,href],i)=>`<li><a href="${href}${href.includes('?')?'&':'?'}lang=${lang}"><span class="h-n">0${i+1}</span><b>${t(f,lang)}</b><small>${t(f+'Sub',lang)}</small><span class="h-go">→</span></a></li>`).join('')}</ul></section>
 <section class="h-ai"><div><h2>${t('aiTitle',lang)}</h2><p>${t('aiText',lang)}</p></div><a href="sohbet.html">${t('aiCta',lang)}</a></section>`+siteFooter(lang);
 document.getElementById('homeLang').onchange=e=>{try{localStorage.setItem('aura-forma-lang',JSON.stringify(e.target.value));}catch{}const u=new URL(location.href);u.searchParams.set('lang',e.target.value);history.replaceState(null,'',u);home();};
 drawSketch(document.getElementById('homeSketch')).catch(()=>{});
}

/** Front elevations of three studio pieces, drawn by the studio's own drawing engine (same lines as the hand-off sheet). */
async function drawSketch(host){
 const [{STARTS},{FAMILIES},{buildViews}]=await Promise.all([import('./forma/starts.js'),import('./forma/families.js'),import('./forma/drawing.js')]);
 const pieces=[],any=list=>list[Math.floor(Math.random()*list.length)];
 // Curated starting models of the current studio: an armchair, a sideboard and a display cabinet (panel construction lines).
 for(const [family,kind,list] of [['seating','armchair',STARTS.seating.armchair],['storage','sideboard',FAMILIES.storage.starts.sideboard],['storage','vitrine',FAMILIES.storage.starts.vitrine]]){
  const e=any(list),mod=FAMILIES[family].mod,defs=mod.defaultsFor?mod.defaultsFor(kind):mod.DEFAULTS,c=mod.compile(mod.normalize({...defs,...e.p,kind}));
  const v=buildViews(c).views.front;let x0=Infinity,x1=-Infinity,y1=0;
  for(const s of v)for(const l of s.loops)for(const [h,y] of l){x0=Math.min(x0,h);x1=Math.max(x1,h);y1=Math.max(y1,y);}
  pieces.push({v,x0,x1,y1});
 }
 const gap=260,W=pieces.reduce((s,p)=>s+p.x1-p.x0,0)+gap*(pieces.length-1),H=Math.max(...pieces.map(p=>p.y1));
 const pad=150,vbW=W+pad*2,vbH=H+pad*2+120;let x=pad,out='';
 for(const p of pieces){
  const ox=x-p.x0,base=pad+H;
  for(const s of p.v)out+=`<path d="${s.loops.map(l=>'M'+l.map(([h,y])=>`${(ox+h).toFixed(1)} ${(base-y).toFixed(1)}`).join('L')+'Z').join('')}" fill="#fbfaf6" stroke="#262622" stroke-width="3.2" stroke-linejoin="round" fill-rule="evenodd"/>`;
  const a=x,b=x+p.x1-p.x0,dy=base+70;
  out+=`<g stroke="#9c3b22" stroke-width="2.4"><line x1="${a}" y1="${dy}" x2="${b}" y2="${dy}"/><line x1="${a}" y1="${dy-18}" x2="${a}" y2="${dy+18}"/><line x1="${b}" y1="${dy-18}" x2="${b}" y2="${dy+18}"/></g><text x="${(a+b)/2}" y="${dy+62}" text-anchor="middle" fill="#9c3b22" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="46">${Math.round(p.x1-p.x0)}</text>`;
  x=b+gap;
 }
 const ground=`<line x1="${pad*0.4}" y1="${pad+H}" x2="${vbW-pad*0.4}" y2="${pad+H}" stroke="#262622" stroke-width="2"/>`;
 host.innerHTML=`<svg viewBox="0 0 ${vbW.toFixed(0)} ${vbH.toFixed(0)}" preserveAspectRatio="xMidYMid meet">${ground}${out}</svg>`;
}

if(document.body.dataset.page==='aura-home')home();

if(document.body.dataset.page==='aura-styles'){
 document.getElementById('main').innerHTML=siteHeader()+`<div class="a-library-head"><p class="a-eye">AURA / TASARIM DİLİ</p><h1 class="a-title">Bir etiket değil,<br>tasarımın yönü.</h1><p>Malzemeyi, oranı ve ayrıntıları birlikte konuşmak için bir başlangıç. Ayrıntılı stil rehberlerini ve tasarımcılarla geliştirdiğimiz yeni yaklaşımları inceleyin. Bazı başlıklar henüz çalışma taslağıdır.</p></div><section class="a-section"><div class="a-filter"><input id="styleSearch" type="search" placeholder="Tarz veya malzeme arayın" aria-label="Tarz ara"><select id="styleFilter" aria-label="Profil kapsamı"><option value="all">Tüm yaklaşımlar</option><option value="source-profile">Ayrıntılı rehberler</option><option value="editorial-working-draft">Geliştirilen çalışma notları</option></select></div><p id="styleCount" class="a-muted" role="status"></p><div id="styleCards" class="a-style-grid"></div><div class="a-banner"><p>Tarzlar kesin sınırlar değildir. Bir yaklaşımın ahşabını, diğerinin oranlarını beğenebilirsiniz. Asistanınızla hangi özellikleri sevdiğinizi ve nelerden uzak durmak istediğinizi konuşun.</p></div></section>`+siteFooter();
 const render=()=>{const q=document.getElementById('styleSearch').value.toLocaleLowerCase('tr'),filter=document.getElementById('styleFilter').value,found=STYLE_DIRECTIONS.filter(p=>(filter==='all'||p.status===filter)&&(p.id+' '+p.name+' '+p.description+' '+p.principles.join(' ')).toLocaleLowerCase('tr').includes(q));document.getElementById('styleCount').textContent=found.length+' yaklaşım';document.getElementById('styleCards').innerHTML=found.map(p=>`<article class="a-style-card"><span class="a-badge">${p.status==='source-profile'?'Ayrıntılı rehber':'Çalışma taslağı'}</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><ul>${p.principles.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><a href="sohbet.html?style=${p.id}">Bu yaklaşımı birlikte keşfedelim ↗</a></article>`).join('');};document.getElementById('styleSearch').oninput=render;document.getElementById('styleFilter').onchange=render;render();
}
