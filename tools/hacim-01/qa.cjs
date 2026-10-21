const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
(async()=>{const out=path.resolve('work/hacim-1-qa');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
for(const [name,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
 await page.setViewportSize({width,height});await page.goto(pathToFileURL(path.resolve('knowledge/ai-egitim/HACIM-01-H1-inceleme.html')).href);
 for(const language of ['tr','en','de','fr','nl','da','es','it','ar']){
  await page.selectOption('#lang',language);await page.selectOption('#kind','');
  if(!((await page.locator('#count').textContent()).startsWith('200 kayıt')))throw Error('Bad language count');
 }
 await page.selectOption('#kind','unsupported');
 const metrics=await page.evaluate(()=>({cards:document.querySelectorAll('article').length,overflow:document.documentElement.scrollWidth>innerWidth,rtl:document.querySelector('article p').dir,actions:[...document.querySelectorAll('article > pre')].every(p=>p.textContent==='[]'),count:document.getElementById('count').textContent}));
 if(metrics.cards!==10||metrics.overflow||metrics.rtl!=='rtl'||!metrics.actions||errors.length)throw Error(JSON.stringify({metrics,errors}));
 await page.screenshot({path:path.join(out,name+'.png')});results.push({name,...metrics,errors:[...errors]});
 await page.goto(pathToFileURL(path.resolve('knowledge/ai-egitim/HACIM-01-YERLESIM-inceleme.html')).href);
 const gallery=await page.evaluate(()=>({cards:document.querySelectorAll('article').length,svg:document.querySelectorAll('svg').length,overflow:document.documentElement.scrollWidth>innerWidth}));
 if(gallery.cards!==55||gallery.svg!==55||gallery.overflow||errors.length)throw Error(JSON.stringify({gallery,errors}));
 await page.screenshot({path:path.join(out,name+'-gallery.png')});results.push({name:name+'-gallery',...gallery,errors:[...errors]});
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
