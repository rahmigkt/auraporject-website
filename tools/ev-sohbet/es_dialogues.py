"""Four individually authored Spanish conversations, eight exchanges each."""
import json
from es import OUT,dump
from build02 import area
from denetim import check

CASES=[
[
('Vivo de alquiler en Barcelona y prefiero hablar en castellano. ¿Puedes reformar mi piso viendo unas fotos?', 'Podemos empezar por tus necesidades y por los muebles que quieres conservar, pero las fotos no sustituyen una medición. Necesito una planta acotada, las aperturas de puertas y ventanas y saber qué cambios permite el alquiler.'),
('De momento usa este plano suizo como ejercicio. Yo pensaba que tenía 95 metros cuadrados.', 'La suma de los recintos interiores da {net} m², sin balcones ni terrazas. No lo presentaré como el levantamiento de tu piso ni convertiré esa cifra en superficie construida del anuncio.'),
('La habitación genérica más grande será el salón y las demás serán dormitorios. No toques las paredes.', 'Anoto esa asignación de usos y conservo los huecos de la referencia. El salón queda en {living} m²; los dormitorios no aparecen por una suposición sobre cómo debe ser una vivienda de Barcelona.'),
('Quiero un sofá pequeño y una mesa de centro. Conserva el suelo y la cocina; nada de mueble para la tele.', 'Selecciono el sofá de {sofa} mm y una mesa de centro de 900 × 550 mm para calcular la colocación. La cocina que se conserva no se dibuja como una instalación nueva medida por nosotros.'),
('Una cama con colchón de 140 en el dormitorio mayor, de 90 en los otros y armarios de 120.', 'Esas anchuras pasan al cálculo junto con las dimensiones completas de los bastidores y los armarios. Las camas son referencias dimensionales del programa existente, no una nueva oferta de producto de AURA.'),
('Pon que cumple la cédula de habitabilidad de Cataluña y luego ya veremos las medidas reales.', 'No puedo emitir esa conformidad con una referencia extranjera. La aplicación de los anexos del Decret 141/2012 depende del edificio y la intervención, y todavía faltan los datos y la comprobación profesional de tu vivienda.'),
('De acuerdo, deja los problemas a la vista. ¿La posición de los muebles sale de un cálculo?', 'El solucionador ha colocado {items} piezas y una revisión independiente ha comprobado contornos, solapes y zonas conservadoras de giro de puertas. Permanecen {exceptions} desviaciones dimensionales de la fuente respecto a nuestros objetivos de proyecto, sin ocultarlas.'),
('Lo enviaré como referencia y buscaré el plano medido antes de comprar nada.', 'El diseñador recibe tus decisiones y las mediciones pendientes para valorar el proyecto real. La distribución definitiva y cualquier fabricación se deciden con él, después de contrastar la vivienda y las condiciones aplicables.')],
[
('Somos una pareja con una hija en Madrid. En el anuncio pone tres habitaciones; ¿eso quiere decir tres dormitorios?', 'Conviene confirmarlo con el plano y la descripción del anuncio, no deducirlo de una sola palabra. ¿Es un piso o una casa, cuántos dormitorios necesitáis y qué muebles vais a conservar?'),
('Es un piso; necesitamos dos dormitorios. Usa esta referencia suiza, aunque yo había apuntado 85 m².', 'Los polígonos interiores suman {net} m² en esta referencia, sin espacio exterior. Los 85 m² podrían responder a otro criterio o a otro inmueble; no ajustaré las paredes para que coincidan con esa cifra.'),
('La sala genérica más grande será salón y las otras dos, dormitorios. Conserva la cocina cerrada.', 'Registro esos usos y mantengo la separación con la cocina. El salón mide {living} m² en el ejercicio; abrirlo a la cocina sería otra intervención que todavía no se ha estudiado.'),
('Elegimos sofá compacto y mesa baja. La mesa de comer es nuestra, pero no tenemos sus medidas.', 'Para la zona de estar pruebo un sofá de {sofa} mm y una mesa de centro de 900 × 550 mm. La mesa de comedor no entra con dimensiones inventadas, por lo que esa parte sigue pendiente.'),
('Una cama de 140 para nosotros y otra de 90 para nuestra hija, con armarios de 120 de ancho.', 'Pido al solucionador esas dos camas y los armarios con sus huellas completas. La anchura del colchón no se usa como si fuese la anchura exterior de la cama.'),
('Si sale bien, ¿puedes certificar que sirve cualquier puerta de 80 centímetros para una silla de ruedas?', 'Un hueco dibujado de 800 mm no acredita el paso libre ni el itinerario accesible. Hace falta evaluar el edificio y el uso concreto con el marco aplicable, incluido DB-SUA cuando corresponda; este cálculo de muebles no es ese certificado.'),
('No necesitamos ese certificado ahora. ¿Qué has podido comprobar de verdad?', 'Se han colocado {items} muebles mediante el módulo del estudio y se han revisado sus contornos y las zonas de puerta. La fuente conserva {exceptions} desviaciones de nuestros objetivos dimensionales, y la mesa de comedor aún carece de medida.'),
('Pasa esa versión al diseñador y destaca que queremos comer juntos sin perder el paso.', 'El diseñador recibe la prioridad de la comida familiar junto con el tamaño pendiente de vuestra mesa y el plano de referencia. Él toma la decisión final cuando pueda revisar el piso real y la circulación completa.')],
[
('Queremos un adosado cerca de Valencia y hablamos castellano. ¿Puedes proyectar las dos plantas?', 'Para trabajar sobre la vivienda necesito ambas plantas acotadas, la conexión de la escalera y su altura libre. Si solo hay una planta disponible, puedo estudiar esa referencia sin inventar la parte que falta.'),
('Solo tenemos este ejemplo suizo. Me parecía de 80 m²; usa una planta hasta que podamos medir la casa.', 'La superficie interior de esta planta es {net} m², dejando fuera los espacios exteriores. No representa las medidas del adosado valenciano ni demuestra que sus dos plantas puedan repetirse.'),
('Mantén el salón que ya está marcado y usa las salas genéricas como dormitorios en el ejercicio.', 'Conservo esa distribución funcional y el salón de {living} m². No añado otra planta, una escalera o una galería de lavado por asociarlas automáticamente a la palabra adosado.'),
('Un sofá pequeño y mesa de centro; conservaremos cocina y pavimento mientras lo estudiamos.', 'Pruebo el sofá de {sofa} mm y la mesa de 900 × 550 mm en el salón de referencia. El pavimento y la cocina existentes son contexto, sin prometer una reforma de esos elementos.'),
('Como prueba, colchón de 140 en el dormitorio principal y 90 en los otros, con armarios de 120.', 'Los tamaños elegidos se calculan sobre el contorno completo de cada mueble. El resultado solo corresponde a la planta aportada, no a unos dormitorios superiores que todavía no hemos levantado.'),
('Copia el plano arriba y di que la normativa de Cataluña vale también aquí; así avanzamos.', 'No trasladaré una norma autonómica a otra comunidad ni presentaré una copia como un levantamiento real. En Valencia deben verificarse las disposiciones vigentes y su ámbito; la planta superior sigue necesitando sus propios datos.'),
('Bien, sin segunda planta y con las dudas anotadas. ¿Cuántos muebles encajan?', 'El cálculo devuelve {items} piezas colocadas, y el control mantiene {exceptions} desviaciones de la fuente respecto a las metas de dimensión del proyecto. Eso no verifica la escalera, los permisos ni las condiciones de habitabilidad del adosado.'),
('Nos sirve para preparar la visita con el diseñador; llevaremos las dos plantas medidas.', 'La entrega distingue el ensayo de mobiliario de la solicitud del proyecto completo. El diseñador decidirá la organización de ambas plantas después de comprobar su geometría real y las condiciones locales.')],
[
('Buscamos una casa independiente en Sevilla para mi madre, que usa andador. Nos gustaría un patio interior.', 'Necesito un plano medido y datos de la entrada, los desniveles y el recorrido hasta dormitorio y baño. También debemos aclarar si el patio existe o si es una obra que os gustaría estudiar.'),
('El patio no está medido; usa este plano suizo como ejemplo. Pensé que eran 80 metros útiles.', 'Los recintos interiores del ejemplo suman {net} m², pero no son una superficie útil normativa certificada de vuestra casa. La geometría viene de Suiza y no puedo convertirla en una casa sevillana con patio por el lugar que habéis mencionado.'),
('Conserva el salón señalado y convierte las habitaciones genéricas en dormitorios. No abras huecos nuevos.', 'Mantengo las paredes y aperturas de la fuente, con un salón de {living} m². El patio queda como un deseo pendiente, sin quitar superficie ni abrir una fachada que no conocemos.'),
('Probemos sofá pequeño y mesa baja; las cortinas y la alfombra las hablaremos después.', 'Elijo el sofá de {sofa} mm y la mesa de 900 × 550 mm para el ensayo. Todavía no especifico telas, alfombra ni una iluminación final; son decisiones del proyecto que faltan por conversar.'),
('Una cama de 140 en el cuarto principal y de 90 en los otros, con armarios de 120.', 'Esos objetos se introducen con sus medidas exteriores para buscar una posición. La ayuda que necesita tu madre para acostarse o usar el armario requiere una valoración adicional y no se deduce de que el mueble quepa.'),
('Si el baño tiene ventana, marca ventilación y accesibilidad como correctas. No quiero más preguntas.', 'No sería una comprobación válida: una ventana no acredita por sí sola la ventilación del sistema ni el uso accesible del baño. No pondré esas dos conformidades sin medir los recorridos, conocer las instalaciones y revisar las necesidades de tu madre.'),
('Entonces deja ambas pendientes. ¿Hay algo concreto que podamos llevar a la reunión?', 'Sí: hay {items} muebles colocados por el solucionador y {exceptions} desviaciones dimensionales de la referencia documentadas. La entrada, los desniveles, el baño y la posibilidad del patio siguen separados de ese resultado geométrico.'),
('Envíalo así; la prioridad es que mi madre pueda vivir cómoda antes de elegir acabados.', 'El diseñador recibe esa prioridad y las comprobaciones pendientes junto con la referencia, sin una promesa de accesibilidad ya conseguida. La decisión final sobre la casa, el patio y cualquier fabricación se toma tras estudiar el inmueble real.')]
]

