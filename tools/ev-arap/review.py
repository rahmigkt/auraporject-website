from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-arap'
esc=lambda x:html.escape(str(x))
def build():
 cards=[]
 for f in sorted(OUT.glob('ev-sohbet-arap-*.json')):
  r=json.loads(f.read_text(encoding='utf8'));cards.append('<article><h2>'+esc(r['id'])+' · '+esc(r['city'])+'</h2><p class="meta">Ön görüşme: ölçülü plan ve yerleşim henüz yok. İstenen kat: '+str(r['requested_floors'])+'. Ana dil/tasarımcı onayı bekliyor.</p><div lang="ar" dir="rtl">'+''.join('<p class="'+t['role']+'"><strong>'+('المستخدم' if t['role']=='user' else 'المساعد')+'</strong><br>'+esc(t['content'])+'</p>' for t in r['dialogue'])+'</div></article>')
 page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Arapça ön görüşmeler</title><style>body{font:18px/1.8 system-ui;max-width:1050px;margin:30px auto;padding:18px;background:#f5f2eb;color:#263a34}article{padding:24px;margin:25px 0;background:#fffef9;border:1px solid #d6d9cd}.meta{font-size:14px}.user{border-right:4px solid #b5a17d;padding:12px}.assistant{border-right:4px solid #688c79;padding:12px}</style><h1>12 Arapça ön görüşme · tamamlanmış plan değil</h1><p>192 mesaj. Ölçülü yeni plan ve çözücü yerleşimi: 0. İki katlı iki villa isteği var; üst kat/merdiven çizilmedi. Gerçek müşteri verisi veya fotoğrafı kullanılmadı. Bu sayfa eğitim ya da uygulama onayı değildir.</p>'+''.join(cards)+'</html>'
 (ROOT/'knowledge/ai-egitim/EV-SOHBET-ARAP-inceleme.html').write_text(page,encoding='utf8',newline='\n');print('12 intake review cards written')
if __name__=='__main__':build()
