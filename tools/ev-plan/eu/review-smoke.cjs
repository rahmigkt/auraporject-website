const fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url'),{chromium}=require('playwright');
const directory=path.resolve(process.argv[2]);
const bounded=p=>Promise.race([p,new Promise(r=>setTimeout(r,5000))]);
(async()=>{let owner,browser;try{
  owner=await chromium.launchServer({channel:'chrome',headless:true});browser=await chromium.connect(owner.wsEndpoint());
  const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(directory,'okuma.html')).href);
  const check=(ok,message)=>{if(!ok)throw Error(message)};
  check(await page.locator('article').count()===52,'52 cases');
  const cases=JSON.parse(await page.locator('#data').textContent());
  check(cases.every(c=>c.options.length===3&&c.source_country==='CH'),'source and alternatives');
  await page.locator('#country').selectOption('BE');check(await page.locator('article:visible').count()===12,'BE regions');
  for(const country of ['NL','DE','FR','GB','IE','DK','ES','IT','AT','CH']){
    await page.locator('#country').selectOption(country);check(await page.locator('article:visible').count()===4,country+' cases');
  }
  await page.locator('#country').selectOption('');const first=page.locator('article').first();
  await first.scrollIntoViewIfNeeded();await first.locator('svg').first().waitFor();
  await first.locator('.rating').selectOption('good');await page.locator('#export').click();
  check((await page.locator('#message').textContent()).includes('İnceleyen'),'reviewer gate');
  await first.locator('textarea').fill('TEST ONLY');await first.locator('.option').selectOption({value:'1'});
  check(await first.locator('.rating').inputValue()===''&&await first.locator('textarea').inputValue()==='','choice resets approval');
  await first.locator('.rating').selectOption('weak');await first.locator('textarea').fill('TEST ONLY');await page.locator('#reviewer').fill('AUTOMATED TEST, NOT HUMAN APPROVAL');
  const pending=page.waitForEvent('download');await page.locator('#export').click();const download=await pending;
  const exportPath=path.join(directory,'smoke-export.json');await download.saveAs(exportPath);
  const exported=JSON.parse(fs.readFileSync(exportPath,'utf8'));
  check(exported[0].option===2&&exported[0].proposal_hash===cases[0].options[1].proposal_hash,'hash-bound export');
  await page.reload();check(await page.locator('article').first().locator('.rating').inputValue()==='weak','saved decision');
  await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.screenshot({path:path.join(directory,'desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(directory,'mobile.png')});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');check(!errors.length,'page errors: '+errors);
  fs.unlinkSync(exportPath);fs.writeFileSync(path.join(directory,'ui-results.json'),JSON.stringify({passed:true,cases:52,alternatives:156,country_filters:11,regions_BE:3,reviewer_gate:true,option_reset:true,hash_export:true,persistence:true,mobile_no_overflow:true,page_errors:errors,human_approval:false},null,2));
  console.log('EU review UI passed: 52 cases, 156 options, desktop/mobile');
}catch(e){console.error(e);process.exitCode=1}finally{if(browser)await bounded(browser.close().catch(()=>{}));if(owner){owner.process().kill();await bounded(owner.kill().catch(()=>{}))}process.exit(process.exitCode||0)}})();
