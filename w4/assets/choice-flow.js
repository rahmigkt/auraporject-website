import {FAMILIES,DETAILS,WOODS,FABRICS,SIZE_LIMITS,normalizeStudio,changeFamily,compileStudio,label,detailValue} from './design-library.js?v=20261016b';

export const phrase=(tr,en,fr,da,de,nl,es,it)=>({tr,en,fr:fr||en,da:da||en,de:de||en,nl:nl||en,es:es||en,it:it||en});

export const WORDS={

 title:phrase('Modeli birlikte seçelim.','Let’s choose your piece.','Choisissons votre meuble.','Lad os vælge dit møbel.','Wählen wir Ihr Möbel.','Kies samen uw meubel.','Elijamos su mueble.','Scegliamo il suo mobile.'),

 intro:phrase('Seçin, çiziminiz adım adım oluşsun.','Choose, and see your design take shape.','Choisissez et voyez votre projet prendre forme.','Vælg, og se dit design tage form.','Wählen Sie und sehen Sie den Entwurf wachsen.','Kies en zie uw ontwerp ontstaan.','Elija y vea su diseño tomar forma.','Scelga e guardi il progetto prendere forma.'),

 room:phrase('Hangi alan için?','Which space?','Pour quelle pièce ?','Til hvilket rum?','Für welchen Raum?','Voor welke ruimte?','¿Para qué espacio?','Per quale spazio?'),

 family:phrase('Hangi parçayla başlayalım?','Which piece shall we start with?','Par quel meuble commencer ?','Hvilket møbel skal vi starte med?','Mit welchem Möbel beginnen wir?','Met welk meubel beginnen we?','¿Con qué mueble empezamos?','Da quale mobile iniziamo?'),

 layout:phrase('Yerleşimi nasıl olsun?','How should it be arranged?','Quelle configuration ?','Hvordan skal det indrettes?','Welche Anordnung?','Welke opstelling?','¿Qué distribución?','Quale configurazione?'),

 arms:phrase('Kolçakları nasıl olsun?','Which arm shape?','Quels accoudoirs ?','Hvilke armlæn?','Welche Armlehnen?','Welke armleuningen?','¿Qué brazos?','Quali braccioli?'),

 cushions:phrase('Oturum nasıl olsun?','Which seat construction?','Quelle assise ?','Hvilken sædetype?','Welche Sitzfläche?','Welke zitting?','¿Qué asiento?','Quale seduta?'),

 back:phrase('Sırtı nasıl olsun?','Which back style?','Quel dossier ?','Hvilken ryg?','Welche Rückenlehne?','Welke rugleuning?','¿Qué respaldo?','Quale schienale?'),

 legs:phrase('Ayakları nasıl olsun?','Which base?','Quel piètement ?','Hvilket stel?','Welches Gestell?','Welk onderstel?','¿Qué base?','Quale base?'),

 top:phrase('Tabla biçimini seçin.','Choose the top shape.','Choisissez le plateau.','Vælg bordpladens form.','Wählen Sie die Tischplatte.','Kies de vorm van het blad.','Elija la forma del tablero.','Scelga la forma del piano.'),

 front:phrase('Açık mı, kapaklı mı?','Open, closed, or both?','Ouvert, fermé ou les deux ?','Åbent, lukket eller begge?','Offen, geschlossen oder beides?','Open, gesloten of beide?','¿Abierto, cerrado o ambos?','Aperto, chiuso o entrambi?'),

 storage:phrase('Bölmeleri düzenleyin.','Arrange the compartments.','Organisez les compartiments.','Inddel rummene.','Ordnen Sie die Fächer.','Deel de vakken in.','Organice los compartimentos.','Organizzi i vani.'),

 size:phrase('Mekânınıza ne kadar yer ayıralım?','How much space should it take?','Quelle place prévoir ?','Hvor meget plads skal det fylde?','Wie viel Platz ist vorgesehen?','Hoeveel ruimte is er?','¿Cuánto espacio ocupará?','Quanto spazio occuperà?'),

 wood:phrase('Ahşabın tonunu seçin.','Choose the wood tone.','Choisissez la teinte du bois.','Vælg træets nuance.','Wählen Sie den Holzton.','Kies de houttint.','Elija el tono de madera.','Scelga il tono del legno.'),

 fabric:phrase('Düz kumaş rengini seçin.','Choose a plain fabric colour.','Choisissez un tissu uni.','Vælg en ensfarvet tekstilfarve.','Wählen Sie einen Unistoff.','Kies een effen stofkleur.','Elija un tejido liso.','Scelga un tessuto unito.'),

 weave:phrase('Dokuyu yakından görün.','Look closely at the texture.','Observez la texture.','Se teksturen tæt på.','Betrachten Sie die Struktur.','Bekijk de textuur van dichtbij.','Vea la textura de cerca.','Osservi la trama da vicino.'),

 review:phrase('İlk tasarımınız hazır.','Your first design is ready.','Votre premier projet est prêt.','Dit første design er klar.','Ihr erster Entwurf ist fertig.','Uw eerste ontwerp is klaar.','Su primer diseño está listo.','Il primo progetto è pronto.'),

 next:phrase('Bu seçimle devam','Continue with this choice','Continuer avec ce choix','Fortsæt med dette valg','Mit dieser Wahl weiter','Verder met deze keuze','Continuar con esta opción','Continua con questa scelta'),

 previous:phrase('Geri','Back','Retour','Tilbage','Zurück','Terug','Atrás','Indietro'),

 finish:phrase('Tasarımı tamamla','Complete the design','Terminer le projet','Afslut designet','Entwurf abschließen','Ontwerp afronden','Completar diseño','Completa il progetto'),

 suggested:phrase('Öneri ölçüsü · kesin ölçü gerekmez','Suggested size · exact measurements can wait','Dimensions proposées · mesures précises plus tard','Foreslåede mål · præcise mål kan vente','Vorgeschlagene Maße · genaue Maße später','Voorgestelde maten · exacte maten kunnen later','Medidas propuestas · las exactas pueden esperar','Misure proposte · quelle esatte possono attendere'),

 note:phrase('Ön tasarımdır. Üretim uygunluğu tasarımcıyla doğrulanır. Kumaşlar temsili dokulardır.','Concept design. Production suitability needs designer review. Fabrics are representative.','Avant-projet. Fabrication à valider par le designer. Tissus représentatifs.','Designforslag. Produktion skal godkendes af en designer. Stoffer er illustrative.','Vorentwurf. Fertigung durch Designer prüfen lassen. Stoffe sind beispielhaft.','Voorontwerp. Productie door ontwerper te beoordelen. Stoffen zijn illustratief.','Diseño preliminar. Fabricación a revisar. Tejidos ilustrativos.','Bozza. Produzione da verificare. Tessuti rappresentativi.'),

 summary:phrase('Seçimleriniz','Your choices','Vos choix','Dine valg','Ihre Auswahl','Uw keuzes','Sus opciones','Le sue scelte'),

 width:phrase('Genişlik','Width','Largeur','Bredde','Breite','Breedte','Ancho','Larghezza'),

 height:phrase('Yükseklik','Height','Hauteur','Højde','Höhe','Hoogte','Altura','Altezza'),

 depth:phrase('Derinlik','Depth','Profondeur','Dybde','Tiefe','Diepte','Profundidad','Profondità'),

 save:phrase('Kaydet','Save','Enregistrer','Gem','Speichern','Opslaan','Guardar','Salva'),

 restore:phrase('Kaydı aç','Restore','Restaurer','Åbn gemt','Öffnen','Openen','Restaurar','Ripristina'),

 project:phrase('Proje dosyası','Project file','Fichier du projet','Projektfil','Projektdatei','Projectbestand','Archivo del proyecto','File del progetto'),

 sheets:phrase('Çizim ve malzeme dosyası','Drawings & materials','Dessins et matériaux','Tegninger og materialer','Zeichnungen und Materialien','Tekeningen en materialen','Planos y materiales','Disegni e materiali'),

 edit:phrase('Düzenle','Edit','Modifier','Rediger','Bearbeiten','Bewerken','Editar','Modifica'),

 saved:phrase('Bu tarayıcıya kaydedildi.','Saved in this browser.','Enregistré dans ce navigateur.','Gemt i denne browser.'),

 error:phrase('Dosya açılamadı.','Could not open the file.','Impossible d’ouvrir le fichier.','Filen kunne ikke åbnes.'),

 frontView:phrase('Önden','Front','Face','Forfra','Vorne','Voorkant','Frente','Fronte'),

 sideView:phrase('Yandan','Side','Côté','Fra siden','Seite','Zijkant','Lateral','Lato'),

 topView:phrase('Üstten','Top','Dessus','Ovenfra','Oben','Bovenkant','Superior','Dall’alto'),

 perspective:phrase('Perspektif','Perspective','Perspective','Perspektiv','Perspektive','Perspectief','Perspectiva','Prospettiva'),

 payment:phrase('Tasarımcı incelemesi ücretlidir. Ödeme ve otomatik gönderim henüz açık değil; dosyayı indirerek saklayabilirsiniz.','Designer review is paid. Payment and automatic submission are not enabled yet; download your project to keep it.','La révision du designer est payante. Paiement et envoi automatique indisponibles ; téléchargez votre projet.','Designerens gennemgang koster et gebyr. Betaling og automatisk indsendelse er ikke aktiveret; download projektet.'),

 unknown:phrase('Ölçüyü sonra netleştireceğim','I will confirm dimensions later','Je confirmerai les mesures plus tard','Jeg bekræfter målene senere'),

 import:phrase('Dosyadan aç','Open project file','Ouvrir un projet','Åbn projektfil'),

 chosen:phrase('Seçildi','Selected','Sélectionné','Valgt','Ausgewählt','Geselecteerd','Elegido','Selezionato')

};

