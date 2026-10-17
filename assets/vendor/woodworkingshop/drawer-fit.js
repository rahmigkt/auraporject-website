// Adapted from calculateDrawerBox, RajwanYair/WoodworkingShop.
// Copyright (c) 2026 Ryair. MIT; see LICENSE.txt.
// db927cad3213a69f10dcdd7e29eb8c3fcb907c7f/src/engine/geometry/drawer-box.ts
// AURA: only the explicitly defined side-mounted example profile is enabled.
// Other runner types require their own verified hardware profiles.
export function drawerFit({openingWidthMm,openingHeightMm,openingDepthMm,frontThicknessMm=24,sideClearanceMm=12.7}){
 for(const v of [openingWidthMm,openingHeightMm,openingDepthMm,frontThicknessMm,sideClearanceMm])if(!Number.isFinite(v)||v<=0)throw RangeError('Invalid drawer dimension');
 const widthMm=openingWidthMm-2*sideClearanceMm,heightMm=openingHeightMm-6,depthMm=openingDepthMm-frontThicknessMm;if([widthMm,heightMm,depthMm].some(v=>v<=0))throw RangeError('Drawer opening too small');
 return {widthMm,heightMm,depthMm,profile:'example-side-runner-12.7mm',hardwareVerified:false};
}
