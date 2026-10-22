import assert from 'node:assert/strict';import fs from 'node:fs';import {taskTools} from './node_modules/@claude-flow/cli/dist/src/mcp-tools/task-tools.js';
let checks=0;const good=(condition)=>{assert(condition);checks++;};
const call=async(name,input)=>taskTools.find(x=>x.name===name).handler(input);
const create=(description,dependencies=[])=>call('task_create',{type:'testing',description,dependencies});
const parent=await create('Patched pilot prerequisite'),child=await create('Patched pilot dependent',[parent.taskId,parent.taskId]);
good(child.dependencies.length===1&&child.dependencies[0]===parent.taskId);
const storePath='.claude-flow/tasks/store.json',before=fs.readFileSync(storePath,'utf8');
good((await create('Missing dependency',['missing-new-pilot'])).success===false);
good(fs.readFileSync(storePath,'utf8')===before);
good((await create('Invalid dependency field','not-array')).success===false);
good((await call('task_status',{taskId:child.taskId})).dependencies[0]===parent.taskId);
good((await call('task_list',{})).tasks.find(x=>x.taskId===child.taskId).dependencies[0]===parent.taskId);
good((await call('task_update',{taskId:child.taskId,status:'in_progress'})).success===false);
good((await call('task_update',{taskId:child.taskId,status:'completed'})).success===false);
good((await call('task_complete',{taskId:child.taskId})).success===false);
// This must reject before touching any worker store; no agent is created.
good((await call('task_assign',{taskId:child.taskId,agentIds:['fixture-not-an-agent']})).success===false);
good((await call('task_create',{type:'testing',description:'Premature assignment',dependencies:[parent.taskId],assignTo:['fixture-not-an-agent']})).success===false);
good((await call('task_status',{taskId:child.taskId})).status==='pending');
good((await call('task_complete',{taskId:parent.taskId})).status==='completed');
good((await call('task_update',{taskId:child.taskId,status:'in_progress'})).success===true);
good((await call('task_complete',{taskId:child.taskId})).status==='completed');
const retry=await call('task_retry',{taskId:child.taskId});
good((await call('task_status',{taskId:retry.newTaskId})).dependencies[0]===parent.taskId);
const failed=await create('Failed prerequisite'),blocked=await create('Blocked by failed prerequisite',[failed.taskId]);
await call('task_update',{taskId:failed.taskId,status:'failed'});
good((await call('task_update',{taskId:blocked.taskId,status:'in_progress'})).success===false);
const snapshot=fs.readFileSync(storePath,'utf8');
try{const s=JSON.parse(snapshot);s.tasks[parent.taskId].dependencies=[child.taskId];fs.writeFileSync(storePath,JSON.stringify(s));good((await create('Cycle rejected',[parent.taskId])).success===false);}
finally{fs.writeFileSync(storePath,snapshot);}
console.log(JSON.stringify({checks,pass:true,agents_created:0,parent_id:parent.taskId,child_id:child.taskId}));
