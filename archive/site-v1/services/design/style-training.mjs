import {STYLE_DIRECTIONS} from '../../../../assets/style-directions.js';
import {validateTasteAnalysis} from '../../../../assets/assistant-classifier.js';
import {writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function trainingCandidates(){return STYLE_DIRECTIONS.flatMap(p=>[
 {id:p.id+'-prefer',sourceType:'editorial-synthetic',reviewStatus:'unreviewed',reviewer:null,profileStatus:p.status,user:`${p.name} yaklaşımını seviyorum. ${p.description}`,referenceGuide:p.principles[0],assistant:{intent:'style',styleIds:[p.id],avoidStyleIds:[],nextQuestion:'use'}},
 {id:p.id+'-avoid',sourceType:'editorial-synthetic',reviewStatus:'unreviewed',reviewer:null,profileStatus:p.status,user:`${p.name} istemiyorum. Tarzımı henüz bilmiyorum.`,referenceGuide:'Kullanıcının açıkça istemediği yaklaşım bir tercih değildir.',assistant:{intent:'style',styleIds:[],avoidStyleIds:[p.id],nextQuestion:'dislikes'}}
]);}
export function approvedTrainingRows(records){return records.filter(r=>r.reviewStatus==='approved').map(r=>{if(r.sourceType!=='editorial-synthetic'||typeof r.reviewer!=='string'||!r.reviewer.trim()||typeof r.user!=='string'||r.user.length>2500)throw Error('Missing explicit editorial review');const result=validateTasteAnalysis(r.assistant);return {messages:[{role:'user',content:r.user},{role:'assistant',content:JSON.stringify(result)}],metadata:{recordId:r.id,sourceType:r.sourceType,reviewer:r.reviewer,profileStatus:r.profileStatus}};});}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv[2]==='--candidates'){await writeFile(new URL('../../knowledge/style-training/candidates.jsonl',import.meta.url),trainingCandidates().map(r=>JSON.stringify(r)).join('\n')+'\n',{flag:'wx'});console.log('52 unreviewed editorial candidates created. No training performed.');}
 else if(process.argv[2]==='--export'){const records=(await readFile(process.argv[3],'utf8')).trim().split('\n').map(JSON.parse),rows=approvedTrainingRows(records);if(!rows.length)throw Error('No reviewed examples. Training export refused.');await writeFile(process.argv[4],rows.map(r=>JSON.stringify(r)).join('\n')+'\n',{flag:'wx'});console.log(rows.length+' reviewed rows exported. No model training performed.');}
}
