import {Color} from '../vendor/three.core.js';
import {COLORS,WOODS,STAINS,METALS,STONES,GLASS} from '../forma/catalog.js';
/** Flat story colours follow the selected surface; dormant fields cannot override it. */
export function storyPartColor(design,part){
 if(part.mat?.startsWith('lac:'))return COLORS[part.mat.slice(4)]?.hex||COLORS.white.hex;
 const spec=part.matSpec||design.materials[part.mat]||design.materials.wood||design.materials.case||design.materials.base||{};
 if(['wood','veneer'].includes(spec.surface)||(!spec.surface&&spec.species)){
  const color=new Color((WOODS[spec.species]||WOODS.oak).base),stain=STAINS[spec.stain];if(stain?.hex)color.lerp(new Color(stain.hex),stain.k);return '#'+color.getHexString();
 }
 if(spec.surface==='stone')return (STONES[spec.stone]||STONES.carrara).base;
 if(spec.surface==='glass')return (GLASS[spec.glass]||GLASS.clear).hex;
 if(spec.surface==='metal'||part.mat==='metal')return (METALS[spec.metal||spec.finish]||METALS.black).hex;
 return COLORS[spec.color]?.hex||(['metal','dark','hardware'].includes(part.mat)?'#565e59':part.mat==='glass'?'#b9d3cd':'#ccaf84');
}
