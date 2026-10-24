import {STAGES,rectangleRoom,validateRoom} from './story-model.js';
import {planSvg} from './model.js';

export function createStoryFlow({$,run,imageFile,svgShot,replaceShots,shotCount,invalidate}){
  const designs=new Map(),rooms=new Map(),imports=[];let reference=null,prepared=null,dirty=false,locked=false;
  function note(text){$('storyNote').textContent=text;}
  function changed(){dirty=true;$('rights').checked=false;invalidate();note('Seçim değişti. Videodan önce süreç sahnelerini yeniden hazırlayın.');}
  const controls=['resultImage','storyRoom','storyDesign','roomWidth','roomDepth','roomHeight','prepareStory'];
  function sync(){for(const id of controls)$(id).disabled=locked;const selected=$('storyRoom').value;for(const id of ['roomWidth','roomDepth','roomHeight'])$(id).disabled=locked||selected!=='manual';if(selected!=='manual'){try{const room=validateRoom(rooms.get(selected));$('roomWidth').value=String(room.width/1000);$('roomDepth').value=String(room.depth/1000);$('roomHeight').value=String(room.height/1000);}catch(e){note(e.message);}}}
  function addProject(p,name,key){
    if(p?.D?.spaces)p=p.D;
    if(p?.schema==='aura.forma.design/1')designs.set(key,{name,design:structuredClone(p)});
    for(const [i,it]of (Array.isArray(p?.items)?p.items:[]).slice(0,40).entries())if(it.design?.schema==='aura.forma.design/1')designs.set(key+'-'+i,{name:it.name||name+' '+(i+1),design:structuredClone(it.design)});
    if(Array.isArray(p?.spaces))for(const [i,s]of p.spaces.slice(0,40).entries())rooms.set(key+'-room-'+i,{name:s.name||'Oda '+(i+1),boundary:structuredClone(s.boundary_xy_mm),height:s.ceiling_height?.unit==='mm'?s.ceiling_height.value:2800,representative:s.ceiling_height?.unit!=='mm',source:name,plan:p});
    if(p?.format==='aura-space-design'&&Array.isArray(p.rooms))for(const [i,r]of p.rooms.slice(0,24).entries())rooms.set(key+'-room-'+i,{name:r.name||r.type||'Oda '+(i+1),boundary:[[0,0],[r.width*10,0],[r.width*10,r.depth*10],[0,r.depth*10]],height:r.height*10,source:name});
  }
  function read(key){try{const raw=localStorage.getItem(key)||'null';return raw.length<=2e6?JSON.parse(raw):null}catch{return null}}
  function refresh(){const selected=[...$('storyDesign').selectedOptions].map(o=>o.value),selectedRoom=$('storyRoom').value;designs.clear();rooms.clear();
    addProject(read('aura-forma-project'),'Projem','project');for(const f of ['seating','table','storage','kitchen','bath'])addProject(read('aura-forma-design-'+f),'Stüdyo · '+f,'last-'+f);
    addProject(read('aura-ev-taslak'),'Kayıtlı ev','ev');addProject(read('aura-space-v1'),'Kayıtlı oda projesi','space');imports.forEach((p,i)=>addProject(p.project,p.name,'import-'+i));
    if(prepared?.inputs){for(const [i,design] of prepared.inputs.designs.entries())designs.set('draft-design-'+i,{name:'Taslak mobilyası '+(i+1),design});rooms.set('draft-room',prepared.inputs.room);}
    $('storyDesign').replaceChildren(new Option('Örnek masa · sentetik','sample'));for(const [key,d]of designs)$('storyDesign').add(new Option(d.name,key));
    for(const option of $('storyDesign').options)option.selected=selected.length?selected.includes(option.value):option.value==='sample';
    $('storyRoom').replaceChildren(new Option('Temsili oda · ölçüleri ben gireyim','manual'));for(const [key,r]of rooms)$('storyRoom').add(new Option((r.source||'İçe alınan')+' / '+r.name,key));$('storyRoom').value=rooms.has(selectedRoom)?selectedRoom:'manual';sync();
  }
  for(const id of ['storyRoom','storyDesign','roomWidth','roomDepth','roomHeight'])$(id).onchange=()=>{changed();sync()};
  $('resultImage').onchange=e=>run(async()=>{const f=e.target.files[0];if(!f)return;try{const s=await imageFile(f);reference={kind:'image',data:s.data,name:'Son dokunuş',role:'result'};$('referencePreview').src=s.data;$('referenceDetails').hidden=false;$('referenceName').textContent='Sonuç görseli hazır · yalnız final sahnesinde görünür';changed();}finally{e.target.value='';}});
  $('prepareStory').onclick=()=>run(async()=>{
    if(!reference)throw Error('Önce sonuç görselini yükleyin. Yükleme ekranı videoya alınmaz.');
    const selected=[...$('storyDesign').selectedOptions].map(o=>o.value);if(!selected.length||selected.length>4)throw Error('En az 1, en fazla 4 mobilya seçin.');
    if(shotCount()&&!confirm('Süreç anlatımı mevcut zaman çizgisinin yerini alsın mı? Kaydedilmiş taslaklar değişmez.'))return;
    note('Seçtiğiniz oda ve AURA mobilyalarının görünümleri hazırlanıyor…');
    const room=$('storyRoom').value==='manual'?rectangleRoom($('roomWidth').value,$('roomDepth').value,$('roomHeight').value):validateRoom(rooms.get($('storyRoom').value));
    const chosen=[];for(const key of selected){if(key==='sample'){const {sample}=await import('../forma/generate.js');chosen.push(sample({family:'table',seed:7}));}else{const item=designs.get(key);if(!item)throw Error('Mobilya kaynağı değişmiş; kaynakları yenileyin.');chosen.push(structuredClone(item.design));}}
    const {renderStoryViews}=await import('./story-renderer.js');const views=await renderStoryViews(room,chosen);
    const plan=room.plan||{spaces:[{name:room.name,boundary_xy_mm:room.boundary}],walls:[]};
    const first=await svgShot(planSvg(plan),STAGES[0]);
    await replaceShots([{...first,role:'process'},{kind:'image',data:views.empty,name:STAGES[1],role:'process'},{kind:'sequence',frames:views.frames,name:STAGES[2],role:'process'},{kind:'image',data:views.product,name:STAGES[3],role:'process'},{kind:'image',data:views.placed,name:STAGES[4],role:'process'},{...reference,name:STAGES[5],role:'result'}]);
    prepared={schema:'aura.social.story/1',room:{name:room.name,width:room.width,depth:room.depth,height:room.height,representative:!!room.representative},scope:views.scope,inputs:{room:structuredClone(room),designs:structuredClone(chosen)}};dirty=false;
    note(`6 sahne hazır · ${views.scope.models} mobilya / ${views.scope.parts} görünür parça. Sonuç fotoğrafı yalnız finalde. Oda açık cepheli; renkler temsilî, kapı/pencere ve gerçek montaj sırası anlatılmaz.`);
  });
  refresh();
  return {
    refresh,register(project,name){imports.push({project:structuredClone(project),name:String(name).slice(0,80)});if(imports.length>20)imports.shift();refresh();},
    lock(value){locked=value;sync();},
    snapshot(shots){if(dirty&&shots.some(s=>s.role==='process'))throw Error('Referans veya seçim değişti. Süreç sahnelerini yeniden hazırlayın.');return prepared?structuredClone(prepared):null;},
    restore(shots,story){reference=shots.find(s=>s.role==='result')||null;prepared=story||null;dirty=false;refresh();if(prepared?.inputs){$('storyRoom').value='draft-room';for(const o of $('storyDesign').options)o.selected=o.value.startsWith('draft-design-');sync();}$('referenceDetails').hidden=!reference;if(reference){$('referencePreview').src=reference.data;$('referenceName').textContent='Taslağın sonuç görseli · yalnız finalde görünür';}else{$('referencePreview').removeAttribute('src');$('referenceName').textContent='Sonuç görseli henüz yüklenmedi';}note(story?'Kaydedilmiş süreç sahneleri açıldı. Kaynak seçimini değiştirirseniz yeniden hazırlayın.':'Sonuç görselini yükleyip kaynakları seçin.');},
  };
}
