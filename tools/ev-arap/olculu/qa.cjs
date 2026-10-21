// Optional local artifact rendering; no site, model, login or network request.
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('playwright');
(async()=>{const out=path.resolve('work/arap-review-qa');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
for(const [name,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
 await page.setViewportSize({width,height});await page.goto(pathToFileURL(path.resolve('knowledge/ai-egitim/EV-ARAP-OLCULU-01-inceleme.html')).href);
 const metrics=await page.evaluate(()=>({cards:document.querySelectorAll('article').length,images:[...document.images].filter(x=>x.complete&&x.naturalWidth>0).length,overflow:document.documentElement.scrollWidth>innerWidth,rtl:document.querySelector('[lang="ar"]').dir}));
 if(metrics.cards!==12||metrics.images!==12||metrics.overflow||metrics.rtl!=='rtl'||errors.length)throw Error(JSON.stringify({metrics,errors}));
 await page.screenshot({path:path.join(out,name+'.png')});results.push({name,...metrics,errors:[...errors]});
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
