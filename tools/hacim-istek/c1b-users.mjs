// Full replacements for the ten reviewed third-variant pairs in each language.
// Keys match curriculum.multiPairs; no object category is used as a connector.
export const pairUsers={
en:[
'In our living room, arrange the {n}×90 sofa facing the 160×40 TV unit and choose {color} drapes to complete the room.',
'Our bedroom needs a {bed}×210 bed with two 45×40 bedside tables close by, together with sheers and blackout drapes for the windows.',
'For our coffee corner, keep the {n}×90 sofa close to the 90×55 table and finish the same room with a {rug} rug.',
'Separate the {desk}×60 desk from the 90×35 bookcase in our child’s room and use {sheer} sheers at the window.',
'Give our {bed}×210 bed some distance from the 180×60 wardrobe and make that bedroom’s drapes {color}.',
'Bring our {n}×90 sofa and 80×80 armchair close together, with a {color} rug completing the living room.',
'For film nights, face the {n}×90 sofa towards the 160×40 TV unit from a distance and leave the living room without a rug.',
'Keep our dining room’s 160×90 table away from the 140×40 sideboard and use a {heading} heading on its curtains.',
'I would like {color} drapes and a {rug} rug in our living room so we can see both choices together.',
'At our living room window, combine {sheer} sheers with blackout drapes for the evenings.'
],
fr:[
'Dans notre salon, oriente le canapé de {n}×90 vers le meuble télé de 160×40 et choisis des rideaux de teinte {color} pour compléter la pièce.',
'Notre chambre a besoin du lit de {bed}×210 avec deux chevets de 45×40 à proximité et de voilages accompagnés de rideaux occultants.',
'Pour notre coin café, garde le canapé de {n}×90 près de la table basse de 90×55 et complète la pièce avec un tapis {rug}.',
'Dans la chambre de notre enfant, éloigne le bureau de {desk}×60 de la bibliothèque de 90×35 et choisis des voilages d’aspect {sheer}.',
'Laisse de la distance entre notre lit de {bed}×210 et l’armoire de 180×60, puis passe les rideaux de cette chambre à la teinte {color}.',
'Rapproche notre canapé de {n}×90 et le fauteuil de 80×80, avec un tapis de teinte {color} pour compléter le salon.',
'Pour regarder nos films, oriente le canapé de {n}×90 vers le meuble télé de 160×40 en gardant de la distance et laisse le salon sans tapis.',
'Dans notre salle à manger, éloigne la table de 160×90 du buffet de 140×40 et choisis une tête de rideau {heading}.',
'Je voudrais voir ensemble des rideaux de teinte {color} et un tapis {rug} dans notre salon.',
'À la fenêtre de notre salon, associe les voilages d’aspect {sheer} à des rideaux occultants pour le soir.'
],
es:[
'En nuestro salón, orienta el sofá de {n}×90 hacia el mueble de televisión de 160×40 y completa la habitación con cortinas de color {color}.',
'Nuestro dormitorio necesita una cama de {bed}×210 con dos mesillas de 45×40 cerca, además de visillos y cortinas opacas en la ventana.',
'Para nuestro rincón de café, mantén el sofá de {n}×90 cerca de la mesa de centro de 90×55 y completa la misma habitación con una alfombra de {rug}.',
'En el cuarto de nuestro hijo, aleja el escritorio de {desk}×60 de la librería de 90×35 y elige visillos con aspecto de {sheer}.',
'Deja distancia entre nuestra cama de {bed}×210 y el armario de 180×60, y pon las cortinas de ese dormitorio en color {color}.',
'Agrupa nuestro sofá de {n}×90 y el sillón de 80×80 cerca uno de otro, con una alfombra de color {color} para completar el salón.',
'Para ver películas, orienta el sofá de {n}×90 hacia el mueble de televisión de 160×40 desde cierta distancia y deja el salón sin alfombra.',
'En nuestro comedor, separa la mesa de 160×90 del aparador de 140×40 y elige la cabecilla de cortina {heading}.',
'Quiero ver juntas unas cortinas de color {color} y una alfombra de {rug} en nuestro salón.',
'En la ventana de nuestro salón, combina visillos con aspecto de {sheer} y cortinas opacas para la noche.'
],
it:[
'Nel nostro soggiorno, orienta il divano di {n}×90 verso il mobile TV di 160×40 e completa la stanza con tende di colore {color}.',
'La nostra camera ha bisogno del letto di {bed}×210 con due comodini di 45×40 vicini, insieme a tende leggere e tende oscuranti alla finestra.',
'Per il nostro angolo caffè, tieni il divano di {n}×90 vicino al tavolino di 90×55 e completa la stessa stanza con un tappeto {rug}.',
'Nella cameretta, allontana la scrivania di {desk}×60 dalla libreria di 90×35 e scegli tende leggere con aspetto di {sheer}.',
'Lascia distanza tra il nostro letto di {bed}×210 e l’armadio di 180×60, poi scegli il colore {color} per le tende di quella camera.',
'Avvicina il nostro divano di {n}×90 e la poltrona di 80×80, con un tappeto di colore {color} per completare il soggiorno.',
'Per guardare i film, orienta il divano di {n}×90 verso il mobile TV di 160×40 mantenendo distanza e lascia il soggiorno senza tappeto.',
'Nella nostra sala da pranzo, separa il tavolo di 160×90 dalla credenza di 140×40 e scegli la testa della tenda {heading}.',
'Vorrei vedere insieme tende di colore {color} e un tappeto {rug} nel nostro soggiorno.',
'Alla finestra del soggiorno, combina tende leggere con aspetto di {sheer} e tende oscuranti per la sera.'
]};
export function applyC1b(P){
 P.da.questions[7]=P.da.questions[7].split('|')[0]+'|Vores soveværelse trænger til en ny indretning.';
 P.da.outOverrides={8:'Bestil det valgte inventar til vores hjem, og betal for det.'};
 P.en.multiFrames[2]='{b}, and in that same room {a}.';
 P.fr.multiFrames[2]='{b} et, dans cette même pièce, {a}.';
 P.es.multiFrames[2]='{b} y, en esa misma habitación, {a}.';
 P.it.multiFrames[2]='{b} e, nella stessa stanza, {a}.';
}
