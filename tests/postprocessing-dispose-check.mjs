import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GTAOPass} from '../assets/vendor/addons/postprocessing/GTAOPass.js';
import {Scene,PerspectiveCamera} from '../assets/vendor/three.module.js';
const ao=new GTAOPass(new Scene(),new PerspectiveCamera(),4,4);
const keys=['gtaoNoiseTexture','pdNoiseTexture','normalRenderTarget','gtaoRenderTarget','pdRenderTarget','normalMaterial','gtaoMaterial','pdMaterial','copyMaterial','blendMaterial','depthRenderMaterial'];
const counts=Object.fromEntries(keys.map(k=>[k,0]));for(const k of keys)ao[k].addEventListener('dispose',()=>counts[k]++);
ao.dispose();const missing=keys.filter(k=>counts[k]!==1);
const src=fs.readFileSync(new URL('../assets/forma/scene.js',import.meta.url),'utf8');
const body=src.match(/    dispose\(\) \{([^\n]+)\}/)[1];
const order=[];const pass=(name)=>({dispose(){order.push(name)}});
const noop=()=>{};vm.runInNewContext('(function(){'+body+'})()',{
 ro:{disconnect:noop},mats:null,roomMats:null,itemMats:new Map(),disposeGroup:noop,group:null,disposeEnvironment:noop,
 composer:{passes:[pass('ao'),pass('smaa'),pass('output')],dispose(){order.push('composer')}},renderer:{dispose(){order.push('renderer')}},canvas:{remove:noop},
});
console.log(JSON.stringify({materialAndTargetDisposals:counts,missing,viewerDisposeOrder:order}));
assert.deepEqual(missing,[],'all owned GTAO resources must be disposed');
assert.deepEqual(order,['ao','smaa','output','composer','renderer'],'viewer must free its passes before composer/renderer');
