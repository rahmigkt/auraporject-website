// Compatibility launcher only; score.mjs and parser code are loaded unchanged.
import {registerHooks} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
if(process.platform==='win32')registerHooks({resolve(specifier,context,next){
 return next(/^[A-Za-z]:[\\/]/.test(specifier)?pathToFileURL(specifier).href:specifier,context);
}});
process.argv.splice(1,1,fileURLToPath(new URL('./score.mjs',import.meta.url)));
await import('./score.mjs');
