import assert from 'node:assert/strict';
import {stringChunksSplit,ExtendedData,DxfWriter,point3d} from '../assets/vendor/dxf/dxf.mjs';
let passed=0;
for(const text of ['', 'A', 'AB', ...[254,255,256,510,511,512].map(n=>'x'.repeat(n)), 'Türkçe ölçü ğışüöç '.repeat(40), 'مرحبا'.repeat(100), '家具'.repeat(150), '🪑'.repeat(130)]) {
 const chunks=stringChunksSplit(text);
 assert.equal(chunks.join(''),text,'no lost characters at the tail or boundary');
 assert(chunks.every(c=>Buffer.byteLength(c,'utf8')<=255 && c.length>0));
 for(const c of chunks) assert.equal(Buffer.from(c).toString('utf8'),c,'no split surrogate pairs');
 const data=new ExtendedData('AURA');data.string(text);const tags=[];data.dxfy({push:(...x)=>tags.push(x)});
 assert.equal(tags.filter(t=>t[0]===1000).map(t=>t[1]).join(''),text);passed++;
}
for(const length of [0,-1,1.5,NaN,Infinity]) {assert.throws(()=>stringChunksSplit('AB',length),RangeError);passed++;}
assert.throws(()=>stringChunksSplit('🪑',3),RangeError);passed++;
for(const n of [0,1,126,127,128,254,255,256]) {
 const hex=Buffer.from(Array.from({length:n},(_,i)=>i%256)).toString('hex'),data=new ExtendedData('AURA');data.binaryData(hex);
 const tags=[];data.dxfy({push:(...x)=>tags.push(x)});const chunks=tags.filter(t=>t[0]===1004).map(t=>t[1]);
 assert.equal(chunks.join(''),hex);assert(chunks.every(c=>c.length<=254&&c.length%2===0));passed++;
}
for(const hex of ['0','GG','01 02',null]) {
 const data=new ExtendedData('AURA');assert.throws(()=>data.binaryData(hex));
 const tags=[];data.dxfy({push:(...x)=>tags.push(x)});assert(!tags.some(t=>t[0]===1004));passed++;
}
const writer=new DxfWriter();writer.addLine(point3d(0,0),point3d(817,773));
const dxf=writer.stringify();assert(dxf.includes('EOF')&&!dxf.includes('NaN'));passed++;
console.log(`PASS ${passed} DXF text/binary boundary, Unicode, invalid input and writer smoke controls.`);
