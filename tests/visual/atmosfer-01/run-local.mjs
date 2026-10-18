// Loopback-only static server and child-command lifecycle for reproducible captures.
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.hdr':'application/octet-stream'};
const server=http.createServer((req,res)=>{const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!target.startsWith(root)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);});
server.listen(0,'127.0.0.1',()=>{const child=spawn(process.execPath,process.argv.slice(2),{stdio:'inherit',env:{...process.env,ATMOSFER_ORIGIN:`http://127.0.0.1:${server.address().port}`}});child.on('exit',code=>{server.close();process.exitCode=code;});});
