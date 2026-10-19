// One-shot CLI browsers only: loopback endpoint and bounded, owned cleanup.
import {spawnSync} from 'node:child_process';
export async function launchIsolated(chromium,options){
 const server=await chromium.launchServer({...options,host:'127.0.0.1'});
 try{return {server,browser:await chromium.connect(server.wsEndpoint())};}
 catch(error){await server.kill();throw error;}
}
export async function closeIsolated(browser,server){
 let timer;const result={forced:false,scope:'Only the isolated Playwright browser server'};
 const bounded=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Isolated browser cleanup deadline')),ms);})]);
 try{await bounded(browser.close(),15000);clearTimeout(timer);await bounded(server.close(),10000);}
 catch(error){result.forced=true;result.reason=error.message;clearTimeout(timer);
  try{await bounded(server.kill(),10000);}catch{
   const child=server.process();if(child.exitCode===null&&Number.isSafeInteger(child.pid)){
    if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});else child.kill('SIGKILL');
   }
  }
 }finally{clearTimeout(timer);}
 return result;
}
