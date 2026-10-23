// Hettich catalogue TA2025, printed p405/bk407. The b1 dimension starts at the
// first 37mm fixing, as do the C dimensions on the drawer member.
const TABLE={
  300:{b:[96,null,null,163.3],c:[96,192]},
  350:{b:[96,64,null,149.3],c:[128,229.5]},
  400:{b:[128,64,null,167.3],c:[128,288]},
  450:{b:[128,96,null,185.3],c:[128,192,320]},
  500:{b:[128,96,64,171.3],c:[128,224,352]},
  550:{b:[128,96,128,157.3],c:[128,256,416]}
};
const round=x=>Math.round(x*1000)/1000;
export function runnerMountPattern(profile,length){
  if(profile!=='hettich-ka5632-ss-2025')return {status:'unsupported_profile',drilling_verified:false};
  const row=TABLE[length];if(!Number.isInteger(length)||!row)return {status:'unsupported_length',drilling_verified:false};
  const cabinet=[37];let sum=37;
  for(const v of row.b)if(v!==null){sum+=v;cabinet.push(round(sum));}
  return {status:'source_fixing_centers_only',profile,length_mm:length,source:'https://catalog.hettich.com/General/TA_2025/en_DE/catalogs/TA_2025_en_DE/pdf/save/bk_407.pdf',printed_page:405,
    cabinet_from_front_mm:cabinet,drawer_from_front_mm:[37,...row.c.map(c=>round(37+c))],rear_cabinet_hole_drop_mm:14.5,
    note:'Vertical centerline:23mm above/below the46mm runner edges. Cabinet final fixing is14.5mm below that line. Screw options on drawing:drawer4x14;cabinet4x14 or6x14. Pilot bores depend on selected fastener and stock.',
    drilling_verified:false,production_approved:false};
}
