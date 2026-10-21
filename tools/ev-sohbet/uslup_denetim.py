"""Editorial checks, not a claim of native-speaker approval.
Mix detection is heuristic; unresolved native review remains explicit.
"""
from pathlib import Path
import collections,json,re,sys,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PATTERNS={
 'tr':r'çözücü|kaynak istisnası|proje hedefi|dolaşım zarfı|lisanslı kaynak|referans|isimsiz oda|isviçre|veri seti',
 'en':r'\bsolver\b|source exception|project target|circulation envelope|licensed source|reference|swiss|\bdataset\b|unnamed room|source (?:walls|geometry|floor|target)',
 'nl':r'oplosser|bronafwijk|projectdoel|circulatie(?:zone|envelop)|gelicentieerde bron|referentie|zwitser|bron(?:geometrie|plan)|kildens',
 'fr':r'solveur|écarts? (?:de la |du )?source|objectif du projet|enveloppe de circulation|source sous licence|référence|suisse|pièce sans nom|fichier source',
 'de':r'\bsolver\b|quellenabweich|projektziel|bewegungshülle|lizenzierte quelle|referenz|schweizer|grundrissdaten',
 'da':r'\bsolver\b|kildeafvig|projektmål|cirkulations(?:zone|hylster)|licenseret kilde|reference|schweiz|kildens',
 'es':r'solucionador|resolutor|desviaci[oó]n.*fuente|objetivo del proyecto|envolvente de circulaci[oó]n|fuente licenciada|referencia|suiz[oa]|plano sin nombre',
 'it':r'solutore|\bsolver\b|eccezione.*fonte|obiettivo del progetto|inviluppo di circolazione|fonte licenziata|riferimento|svizzer|senza nome',
 'ar':r'محلل التموضع|استثناء المصدر|هدف المشروع|غلاف الحركة|مصدر مرخص|مخطط مرجعي|مجموعة بيانات'
}
ALL=re.compile('|'.join('(?:'+p+')' for p in PATTERNS.values()),re.I)
MARKERS={'tr':{'için','sizin','ölçüleri','birlikte'},'en':{'the','your','with','before'},'nl':{'jullie','jouw','plattegrond','hebben'},'fr':{'votre','nous','avec','vous'},'de':{'ihre','werden','möchten','haben'},'da':{'jeres','tegningen','sammen','skal'},'es':{'vuestro','medidas','podemos','vuestros'},'it':{'vostro','possiamo','insieme','misure'}}
def words(s):return re.findall(r"[^\W\d_]+(?:['’][^\W\d_]+)?",s,flags=re.UNICODE)
def inspect(records):
    forbidden=[];long=[];mix=[];seen=collections.defaultdict(list)
    for r in records:
        for i,t in enumerate(r['dialogue']):
            text=t['content'];lang=r['language'];tokens={w.lower() for w in words(text)}
            for hit in ALL.finditer(text):forbidden.append({'id':r['id'],'turn':i,'term':hit.group()})
            if t['role']=='assistant':
                if len(text.split())>60:long.append({'id':r['id'],'turn':i,'words':len(text.split())})
                for sent in re.split(r'(?<=[.!?])\s+(?=[A-ZİĞŞÇÖÜ])',text):
                    key=' '.join(words(sent.lower()))
                    if len(key.split())>=5:seen[(lang,key)].append((r['id'],i))
            for other,markers in MARKERS.items():
                if other!=lang and len(tokens&markers)>=3:mix.append({'id':r['id'],'turn':i,'declared':lang,'suspected':other})
    repeats=[{'language':lang,'sentence':sent,'occurrences':items} for (lang,sent),items in seen.items() if len(items)>1]
    return {'conversations':len(records),'messages':sum(len(r['dialogue']) for r in records),'forbidden':forbidden,'over_60_words':long,'language_mix_heuristic':mix,'repeated_assistant_sentences':repeats,'native_review':'pending_not_a_language_identification_proof','passed':not(forbidden or long or mix)}
if __name__=='__main__':
    from uslup_duzelt import records
    rs=[json.loads(p.read_text(encoding='utf8')) for p in records()];r=inspect(rs)
    out=ROOT/'knowledge/ai-egitim/toparlama-01/uslup-denetim.json';out.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps(r,ensure_ascii=False,indent=2));sys.exit(0 if r['passed'] else 1)