export const ROOMS={living:phrase('Salon','Living room','Salon','Stue','Wohnzimmer','Woonkamer','Salón','Soggiorno'),dining:phrase('Yemek alanı','Dining space','Salle à manger','Spisestue','Essbereich','Eetkamer','Comedor','Sala da pranzo'),bedroom:phrase('Yatak odası','Bedroom','Chambre','Soveværelse','Schlafzimmer','Slaapkamer','Dormitorio','Camera da letto'),entry:phrase('Antre','Entrance','Entrée','Entré','Eingang','Entree','Entrada','Ingresso'),office:phrase('Çalışma alanı','Workspace','Bureau','Arbejdsrum','Arbeitszimmer','Werkruimte','Despacho','Studio')};

export const CONFIGS={two:phrase('İkili','Two seats','Deux places','To sæder','Zweisitzer','Twee zitplaatsen','Dos plazas','Due posti'),three:phrase('Üçlü','Three seats','Trois places','Tre sæder','Dreisitzer','Drie zitplaatsen','Tres plazas','Tre posti'),left:phrase('Solda uzanma','Chaise on left','Méridienne à gauche','Chaiselong til venstre','Longchair links','Chaise links','Chaise a la izquierda','Chaise a sinistra'),right:phrase('Sağda uzanma','Chaise on right','Méridienne à droite','Chaiselong til højre','Longchair rechts','Chaise rechts','Chaise a la derecha','Chaise a destra')};