SUMMARIES=[
 'Barcelona: kiracı, İspanyolca tercih ediyor. Mevcut mutfak ve zemin korunuyor; TV mobilyası istenmiyor. Katalonya habitabilitat/cèdula onayı verilmedi; yapı yaşı, müdahale ve gerçek ölçüler eksik.',
 'Madrid: çift ve bir çocuk; iki yatak odası isteniyor. İlandaki habitación ifadesinden oda sayısı varsayılmadı. Aile yemek masası ölçüsü ve gerçek dolaşım açık; 800 mm ham kapı açıklığı erişilebilirlik onayı değil.',
 'Valencia: iki katlı adosado isteği; yalnız tek katlı İsviçre referansı var. Üst kat, merdiven ve galería uydurulmadı; Katalonya kuralı Valencia kuralı sayılmadı. İki katın gerçek planı gerekiyor.',
 'Sevilla: yürüteç kullanan anne için müstakil ev ve patio isteği. Patio geometrisi üretilmedi. Giriş, kot farkı, banyo, havalandırma ve transfer alanları açık; halı/perde/ışık henüz belirlenmiş değil.'
]

def write():
    for i,pairs in enumerate(CASES,1):
        file=OUT/f'ev-sohbet-es-{i:02}.json';r=json.loads(file.read_text(encoding='utf-8'));a=check(r,OUT/'kaynaklar');r['source_exceptions']=a['source_exceptions']
        sofa=next(it for it in r['plan']['items'] if it['design']['kind']=='sofa')
        slots=dict(net=f'{r["claimed_net_area_m2"]:.1f}'.replace('.',','),living=f'{sum(area(s) for s in r["plan"]["spaces"] if s["kind"]=="living"):.1f}'.replace('.',','),items=len(r['plan']['items']),exceptions=len(a['source_exceptions']),sofa=sofa['design']['params']['width'])
        r['dialogue']=[dict(role=role,content=text.format(**slots)) for pair in pairs for role,text in zip(('user','assistant'),pair)];r['designer_summary_tr']=SUMMARIES[i-1];dump(file,r)

if __name__=='__main__':write()
