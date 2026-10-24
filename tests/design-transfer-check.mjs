import assert from 'node:assert/strict';
import {sample,normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {identifyDesign,designRevision} from '../assets/forma/identity.js';
import {encode,decode,designLink,projectLink,readLink} from '../assets/forma/link.js';
import {importDesignLink} from '../assets/social/transfer.js';
globalThis.location={origin:'https://auraproject.com.tr',pathname:'/tasarla.html',hash:''};
for(const family of ['seating','table','storage','kitchen','bath']){
 const d=identifyDesign(sample({family,seed:211})),before=JSON.stringify(d),rev=await designRevision(d),url=await designLink(d,'tr'),back=await importDesignLink(url);
 assert.deepEqual(back,d);assert.equal(await designRevision(back),rev);assert.deepEqual(compileDesign(back),compileDesign(d));assert.equal(JSON.stringify(d),before);
 const changed=identifyDesign({...d,params:{...d.params,width:(d.params.width||800)+100}},d);assert.equal(changed.productId,d.productId);assert.notEqual(await designRevision(changed),rev);
 assert.notEqual(identifyDesign({...d,productId:null}).productId,d.productId);assert.equal(normalizeDesign(d).productId,d.productId);
 const project=await importDesignLink(await projectLink([{id:'U1',qty:2,design:d}],null,'tr'));assert.equal(project.items[0].qty,2);assert.deepEqual(project.items[0].design,d);
}
for(const input of ['https://auraproject.com.tr/tasarla.html?lang=tr','javascript:alert(1)','https://evil.example/other.html#d=jYWJj'])await assert.rejects(()=>importDesignLink(input));
assert.equal(await readLink('#d='+await encode({v:99,d:{}})),null);
await assert.rejects(()=>decode('xabc'));await assert.rejects(()=>decode('j'+'a'.repeat(262145)));await assert.rejects(()=>decode('j'+Buffer.from('{"__proto__":{}}').toString('base64url')));
assert.equal(await readLink('#p='+await encode({v:1,items:Array(41).fill({})})),null);
const bomb=new Uint8Array(await new Response(new Blob([' '.repeat(2097153)]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());await assert.rejects(()=>decode('z'+Buffer.from(bomb).toString('base64url')));
console.log('PASS 5 family exact link/project/identity/revision/geometry roundtrips; plain URL, malformed/version/prototype/oversize/inflation rejection; sources unchanged');
