import {t} from './i18n.js';
export function findingText(f,lang='tr'){
 const keys={materialGradeUnknown:'technicalMaterial',memberScreenUnknown:'technicalUnsupported',memberScreenReview:'technicalLeg',olderAdultSeatDepth:'technicalErgo',frameNoFloor:'frameNoFloor',backSupportMissing:'backSupportMissing',frameDisconnected:'frameDisconnected',tableBracing:'tableBracing',jointCapacityReview:'jointCapacityReview',wholeProductReview:'wholeProductReview'};
 return t(f.code==='frameInvalidGeometry'?'frameInvalidGeometry':keys[f.code]||'issues.'+f.code,lang).replace('{v}',String(f.value??''))+(f.parts?.length?' ('+f.parts.join(', ')+')':'');
}
export function reviewDocument(items,lang='tr'){
 return [t('technicalTitle',lang),t('technicalReturn',lang),'',...items.flatMap(i=>[i.id+' · '+i.design.kind,...i.technicalReview.findings.map(f=>'• '+findingText(f,lang)), '']),t('technicalLimits',lang)].join('\n');
}
