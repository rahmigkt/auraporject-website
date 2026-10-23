import {inspectEngineering,inspectionKey,INSPECTION_VERSION} from './engineering-checks.js';
import {inspectionPdf} from './inspection-pdf.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cache=new Map();let dialog=null;
export const cachedInspection=design=>cache.get(inspectionKey(design));
export const projectInspectionEnabled=()=>new URLSearchParams(location.search).get('uretim-inceleme')==='1';
async function digest(s){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(h),v=>v.toString(16).padStart(2,'0')).join('');}
export async function inspectItem(item,onProgress=()=>{}){
 const key=inspectionKey(item.design);let r=cache.get(key);if(!r){onProgress('Montaj, erişim ve hareket kontrolü çalışıyor…');r=await inspectEngineering(item.design);r.design_sha256=await digest(key);try{const pins=JSON.parse(document.querySelector('script[type=importmap]')?.textContent||'{}').imports||{};r.generator_assets=Object.entries(pins).filter(([k])=>/engineering-checks|inspection-pdf|assembly-collision/.test(k));}catch{}cache.set(key,r);}
 return {...r,id:item.id,name:item.name||item.design.kind,quantity:item.qty??1,origin:location.origin+location.pathname};
}
export async function openInspectionPdf(items){
 if(dialog?.open){dialog.focus();return;}const snapshot=structuredClone(items);if(!snapshot.length)throw Error('Önce projeye ürün ekleyin.');
 if(snapshot.some(i=>!Number.isInteger(i.qty??1)||(i.qty??1)<1))throw Error('Proje adedi geçersiz.');
 dialog=document.createElement('dialog');dialog.setAttribute('data-inspection-dialog','');dialog.style.cssText='width:min(1100px,94vw);height:88vh;padding:16px;border:1px solid #bdb4a2;background:#fbfaf6;color:#223329';dialog.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px"><b>Montaj ve ölçü incelemesi · PDF</b><button type="button" data-inspection-close>Kapat</button></div><p data-inspection-status role="status">Rapor hazırlanıyor…</p><p style="font-size:12px">Bu rapor seçilen tasarımın anlık kopyasına aittir. Sonraki değişiklikler için yeniden oluşturun. Üretim onayı değildir.</p><div data-inspection-result></div>';
 const host=dialog;document.body.appendChild(host);let url=null,closed=false;const cleanup=()=>{if(closed)return;closed=true;if(url)URL.revokeObjectURL(url);host.remove();if(dialog===host)dialog=null;};host.querySelector('[data-inspection-close]').onclick=()=>host.close();host.addEventListener('close',cleanup,{once:true});host.showModal();const progress=s=>{if(!closed)host.querySelector('[data-inspection-status]').textContent=s;};
 try{const reports=[];for(const [i,item]of snapshot.entries()){if(closed)return;progress('Ürün '+(i+1)+' / '+snapshot.length+' kontrol ediliyor…');try{reports.push(await inspectItem(item,progress));}catch(error){reports.push({schema:INSPECTION_VERSION,id:item.id,name:item.name||item.design.kind,quantity:item.qty??1,design:item.design,created_at:new Date().toISOString(),status:'not_verified',error:String(error.message||error),production_approved:false});}}
 const pdf=await inspectionPdf(reports,progress);if(closed)return;url=URL.createObjectURL(new Blob([pdf.bytes],{type:'application/pdf'}));const result=host.querySelector('[data-inspection-result]');result.innerHTML=`<p><a data-inspection-download download="AURA-montaj-inceleme.pdf" href="${url}">PDF indir ↓</a> · <a data-inspection-open target="_blank" rel="noopener" href="${url}">Yeni sekmede görüntüle ↗</a></p><iframe title="Montaj inceleme PDF önizlemesi" style="width:100%;height:62vh;border:1px solid #ddd" src="${url}"></iframe>`;progress(pdf.page_count+' sayfalık inceleme hazır. Eksik/doğrulanamayan kontroller raporda açıkça yazılıdır.');
 host.inspectionReports=reports;host.inspectionPageCount=pdf.page_count;
 }catch(error){progress('Rapor oluşturulamadı: '+String(error.message||error));}
}
export function inspectionPanelSummary(design,report){
 report ||= cachedInspection(design);const same=report&&report.input===inspectionKey(design);return `<section data-engineering-summary><h2>Montaj ve ölçü incelemesi</h2><p class="a-note">Nihai çalışma modelinin ölçüleri, bağlantıları, erişim ve tolerans kontrolleri. Üretim onayı değildir.</p><div class="a-tools"><button data-inspection-pdf>Raporu görüntüle / PDF indir</button><button data-machined-preview>İşlenmiş parçaları göster</button><button data-machined-reset>Normal modele dön</button></div><p class="a-note">${same?'Bu model için kontrol mevcut.':'Bu tasarım için güncel ayrıntılı kontrol henüz çalıştırılmadı.'}</p></section>`;
}
