"""Actual local CPU zero-shot baseline; incremental raw evidence, never oracle scores."""
import argparse,json,time,urllib.request,urllib.error,hashlib,subprocess
from pathlib import Path
from common import write,compact,digest,ROOT
from eu.contract import SYSTEM,CONTRACT,response,response_schema
from eu.language import analyze

MODEL='qwen2.5:0.5b-instruct'
DETAILS={
'tr':('Belçika, Flaman bölgesinde 70 m² bir daire. 2+1 istiyorum: iki yatak odası ve bir salon. Kapalı mutfak, banyo, ayrı WC ve hol de olsun. Tek kat, dikdörtgen; cephe ve giriş yönü henüz bilinmiyor. Taslak bir program öner; geometriyi araç seçecek.','Fransızca konuşuyorum, T3 ev istiyorum. Henüz ülkeyi ve oda kullanımlarını söylemedim.'),
'en':('An apartment in Flanders, Belgium, about 70 m² on one floor. I need a 2-bed home: two bedrooms and one living room, a closed kitchen, bathroom, separate WC and hall. Rectangular outline; entrance and facade direction are unknown. Suggest a preliminary program; the tool will select geometry.','I speak French and want a T3. I have not specified the country or confirmed how the main rooms are used.'),
'de':('Eine Wohnung in Flandern, Belgien, etwa 70 m² auf einer Ebene. Eine 3-Zimmer-Wohnung: ausdrücklich zwei Schlafzimmer und ein Wohnzimmer. Dazu geschlossene Küche, Bad, separates WC und Flur. Rechteckiger Umriss; Eingang und Ausrichtung unbekannt. Bitte ein vorläufiges Raumprogramm, keine Wandkoordinaten.','Ich spreche Französisch und suche T3. Land und Nutzung der Haupträume sind noch nicht geklärt.'),
'fr':('Un appartement en Flandre, Belgique, environ 70 m² sur un seul niveau. Un T3 avec exactement deux chambres et un séjour, cuisine fermée, salle de bains, WC séparé et entrée. Contour rectangulaire, orientation et accès encore inconnus. Proposez un programme provisoire; un outil choisira la géométrie.','Je cherche un T3. Je parle français, mais je ne vous ai pas encore indiqué le pays ni confirmé les usages des pièces.'),
'nl':('Een appartement in Vlaanderen, België, circa 70 m² op één verdieping. Een 3-kamerwoning: precies twee slaapkamers en een woonkamer, gesloten keuken, badkamer, apart toilet en hal. Rechthoekige omtrek; ingang en oriëntatie onbekend. Stel een voorlopig programma voor; de tool kiest de geometrie.','Ik spreek Frans en zoek een T3. Het land en het gebruik van de kamers zijn nog niet bevestigd.'),
'da':('En lejlighed i Flandern, Belgien, cirka 70 m² i ét plan. En 3-værelses med præcis to soveværelser og en stue, lukket køkken, badeværelse, separat WC og entré. Rektangulær omkreds; indgang og orientering er ukendt. Foreslå et foreløbigt rumprogram; værktøjet vælger geometrien.','Jeg taler fransk og ønsker en T3. Landet og rummenes anvendelse er ikke bekræftet.'),
'es':('Un piso en Flandes, Bélgica, de unos 70 m² en una planta: exactamente dos dormitorios y un salón, cocina cerrada, baño, aseo separado y recibidor. Contorno rectangular; orientación y entrada desconocidas. Proponga un programa provisional; la herramienta elegirá la geometría.','Hablo francés y busco un T3. Aún no he indicado el país ni confirmado el uso de las habitaciones.'),
'it':('Un appartamento nelle Fiandre, Belgio, di circa 70 m² su un piano. Un trilocale con esattamente due camere e un soggiorno, cucina chiusa, bagno, WC separato e ingresso. Perimetro rettangolare; orientamento e accesso non noti. Proponga un programma preliminare; la geometria verrà scelta dallo strumento.','Parlo francese e cerco un T3. Non ho ancora indicato il paese né confermato gli usi dei locali.')}

