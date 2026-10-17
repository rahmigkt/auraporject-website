import assert from 'node:assert/strict';
import {explicitStyleEvidence} from '../assets/preference-evidence.js';
import {groundedTasteReply} from '../assets/assistant-classifier.js';
const cases=[['Japandi istemiyorum. Art Deco seviyorum ama aşırı süsleme olmasın.',['art_deco'],['japandi']],['I do not want Japandi, but I like Art Deco.',['art_deco'],['japandi']],['Jeg kan ikke lide Japandi, men jeg kan lide Art Deco.',['art_deco'],['japandi']],['Je ne veux pas de Japandi, mais je préfère Art Deco.',['art_deco'],['japandi']],['Gotik Minimalizm istiyorum.',['gothic_minimalism'],[]],['Endüstriyel olmasın.',[],['industrial']],['Art Deco seviyorum ama çok parlak olmasın.',['art_deco'],[]],['Aklımda bir proje var.',[],[]]];
for(const [text,yes,no]of cases){const got=explicitStyleEvidence(text);assert.deepEqual(got.positive,yes,text);assert.deepEqual(got.negative,no,text);}
const wrong={intent:'style',styleIds:['japandi','memphis'],avoidStyleIds:[],nextQuestion:'use'},result=groundedTasteReply(wrong,{category:'storage'},'tr',cases[0][0]);
assert.deepEqual(result.styleIds,['art_deco']);assert.ok(result.avoidStyleIds.includes('japandi'));
assert.ok(!result.reply.includes('Memphis'));assert.equal(result.replySource,'curated-style-guide-from-model-extraction');
assert.throws(()=>groundedTasteReply({...wrong,styleIds:['invented']}));
console.log('PASS exact named-style evidence in TR/EN/FR/DA and source-grounded correction of a semantically wrong model result.');
