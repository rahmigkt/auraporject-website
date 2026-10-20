const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('playwright');

(async () => {
  const directory = path.resolve(process.argv[2]);
  const expected = Number(process.argv[3] || 60);
  const owner = await chromium.launchServer({channel:'chrome', headless:true});
  const browser = await chromium.connect(owner.wsEndpoint());
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.join(directory,'okuma.html')).href);
    if (await page.locator('article').count() !== expected) throw Error('Wrong case count');
    const first = page.locator('article').first();
    await first.locator('.source svg').waitFor();
    const initial = await first.locator('.source').innerHTML();
    await first.locator('.option').selectOption('1');
    if (initial === await first.locator('.source').innerHTML()) throw Error('Alternative did not change');
    await first.locator('.rating').selectOption('weak');
    await first.locator('textarea').fill('Deneme kararı; insan onayı sayılmaz.');
    await page.locator('#export').click();
    if (!(await page.locator('#message').textContent()).includes('adını')) throw Error('Reviewer guard missing');
    await page.locator('#reviewer').fill('Otomatik arayüz testi');
    const downloadPromise=page.waitForEvent('download');
    await page.locator('#export').click();
    const download=await downloadPromise;
    const temporaryExport=path.join(directory,'ui-test-export.tmp.json');
    await download.saveAs(temporaryExport);
    const rows=JSON.parse(fs.readFileSync(temporaryExport,'utf8'));
    fs.unlinkSync(temporaryExport);
    if(rows.length!==expected || rows[0].selected_option!==2 || rows[0].rating!=='weak' || !rows[0].source_record_sha256) throw Error('Export mismatch');
    await first.locator('.option').selectOption('2');
    if(await first.locator('.rating').inputValue() || await first.locator('textarea').inputValue()) throw Error('Rating carried over to another plan');
    // Restore pending state before screenshots; automatic actions are not human reviews.
    await first.locator('.rating').selectOption('');
    await first.locator('textarea').fill('');
    await first.locator('.option').selectOption('0');
    await page.locator('#reviewer').fill('');
    await page.evaluate(()=>{document.querySelector('#message').textContent='';scrollTo(0,0)});
    await page.screenshot({path:path.join(directory,'review-desktop.png')});
    await first.screenshot({path:path.join(directory,'review-first-case.png')});
    for(let i=0;i<expected;i++){
      const card=page.locator('article').nth(i);
      await card.scrollIntoViewIfNeeded();
      await card.locator('.source svg').waitFor();
      if(await card.locator('.pair svg').count()!==2)throw Error('Missing comparison '+i);
      if(await card.locator('.option option').count()!==3)throw Error('Wrong option count '+i);
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(directory,'review-mobile.png')});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(overflow || errors.length)throw Error(JSON.stringify({overflow,errors}));
    const result={cases:expected,rendered_comparisons:expected,options_per_case:3,export_hashes:true,alternative_resets_rating:true,reviewer_guard:true,mobile_overflow:false,page_errors:errors,human_approval:false};
    fs.writeFileSync(path.join(directory,'review-ui-results.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
  } finally {
    await Promise.race([browser.close().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,5000))]);
    owner.process().kill('SIGKILL');
    await Promise.race([owner.kill().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,5000))]);
  }
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