def post(path,payload,timeout=150):
    # Hard-coded loopback only. No environment-controlled external provider.
    request=urllib.request.Request('http://127.0.0.1:11434'+path,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    return urllib.request.urlopen(request,timeout=timeout)

def run(output):
    output=Path(output)
    if output.exists():raise ValueError('Use a new benchmark directory')
    output.mkdir(parents=True);results=[];started=time.monotonic()
    for lang,prompts in DETAILS.items():
        for i,prompt in enumerate(prompts):
            before=time.monotonic();raw='';last={};failure=None
            payload=dict(model=MODEL,messages=[dict(role='system',content=SYSTEM),dict(role='user',content=prompt)],format='json',stream=True,keep_alive='30s',options=dict(num_gpu=0,num_thread=2,num_ctx=4096,num_predict=1000,temperature=0,seed=0))
            try:
                with post('/api/chat',payload) as stream:
                    for line in stream:
                        if not line:continue
                        message=json.loads(line)
                        if 'error' in message:raise ValueError(message['error'])
                        raw+=message.get('message',{}).get('content','');last=message
                parsed=response(json.loads(raw));valid=True
            except Exception as exc:failure=type(exc).__name__+': '+str(exc);parsed=None;valid=False
            expected='program' if i==0 else 'clarify';p=parsed.get('plan_program') if parsed else None
            locale=bool(valid and i==0 and p and p['country']=='BE' and p['region']=='BE-VLG') if i==0 else bool(valid and parsed['status']=='clarify' and p is None)
            rooms=bool(valid and i==0 and p and p['bedrooms']==2) if i==0 else bool(valid and parsed['status']=='clarify')
            row=dict(id=lang+'-'+str(i),language=lang,case='complete_program' if i==0 else 'ambiguous_country_and_notation',prompt=prompt,
                raw_response=raw,response=parsed,error=failure,format_valid=valid,expected_status=expected,status_correct=bool(valid and parsed['status']==expected),
                locale_correct=locale,room_notation_correct=rooms,elapsed_seconds=round(time.monotonic()-before,3),done=last.get('done',False),done_reason=last.get('done_reason'),
                eval_count=last.get('eval_count'),eval_duration_ns=last.get('eval_duration'),cpu_requested=True,gpu_requested=False)
            results.append(row)
            with (output/'responses.jsonl').open('a',encoding='utf8') as f:f.write(compact(row)+'\n')
            print(row['id'],row['format_valid'],row['status_correct'],row['elapsed_seconds'],flush=True)
    languages={lang:dict(n=sum(r['language']==lang for r in results),format_valid=sum(r['language']==lang and r['format_valid'] for r in results),locale_correct=sum(r['language']==lang and r['locale_correct'] for r in results),room_notation_correct=sum(r['language']==lang and r['room_notation_correct'] for r in results)) for lang in DETAILS}
    write(output/'manifest.json',dict(model=MODEL,contract=CONTRACT,system_sha256=hashlib.sha256(SYSTEM.encode()).hexdigest(),response_schema_sha256=digest(response_schema()),
        source_main=subprocess.check_output(['git','rev-parse','origin/main'],cwd=ROOT,text=True).strip(),examples=len(results),languages=languages,
        elapsed_seconds=round(time.monotonic()-started,3),guided_json=True,generation_format='json',strict_output_schema_enforced_by_validator=True,generation_token_cap=1000,trained=False,gpu_gate='closed',
        limitations=['two examples per language, not a robust language accuracy estimate','ambiguous case checks abstention, not a unique inferred country','geometry execution scored separately from raw responses','CPU requested explicitly; no paid API or rented GPU']))
    with post('/api/chat',dict(model=MODEL,messages=[],keep_alive=0,stream=False),timeout=30) as stream:stream.read()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();run(a.output)
