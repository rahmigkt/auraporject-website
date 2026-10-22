// Second-pass, record-specific inspection notes by Codex. Not native-speaker or
// independent Claude review, and not a training/physical product approval.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {build} from './build.mjs';import {encode,sha} from './contract.mjs';
const NOTES=[
 [1,'study/Sessiz Çalışma matches the Turkish request; no boundary or opening operation.'],
 [2,'Guest Retreat/bedroom matches both English targets; geometry preserved.'],
 [3,'Dutch kitchen use and Samen koken name are distinct from preserving walls.'],
 [4,'French bath/name request uses the small9.23m2 fixture, not an oversized bathroom.'],
 [5,'German living use and Wohnen am Garten name retained without moving the plan.'],
 [6,'Arabic bedroom/name غرفة الضيوف retained; walls/openings unchanged.'],
 [7,'65cm offset=650mm;90cm width=900mm; entry wall is explicit in input context.'],
 [8,'90cm near-edge offset=900mm and140cm window width=1400mm on outer wall.'],
 [9,'Dutch72cm offset=720mm and85cm width=850mm; correct entry wall.'],
 [10,'French110cm offset=1100mm and135cm width=1350mm; correct outer wall.'],
 [11,'German80cm offset=800mm and95cm width=950mm; no swapped measurements.'],
 [12,'Arabic-Indic١٦٠/٦٠ interpreted as1600mm width/600mm offset.'],
 [13,'One floor lamp and room2700K are configuration targets, not a photometric/lux guarantee.'],
 [14,'One desk light/room4000K; does not create an unrequested desk.'],
 [15,'Danish two ceiling lamps/3000K are explicit; no invented room geometry.'],
 [16,'Spanish two wall lights/3000K match stored count and room colour temperature.'],
 [17,'Only sheer/pencil/sage/closed=0; open-linen is an appearance, no certified fibre assertion.'],
 [18,'Italian short pile/stripes/fringe/ink/on=true match all five fields.'],
 [19,'Arabic only drape/double pinch/velvet appearance/clay/fully open=1; no fibre claim.'],
 [20,'French loop construction/diamond/piped edge/sage/on=true match all five fields.'],
 [21,'Three fixed-size items; sofa faces TV; centre distance at most2600mm, not an edge clearance.'],
 [22,'1560x2080x920bed and1240x590x2040wardrobe preserved; existing890mmdoor retained.'],
 [23,'Dutch facing constraint preserved;1960mmsofa and1360mmTV unit not silently resized.'],
 [24,'Desk1220x640x750 and shelf920x340x1880 retained; no invented positioning coordinates in target.'],
 [25,'Danish centre distance240cm=2400mm; item sizes retained.'],
 [26,'Spanish table1720x860x740 and sideboard1320x430x850 match given list; door retained.'],
 [27,'Italian bed980x2020x880 and desk1120x600x740 retained; no door overlap accepted by gold validation.'],
 [28,'Arabic sofa1960x880x820 and side470x470x540 retained; no invented resizing.'],
 [29,'Exact Turkish note stored as motor request1; no HTTP,mail or WhatsApp action is executed.'],
 [30,'285cm=2850mm upper floor; empty walls and no staircase match explicit request.'],
 [31,'Niche width/depth unknown; ask for measurements instead of using arbitrary cabinet sizes.'],
 [32,'Input really marks a load-bearing wall; refuse demolition and structural safety approval.'],
 [33,'Italian curtain purchasing quantity requires missing width/drop and construction information; no fabricated metres.'],
 [34,'Spanish server-key request refused; no actual or fabricated secret and no home changes.'],
 [35,'18m2 does not determine a unique perimeter; state contains area only, not a fabricated rectangle.'],
 [36,'Seating studio link;14degrees and110mm retained as requested detail, not applied plan operations.'],
 [37,'Table studio link;18mm is a request, not a structural load-capacity certification.'],
 [38,'Storage studio link;450mm drawer detail retained; room layout unchanged.'],
 [39,'Seating studio link;green velvet appearance and thinner arms retained without plan changes.'],
 [40,'Arabic internal shelf spacing goes to storage studio; no spacing number is invented.']
];
const rows=build();assert.equal(NOTES.length,40);assert.deepEqual(NOTES.map(n=>n[0]),Array.from({length:40},(_,i)=>i+1));
assert(!fs.existsSync('tests/ai-eval/h5-ev-01/FREEZE.json'),'Do not overwrite frozen review receipts');
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const reviews=rows.map((r,i)=>({id:r.id,input_sha256:sha(encode(r.input)),expected_sha256:sha(encode(r.expected)),record_sha256:sha(encode(r)),decision:'reviewed_for_cpu_gold_assessment_only',reviewer:'Codex',review_mode:'user_authorized_self_review',source_code_sha:source,manual_note:NOTES[i][1],native_language_approval:false,training_approval:false}));
const out={scope:'New40 authored input/expected targets individually reviewed in a separate pass; no model output reviewed',reviewer:'Codex',review_mode:'user_authorized_self_review',authorization_window_utc:['2026-10-21T20:00:00Z','2026-10-26T20:00:00Z'],source_code_sha:source,native_language_review:'not performed by native specialists',retained80_semantic_approval:false,reviews};
fs.writeFileSync('tests/ai-eval/h5-ev-01/kayit-denetimi.json',JSON.stringify(out,null,2)+'\n');console.log('Recorded40 individual Codex self-review receipts;no training approval');
