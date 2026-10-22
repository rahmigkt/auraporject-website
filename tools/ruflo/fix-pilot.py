"""Version-bound local Ruflo fixes. Never apply to AURA runtime files."""
from pathlib import Path
import hashlib
import json
import re
import difflib

root=Path(__file__).resolve().parent
base=root/'node_modules/@claude-flow/cli/dist/src'
out=root/'patches'
out.mkdir(exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def replace(s,a,b):
    assert s.count(a)==1,('Unexpected source',a[:100],s.count(a))
    return s.replace(a,b,1)

sources={name:(base/name).read_bytes() for name in ['index.js','mcp-tools/task-tools.js','commands/task.js']}
assert sha(sources['index.js'])=='c320b29528a441ebfa519873dde62e3e9cb97db09d78fb8692f044c0ad61facf'
assert sha(sources['mcp-tools/task-tools.js'])=='8d9a4f5e99364ec11b2a9690ef54ce5fc7ab795ae68a91188be80e40a2738d91'
index=sources['index.js'].decode()
index,n=re.subn(r'process\.exit\(([^\n;]+)\);',r'process.exitCode = \1; return;',index)
assert n==6,n
task=sources['mcp-tools/task-tools.js'].decode()
helper='''// AURA pilot dependency contract: persist edges and refuse premature work.
function validateDependencies(store, dependencies, taskId) {
    if (!Array.isArray(dependencies) || dependencies.some(id => !validateIdentifier(id, 'dependency').valid))
        return 'dependencies must be an array of task ids';
    const visit = (id, seen) => {
        if (id === taskId || seen.has(id)) return 'Cyclic task dependencies';
        const node = store.tasks[id];
        if (!node) return `Dependency not found: ${id}`;
        const next = new Set(seen); next.add(id);
        if (!Array.isArray(node.dependencies ?? [])) return 'Invalid stored dependencies';
        for (const parent of node.dependencies ?? []) {
            const error = visit(parent, next); if (error) return error;
        }
        return null;
    };
    for (const id of dependencies) { const error = visit(id, new Set()); if (error) return error; }
    return null;
}
function pendingDependencyError(store, task) {
    const error = validateDependencies(store, task.dependencies ?? [], task.taskId);
    if (error) return error;
    const pending = (task.dependencies ?? []).filter(id => store.tasks[id].status !== 'completed');
    return pending.length ? `Dependencies not completed: ${pending.join(', ')}` : null;
}
'''
task=replace(task,'export const taskTools = [',helper+'\nexport const taskTools = [')
task=replace(task,"                priority: { type: 'string', description: 'Task priority (low, normal, high, critical)' },\n                assignTo: { type: 'array', items: { type: 'string' }, description: 'Agent IDs to assign' },", "                priority: { type: 'string', description: 'Task priority (low, normal, high, critical)' },\n                dependencies: { type: 'array', items: { type: 'string' }, description: 'Prerequisite task IDs' },\n                assignTo: { type: 'array', items: { type: 'string' }, description: 'Agent IDs to assign' },")
task=replace(task,"            const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;", "            const dependencies = input.dependencies ?? [];\n            const depError = validateDependencies(store, dependencies);\n            if (depError) return { success: false, error: depError };\n            if (input.assignTo?.length && dependencies.some(id => store.tasks[id].status !== 'completed'))\n                return { success: false, error: 'Dependencies not completed' };\n            const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;")
task=replace(task,"                assignedTo: input.assignTo || [],", "                assignedTo: input.assignTo || [],\n                dependencies: [...new Set(dependencies)],")
# Return edges on create, status and list, without fabricating old missing edges.
task=task.replace('                assignedTo: task.assignedTo,','                assignedTo: task.assignedTo,\n                dependencies: task.dependencies ?? [],')
task=replace(task,'                    assignedTo: t.assignedTo,','                    assignedTo: t.assignedTo,\n                    dependencies: t.dependencies ?? [],')
task=replace(task,"                if (task.status === 'completed') {", "                const depError = pendingDependencyError(store, task);\n                if (depError) return { success: false, taskId, error: depError };\n                if (task.status === 'completed') {")
task=replace(task,"                // Worker effects run AFTER the task store is saved, as task_complete does:","                if (['in_progress', 'completed'].includes(status) || input.assignTo?.length) {\n                    const depError = pendingDependencyError(store, task);\n                    if (depError) return { success: false, taskId, error: depError };\n                }\n                // Worker effects run AFTER the task store is saved, as task_complete does:")
task=replace(task,'            const previouslyAssigned = [...task.assignedTo];',"            if (!input.unassign && input.agentIds?.length) {\n                const depError = pendingDependencyError(store, task);\n                if (depError) return { success: false, taskId, error: depError };\n            }\n            const previouslyAssigned = [...task.assignedTo];")
task=replace(task,'                assignedTo: [...original.assignedTo],','                assignedTo: [...original.assignedTo],\n                dependencies: [...(original.dependencies ?? [])],')
command=sources['commands/task.js'].decode()
command=replace(command,"            output.printSuccess(`Task created: ${result.taskId}`);", "            if (result.success === false || result.error) {\n                output.printError(result.error || 'Task creation rejected');\n                return { success: false, exitCode: 1, data: result };\n            }\n            output.printSuccess(`Task created: ${result.taskId}`);")
results={'index.js':index,'mcp-tools/task-tools.js':task,'commands/task.js':command}
manifest={}
diff=[]
for name,new in results.items():
    old=sources[name]
    backup=out/'original'/name;backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(old)
    data=new.encode()
    (base/name).write_bytes(data)
    manifest[name]={'before_sha256':sha(old),'after_sha256':sha(data)}
    diff.extend(difflib.unified_diff(old.decode().splitlines(keepends=True),new.splitlines(keepends=True),fromfile='a/'+name,tofile='b/'+name))
(out/'ruflo-3.59.17-aura-local.patch').write_text(''.join(diff),encoding='utf8')
(out/'manifest.json').write_text(json.dumps({'package':'@claude-flow/cli','version':'3.59.17','local_patch_only':True,'files':manifest},indent=2)+'\n',encoding='utf8')
print(json.dumps({'patched_files':len(results),'graceful_error_exits':n}))