CONFIGS.cornerLeft=phrase('Soldan dönen köşe','Left corner sofa','Canapé d’angle gauche','Venstrevendt hjørnesofa');CONFIGS.cornerRight=phrase('Sağdan dönen köşe','Right corner sofa','Canapé d’angle droit','Højrevendt hjørnesofa');

WORDS.returnSeats=phrase('Dönen kolda kaç oturum olsun?','How many return seats?');WORDS.service=phrase('Servis modülü ekleyelim mi?','Add a service module?');WORDS.pillows=phrase('Dekoratif yastık olsun mu?','Add throw pillows?');
export const TOPS={rect:phrase('Dikdörtgen','Rectangular','Rectangulaire','Rektangulær','Rechteckig','Rechthoekig','Rectangular','Rettangolare'),soft:phrase('Yumuşak köşeler','Soft corners','Angles adoucis','Bløde hjørner','Weiche Ecken','Zachte hoeken','Esquinas suaves','Angoli morbidi'),round:phrase('Yuvarlak','Round','Rond','Rund','Rund','Rond','Redondo','Rotondo'),oval:phrase('Oval','Oval','Ovale','Oval','Oval','Ovaal','Ovalado','Ovale')};

export const WEAVE_NAMES={plain:phrase('İnce düz dokuma','Fine plain weave','Tissage fin','Fin lærredsvævning','Feine Leinwandbindung','Fijn platbinding','Tejido liso fino','Tela fine'),twill22:phrase('Çapraz dokuma','Twill texture','Sergé','Kipervævning','Köper','Keper','Sarga','Saia'),basket:phrase('İri dokuma','Coarse weave','Tissage épais','Grov vævning','Grobe Webung','Grof weefsel','Tejido grueso','Trama grossa')};

