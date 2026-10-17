import {compileStudio} from './design-library.js?v=20261016n';
import {upholsteryMesh} from './upholstery-mesh.js?v=20261016n';
import {buildTechnicalPacket} from './technical-packet.js?v=20261016n';
self.onmessage=({data:{id,state}})=>{try{self.postMessage({id,progress:'geometry'});const model=compileStudio(state),transfer=[];for(const p of model.parts)if(['pillow','quilted','roll','turned'].includes(p.shape)){p.mesh=upholsteryMesh(p);transfer.push(p.mesh.positions.buffer,p.mesh.indices.buffer);}self.postMessage({id,progress:'dimensions'});const packet=buildTechnicalPacket(model,state.language||'tr');self.postMessage({id,model,packet},transfer);}catch(e){self.postMessage({id,error:String(e.message||e)});}};
