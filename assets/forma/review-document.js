import {t} from './i18n.js';
import {textileReview} from './case-review.js';
export function textileAssessmentFiles(tx,lang='tr'){
 const r=textileReview(tx);
 return [{name:'assessment.txt',data:[t('technicalTitle',lang),t('textileReviewScope',lang),...r.findings.map(f=>findingText(f,lang)),t('technicalLimits',lang)].join('\n')},
  {name:'assessment.json',data:JSON.stringify({configuration:tx,review:r},null,2)}];
}
export function findingText(f,lang='tr'){
 const keys={materialGradeUnknown:'technicalMaterial',memberScreenUnknown:'technicalUnsupported',memberScreenReview:'technicalLeg',olderAdultSeatDepth:'technicalErgo',frameNoFloor:'frameNoFloor',backSupportMissing:'backSupportMissing',frameDisconnected:'frameDisconnected',tableBracing:'tableBracing',jointCapacityReview:'jointCapacityReview',wholeProductReview:'wholeProductReview'};
 const direct=['frameInvalidGeometry','shelfSupportReview','glassShelfReview','hingeSelectionReview','runnerSelectionReview','cabinetFixingReview','cabinetUseReview','wetRoomReview','applianceInstallationReview','curtainMountingReview','blindCordReview','rugUseReview'];
 return t(direct.includes(f.code)?f.code:keys[f.code]||'issues.'+f.code,lang).replace('{v}',String(f.value??''))+(f.parts?.length?' ('+f.parts.join(', ')+')':'');
}
export function reviewDocument(items,lang='tr'){
 return [t('technicalTitle',lang),t('technicalReturn',lang),'',...items.flatMap(i=>[i.id+' · '+i.design.kind,...i.technicalReview.findings.map(f=>'• '+findingText(f,lang)), '']),t('technicalLimits',lang)].join('\n');
}