export const WOOD_NAMES={oak:phrase('Doğal meşe','Natural oak','Chêne naturel','Natur eg','Natureiche','Naturel eiken','Roble natural','Rovere naturale'),walnut:phrase('Sıcak ceviz','Warm walnut','Noyer chaud','Varm valnød','Warmer Nussbaum','Warm walnoot','Nogal cálido','Noce caldo'),dark:phrase('Koyu ahşap','Dark wood','Bois foncé','Mørkt træ','Dunkles Holz','Donker hout','Madera oscura','Legno scuro')};

export const FABRIC_NAMES={linen:phrase('Kum beji','Sand beige','Beige sable','Sandbeige','Sandbeige','Zandbeige','Beige arena','Beige sabbia'),clay:phrase('Kiremit','Terracotta','Terre cuite','Terracotta','Terrakotta','Terracotta','Terracota','Terracotta'),indigo:phrase('Çivit mavisi','Indigo blue','Bleu indigo','Indigoblå','Indigoblau','Indigoblauw','Azul índigo','Blu indaco'),charcoal:phrase('Antrasit','Charcoal','Anthracite','Antracit','Anthrazit','Antraciet','Antracita','Antracite')};

FABRIC_NAMES.taupe=phrase('Bohem kahve','Bohemian taupe','Brun taupe','Taupebrun');FABRIC_NAMES.sage=phrase('Adaçayı yeşili','Sage green','Vert sauge','Salviegrøn');

export function stepsFor(family,state={}){

 const steps=['room','family'];if(family==='sofa'){steps.push('layout');if(state.configuration?.startsWith('corner'))steps.push('returnSeats','service','pillows');}

 if(['sofa','armchair'].includes(family))steps.push('arms');

 if(['sofa','armchair','chair','bench'].includes(family))steps.push('cushions');

 if(['sofa','armchair','chair','bed'].includes(family))steps.push('back');

 if(['table','coffee','desk'].includes(family))steps.push('top');

 if(['console','shelf','wardrobe','dresser','nightstand','tv'].includes(family))steps.push('front','storage');

 if(family!=='shelf')steps.push('legs');steps.push('size','wood');

 if(FAMILIES[family].upholstered)steps.push('fabric','weave');steps.push('review');return steps;

}

