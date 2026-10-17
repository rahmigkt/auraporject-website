export const PALETTES={
 linen:{tr:'Keten & zeytin',en:'Linen & olive',ground:'#ded5bf',ink:'#475541',accent:'#a77a55',soft:'#a5ad8a'},
 clay:{tr:'Kil & kökboya',en:'Clay & madder',ground:'#ad6c53',ink:'#f0dfc2',accent:'#5d3438',soft:'#d5ae8f'},
 indigo:{tr:'Çivit & kum',en:'Indigo & sand',ground:'#273e50',ink:'#e4d8bf',accent:'#b58755',soft:'#88a3a1'},
 charcoal:{tr:'Kömür & tebeşir',en:'Charcoal & chalk',ground:'#333833',ink:'#e9e5d7',accent:'#a59d7b',soft:'#7d8d7c'}
};
export const MOTIF_OPTIONS={none:['Düz','Plain'],palmet:['Palmet','Palmette'],iris:['İris','Iris'],kalpyaprak:['Kalp yaprak','Heart leaf'],damask:['Damask','Damask']};
export const WEAVE_NAMES={plain:['Bezayağı','Plain weave'],twill22:['Dimi 2/2','2/2 twill'],twill31:['Dimi 3/1','3/1 twill'],satin:['Saten','Satin'],basket:['Sepet','Basket weave'],herringbone:['Balıksırtı','Herringbone'],diamond:['Elmas dimi','Diamond twill']};
export const DEFAULT={version:1,palette:'linen',motif:'palmet',weave:'twill22',repeat:'halfdrop',scale:150,rotation:0,view:'flat'};
const has=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
const bounded=(v,d,min,max)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,Math.round(v))):d;
export function normalize(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))value={};
 return {version:1,palette:has(PALETTES,value.palette)?value.palette:DEFAULT.palette,motif:has(MOTIF_OPTIONS,value.motif)?value.motif:DEFAULT.motif,weave:has(WEAVE_NAMES,value.weave)?value.weave:DEFAULT.weave,repeat:['grid','halfdrop'].includes(value.repeat)?value.repeat:DEFAULT.repeat,scale:bounded(value.scale,DEFAULT.scale,90,240),rotation:bounded(value.rotation,0,-90,90),view:value.view==='cushion'?'cushion':'flat'};
}
export function decodeState(value){try{const parsed=JSON.parse(value);if(parsed.version!==1)throw Error('version');return normalize(parsed)}catch{return null}}
export function encodeState(state){return JSON.stringify(normalize(state))}
