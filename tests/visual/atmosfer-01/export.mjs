const origin=process.env.ATMOSFER_ORIGIN||'http://127.0.0.1:8772';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server']});
try{
 const page=await browser.newPage();await page.goto(origin+'/tests/visual/atmosfer-01/review.html');await page.waitForFunction(()=>window.reviewReady);
 const fixtures=JSON.parse(await fs.readFile(new URL('./designs.json',import.meta.url)));
 const output=process.env.ATMOSFER_EXPORT_DIR;if(!output)throw Error('ATMOSFER_EXPORT_DIR required');await fs.mkdir(output,{recursive:true});
 for(const f of fixtures){console.log('export '+f.id);const result=await page.evaluate(id=>window.exportFinal(id),f.id);await fs.writeFile(`${output}/${f.id}.glb`,Buffer.from(result.base64,'base64'));await fs.writeFile(`${output}/${f.id}.json`,JSON.stringify(result.metadata,null,2));}
}finally{await browser.close();}
