import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../assets/forma/scene.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const studio = source.slice(source.indexOf('  async function studioPhoto('), source.indexOf('\n  return {\n    setDesign'));
const photo = source.slice(source.indexOf('    async photo('), source.indexOf('    capture()'));
const failures = [];
for (const [kind, step] of [['studio','success'],['studio','place'],['studio','render'],['studio','read'],['studio','encode'],['regular','success'],['regular','render'],['regular','encode']]) {
  try {
    const error = new Error(step); let thrown = false, resized = 0;
    const fail = name => { if (!thrown && step === name) { thrown = true; throw error; } };
    class Vec {
      constructor(x=0,y=0,z=0) { Object.assign(this,{x,y,z}); }
      clone() { return new Vec(this.x,this.y,this.z); }
      copy(v) { Object.assign(this,{x:v.x,y:v.y,z:v.z}); return this; }
      set(x,y,z) { Object.assign(this,{x,y,z}); return this; }
      setLength() { return this; } crossVectors() { return this; } normalize() { return this; } addScaledVector() { this.x++; return this; }
    }
    const owned = [], disposable = () => { const o={count:0,dispose(){this.count++;}};owned.push(o);return o; };
    const rect = () => ({width:20,height:10}), focus = {x:2}, bg = {}, floor = {material:{isShadowMaterial:true,opacity:0.21}};
    const ctx = {Float32Array,Math,Promise,setTimeout,cancelAnimationFrame(){},raf:1,matsReady:true,mats:{pendingParts:false},shooting:false,pendingRebuild:false,
      yaw:0.6,pitch:0.3,view:'front',zoom:1.3,focus,room:kind==='regular'?{}:null,sketch:false,compiled:{params:{base:'wall'},parts:[]},group:{},camera:{},canvas:{toDataURL(){fail('encode');return 'jpeg';}},
      host:{getBoundingClientRect:rect},contact:{material:{opacity:0.81}},sun:{position:new Vec(1,2,3),intensity:4},
      scene:{background:bg,environmentIntensity:0.9,children:[floor],add(o){this.children.push(o);},remove(o){this.children.splice(this.children.indexOf(o),1);}},
      renderer:{toneMapping:8,toneMappingExposure:1.2,pr:2,getPixelRatio(){return this.pr;},setPixelRatio(v){this.pr=v;},setSize(w,h){this.size=[w,h];}},
      composer:{setPixelRatio(v){this.pr=v;},setSize(w,h){this.size=[w,h];},render(){fail('render');}},
      persp:{fov:35,offset:false,setViewOffset(){this.offset=true;},clearViewOffset(){this.offset=false;},updateProjectionMatrix(){}},renderPass:{},ao:{updateGtaoMaterial({samples}){this.samples=samples;}},
      THREE:{NeutralToneMapping:9,Color:class{},Box3:class{setFromObject(){return {min:{y:1,z:0}};}},Vector3:Vec,
        PlaneGeometry:class{constructor(){return disposable();}},MeshStandardMaterial:class{constructor(){return disposable();}},Mesh:class{constructor(geometry,material){Object.assign(this,{geometry,material,position:new Vec()});}}},
      document:{createElement(){return {getContext(){return {drawImage(){},getImageData(){fail('read');return {data:new Uint8ClampedArray(16)};},createImageData(){return {data:new Uint8ClampedArray(16)};},putImageData(){}};},toDataURL(){fail('encode');return 'jpeg';}};}},
      place(){fail('place');},sketchResolution(){},rebuild(){},resize(){resized++;ctx.renderer.setSize(20,10);ctx.composer.setPixelRatio(ctx.renderer.pr);ctx.composer.setSize(20,10);}
    };
    const api = vm.runInNewContext(`${studio}\n({${photo}})`,ctx);
    const call = api.photo(2,{width:2,height:2,samples:1});
    if(step==='success') assert.equal(await call,'jpeg'); else await assert.rejects(call,e=>e===error);
    assert.equal(ctx.shooting,false);assert.equal(ctx.host.getBoundingClientRect,rect,'host measurement restored');
    assert.equal(ctx.scene.background,bg);assert.equal(ctx.scene.environmentIntensity,0.9);
    assert.equal(ctx.renderer.toneMapping,8);assert.equal(ctx.renderer.toneMappingExposure,1.2);assert.equal(ctx.renderer.pr,2);
    assert.deepEqual([ctx.sun.position.x,ctx.sun.position.y,ctx.sun.position.z],[1,2,3]);assert.equal(ctx.sun.intensity,4);
    assert.equal(floor.material.opacity,0.21);assert.equal(ctx.contact.material.opacity,0.81);
    assert.deepEqual([ctx.persp.fov,ctx.yaw,ctx.pitch,ctx.view,ctx.zoom],[35,0.6,0.3,'front',1.3]);assert.equal(ctx.focus,focus);
    assert.equal(ctx.persp.offset,false);assert.equal(ctx.ao.samples,16);assert.equal(resized,1);
    assert.equal(ctx.scene.children.length,1);for(const r of owned)assert.equal(r.count,1,'temporary wall disposed');
  } catch(error) { failures.push({kind,step,message:error.message}); }
}
console.log(JSON.stringify({passed:8-failures.length,failed:failures.length,failures}));
if(failures.length)process.exitCode=1;
