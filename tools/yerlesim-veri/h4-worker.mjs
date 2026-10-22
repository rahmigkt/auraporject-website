import {parentPort} from 'node:worker_threads';
import {convert} from './h4.mjs';
parentPort.on('message',({index,source})=>parentPort.postMessage({index,result:convert(source)}));
