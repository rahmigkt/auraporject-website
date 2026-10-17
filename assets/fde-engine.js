import {KNOWLEDGE} from './fde-knowledge-data.js?v=20261016q';
import {partCorners} from './reference-studies.js?v=20261016n';

export const STYLE_PROFILES=KNOWLEDGE.styles;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const types={sofa:'sofa',chair:'chair',bench:'bench',table:'dining_table',coffee:'coffee_table',desk:'desk',console:'sideboard',shelf:'bookshelf',wardrobe:'wardrobe'};
const aliases={leg:'legs',foot:'foot',top:'top',bottom:'carcass',base:'carcass',side:'side_panel',back:'back_panel',shelf:'shelf',divider:'divider',door:'door',pull:'hardware',handle:'hardware',plinth:'base_plinth','recessed-plinth':'base_plinth','seat':'seat','seat-cushion':'cushion','fixed-seat':'cushion',arm:'armrest','arm-roll':'armrest','rolled-arm':'armrest','tufted-arm':'armrest','back-cushion':'cover','fixed-back':'cover','tufted-back':'cover','upholstered-apron':'cover'};
export function taxonomyFor(family){return KNOWLEDGE.types.find(t=>t.furniture_type===types[family])||null;}
function flatten(parts){return parts.flatMap(p=>[p,...flatten(p.children||[])]);}
function canonical(role){if(own(aliases,role))return aliases[role];if(role.startsWith('drawer'))return 'drawer';if(role.startsWith('front-')||['recessed-panel','door-backing'].includes(role))return 'door';if(role.startsWith('frame-')||role.startsWith('timber-')||role.endsWith('-frame'))return 'frame';return null;}
export function explainPart(family,role,styleId){
 const taxonomy=taxonomyFor(family),partId=canonical(role),part=taxonomy&&flatten(taxonomy.parts).find(p=>p.part_id===partId);
 const style=STYLE_PROFILES.find(p=>p.style_id===styleId),directive=part&&style?.part_directives.find(d=>d.part_role===part.structural_role);
 return {mapped:!!part,taxonomyType:taxonomy?.furniture_type||null,role,partId:part?.part_id||null,name:part?.name_tr||null,nameEn:part?.name_en||null,functionTr:part?.function?.primary_tr||null,functionEn:part?.function?.primary||null,loadBearing:part?.function?.load_bearing??null,materials:(part?.material_options||[]).map(m=>({id:m.material_id,name:m.material_tr||KNOWLEDGE.materials.entries.find(e=>e.material_id===m.material_id)?.name_tr||m.material_id,processes:m.processes||[]})),directiveTr:directive?.directive_tr||null,directiveEn:directive?.directive||null};
}
// Recipes use only geometry already supported by AURA. They are interpretations,
// never full style reconstructions or style-match scores.
export function styleRecipe(state,id){
 if(!STYLE_PROFILES.some(p=>p.style_id===id))return null;
 if(!['sofa','armchair','console','shelf','wardrobe','dresser','nightstand','tv'].includes(state.family))return null;
 const upholstered=['sofa','armchair'].includes(state.family);
 if(upholstered&&state.configuration?.startsWith('corner'))return null;
 const recipes={
  japandi:upholstered?{archetype:'timber',arms:'slim',back:'looseBack',cushions:'split',wood:'oak',fabric:'linen',weave:'plain'}:{front:'closed',frontStyle:'slatted',legs:'tapered',wood:'oak'},
  bauhaus:upholstered?{archetype:'modern',arms:'slim',legs:'straight',back:'fixedBack',cushions:'single',wood:'dark',fabric:'charcoal'}:{front:'closed',frontStyle:'plain',legs:'straight',wood:'dark'},
  brutalism:upholstered?{archetype:'lounge',arms:'square',legs:'plinth',back:'fixedBack',cushions:'fixed',wood:'dark',fabric:'taupe'}:{front:'closed',frontStyle:'plain',legs:'plinth',wood:'dark'},
  art_deco:upholstered?{archetype:'modern',arms:'rounded',legs:'tapered',back:'channelBack',cushions:'single',wood:'walnut',fabric:'indigo'}:{front:'closed',frontStyle:'slatted',legs:'tapered',wood:'walnut'},
  gothic_minimalism:upholstered?{archetype:'timber',arms:'slim',legs:'straight',back:'fixedBack',cushions:'single',wood:'dark',fabric:'charcoal'}:{front:'closed',frontStyle:'plain',legs:'straight',wood:'dark'}
 };
 return recipes[id];
}
export function assessDesign(model){
 const family=model.state.family,taxonomy=taxonomyFor(family),checks=[];
 const add=(id,status,value,expected,partRoles=[])=>{const source=KNOWLEDGE.rules.find(r=>r.check_id===id);checks.push({id,status,name:source?.name_tr||id,nameEn:source?.name||id,value,expected,partRoles});};
 const seats=model.parts.filter(p=>['seat','seat-cushion','fixed-seat'].includes(p.role)),env=taxonomy?.ergonomic_envelope;
 if(seats.length&&env?.seat_height_range){const value=Math.round(Math.max(...seats.flatMap(p=>partCorners(p).map(v=>v[1])))*1000),[lo,hi]=env.seat_height_range;add('ERG-001',value>=lo&&value<=hi?'within-reference':'review',value+' mm',`${lo}–${hi} mm`,seats.map(p=>p.role));}
 if(seats.length&&env?.seat_depth_range){const value=Math.round(Math.min(...seats.map(p=>p.size[2]))*1000),[lo,hi]=env.seat_depth_range;add('ERG-002',value>=lo&&value<=hi?'within-reference':'review',value+' mm',`${lo}–${hi} mm`,seats.map(p=>p.role));}
 if(seats.length&&env?.seat_width_min){const width=Math.max(...seats.flatMap(p=>partCorners(p).map(v=>v[0])))-Math.min(...seats.flatMap(p=>partCorners(p).map(v=>v[0]))),people=family==='sofa'?model.state.seats||1:1,value=Math.round(width*1000/people),minimum=env.seat_width_min;add('ERG-003',value>=minimum?'within-reference':'review',value+' mm',`≥ ${minimum} mm${family==='sofa'?' / kişi':''}`,seats.map(p=>p.role));}
 if(env?.table_height_range){const value=Math.round(model.height*1000),[lo,hi]=env.table_height_range;add('ERG-007',value>=lo&&value<=hi?'within-reference':'review',value+' mm',`${lo}–${hi} mm`);}
 const woodLegs=model.parts.filter(p=>p.role==='leg'&&p.material==='wood'&&!p.rotation&&!p.yaw);
 if(woodLegs.length){const ratio=Math.max(...woodLegs.map(p=>p.size[1]/Math.min(p.size[0],p.size[2])/(p.shape==='tapered'?.5:p.shape==='turned'?.49:1)));add('STR-003',ratio<=18?'within-reference':'review',ratio.toFixed(1),'≤ 18 (sert ağaç varsayımı)',['leg']);}
 const evaluated=new Set(checks.map(c=>c.id));
 return {version:1,status:'preliminary-not-manufacturing-approval',source:KNOWLEDGE.source,taxonomyType:taxonomy?.furniture_type||null,checks,reviewCount:checks.filter(c=>c.status==='review').length,unevaluatedRuleIds:KNOWLEDGE.rules.filter(r=>!evaluated.has(r.check_id)).map(r=>r.check_id),limitations:['Referans eşikleri gönderilen bilgi paketinden alınmıştır; sertifikasyon değildir.','Sıkışma, süspansiyon ve gerçek malzeme sınıfı ölçülmedi.','Yük yolu, devrilme, birleşimler ve dayanım bu ön kontrolde hesaplanmadı.']};
}
export function knowledgeBrief(model,packet,styleId=null){
 const style=STYLE_PROFILES.find(p=>p.style_id===styleId);
 return {format:'aura-fde-design-brief',version:1,createdAt:new Date().toISOString(),design:model.state,styleIntent:style?{id:style.style_id,name:style.name,interpretationOnly:true}:null,assessment:assessDesign(model),components:packet.groups.map(g=>({id:g.id,role:g.role,name:g.name,quantity:g.quantity,dimensionsMm:g.dimensionsMm,knowledge:explainPart(model.state.family,g.role,styleId)})),modelGeneration:'existing-parametric-geometry',imageAnalysis:'not-connected',productionApproval:false};
}
