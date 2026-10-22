import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import cp from 'node:child_process';
import wt from 'node:worker_threads';
import {syncBuiltinESMExports} from 'node:module';
import fsp from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const pilot=path.resolve(process.env.AURA_RUFLO_PILOT_ROOT||path.dirname(fileURLToPath(import.meta.url)));
const inside=p=>{if(typeof p==='number')return;const full=path.resolve(p instanceof URL?fileURLToPath(p):String(p));const rel=path.relative(pilot,full);if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('AURA pilot filesystem boundary: '+full);};
for(const mod of [fs,fsp])for(const name of ['readFile','readFileSync','writeFile','writeFileSync','appendFile','appendFileSync','open','openSync','mkdir','mkdirSync','readdir','readdirSync','stat','statSync','lstat','lstatSync','access','accessSync','unlink','unlinkSync','rm','rmSync','rmdir','rmdirSync','chmod','chmodSync','truncate','truncateSync','createReadStream','createWriteStream','watch']){
 if(typeof mod[name]!=='function')continue;const original=mod[name];mod[name]=function(p,...rest){inside(p);return original.call(this,p,...rest);};
}
for(const mod of [fs,fsp])for(const name of ['rename','renameSync','copyFile','copyFileSync','cp','cpSync']){if(typeof mod[name]!=='function')continue;const original=mod[name];mod[name]=function(a,b,...rest){inside(a);inside(b);return original.call(this,a,b,...rest);};}
for(const mod of [fs,fsp])for(const name of ['symlink','symlinkSync','link','linkSync'])if(typeof mod[name]==='function')mod[name]=()=>{throw Error('AURA pilot blocks filesystem links');};
const deny=kind=>(...args)=>{
 fs.appendFileSync(path.resolve('blocked-operations.jsonl'),JSON.stringify({kind,at:new Date().toISOString()})+'\n');
 throw new Error('AURA offline pilot blocks '+kind);
};
globalThis.fetch=deny('fetch');
for(const mod of [http,https])for(const key of ['request','get'])mod[key]=deny(key);
net.connect=deny('net.connect');net.createConnection=deny('net.createConnection');
net.Socket.prototype.connect=deny('socket.connect');net.Server.prototype.listen=deny('server.listen');
tls.connect=deny('tls.connect');dns.lookup=deny('dns.lookup');dns.resolve=deny('dns.resolve');
for(const key of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])cp[key]=deny('child_process.'+key);
wt.Worker=class{constructor(){deny('worker')();}};
syncBuiltinESMExports();
