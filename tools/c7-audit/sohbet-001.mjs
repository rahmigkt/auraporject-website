// C7 evidence only. Never regenerates the source or invents native operations.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {compileItem,footprint} from '../../assets/ev/items.js';
import * as EXAM from '../aura-sinav-01/tasks.mjs';
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const sha=x=>createHash('sha256').update(x).digest('hex');
const norm=s=>String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/\d+/g,'#').replace(/[^\p{L}#]+/gu,' ').trim();
export const exactLeakage=(turns,tasks)=>turns.filter(t=>t.role==='user').flatMap((t,i)=>tasks.includes(norm(t.text))?[{user_index:i,normalized:norm(t.text)}]:[]);
export function auditConversation(raw,plan,row){
 if(!Array.isArray(plan?.items)||!Array.isArray(raw?.turns)||!Array.isArray(row?.mesajlar))throw Error('Missing source, plan or projected dialogue');
 const findings=[],proposals=raw.turns.flatMap(t=>t.proposed_changes||[]);
 const projected=raw.turns.map(t=>({rol:t.role,metin:t.text}));
 const projectionMatches=canonical(projected)===canonical(row.mesajlar);
 if(!projectionMatches)findings.push({code:'message_projection_mismatch'});
 const nativeCount=(row.islemler||[]).length;
 if(!nativeCount)findings.push({code:'no_recorded_native_operation_sequence',existing_quarantine:row.denetim?.uyarilar?.includes('no_recorded_native_operation_sequence')===true});
 const text=raw.turns.filter(t=>t.role==='assistant').map(t=>t.text).join('\n');
 const claim=text.match(/Mutfak\s+(\d+(?:[,.]\d+)?)\s*m\b/);
 const kitchen=plan.items.find(i=>i.id==='mutfak');
 if(!claim||!kitchen)throw Error('Expected reviewed kitchen claim/item absent; manual re-review required');
 const actual=compileItem(kitchen).size,stated=Number(claim[1].replace(',','.'))*1000;
 if(Math.abs(actual.w-stated)>.5)findings.push({code:'kitchen_width_claim_mismatch',stated_mm:stated,compiled_mm:actual.w,module_widths_mm:kitchen.design.params.modules.map(m=>m.w)});
 const assumed=[];
 if(raw.turns.some(t=>t.assumptions?.includes('Tavan yüksekliği 2700 mm')))for(const s of plan.spaces)if(s.ceiling_height?.value===2700&&s.ceiling_height.status==='customer_stated')assumed.push('spaces/'+s.id+'/ceiling_height');
 for(const w of plan.walls)if(w.thickness?.status==='customer_stated'&&[120,300].includes(w.thickness.value))assumed.push('walls/'+w.id+'/thickness');
 if(assumed.length)findings.push({code:'assumptions_labeled_customer_stated',fields:assumed});
 const exam=Object.values(EXAM).filter(Array.isArray).flat().map(t=>Array.isArray(t)?norm(t[1]):norm(t?.user||t?.metin||'')).filter(Boolean);
 const leakage=exactLeakage(raw.turns,exam);if(leakage.length)findings.push({code:'exact_normalized_exam_overlap',matches:leakage});
 return {id:row.id,source_turns:raw.turns.length,raw_proposals:proposals.length,coordinate_placement_proposals:proposals.filter(p=>p.operation==='propose_item_placement'&&p.payload?.pos_xy_mm).length,native_operations:nativeCount,message_projection_exact:projectionMatches,
  row_sha256:sha(canonical(Object.fromEntries(Object.entries(row).filter(([k])=>!['denetim','bolum'].includes(k))))),
  geometry:plan.items.map(i=>({id:i.id,position:i.pos_xy_mm,rotation:i.rot_deg,size:compileItem(i).size,footprint:footprint(i)})),
  exam_check:{method:'Compiler-compatible normalized exact user text comparison only; semantic/paraphrase leakage remains unreviewed',task_texts:exam.length,overlap:leakage},
  findings,decision:'duzelt',training_approved:false,scope:'One original Claude conversation and its current projection/compiled plan. No approval of other rows or full C7 completion; no source regeneration or model inference.'};
}
export function run(root=process.cwd()){
 const read=f=>fs.readFileSync(path.join(root,f),'utf8'),source='knowledge/ai-egitim/veri/sohbet-ornekleri/sohbet-001.json',projection='knowledge/ai-egitim/veri/birlesik/adaylar.jsonl';
 const raw=JSON.parse(read(source)),plan=JSON.parse(read(raw.result_plan)),rows=read(projection).split('\n').filter(Boolean).map(JSON.parse),row=rows.find(r=>r.id==='sohbet-ornekleri:sohbet-001');
 if(!row)throw Error('Projected source not found');
 const evidence=auditConversation(raw,plan,row),files=[source,raw.result_plan,'assets/ev/items.js','assets/forma/generate.js','assets/forma/kitchen.js','assets/ev/yerlesim.js','tools/studyo-motoru/motor.mjs','tools/egitim-donustur/donustur.py','tools/egitim/derle.mjs','tools/aura-sinav-01/tasks.mjs','tools/c7-audit/sohbet-001.mjs'];
 evidence.source_code_sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 evidence.sources=Object.fromEntries(files.map(f=>[f,{sha256_lf:sha(read(f).replace(/\r\n/g,'\n'))}]));
 evidence.projected_source_hash_matches=row.kaynak.sha256===evidence.sources[source].sha256_lf;
 evidence.reviewer='Codex';evidence.review_mode='cross_review';evidence.producer='Claude';evidence.at=new Date().toISOString();
 const pos=process.argv.indexOf('--out'),out=pos>=0?process.argv[pos+1]:'work/c7-sohbet-001-evidence.json';
 fs.mkdirSync(path.dirname(path.join(root,out)),{recursive:true});fs.writeFileSync(path.join(root,out),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({out,id:evidence.id,source_turns:evidence.source_turns,raw_proposals:evidence.raw_proposals,native_operations:evidence.native_operations,findings:evidence.findings.map(f=>f.code),hash_matches:evidence.projected_source_hash_matches,training_approved:false}));return evidence;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))run();
