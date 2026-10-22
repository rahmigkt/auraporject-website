import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {cuttingList} from '../assets/forma/production/nesting.js';
// Exercise the real page's quantity loader and event handler, with DOM/rendering isolated.
const source=readFileSync(new URL('../assets/forma/production/app.js',import.meta.url),'utf8');
const begin=source.includes('function quantity(')?source.indexOf('function quantity('):source.indexOf('function setItems(');
const block=source.slice(begin,source.indexOf('\nfunction render()',begin));
const handler=source.match(/^\$\('#items'\)\.addEventListener\('change', .+$/m)?.[0];assert(block&&handler);
function page(){
 let change;const nodes={loadState:{},outState:{},items:{addEventListener(type,fn){assert.equal(type,'change');change=fn;}}};
 const api=runInNewContext('let items=[];'+block+'\n'+handler+'\n({load:setItems,get:()=>items});',{$:id=>nodes[id.slice(1)],normalizeDesign:d=>d,render(){}});
 return {...api,change:e=>change(e),nodes};
}
const design={params:{},materials:{case:{surface:'lacquer'},front:{surface:'lacquer'}}};
const compiled={parts:['a','b'].map(id=>({id,role:'top',mat:'case',geom:{w:400,h:18,d:300}}))};
let failed=0;const cases=[];
for(const qty of [undefined,2,'2'])cases.push([`import ${String(qty)} gives an integer and correct panel total`,()=>{const p=page();p.load([{design,qty}]);const n=p.get()[0].qty,expected=qty===undefined?1:2;assert.equal(cuttingList(compiled,design,n).rows[0].qty,expected*2);assert.equal(typeof n,'number');assert.equal(n,expected);}]);
for(const qty of [0,-1,1.5,'no',Infinity,1000])cases.push([`invalid import ${qty} preserves loaded items`,()=>{const p=page();p.load([{design,qty:2}]);assert.throws(()=>p.load([{design,qty}]));assert.equal(p.get()[0].qty,2);}]);
cases.push(['invalid quantity edit restores the last valid count; valid edit still saves',()=>{const p=page();p.load([{design,qty:2}]);const target={dataset:{qty:'0'},value:'2.5'};p.change({target});assert.equal(p.get()[0].qty,2);assert.equal(target.value,'2');assert(p.nodes.outState.textContent);target.value='3';p.change({target});assert.equal(p.get()[0].qty,3);assert.equal(p.nodes.outState.textContent,'');}]);
for(const [name,run]of cases){try{run();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
assert.equal(failed,0,`${failed} production quantity regressions`);