export function choicesFor(step,s){

 const corner=s.configuration?.startsWith('corner');
 const ids={returnSeats:corner?['returnOne','returnTwo','returnThree']:['returnTwo'],service:corner?['noService','woodService','cupService']:['noService'],pillows:corner?['noPillows','withPillows']:['noPillows'],arms:corner?['rounded','paddedWood','slim','none']:['rounded','rolled','slim','sloped','square','none'],cushions:s.family==='sofa'?['fixed','single','split']:['fixed','single'],back:s.family==='bed'?['fixedBack','channelBack']:['fixedBack','looseBack','channelBack'],legs:corner?['tapered','straight','cylindrical']:s.configuration!=='straight'?['tapered','straight']:['tapered','straight','sled','plinth'],front:['closed','open','mixed']}[step];

 if(ids)return ids.map(id=>({id,names:DETAILS[id].names,sketch:DETAILS[id].sketch}));

 const options={room:ROOMS,family:Object.fromEntries(Object.entries(FAMILIES).map(([k,v])=>[k,v.names])),layout:CONFIGS,top:s.family==='desk'?{rect:TOPS.rect,soft:TOPS.soft}:TOPS,wood:WOOD_NAMES,fabric:FABRIC_NAMES,weave:WEAVE_NAMES}[step];

 if(options)return Object.entries(options).map(([id,names])=>({id,names}));

 if(step==='storage'&&s.family==='nightstand')return ['2','3','4'].map(id=>({id,names:phrase(id+' sıra',id+' rows',id+' rangées',id+' rækker')}));
 if(step==='storage')return (s.front==='mixed'?['3','4']:['2','3','4']).map(id=>({id,names:phrase(id+' bölme',id+' sections',id+' compartiments',id+' rum',id+' Fächer',id+' vakken',id+' secciones',id+' vani')}));

 if(step==='size')return ['compact','standard','generous'].map((id,i)=>({id,names:[phrase('Kompakt','Compact','Compact','Kompakt'),phrase('Standart','Standard','Standard','Standard'),phrase('Geniş','Generous','Généreux','Rummelig')][i]}));

 return [];

}

export function applyChoice(state,step,id){

 if(['returnSeats','service','pillows'].includes(step))return normalizeStudio({...state,[step]:detailValue(id)});
 if(step==='family')return changeFamily({},id);

 if(step==='layout'){if(id.startsWith('corner'))return normalizeStudio({...state,width:320,height:90,depth:260,seats:2,returnSeats:2,configuration:id});if(id==='two')return normalizeStudio({...state,width:170,depth:90,seats:2,configuration:'straight'});if(id==='three')return normalizeStudio({...state,width:220,depth:95,seats:3,configuration:'straight'});return normalizeStudio({...state,width:260,depth:165,seats:3,configuration:id});}

 if(step==='top'&&id==='round'){const diameter=state.family==='table'?110:80;return normalizeStudio({...state,top:id,width:diameter,depth:diameter});}

 if(step==='storage')return normalizeStudio({...state,[state.family==='nightstand'?'rows':'columns']:Number(id)});

 if(step==='size'&&state.configuration?.startsWith('corner')){const ratio=id==='compact'?.9:id==='generous'?1.03:1;return normalizeStudio({...state,width:Math.round(320*ratio),height:90,depth:Math.round(260*ratio)});}
 if(step==='size'){const d=FAMILIES[state.family].size,ratio=id==='compact'?.85:id==='generous'?1.15:1;if(state.top==='round'&&['table','coffee'].includes(state.family)){const diameter=Math.round((state.family==='table'?110:80)*ratio);return normalizeStudio({...state,width:diameter,depth:diameter});}return normalizeStudio({...state,width:Math.round((state.configuration!=='straight'?260:state.family==='sofa'?(state.seats===2?170:220):d[0])*ratio),height:d[1],depth:state.configuration!=='straight'?165:d[2]});}

 return normalizeStudio({...state,[step]:id});

}

export function selectedChoice(step,s,brief){if(['returnSeats','service','pillows'].includes(step))return choicesFor(step,s).find(c=>detailValue(c.id)===s[step])?.id;if(step==='room')return brief.room;if(step==='family')return brief.familyChosen?s.family:null;if(step==='layout')return s.configuration==='straight'?(s.seats===2?'two':'three'):s.configuration;if(step==='storage')return String(s.family==='nightstand'?s.rows:s.columns);if(step==='size')return brief.sizePreset||null;return s[step];}

export function projectRecord(state,brief,language){const model=compileStudio(state);return {format:'aura-guided-design',version:1,createdAt:new Date().toISOString(),language,design:model.state,brief:{...brief},parts:model.parts,stage:'concept',dimensionsStatus:brief.dimensionsEntered?'customer_entered_unverified':'suggested',materialsRepresentative:true,designerReviewRequired:true,paymentStatus:'not_collected',submitted:false};}

