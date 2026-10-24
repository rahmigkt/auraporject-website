import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {safeNext,profile,emailAddress,newPassword} from '../assets/auth/config.js';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
for(const v of ['https://evil.test','//evil.test','sosyal-editor.php?x=1','../x'])assert.equal(safeNext(v),'tasarla.html');
assert.equal(emailAddress(' TEST@example.com '),'test@example.com');assert.throws(()=>profile({name:'a',market:'TR',locale:'tr-TR'}));assert.throws(()=>newPassword('short','short'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),calls=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://xcsvobtewvjlnjeyqiux.supabase.co/**',async route=>{const r=route.request(),u=new URL(r.url());calls.push({path:u.pathname,query:u.search,body:r.postDataJSON?.()});let body={};if(u.pathname.endsWith('/settings'))body={external:{email:true,google:false},disable_signup:false};else if(u.pathname.endsWith('/token'))return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'invalid_credentials',message:'Invalid login credentials'})});else if(!['/auth/v1/otp','/auth/v1/recover'].includes(u.pathname))throw Error('Unexpected Auth call '+u.pathname);await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});});
 await page.goto('http://127.0.0.1:51947/hesap.html?next=sosyal-editor.php');
 await page.getByText('Google bağlantısı bu projede henüz etkinleştirilmedi.',{exact:true}).waitFor();assert.equal(await page.locator('#google').isDisabled(),true);
 await page.locator('#email').fill('owner@example.com');await page.locator('#submit').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('İşlem kabul'));
 assert.equal(calls.find(c=>c.path.endsWith('/otp')).body.create_user,false);
 await page.locator('[data-mode=signup]').click();await page.locator('#name').fill('Test User');await page.locator('#privacy').check();await page.locator('#submit').click();await page.waitForTimeout(300);
 const otp=calls.filter(c=>c.path.endsWith('/otp'));assert.equal(otp.at(-1).body.create_user,true);assert.equal(otp.at(-1).body.data.market,'TR');assert.ok(otp.at(-1).body.code_challenge);assert.ok(otp.at(-1).query.includes('redirect_to='));
 await page.locator('[data-mode=login]').click();await page.locator('#method').selectOption('password');await page.locator('#password').fill('wrongpassword');await page.locator('#submit').click();await page.waitForTimeout(500);console.log('password notice',await page.locator('#notice').textContent());assert.ok(calls.some(c=>c.path.endsWith('/token')));assert.ok((await page.locator('#notice').textContent()).length>0);
 await page.locator('#reset').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('sıfırlama bağlantısı'));assert.ok(calls.find(c=>c.path.endsWith('/recover')).query.includes('recovery'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 results.push({width,otp:otp.length,passwordFailure:true,recoveryRequest:true,pageerror:errors.length});await context.close();
}
for(const [confirmed,status] of [[false,200],[true,403],[true,200]]){
 const context=await browser.newContext(),page=await context.newPage();
 const user={id:'mock-owner',email:'owner@example.com',email_confirmed_at:confirmed?'2026-10-24':null,user_metadata:{name:'Owner',market:'TR'}};
 const token=['e30',Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600,sub:'mock-owner'})).toString('base64url'),'mock'].join('.');
 await context.addInitScript(({user,token})=>localStorage.setItem('aura-account-session',JSON.stringify({access_token:token,refresh_token:'mock-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user})),{user,token});
 await page.route('https://xcsvobtewvjlnjeyqiux.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(route.request().url().includes('/settings')?{external:{google:false}}:user)}));
 await page.route('**/api/editor-session.php',route=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{editor:true}:{error:'Yetki yok'})}));
 await page.goto('http://127.0.0.1:51947/hesap.html?next=sosyal-editor.php');await page.locator('#session').waitFor();await page.waitForTimeout(300);
 assert.equal(await page.locator('#continue').isDisabled(),!confirmed||status!==200);await context.close();
}
const response=await fetch('http://127.0.0.1:51947/sosyal-editor.php',{redirect:'manual'});assert.equal(response.status,303);assert.equal(response.headers.get('location'),'hesap.html?next=sosyal-editor.php');
const blocked=await fetch('http://127.0.0.1:51947/api/editor-session.php',{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://evil.test'},body:'{"action":"login"}'});assert.equal(blocked.status,403);
const invalid=await fetch('http://127.0.0.1:51947/api/editor-session.php',{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:51947'},body:'{"action":"login","access_token":"invalid"}'});assert.equal(invalid.status,401);
console.log(JSON.stringify({config:true,chrome:results,server:{unauthenticated:303,foreignOrigin:403,invalidToken:401},scope:'mock Auth requests; no actual email, account creation or OAuth success asserted'}));
}finally{await browser.close()}

