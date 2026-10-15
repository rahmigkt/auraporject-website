// Adapted from Morti, MIT, (c) 2026 Morti contributors.
// d12cb910339bd5d50e635882299ab6cfba70748d / shared/domain/defaults.ts
// and shared/domain/assembly.ts. License: vendor/MORTI-LICENSE.txt.
// Retained concepts: millimetre snapping and interior/face clearances.
export const metricSnap=v=>Math.round(v*1000)/1000;
export const PANEL_RULES={panelThickness:.022,panelJointClearance:.002,frontClearance:.002,backPanelThickness:.008,backPanelInset:.01};
export function cellBounds(width,height,depth,config=PANEL_RULES){
 const w=metricSnap(width-config.panelThickness-2*config.panelJointClearance);
 const h=metricSnap(height-config.panelThickness-2*config.panelJointClearance);
 const d=metricSnap(depth-config.backPanelInset-config.backPanelThickness-2*config.panelJointClearance);
 return {width:w,height:h,depth:d,frontWidth:metricSnap(w-2*config.frontClearance),frontHeight:metricSnap(h-2*config.frontClearance)};
}
