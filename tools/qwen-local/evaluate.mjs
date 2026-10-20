import {readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {hash, json, score} from './core.mjs';
const [directory, predictionFile, split='dev'] = process.argv.slice(2);
if (!directory || !predictionFile || !['dev','test'].includes(split)) throw Error('Usage: node tools/qwen-local/evaluate.mjs DATA_DIR PREDICTIONS.jsonl [dev|test]');
const dir = resolve(directory), manifest = JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
// Verify all frozen files, even when evaluating just one split.
for (const [name,meta] of Object.entries(manifest.files)) if (hash(readFileSync(join(dir,name))) !== meta.sha256) throw Error(`Hash mismatch: ${name}`);
const lines = file => readFileSync(file,'utf8').split(/\r?\n/).filter(x => x.trim()).map(JSON.parse);
console.log(json({...score(lines(join(dir,`${split}.jsonl`)),lines(predictionFile)),split,
  datasetSha256:manifest.files[`${split}.jsonl`].sha256, predictionsSha256:hash(readFileSync(predictionFile))}));
