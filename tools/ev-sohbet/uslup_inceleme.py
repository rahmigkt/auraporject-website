"""Standalone old/new reading sheet; metadata stays outside the dialogue."""
from pathlib import Path
import html,json
from uslup_duzelt import ROOT,ARCHIVE,records
esc=lambda x:html.escape(str(x))
def build():
 old=json.loads(ARCHIVE.read_text(encoding='utf8'));cards=[];edited=0
 for f in records():
  r=json.loads(f.read_text(encoding='utf8'));before=old[r['id']]['dialogue'];rows=[]
  for i,(a,b) in enumerate(zip(before,r['dialogue'])):
   changed=a['content']!=b['content'];edited+=changed
   rows.append('<tr class="'+('changed' if changed else 'same')+'"><th>'+('Kullanıcı' if b['role']=='user' else 'Asistan')+'</th><td class="old">'+esc(a['content'])+'</td><td>'+esc(b['content'])+'</td></tr>')
  cards.append('<article id="'+esc(r['id'])+'"><h2>'+esc(r['id'])+' · '+esc(r['city'])+' · '+esc(r['language'])+'</h2><p class="meta">Plan, işlemler ve yerleşim değişmedi. Ana dil ve tasarımcı incelemesi bekleniyor.</p><table><thead><tr><th>Rol</th><th class="old">Önceki metin</th><th>Yeni okuma</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table></article>')
 page='''<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>TOPARLAMA-01 · Üslup okuması</title><style>body{font:17px/1.6 system-ui;background:#f5f2eb;color:#263a34;max-width:1400px;margin:auto;padding:24px}header{position:sticky;top:0;background:#f5f2eb;padding:10px 0;border-bottom:1px solid #bcc5bb}h1{font-size:26px}article{background:#fffdf8;margin:28px 0;padding:22px;border:1px solid #ddd8cc}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{text-align:left;vertical-align:top;padding:14px;border-bottom:1px solid #e1ded5;overflow-wrap:anywhere}th:first-child{width:85px}.old{display:none;color:#68716c}body.compare .old{display:table-cell}.changed td:last-child{border-left:3px solid #688c79}.meta{font-size:14px;color:#69736d}.only-changes .same{display:none}label{margin-right:24px;display:inline-block}@media(max-width:700px){body{padding:10px}article{padding:8px}td,th{padding:8px;font-size:14px}}</style><header><h1>40 sohbet · yeni üslup okuması</h1><p>640 mesaj incelendi; 38 sohbette 147 mesaj değişti. Eski metinler korunuyor. Geometri/işlem/yerleşim özeti değişmedi. Bu sayfa yeni bir insan veya yapı onayı değildir.</p><label><input id="compare" type="checkbox"> Eski metni yanında göster</label><label><input id="changes" type="checkbox"> Yalnız değişen mesajlar</label></header>'''+''.join(cards)+'''<script>document.getElementById('compare').addEventListener('change',e=>document.body.classList.toggle('compare',e.target.checked));document.getElementById('changes').addEventListener('change',e=>document.body.classList.toggle('only-changes',e.target.checked));</script></html>'''
 page=page.replace('147 mesaj',str(edited)+' mesaj')
 (ROOT/'knowledge/ai-egitim/TOPARLAMA-4-inceleme.html').write_text(page,encoding='utf8',newline='\n');print('40-card reading sheet written')
if __name__=='__main__':build()
