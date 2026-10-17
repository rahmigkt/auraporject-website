// Parameter adapter derived from Infinigen sofa_parameter_distribution.
// Copyright (c) 2024, Princeton University. BSD-3-Clause; see LICENSE.txt.
// Source: princeton-vl/infinigen @ 224598d4a2ff95b4fc928e72c222598b7122c698
// src/infinigen/assets/objects/seating/sofa.py, lines 1392–1428.
// AURA adaptation: deterministic customer dimensions, no random sampling or Blender dependency.
export function sofaParameters(s){
 const width=s.width/100,height=s.height/100,depth=s.depth/100;
 return {dimensions:[depth,width,height],armDimensions:[depth,Math.min(.25,Math.max(.075,width*(s.arms==='slim'?.035:.09))),height*.68],backDimensions:[Math.min(.25,depth*.23),0,height*.65],seatDimensions:[depth*.78,width,.18],footDimensions:[.16,.06,.06],baseboardHeight:.07,backrestAngle:-.12,armType:s.arms==='rolled'?'ROUND':s.arms==='sloped'?'ANGULAR':'SQUARE'};
}
