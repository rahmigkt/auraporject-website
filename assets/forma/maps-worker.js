// Generates material maps off the main thread. Message: {id, kind:'fabric'|'wood', spec}.
import {fabricMaps} from './textile.js';
import {woodMaps} from './wood.js';
import {stoneMaps} from './stone.js';
self.onmessage = ({data}) => {
  try {
    const out = data.kind === 'wood' ? woodMaps(data.spec.species, data.spec.finish, {stain: data.spec.stain}) : data.kind === 'stone' ? stoneMaps(data.spec.stone, data.spec.polish) : fabricMaps(data.spec, {maxPx: data.maxPx || 1024});
    const buffers = [out.albedo.buffer, out.normal.buffer, out.rough.buffer];
    self.postMessage({id: data.id, out}, buffers);
  } catch (error) { self.postMessage({id: data.id, error: String(error)}); }
};
