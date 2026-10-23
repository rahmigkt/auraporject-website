// Product-specific planning dimensions. A geometry fit is not a drilling/load approval.
const legacy = 'legacy-side-12.7';
export const HINGE_SYSTEMS=Object.freeze(['legacy-unspecified','blum-110-inserta-expando']);
export const HINGE_PROFILE=Object.freeze({id:'blum-110-inserta-expando',name:'Blum CLIP top BLUMOTION110° · INSERTA/EXPANDO',cupDiameter:35,cupDepth:13,fixDiameter:8,fixPitch:45,fixOffset:9.5,plate:'174H7100E',platePitch:32,plateFromFront:37,plateBore:5,plateDepth:11.5,gap:1.5,source:'https://publications.blum.com/2024/catalogue/en/77/',drillingSource:'https://shop-ua.blum.com/uploads/documents/dfd537f5-17b4-4d26-ba24-1812df4ae3c4.pdf',plateSource:'https://d1.blum.com/mefiles/BEC003/ka110-kp-002_ka_dok_bau_%24sru_%24aof_%24v3.pdf',plateSourcePdfPage:80,plateSourcePrintedPage:175});
export function hingeForOverlay(overlay,inset=false){
  if(!Number.isFinite(overlay))return {issues:['invalid_overlay']};
  const variant=inset?{code:'71B3790',constant:-7}:overlay>=14?{code:'71B3590',constant:11}:{code:'71B3690',constant:1.5};
  const tb=Math.round((overlay-variant.constant)*1000)/1000;
  return {code:variant.code,tb,issues:tb<3||tb>7?['unsupported_overlay_for_zero_height_plate']:[]};
}
export const RUNNER_SYSTEMS = Object.freeze([legacy, 'accuride-3832ec', 'hettich-ka5632-ss-2025']);
export const CONNECTOR_SYSTEMS=Object.freeze(['legacy-unspecified','rastex15-18-du232t']);
export const CONNECTOR_PROFILES=Object.freeze({
  'legacy-unspecified':{name:'Mevcut örnek / Existing unspecified joint',source:null},
  'rastex15-18-du232t':{name:'Hettich Rastex 15 · 18 mm / DU 232 T',cam:'013961',dowel:'9047861',panelThickness:18,camDiameter:15,camDepth:13.4,edgeDiameter:8,camSetback:34,dowelAxis:9,sidePilotDiameter:5,sidePilotDepth:11.5,
    source:'https://www.hettich.com/fileadmin/Media_Center/Catalogue/Connecting_technology_2016_16359_HUS.pdf',pages:[8,10,11],setbackTolerance:{minus:.3,plus:.5},productionApproved:false}
});
export const RUNNER_PROFILES = Object.freeze({
  [legacy]: {id:legacy, name:'Mevcut örnek / Existing example · 12.7 mm', sideSpace:12.7, sideThickness:12, height:36, lengths:[250,300,350,400,450,500,550,600], rearSpace:4, planningVerified:false, source:null},
  'accuride-3832ec': {id:'accuride-3832ec', name:'Accuride 3832EC · Easy-Close', sideSpace:13.5, sideThickness:12, height:45.7, lengths:[300,350,400,450,500,550,600], rearSpace:4, minHeight:47.625, maxWidthIsLength:true, planningVerified:true,
    codes:{300:'3832-C12EC',350:'3832-C14EC',400:'3832-C16EC',450:'3832-C18EC',500:'3832-C20EC',550:'3832-C22EC',600:'3832-C24EC'},
    source:'https://www.accuride.com/media/amasty/amfile/attach/lsENsMwHMdlHk0OlD2EpkPTjq1u8ZoYw.pdf', pages:[1,2,3], note:'27 mm total width allowance recommended by manufacturer. Rear 4 mm is an AURA planning allowance, not a manufacturer minimum.'},
  'hettich-ka5632-ss-2025': {id:'hettich-ka5632-ss-2025', name:'Hettich KA 5632 · Silent System (2025)', sideSpace:12.7, sideThickness:14, height:46, lengths:[300,350,400,450,500,550], rearSpace:4, planningVerified:true,
    codes:{300:'9221513',350:'9221525',400:'9221526',450:'9221527',500:'9221528',550:'9221539'},
    source:'https://catalog.hettich.com/General/TA_2025/en_DE/catalogs/TA_2025_en_DE/pdf/save/bk_407.pdf', pages:[1], note:'12.7 mm installation width; catalogue minimum14mm refers to CABINET side stock, not drawer side thickness. Drawer14mm plywood is an AURA stock choice. Linked MS10924.03 instead shows cabinet minimum16mm. Minimum cabinet depth SL+4. Closed-member datums/pilots/load are not approved.'}
});
export function runnerProfile(id=legacy){
  if(!RUNNER_SYSTEMS.includes(id))throw Error('Unknown runner system');
  return structuredClone(RUNNER_PROFILES[id]);
}
export function runnerLength(id, availableDepth){
  if(!Number.isFinite(availableDepth))throw Error('Invalid drawer depth');
  const p=runnerProfile(id);
  return p.lengths.filter(n=>n+p.rearSpace<=availableDepth).at(-1)??p.lengths[0];
}
export function runnerAssessment(id,{openingWidth,boxHeight,length,availableDepth}){
  const p=runnerProfile(id), issues=[];
  for(const v of [openingWidth,boxHeight,length,availableDepth])if(!Number.isFinite(v)||v<=0)throw Error('Invalid runner dimensions');
  if(!p.lengths.includes(length))issues.push('unsupported_length');
  if(length+p.rearSpace>availableDepth+1e-6)issues.push('insufficient_depth');
  if(p.minHeight&&boxHeight<p.minHeight)issues.push('insufficient_box_height');
  const outerWidth=openingWidth-2*p.sideSpace;
  if(outerWidth<=2*p.sideThickness)issues.push('insufficient_width');
  if(p.maxWidthIsLength&&outerWidth>length)issues.push('box_wider_than_slide_length');
  if(!p.planningVerified)issues.push('legacy_hardware_unverified');
  return {profile:p.id,product_code:p.codes?.[length]??null,source:p.source,nominal_length_mm:length,side_space_mm:p.sideSpace,side_board_mm:p.sideThickness,outer_width_mm:outerWidth,
    fit_scope:'Listed width/depth/height and stock checks only; runner setback, screw positions, opening sweep and load are not verified.',geometry_fit:issues.length===0,issues,drilling_verified:false,production_approved:false};
}
